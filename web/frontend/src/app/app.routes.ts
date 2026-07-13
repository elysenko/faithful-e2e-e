import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { FlowRoute } from './flow-meta';

// `data.flow` is the single source of truth for the user-flow graph AND the runtime navbar.
// The colossus flow-graph extractor projects it directly (zero heuristics). Authoring rules
// + lint: docs/flow-graph-convention.md + platform/flowgraph-static/verify/flow-lint.mjs.
//
// DEEP-LINKABLE STATE — every navigable UI state a user could leave feedback on must be
// reachable by URL. Notes filters use a `?filter=` query param the list restores from;
// create/edit are distinct routes (`notes/new`, `notes/:id`).
export const routes: Routes = ([
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    data: { flow: { flowId: 'login', node: 'login', entry: true, edgesTo: ['notes'], label: 'Login' } },
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'notes',
        loadComponent: () =>
          import('./features/notes/notes-list.component').then((m) => m.NotesListComponent),
        data: {
          flow: {
            flowId: 'notes',
            node: 'notes',
            showInNavbar: true,
            label: 'Notes',
            scope: 'all',
            edgesTo: ['note-new', 'note-detail'],
          },
        },
      },
      {
        path: 'notes/new',
        loadComponent: () =>
          import('./features/notes/note-editor.component').then((m) => m.NoteEditorComponent),
        data: { flow: { flowId: 'note-new', node: 'notes/new', label: 'New note', edgesTo: ['notes'] } },
      },
      {
        path: 'notes/:id',
        loadComponent: () =>
          import('./features/notes/note-editor.component').then((m) => m.NoteEditorComponent),
        data: { flow: { flowId: 'note-detail', node: 'notes/:id', label: 'Edit note', edgesTo: ['notes'] } },
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.component').then((m) => m.AdminComponent),
        data: {
          flow: {
            flowId: 'admin',
            node: 'admin',
            showInNavbar: true,
            label: 'Admin',
            scope: 'admin',
            edgesTo: ['admin-settings'],
          },
        },
      },
      {
        path: 'admin/settings',
        loadComponent: () =>
          import('./features/admin/admin-settings.component').then((m) => m.AdminSettingsComponent),
        data: {
          flow: { flowId: 'admin-settings', node: 'admin/settings', label: 'Settings', scope: 'admin', edgesTo: ['admin'] },
        },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
] satisfies FlowRoute[]) as Routes;
