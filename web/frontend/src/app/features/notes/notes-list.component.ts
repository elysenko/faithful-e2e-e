import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NotesService } from '../../core/services/notes.service';
import { Note } from '../../core/models';

type Filter = 'all' | 'open' | 'done';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.css',
})
export class NotesListComponent implements OnInit {
  readonly filter = signal<Filter>('all');

  readonly notes = this.notesService.notes;
  readonly loading = this.notesService.loading;
  readonly error = this.notesService.error;
  readonly openCount = this.notesService.openCount;
  readonly doneCount = this.notesService.doneCount;

  readonly visibleNotes = computed<Note[]>(() => {
    const f = this.filter();
    const all = this.notes();
    if (f === 'open') return all.filter((n) => !n.done);
    if (f === 'done') return all.filter((n) => n.done);
    return all;
  });

  constructor(
    private notesService: NotesService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.notesService.list();
    const f = this.route.snapshot.queryParamMap.get('filter') as Filter | null;
    if (f === 'open' || f === 'done' || f === 'all') this.filter.set(f);
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
    this.router.navigate([], {
      queryParams: { filter: f === 'all' ? null : f },
      queryParamsHandling: 'merge',
    });
  }

  toggleDone(note: Note, event: Event): void {
    event.stopPropagation();
    this.notesService.toggleDone(note.id)?.subscribe({
      error: (err) =>
        this.notesService.error.set(err?.error?.message ?? 'Failed to update note.'),
    });
  }

  deleteNote(note: Note, event: Event): void {
    event.stopPropagation();
    this.notesService.remove(note.id).subscribe({
      error: (err) =>
        this.notesService.error.set(err?.error?.message ?? 'Failed to delete note.'),
    });
  }
}
