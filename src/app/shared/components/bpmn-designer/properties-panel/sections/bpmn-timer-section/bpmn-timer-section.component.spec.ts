import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BpmnTimerSectionComponent } from './bpmn-timer-section.component';
import { BpmnModelerService } from '../../../services/bpmn-modeler.service';
import { BpmnElementProperties } from '../../../bpmn-designer.models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('BpmnTimerSectionComponent', () => {
  let fixture: ComponentFixture<BpmnTimerSectionComponent>;
  let component: BpmnTimerSectionComponent;
  let mockModeler: {
    editSelected: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  const defaultElement: BpmnElementProperties = {
    id: 'TimerEvent_1',
    name: 'Chờ 2 ngày',
    type: 'bpmn:IntermediateCatchEvent',
    documentation: '',
    hasTimer: true,
    timerType: 'timeDuration',
    timerValue: 'P2D',
  };

  beforeEach(async () => {
    mockModeler = {
      editSelected: vi.fn(),
      get: vi.fn().mockReturnValue({
        updateModdleProperties: vi.fn(),
        updateProperties: vi.fn(),
        create: vi.fn(),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [BpmnTimerSectionComponent],
      providers: [
        { provide: BpmnModelerService, useValue: mockModeler },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnTimerSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('element', defaultElement);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute timerSummary correctly', () => {
    const summary = (component as any).timerSummary();
    expect(summary).toBeTruthy();
    expect(summary?.valid).toBe(true);
    expect(summary?.text).toContain('2 ngày');
  });

  it('should call editSelected when updating timer properties', () => {
    (component as any).updateTimer({ timerValue: 'PT1H' });
    expect(mockModeler.editSelected).toHaveBeenCalledWith(
      { timerType: 'timeDuration', timerValue: 'PT1H' },
      expect.any(Function),
    );
  });

  it('should call editSelected when updating boundary interrupting state', () => {
    (component as any).updateBoundaryInterrupting(false);
    expect(mockModeler.editSelected).toHaveBeenCalledWith(
      { isInterrupting: false },
      expect.any(Function),
    );
  });
});
