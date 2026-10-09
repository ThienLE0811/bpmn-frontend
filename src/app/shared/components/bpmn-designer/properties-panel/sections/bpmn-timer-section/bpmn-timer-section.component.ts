import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BpmnElementProperties, TimerType } from '../../../bpmn-designer.models';
import { BpmnModelerService } from '../../../services/bpmn-modeler.service';
import { isBoundaryEvent } from '../../../utils/bpmn-type-meta';
import {
  describeTimer,
  fromDateTimeLocal,
  getTimerDefinition,
  TIMER_PRESETS,
  TIMER_TYPES,
  toDateTimeLocal,
} from '../../../utils/timer.utils';

@Component({
  selector: 'app-bpmn-timer-section',
  standalone: true,
  imports: [FormsModule, NzIconModule],
  templateUrl: './bpmn-timer-section.component.html',
  styleUrl: './bpmn-timer-section.component.scss',
})
export class BpmnTimerSectionComponent {
  private readonly modeler = inject(BpmnModelerService);

  readonly element = input.required<BpmnElementProperties>();

  protected readonly timerPresets = TIMER_PRESETS;
  protected readonly toDateTimeLocal = toDateTimeLocal;
  protected readonly isBoundaryEvent = isBoundaryEvent;

  protected readonly timerSummary = computed(() => {
    const el = this.element();
    return el?.hasTimer ? describeTimer(el.timerType, el.timerValue) : null;
  });

  /**
   * Timer config lives on the nested `bpmn:TimerEventDefinition`, not on the event itself.
   * Exactly one of timeDuration / timeDate / timeCycle is kept, each as a `bpmn:FormalExpression`.
   * The chosen type is written even with an empty body so it survives re-selecting the element.
   */
  protected updateTimer(changes: { timerType?: TimerType | ''; timerValue?: string }): void {
    const currentSel = this.element();
    const timerType = changes.timerType ?? currentSel.timerType ?? '';
    const timerValue = changes.timerValue ?? currentSel.timerValue ?? '';

    this.modeler.editSelected({ timerType, timerValue }, (element: any) => {
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
    this.modeler.editSelected({ isInterrupting }, (element: any) =>
      this.modeler
        .get('modeling')
        .updateProperties(element, { cancelActivity: isInterrupting ? undefined : false }),
    );
  }
}
