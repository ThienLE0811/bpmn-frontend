import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/bpmn-designer/bpmn-designer.component').then(
        (m) => m.BpmnDesignerComponent,
      ),
  },
];
