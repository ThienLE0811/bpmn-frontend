import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskDetailDrawerComponent } from './task-detail-drawer.component';
import { TaskService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TaskResponse } from '@core/models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('TaskDetailDrawerComponent', () => {
  let fixture: ComponentFixture<TaskDetailDrawerComponent>;
  let component: TaskDetailDrawerComponent;
  let mockTaskService: {
    tasks: ReturnType<typeof signal<TaskResponse[]>>;
    claimTask: ReturnType<typeof vi.fn>;
  };
  let mockMessage: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const sampleTask: TaskResponse = {
    id: 'task-1',
    nodeId: 'Activity_Review',
    name: 'Kiểm duyệt tài liệu',
    description: '',
    status: 'ASSIGNED',
    assigneeId: 'john',
    claimedBy: 'john',
    claimedAt: '2026-03-01',
    completedBy: '',
    completedAt: '',
    processInstanceId: 'pi-123',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  };

  beforeEach(async () => {
    mockTaskService = {
      tasks: signal([sampleTask]),
      claimTask: vi.fn().mockReturnValue(of({ ...sampleTask, status: 'COMPLETED' })),
    };
    mockMessage = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskDetailDrawerComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in closed state', () => {
    expect(component).toBeTruthy();
    expect((component as any).isOpen()).toBe(false);
  });

  it('should open with task data', () => {
    component.open(sampleTask);
    expect((component as any).isOpen()).toBe(true);
    expect((component as any).task()?.name).toBe('Kiểm duyệt tài liệu');
  });

  it('should claim task when claim is called', () => {
    component.open(sampleTask);
    (component as any).claim(sampleTask);
    expect(mockTaskService.claimTask).toHaveBeenCalledWith('task-1');
  });

  it('should close drawer on close()', () => {
    component.open(sampleTask);
    expect((component as any).isOpen()).toBe(true);

    (component as any).close();
    expect((component as any).isOpen()).toBe(false);
  });
});
