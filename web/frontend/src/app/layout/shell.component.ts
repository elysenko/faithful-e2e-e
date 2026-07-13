import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

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
export class ShellComponent {
  readonly drawerOpen = signal(false);

  private readonly allNav: NavItem[] = [
    { label: 'Notes', route: '/notes', icon: '📝' },
    { label: 'Admin', route: '/admin', icon: '⚙️', adminOnly: true },
  ];

  readonly nav = computed(() =>
    this.allNav.filter((item) => !item.adminOnly || this.auth.isAdmin()),
  );

  readonly userEmail = computed(() => this.auth.currentUser()?.email ?? 'Signed in');

  constructor(public auth: AuthService) {}

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
