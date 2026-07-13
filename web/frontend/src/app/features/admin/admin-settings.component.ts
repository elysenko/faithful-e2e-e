import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  // Mock settings — scaffolded UI only, not wired to a backend endpoint.
  appName = 'FaithfulE';
  allowRegistration = false;
  seedOnBoot = true;
}
