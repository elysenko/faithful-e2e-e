import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface SeededUser {
  id: string;
  email: string;
  role: string;
  notes: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  // Mockup data (admin panel is scaffolded mock, outside backend spec scope).
  readonly users = signal<SeededUser[]>([
    { id: 'u-admin', email: 'admin@faithful-e.test', role: 'ADMIN', notes: 4 },
    { id: 'u-user', email: 'user@faithful-e.test', role: 'USER', notes: 2 },
  ]);
}
