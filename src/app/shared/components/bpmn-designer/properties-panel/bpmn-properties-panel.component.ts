import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { copyToClipboard } from '@shared/utils/clipboard.util';
import { BpmnElementProperties, PropertiesTab } from '../bpmn-designer.models';
import { BpmnModelerService } from '../services/bpmn-modeler.service';
import {
  getBpmnTypeMeta,
  hasExecutionConfig,
  isBranchingGateway,
  isBusinessRuleTask,
  isCallActivity,
  isSequenceFlow,
  isServiceOrScript,
  isServiceTask,
  isUserOrTask,
} from '../utils/bpmn-type-meta';
import { BpmnUserTaskSectionComponent } from './sections/bpmn-user-task-section/bpmn-user-task-section.component';
import { BpmnConnectorSectionComponent } from './sections/bpmn-connector-section/bpmn-connector-section.component';
import { BpmnTimerSectionComponent } from './sections/bpmn-timer-section/bpmn-timer-section.component';
import { BpmnAdvancedTabComponent } from './sections/bpmn-advanced-tab/bpmn-advanced-tab.component';

@Component({
  selector: 'app-bpmn-properties-panel',
  standalone: true,
  imports: [
    FormsModule,
    NzIconModule,
    BpmnUserTaskSectionComponent,
    BpmnConnectorSectionComponent,
    BpmnTimerSectionComponent,
    BpmnAdvancedTabComponent,
  ],
  templateUrl: './bpmn-properties-panel.component.html',
  styleUrl: './bpmn-properties-panel.component.scss',
})
export class BpmnPropertiesPanelComponent {
  private readonly modeler = inject(BpmnModelerService);

  readonly dmnDecisions = input<DmnDecision[]>([]);
  readonly connectors = input<string[]>([]);
  readonly activeTab = model<PropertiesTab>('general');

  protected readonly selected = this.modeler.selectedElement;
  protected readonly isSimulationActive = this.modeler.isSimulationActive;
  protected readonly copiedId = signal<boolean>(false);

  protected readonly typeMeta = computed(() => getBpmnTypeMeta(this.selected()?.type));
  protected readonly hasExecutionConfig = computed(() => {
    const el = this.selected();
    return !!el && hasExecutionConfig(el);
  });
  protected readonly isOutgoingFromGateway = computed(() => {
    const el = this.selected();
    return !!el && isBranchingGateway(this.modeler.getElement(el.id)?.source?.type);
  });

  protected readonly isUserOrTask = isUserOrTask;
  protected readonly isSequenceFlow = isSequenceFlow;
  protected readonly isServiceOrScript = isServiceOrScript;
  protected readonly isServiceTask = isServiceTask;
  protected readonly isCallActivity = isCallActivity;
  protected readonly isBusinessRuleTask = isBusinessRuleTask;

  protected async copyElementId(id: string): Promise<void> {
    if (await copyToClipboard(id)) {
      this.copiedId.set(true);
      setTimeout(() => this.copiedId.set(false), 2000);
    }
  }

  protected updateName(newName: string): void {
    this.modeler.editSelected({ name: newName }, (element) =>
      this.modeler.get('modeling').updateLabel(element, newName),
    );
  }

  protected updateDocumentation(docText: string): void {
    this.modeler.editSelected({ documentation: docText }, (element) => {
      const bpmnFactory = this.modeler.get('bpmnFactory');
      const doc = docText ? [bpmnFactory.create('bpmn:Documentation', { text: docText })] : [];
      this.modeler.get('modeling').updateProperties(element, { documentation: doc });
    });
  }

  protected updateProperty(propName: keyof BpmnElementProperties, value: any): void {
    this.modeler.updateProperty(propName, value);
  }

  protected updateDefaultFlow(isDefault: boolean): void {
    this.modeler.editSelected({ isDefaultFlow: isDefault }, (flowElement) => {
      if (!flowElement.source) return false;
      this.modeler.get('modeling').updateProperties(flowElement.source, {
        default: isDefault ? flowElement.businessObject : undefined,
      });
      return true;
    });
  }
}
