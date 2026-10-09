import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BpmnPropertiesPanelComponent } from './bpmn-properties-panel.component';
import { BpmnModelerService } from '../services/bpmn-modeler.service';
import { BpmnElementProperties } from '../bpmn-designer.models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('BpmnPropertiesPanelComponent', () => {
  let fixture: ComponentFixture<BpmnPropertiesPanelComponent>;
  let component: BpmnPropertiesPanelComponent;
  let mockModeler: {
    selectedElement: ReturnType<typeof signal<BpmnElementProperties | null>>;
    isSimulationActive: ReturnType<typeof signal<boolean>>;
    editSelected: ReturnType<typeof vi.fn>;
    updateProperty: ReturnType<typeof vi.fn>;
    getElement: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockModeler = {
      selectedElement: signal<BpmnElementProperties | null>(null),
      isSimulationActive: signal(false),
      editSelected: vi.fn(),
      updateProperty: vi.fn(),
      getElement: vi.fn(),
      get: vi.fn().mockReturnValue({
        updateLabel: vi.fn(),
        updateProperties: vi.fn(),
        create: vi.fn(),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [BpmnPropertiesPanelComponent],
      providers: [
        { provide: BpmnModelerService, useValue: mockModeler },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnPropertiesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty state when no element is selected', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-selection')).toBeTruthy();
    expect(compiled.querySelector('.empty-selection')?.textContent).toContain('Chưa chọn phần tử');
  });

  it('should render element hero card and tabs when an element is selected', () => {
    mockModeler.selectedElement.set({
      id: 'Activity_1',
      name: 'Phê duyệt đơn hàng',
      type: 'bpmn:UserTask',
      documentation: 'Ghi chú duyệt đơn',
      assignee: 'admin',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-selection')).toBeFalsy();
    expect(compiled.querySelector('.element-hero-card')).toBeTruthy();
    expect(compiled.querySelector('.id-text')?.textContent).toContain('Activity_1');
  });

  it('should switch tabs correctly', () => {
    mockModeler.selectedElement.set({
      id: 'Activity_1',
      name: 'User Task',
      type: 'bpmn:UserTask',
      documentation: '',
    });
    fixture.detectChanges();

    expect(component.activeTab()).toBe('general');

    component.activeTab.set('execution');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('execution');

    component.activeTab.set('advanced');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('advanced');
  });

  it('should call editSelected when updating name', () => {
    mockModeler.selectedElement.set({
      id: 'Activity_1',
      name: 'Old Name',
      type: 'bpmn:Task',
      documentation: '',
    });
    fixture.detectChanges();

    (component as any).updateName('New Name');
    expect(mockModeler.editSelected).toHaveBeenCalledWith(
      { name: 'New Name' },
      expect.any(Function),
    );
  });

  it('should call updateProperty when property changes', () => {
    (component as any).updateProperty('priority', '100');
    expect(mockModeler.updateProperty).toHaveBeenCalledWith('priority', '100');
  });
});
