import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { FormSchemaService } from '@core/services/state/form-schema.service';
import { copyToClipboard } from '@shared/utils/clipboard.util';
import { BpmnElementProperties, PropertiesTab, TimerType } from '../bpmn-designer.models';
import { BpmnModelerService } from '../services/bpmn-modeler.service';
import {
  getBpmnTypeMeta,
  hasExecutionConfig,
  isBoundaryEvent,
  isBranchingGateway,
  isBusinessRuleTask,
  isCallActivity,
  isSequenceFlow,
  isServiceOrScript,
  isUserOrTask,
} from '../utils/bpmn-type-meta';
import {
  describeTimer,
  fromDateTimeLocal,
  getTimerDefinition,
  TIMER_PRESETS,
  TIMER_TYPES,
  toDateTimeLocal,
} from '../utils/timer.utils';

@Component({
  selector: 'app-bpmn-properties-panel',
  standalone: true,
  imports: [FormsModule, NzIconModule],
  templateUrl: './bpmn-properties-panel.component.html',
  styleUrl: './bpmn-properties-panel.component.scss',
})
export class BpmnPropertiesPanelComponent {
  private modeler = inject(BpmnModelerService);
  private formSchemaService = inject(FormSchemaService);

  readonly dmnDecisions = input<DmnDecision[]>([]);
  readonly activeTab = model<PropertiesTab>('general');

  protected selected = this.modeler.selectedElement;
  protected isSimulationActive = this.modeler.isSimulationActive;
  protected registeredForms = computed(() => this.formSchemaService.getRegisteredForms());
  protected copiedId = signal<boolean>(false);

  protected typeMeta = computed(() => getBpmnTypeMeta(this.selected()?.type));
  protected hasExecutionConfig = computed(() => {
    const el = this.selected();
    return !!el && hasExecutionConfig(el);
  });
  protected isOutgoingFromGateway = computed(() => {
    const el = this.selected();
    return !!el && isBranchingGateway(this.modeler.getElement(el.id)?.source?.type);
  });
  protected timerSummary = computed(() => {
    const el = this.selected();
    return el?.hasTimer ? describeTimer(el.timerType, el.timerValue) : null;
  });

  protected readonly timerPresets = TIMER_PRESETS;
  protected readonly toDateTimeLocal = toDateTimeLocal;
  protected readonly isUserOrTask = isUserOrTask;
  protected readonly isSequenceFlow = isSequenceFlow;
  protected readonly isServiceOrScript = isServiceOrScript;
  protected readonly isCallActivity = isCallActivity;
  protected readonly isBusinessRuleTask = isBusinessRuleTask;
  protected readonly isBoundaryEvent = isBoundaryEvent;

  protected async copyElementId(id: string): Promise<void> {
    if (await copyToClipboard(id)) {
      this.copiedId.set(true);
      setTimeout(() => this.copiedId.set(false), 2000);
    }
  }

  protected updateName(newName: string): void {
    this.editSelected({ name: newName }, (element) =>
      this.modeler.get('modeling').updateLabel(element, newName),
    );
  }

  protected updateDocumentation(docText: string): void {
    this.editSelected({ documentation: docText }, (element) => {
      const bpmnFactory = this.modeler.get('bpmnFactory');
      const doc = docText ? [bpmnFactory.create('bpmn:Documentation', { text: docText })] : [];
      this.modeler.get('modeling').updateProperties(element, { documentation: doc });
    });
  }

  protected updateProperty(propName: keyof BpmnElementProperties, value: any): void {
    this.editSelected({ [propName]: value }, (element) => {
      let updatePayload: Record<string, any>;
      if (propName === 'conditionExpression') {
        updatePayload = {
          conditionExpression:
            value && value.trim()
              ? this.modeler
                  .get('bpmnFactory')
                  .create('bpmn:FormalExpression', { body: value.trim() })
              : undefined,
        };
      } else {
        // 'javaClass' is the panel's field name, but the real camunda moddle property is 'class'
        // ('class' is awkward to use as a JS/TS identifier, hence the alias in BpmnElementProperties).
        const moddlePropName = propName === 'javaClass' ? 'class' : propName;
        updatePayload = { [moddlePropName]: value || undefined };
      }
      this.modeler.get('modeling').updateProperties(element, updatePayload);
    });
  }

  /**
   * "Default flow" lives on the gateway (source), not on the flow itself - it's the
   * `bpmn:Gateway.default` moddle property, a reference to this SequenceFlow's business
   * object. Written on the source element, distinct from the currently-selected flow.
   */
  protected updateDefaultFlow(isDefault: boolean): void {
    this.editSelected({ isDefaultFlow: isDefault }, (flowElement) => {
      if (!flowElement.source) return false;
      this.modeler.get('modeling').updateProperties(flowElement.source, {
        default: isDefault ? flowElement.businessObject : undefined,
      });
      return true;
    });
  }

  /**
   * Timer config lives on the nested `bpmn:TimerEventDefinition`, not on the event itself.
   * Exactly one of timeDuration / timeDate / timeCycle is kept, each as a `bpmn:FormalExpression`.
   * The chosen type is written even with an empty body so it survives re-selecting the element.
   */
  protected updateTimer(changes: { timerType?: TimerType | ''; timerValue?: string }): void {
    const currentSel = this.selected();
    if (!currentSel) return;

    const timerType = changes.timerType ?? currentSel.timerType ?? '';
    const timerValue = changes.timerValue ?? currentSel.timerValue ?? '';

    this.editSelected({ timerType, timerValue }, (element) => {
      const timerDef = getTimerDefinition(element.businessObject);
      if (!timerDef) return false;

      const updatePayload: Record<string, any> = {};
      TIMER_TYPES.forEach((t) => (updatePayload[t] = undefined));
      if (timerType) {
        updatePayload[timerType] = this.modeler.get('bpmnFactory').create('bpmn:FormalExpression', {
          body: timerValue.trim() || undefined,
        });
      }
      this.modeler.get('modeling').updateModdleProperties(element, timerDef, updatePayload);
      return true;
    });
  }

  protected updateTimerDateFromPicker(localValue: string): void {
    if (!localValue) return;
    this.updateTimer({ timerValue: fromDateTimeLocal(localValue) });
  }

  protected updateBoundaryInterrupting(isInterrupting: boolean): void {
    // Omit the attribute for the schema default (true) to keep the XML clean
    this.editSelected({ isInterrupting }, (element) =>
      this.modeler
        .get('modeling')
        .updateProperties(element, { cancelActivity: isInterrupting ? undefined : false }),
    );
  }

  /**
   * Applies a modeling command to the selected element, then mirrors the raw (untrimmed) value
   * into the sidebar state. `edit` may return `false` to signal it skipped the change.
   */
  private editSelected(
    patch: Partial<BpmnElementProperties>,
    edit: (element: any) => boolean | void,
  ): void {
    const currentSel = this.selected();
    if (!currentSel) return;

    const element = this.modeler.getElement(currentSel.id);
    if (!element) return;

    if (this.modeler.applySidebarEdit(() => edit(element)) === false) return;
    this.selected.set({ ...currentSel, ...patch });
  }
}
