import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models';

/** A user row as rendered by the admin panel (derived from `GET /users`). */
export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  notes: number;
}

/** Deep health-check payload from `GET /health/deep` (@nestjs/terminus). */
export interface HealthStatus {
  status: string;
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string }>;
  details?: Record<string, { status: string }>;
}

/** Raw user shape returned by the NestJS `GET /users` endpoint. */
interface ApiUser {
  id: string;
  email: string;
  role: string;
  _count?: { notes?: number };
}

/**
 * AdminService — live data layer for the admin panel.
 *
 * Wraps HttpClient calls against the real NestJS API (JWT-guarded; the token is
 * attached by authInterceptor). `listUsers` hits the admin-only `GET /users`
 * endpoint and normalizes the role casing to match the frontend `UserRole`
 * union; `health` hits the public `GET /health/deep` readiness probe.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** List all users with their note counts. GET `${apiUrl}/users`. */
  listUsers(): Observable<AdminUser[]> {
    return this.http.get<ApiUser[]>(`${this.apiUrl}/users`).pipe(
      map((users) =>
        (users ?? []).map((u) => ({
          id: u.id,
          email: u.email,
          role: (u.role || 'user').toUpperCase() as UserRole,
          notes: u._count?.notes ?? 0,
        })),
      ),
    );
  }

  /** Deep readiness check (Postgres ping). GET `${apiUrl}/health/deep`. */
  health(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}/health/deep`);
  }
}
