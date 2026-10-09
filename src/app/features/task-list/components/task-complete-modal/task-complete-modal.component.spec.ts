import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskCompleteModalComponent } from './task-complete-modal.component';
import { TaskService, FormSchemaService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TaskResponse } from '@core/models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('TaskCompleteModalComponent', () => {
  let fixture: ComponentFixture<TaskCompleteModalComponent>;
  let component: TaskCompleteModalComponent;
  let mockTaskService: {
    completeTask: ReturnType<typeof vi.fn>;
  };
  let mockFormSchemaService: {
    getFormForTask: ReturnType<typeof vi.fn>;
    extractFormValues: ReturnType<typeof vi.fn>;
  };
  let mockMessage: { warning: ReturnType<typeof vi.fn> };

  const sampleTask: TaskResponse = {
    id: 't-123',
    nodeId: 'Activity_Review',
    name: 'Duyệt thanh toán',
    description: '',
    status: 'ASSIGNED',
    assigneeId: 'admin',
    claimedBy: 'admin',
    claimedAt: '2026-03-01',
    completedBy: '',
    completedAt: '',
    processInstanceId: 'pi-1',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  };

  beforeEach(async () => {
    mockTaskService = {
      completeTask: vi.fn().mockReturnValue(of({ ...sampleTask, status: 'COMPLETED' })),
    };
    mockFormSchemaService = {
      getFormForTask: vi.fn().mockReturnValue({ id: 'form-rev', fields: [] }),
      extractFormValues: vi.fn().mockReturnValue({ approved: true, comment: 'OK' }),
    };
    mockMessage = {
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskCompleteModalComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: FormSchemaService, useValue: mockFormSchemaService },
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCompleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in closed state', () => {
    expect(component).toBeTruthy();
    expect((component as any).isVisible()).toBe(false);
  });

  it('should open and prepare form schema and initial values', () => {
    component.open(sampleTask);
    expect((component as any).isVisible()).toBe(true);
    expect((component as any).task()?.id).toBe('t-123');
    expect((component as any).formValues()).toEqual({ approved: true, comment: 'OK' });
  });

  it('should complete task on valid submit', () => {
    component.open(sampleTask);
    (component as any).submit();

    expect(mockTaskService.completeTask).toHaveBeenCalledWith('t-123', {
      approved: true,
      comment: 'OK',
    });
    expect((component as any).isVisible()).toBe(false);
  });
});
