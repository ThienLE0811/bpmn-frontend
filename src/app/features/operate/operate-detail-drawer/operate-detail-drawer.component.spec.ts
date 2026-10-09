import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { OperateDetailDrawerComponent } from './operate-detail-drawer.component';
import { OperateService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { provideTestIcons } from '@shared/testing/test-icon-provider';
import { OperateProcessInstance, ProcessIncident } from '@core/models';

describe('OperateDetailDrawerComponent', () => {
  let fixture: ComponentFixture<OperateDetailDrawerComponent>;
  let component: OperateDetailDrawerComponent;
  let mockOperateService: any;
  let mockMessage: {
    success: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const testInstance: OperateProcessInstance = {
    id: 'inst-12345',
    processDefinitionKey: 'order_process',
    processDefinitionName: 'Xử lý đơn hàng',
    processVersion: 2,
    state: 'INCIDENT',
    startDate: '2026-10-09T08:00:00Z',
    incidentCount: 1,
    activeActivities: ['task_check_inventory'],
    incidentActivities: ['task_check_inventory'],
    completedActivities: ['start_event'],
  };

  beforeEach(async () => {
    mockOperateService = {
      incidents: signal<ProcessIncident[]>([
        {
          id: 'inc-1',
          processInstanceId: 'inst-12345',
          activityId: 'task_check_inventory',
          activityName: 'Kiểm tra tồn kho',
          errorType: 'OUT_OF_STOCK',
          errorMessage: 'Hết hàng trong kho',
          creationTime: '2026-10-09T08:05:00Z',
          state: 'OPEN',
        },
      ]),
      variables: signal([]),
      auditTrail: signal([]),
      isActionLoading: signal(false),
      retryIncident: vi.fn(),
      cancelInstance: vi.fn(),
    };

    mockMessage = {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OperateDetailDrawerComponent],
      providers: [
        { provide: OperateService, useValue: mockOperateService },
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperateDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('instance', testInstance);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event when closeDrawer is called', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.closeDrawer();
    expect(closed).toBe(true);
  });

  it('should call retryIncident on operateService and display success message', () => {
    const incident: ProcessIncident = {
      id: 'inc-1',
      processInstanceId: 'inst-12345',
      activityId: 'task_check_inventory',
      activityName: 'Kiểm tra tồn kho',
      errorType: 'OUT_OF_STOCK',
      errorMessage: 'Hết hàng trong kho',
      creationTime: '2026-10-09T08:05:00Z',
      state: 'OPEN',
    };

    component.retryIncident(incident, 'inst-12345');
    expect(mockOperateService.retryIncident).toHaveBeenCalledWith('inc-1', 'inst-12345');
    expect(mockMessage.success).toHaveBeenCalledWith(
      expect.stringContaining('Kiểm tra tồn kho')
    );
  });

  it('should call cancelInstance on operateService, emit instanceCancelled and display info message', () => {
    let cancelledInstance: OperateProcessInstance | undefined;
    component.instanceCancelled.subscribe((inst) => (cancelledInstance = inst));

    component.cancelInstance(testInstance);
    expect(mockOperateService.cancelInstance).toHaveBeenCalledWith('inst-12345');
    expect(cancelledInstance).toEqual(testInstance);
    expect(mockMessage.info).toHaveBeenCalledWith(
      expect.stringContaining('inst-12345')
    );
  });
});
