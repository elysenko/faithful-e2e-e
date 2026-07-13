import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css',
})
export class NoteEditorComponent implements OnInit {
  form: FormGroup;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly noteId = signal<string | null>(null);
  readonly isEdit = signal(false);

  constructor(
    private fb: FormBuilder,
    private notesService: NotesService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      body: ['', [Validators.required]],
      done: [false],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.noteId.set(id);
      this.isEdit.set(true);
      this.loading.set(true);
      this.notesService.get(id).subscribe({
        next: (note) => {
          this.form.patchValue({ title: note.title, body: note.body, done: note.done });
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Note not found.');
          this.loading.set(false);
        },
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value as { title: string; body: string; done: boolean };
    this.loading.set(true);
    this.error.set(null);
    const request$ =
      this.isEdit() && this.noteId()
        ? this.notesService.update(this.noteId()!, value)
        : this.notesService.create(value);
    request$.subscribe({
      next: () => this.router.navigate(['/notes']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to save note.');
        this.loading.set(false);
      },
    });
  }

  remove(): void {
    if (this.isEdit() && this.noteId()) {
      this.loading.set(true);
      this.notesService.remove(this.noteId()!).subscribe({
        next: () => this.router.navigate(['/notes']),
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Failed to delete note.');
          this.loading.set(false);
        },
      });
    } else {
      this.router.navigate(['/notes']);
    }
  }

  cancel(): void {
    this.router.navigate(['/notes']);
  }
}
