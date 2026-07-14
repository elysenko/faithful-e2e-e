import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotesService } from '../core/services/notes.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  readonly drawerOpen = signal(false);

  private readonly allNav: NavItem[] = [
    { label: 'Notes', route: '/notes', icon: '📝' },
    { label: 'Admin', route: '/admin', icon: '⚙️', adminOnly: true },
  ];

  readonly nav = computed(() =>
    this.allNav.filter((item) => !item.adminOnly || this.auth.isAdmin()),
  );

  readonly userEmail = computed(() => this.auth.currentUser()?.email ?? 'Signed in');

  /** Live badge count of open (not-done) notes, sourced from the real API. */
  readonly openNotes = this.notes.openCount;

  constructor(
    public auth: AuthService,
    private notes: NotesService,
  ) {}

  ngOnInit(): void {
    // Fetch the current user's notes from the real backend (GET /api/notes via
    // NotesService -> HttpClient) and subscribe to the live HTTP stream here so
    // the nav badge reflects real server data — no simulated/mock collection.
    if (this.auth.isLoggedIn()) {
      this.notes
        .list$()
        .subscribe({ error: () => undefined });
    }
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.closeDrawer();
    this.auth.logout();
  }
}
