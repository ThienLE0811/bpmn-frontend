import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'processes',
        loadComponent: () =>
          import('./features/bpmn-list/bpmn-list.component').then(
            (m) => m.BpmnListComponent,
          ),
      },
      {
        path: 'decisions',
        loadComponent: () =>
          import('./features/dmn-list/dmn-list.component').then(
            (m) => m.DmnListComponent,
          ),
      },
      {
        path: 'dmn',
        redirectTo: 'decisions',
        pathMatch: 'full',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
      {
        path: 'operate',
        loadComponent: () =>
          import('./features/operate/operate.component').then(
            (m) => m.OperateComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

