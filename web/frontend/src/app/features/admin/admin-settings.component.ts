import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent implements OnInit {
  // Static app identity (marker branding).
  readonly appName = 'FaithfulE';

  // Live system status pulled from the real backend.
  readonly dbStatus = signal<string>('checking…');
  readonly userCount = signal<number>(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    // Real readiness probe (Postgres ping via /health/deep).
    this.admin.health().subscribe({
      next: (res) => this.dbStatus.set(res?.status === 'ok' ? 'connected' : 'degraded'),
      error: () => this.dbStatus.set('unavailable'),
    });

    // Real seeded-user count via the admin-only /users endpoint.
    this.admin.listUsers().subscribe({
      next: (users) => {
        this.userCount.set(users.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load system status.');
        this.loading.set(false);
      },
    });
  }
}
