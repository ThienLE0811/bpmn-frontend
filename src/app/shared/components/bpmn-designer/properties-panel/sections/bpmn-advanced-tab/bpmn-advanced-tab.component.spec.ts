import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BpmnAdvancedTabComponent } from './bpmn-advanced-tab.component';
import { BpmnElementProperties } from '../../../bpmn-designer.models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('BpmnAdvancedTabComponent', () => {
  let fixture: ComponentFixture<BpmnAdvancedTabComponent>;
  let component: BpmnAdvancedTabComponent;

  const defaultElement: BpmnElementProperties = {
    id: 'Task_123',
    name: 'Giao việc',
    type: 'bpmn:UserTask',
    documentation: '',
    assignee: 'admin',
    conditionExpression: '${amount > 100}',
    topic: 'order-topic',
    decisionRef: 'decision_table_1',
    resultVariable: 'isApproved',
    timerType: 'timeDuration',
    timerValue: 'PT5M',
  };

  const defaultTypeMeta = {
    label: 'User Task',
    category: 'task',
    icon: 'user',
    color: '#1890ff',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpmnAdvancedTabComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnAdvancedTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('element', defaultElement);
    fixture.componentRef.setInput('typeMeta', defaultTypeMeta);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render raw XML metadata grid items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent || '';

    expect(text).toContain('Task_123');
    expect(text).toContain('bpmn:UserTask');
    expect(text).toContain('task');
    expect(text).toContain('admin');
    expect(text).toContain('${amount > 100}');
    expect(text).toContain('order-topic');
    expect(text).toContain('decision_table_1');
    expect(text).toContain('isApproved');
  });
});
