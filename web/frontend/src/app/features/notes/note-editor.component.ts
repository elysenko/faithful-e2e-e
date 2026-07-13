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
      const note = this.notesService.get(id);
      if (note) {
        this.form.patchValue({ title: note.title, body: note.body, done: note.done });
      } else {
        this.error.set('Note not found.');
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value as { title: string; body: string; done: boolean };
    if (this.isEdit() && this.noteId()) {
      this.notesService.update(this.noteId()!, value);
    } else {
      this.notesService.create(value);
    }
    this.router.navigate(['/notes']);
  }

  remove(): void {
    if (this.isEdit() && this.noteId()) {
      this.notesService.remove(this.noteId()!);
    }
    this.router.navigate(['/notes']);
  }

  cancel(): void {
    this.router.navigate(['/notes']);
  }
}
