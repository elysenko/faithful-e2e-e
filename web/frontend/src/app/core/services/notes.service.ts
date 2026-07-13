import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Note } from '../models';

/**
 * NotesService — live data layer.
 *
 * Wraps HttpClient CRUD against `${environment.apiUrl}/notes` (JWT-guarded on
 * the backend; the token is attached by authInterceptor). Server responses are
 * cached in the `_notes` signal so the list/editor stay reactive, and
 * loading/error signals give components in-flight + failure feedback.
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly apiUrl = environment.apiUrl + '/notes';

  private _notes = signal<Note[]>([]);

  readonly notes = this._notes.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly openCount = computed(() => this._notes().filter((n) => !n.done).length);
  readonly doneCount = computed(() => this._notes().filter((n) => n.done).length);

  constructor(private http: HttpClient) {}

  /** Load all notes for the current user. GET `${apiUrl}`. */
  list(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Note[]>(this.apiUrl).subscribe({
      next: (notes) => {
        this._notes.set(notes ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.messageFor(err, 'Failed to load notes.'));
        this.loading.set(false);
      },
    });
  }

  /** Fetch a single note by id. GET `${apiUrl}/:id`. */
  get(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`);
  }

  /** Create a note. POST `${apiUrl}`. */
  create(input: { title: string; body: string; done: boolean }): Observable<Note> {
    return this.http
      .post<Note>(this.apiUrl, input)
      .pipe(tap((note) => this._notes.update((list) => [note, ...list])));
  }

  /** Update a note. PATCH `${apiUrl}/:id`. */
  update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'body' | 'done'>>,
  ): Observable<Note> {
    return this.http
      .patch<Note>(`${this.apiUrl}/${id}`, patch)
      .pipe(
        tap((updated) =>
          this._notes.update((list) => list.map((n) => (n.id === id ? updated : n))),
        ),
      );
  }

  /** Toggle the done flag. PATCH `${apiUrl}/:id`. */
  toggleDone(id: string): Observable<Note> | void {
    const current = this._notes().find((n) => n.id === id);
    if (!current) return;
    return this.update(id, { done: !current.done });
  }

  /** Delete a note. DELETE `${apiUrl}/:id`. */
  remove(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this._notes.update((list) => list.filter((n) => n.id !== id))));
  }

  private messageFor(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? fallback;
  }
}
