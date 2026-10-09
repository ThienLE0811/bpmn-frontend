import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BpmnUserTaskSectionComponent } from './bpmn-user-task-section.component';
import { BpmnModelerService } from '../../../services/bpmn-modeler.service';
import { FormSchemaService } from '@core/services/state/form-schema.service';
import { BpmnElementProperties } from '../../../bpmn-designer.models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('BpmnUserTaskSectionComponent', () => {
  let fixture: ComponentFixture<BpmnUserTaskSectionComponent>;
  let component: BpmnUserTaskSectionComponent;
  let mockModeler: {
    updateProperty: ReturnType<typeof vi.fn>;
  };
  let mockFormSchemaService: {
    getRegisteredForms: ReturnType<typeof vi.fn>;
  };

  const defaultElement: BpmnElementProperties = {
    id: 'UserTask_1',
    name: 'Duyệt hồ sơ',
    type: 'bpmn:UserTask',
    documentation: '',
    assignee: 'manager',
    candidateGroups: 'HR, ADMIN',
    candidateUsers: 'john, jane',
    dueDate: 'P3D',
    priority: '75',
    formKey: 'loan_approval_form',
  };

  beforeEach(async () => {
    mockModeler = {
      updateProperty: vi.fn(),
    };
    mockFormSchemaService = {
      getRegisteredForms: vi.fn().mockReturnValue([
        { id: 'loan_approval_form', name: 'Form Phê duyệt khoản vay' },
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [BpmnUserTaskSectionComponent],
      providers: [
        { provide: BpmnModelerService, useValue: mockModeler },
        { provide: FormSchemaService, useValue: mockFormSchemaService },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnUserTaskSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('element', defaultElement);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render form fields with element values', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll('input');
    const inputValues = Array.from(inputs).map((input) => (input as HTMLInputElement).value);

    expect(inputValues).toContain('manager');
    expect(inputValues).toContain('HR, ADMIN');
    expect(inputValues).toContain('john, jane');
    expect(inputValues).toContain('P3D');
    expect(inputValues).toContain('loan_approval_form');
  });

  it('should call modeler updateProperty on change', () => {
    (component as any).updateProperty('assignee', 'new_user');
    expect(mockModeler.updateProperty).toHaveBeenCalledWith('assignee', 'new_user');
  });
});
