import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'processes',
        pathMatch: 'full',
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
    ],
  },
];
