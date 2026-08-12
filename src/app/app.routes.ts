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
    ],
  },
];
