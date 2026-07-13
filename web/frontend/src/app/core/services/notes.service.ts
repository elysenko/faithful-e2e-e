import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Note } from '../models';

/**
 * NotesService — mockup state layer.
 *
 * DATA CONTRACT: every field the backend will provide is declared as
 * `signal<Note[]>([...mock...])`. The mockup_cleaner stage clears this to
 * `signal<Note[]>([])`; service_agent then wires the CRUD methods to
 * `${environment.apiUrl}/notes` via HttpClient in ngOnInit().
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly apiUrl = environment.apiUrl + '/notes';

  private _notes = signal<Note[]>([
    {
      id: 'n1',
      title: 'Draft the sprint retro notes',
      body: 'Summarize wins, blockers, and three action items for the FaithfulE team sync.',
      done: false,
      createdAt: '2026-07-10T09:15:00.000Z',
      updatedAt: '2026-07-12T14:02:00.000Z',
    },
    {
      id: 'n2',
      title: 'Review PR: notes CRUD module',
      body: 'Check per-user scoping on GET/PATCH/DELETE and confirm owner mismatch returns 403.',
      done: false,
      createdAt: '2026-07-11T11:40:00.000Z',
      updatedAt: '2026-07-11T11:40:00.000Z',
    },
    {
      id: 'n3',
      title: 'Book dentist appointment',
      body: 'Call the clinic before Friday to schedule the annual check-up.',
      done: true,
      createdAt: '2026-07-08T16:20:00.000Z',
      updatedAt: '2026-07-09T08:05:00.000Z',
    },
    {
      id: 'n4',
      title: 'Water the office plants',
      body: 'The fern by the window is looking thirsty again.',
      done: true,
      createdAt: '2026-07-05T07:30:00.000Z',
      updatedAt: '2026-07-06T07:30:00.000Z',
    },
  ]);

  readonly notes = this._notes.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly openCount = computed(() => this._notes().filter((n) => !n.done).length);
  readonly doneCount = computed(() => this._notes().filter((n) => n.done).length);

  constructor(private http: HttpClient) {}

  /** Load all notes for the current user. service_agent: GET `${apiUrl}`. */
  list(): void {
    // mockup: notes already present in the signal; nothing to fetch.
  }

  /** Fetch a single note by id. service_agent: GET `${apiUrl}/:id`. */
  get(id: string): Note | undefined {
    return this._notes().find((n) => n.id === id);
  }

  /** Create a note. service_agent: POST `${apiUrl}`. */
  create(input: { title: string; body: string; done: boolean }): Note {
    const now = new Date().toISOString();
    const note: Note = {
      id: 'n' + (this._notes().length + 1) + '-' + note_seq(),
      title: input.title,
      body: input.body,
      done: input.done,
      createdAt: now,
      updatedAt: now,
    };
    this._notes.update((list) => [note, ...list]);
    return note;
  }

  /** Update a note. service_agent: PATCH `${apiUrl}/:id`. */
  update(id: string, patch: Partial<Pick<Note, 'title' | 'body' | 'done'>>): void {
    const now = new Date().toISOString();
    this._notes.update((list) =>
      list.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now } : n)),
    );
  }

  /** Toggle the done flag. service_agent: PATCH `${apiUrl}/:id`. */
  toggleDone(id: string): void {
    const current = this.get(id);
    if (current) this.update(id, { done: !current.done });
  }

  /** Delete a note. service_agent: DELETE `${apiUrl}/:id`. */
  remove(id: string): void {
    this._notes.update((list) => list.filter((n) => n.id !== id));
  }
}

let _seq = 0;
function note_seq(): number {
  _seq += 1;
  return _seq;
}
