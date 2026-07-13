import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, UserRole } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<User | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /**
   * Real login against the NestJS API: `POST ${apiUrl}/auth/login`.
   * The backend responds with `{ user: { id, email, role, ... }, token }`.
   * `persistSession` normalizes `role` to uppercase to match the frontend
   * `UserRole` union and stores the token + user in signals/localStorage.
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  /** Demo Mode bypass: sign in as a seeded admin and jump straight into the app. */
  demoLogin(): void {
    const response: AuthResponse = {
      user: { id: 'u-admin', email: 'admin@faithful-e.test', role: 'admin' },
      token: 'demo-admin-token',
    };
    this.persistSession(response);
    this.router.navigate(['/notes']);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private persistSession(res: AuthResponse): void {
    const user: User = {
      id: res.user.id,
      email: res.user.email,
      role: (res.user.role || 'user').toUpperCase() as UserRole,
    };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(res.token);
    this._user.set(user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
