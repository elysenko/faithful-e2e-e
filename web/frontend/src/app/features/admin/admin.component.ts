import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminUser } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalNotes = computed(() =>
    this.users().reduce((sum, u) => sum + u.notes, 0),
  );

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load users.');
        this.loading.set(false);
      },
    });
  }
}
