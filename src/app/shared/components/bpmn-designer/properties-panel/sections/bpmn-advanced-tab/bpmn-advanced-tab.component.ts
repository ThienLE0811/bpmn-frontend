import { Component, input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BpmnElementProperties } from '../../../bpmn-designer.models';
import { isBoundaryEvent } from '../../../utils/bpmn-type-meta';

@Component({
  selector: 'app-bpmn-advanced-tab',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './bpmn-advanced-tab.component.html',
  styleUrl: './bpmn-advanced-tab.component.scss',
})
export class BpmnAdvancedTabComponent {
  readonly element = input.required<BpmnElementProperties>();
  readonly typeMeta = input.required<{ label: string; icon: string; color: string; category: string }>();

  protected readonly isBoundaryEvent = isBoundaryEvent;
}
