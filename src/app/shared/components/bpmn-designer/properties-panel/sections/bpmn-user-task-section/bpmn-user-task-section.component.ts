import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormSchemaService } from '@core/services/state/form-schema.service';
import { BpmnElementProperties } from '../../../bpmn-designer.models';
import { BpmnModelerService } from '../../../services/bpmn-modeler.service';

@Component({
  selector: 'app-bpmn-user-task-section',
  standalone: true,
  imports: [FormsModule, NzIconModule],
  templateUrl: './bpmn-user-task-section.component.html',
  styleUrl: './bpmn-user-task-section.component.scss',
})
export class BpmnUserTaskSectionComponent {
  private readonly modeler = inject(BpmnModelerService);
  private readonly formSchemaService = inject(FormSchemaService);

  readonly element = input.required<BpmnElementProperties>();
  protected readonly registeredForms = computed(() => this.formSchemaService.getRegisteredForms());

  protected updateProperty(propName: keyof BpmnElementProperties, value: any): void {
    this.modeler.updateProperty(propName, value);
  }
}
