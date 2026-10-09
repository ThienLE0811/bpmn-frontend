import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { OperateComponent } from './operate.component';
import { OperateService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { provideTestIcons } from '@shared/testing/test-icon-provider';
import { OperateProcessInstance } from '@core/models';

describe('OperateComponent', () => {
  let fixture: ComponentFixture<OperateComponent>;
  let component: OperateComponent;
  let mockOperateService: any;
  let mockMessage: {
    success: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const testInstances: OperateProcessInstance[] = [
    {
      id: 'inst-1',
      processDefinitionKey: 'order_proc',
      processDefinitionName: 'Xử lý đơn hàng',
      processVersion: 1,
      state: 'ACTIVE',
      startDate: '2026-10-09T08:00:00Z',
      incidentCount: 0,
      activeActivities: ['task_1'],
      incidentActivities: [],
      completedActivities: [],
    },
    {
      id: 'inst-2',
      processDefinitionKey: 'leave_proc',
      processDefinitionName: 'Xin nghỉ phép',
      processVersion: 2,
      state: 'COMPLETED',
      startDate: '2026-10-09T07:00:00Z',
      endDate: '2026-10-09T07:30:00Z',
      incidentCount: 0,
      activeActivities: [],
      incidentActivities: [],
      completedActivities: ['task_start', 'task_approve'],
    },
  ];

  beforeEach(async () => {
    mockOperateService = {
      instances: signal<OperateProcessInstance[]>(testInstances),
      metrics: signal({
        totalInstances: 2,
        activeInstances: 1,
        incidentInstances: 0,
        completedInstances: 1,
        canceledInstances: 0,
      }),
      selectedInstance: signal<OperateProcessInstance | null>(null),
      incidents: signal([]),
      variables: signal([]),
      auditTrail: signal([]),
      filterState: signal('ALL'),
      searchTerm: signal(''),
      isLoading: signal(false),
      isActionLoading: signal(false),
      loadMetrics: vi.fn(),
      loadInstances: vi.fn(),
      setSearchTerm: vi.fn(),
      setFilterState: vi.fn(),
      selectInstance: vi.fn(),
      cancelInstance: vi.fn(),
    };

    mockMessage = {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OperateComponent],
      providers: [
        { provide: OperateService, useValue: mockOperateService },
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockOperateService.loadMetrics).toHaveBeenCalled();
    expect(mockOperateService.loadInstances).toHaveBeenCalled();
  });

  it('should toggle stats visibility', () => {
    expect(component.isStatsOpen()).toBe(false);
    component.toggleStats();
    expect(component.isStatsOpen()).toBe(true);
    component.toggleStats();
    expect(component.isStatsOpen()).toBe(false);
  });

  it('should update search term and filter state', () => {
    component.onSearchChange('order');
    expect(component.searchInput()).toBe('order');
    expect(mockOperateService.setSearchTerm).toHaveBeenCalledWith('order');

    component.onFilterStateChange('ACTIVE');
    expect(mockOperateService.setFilterState).toHaveBeenCalledWith('ACTIVE');
  });

  it('should open and close detail drawer', () => {
    const inst = testInstances[0];
    component.openDetail(inst);
    expect(mockOperateService.selectInstance).toHaveBeenCalledWith(inst);
    expect(component.isDetailOpen()).toBe(true);

    component.closeDetail();
    expect(mockOperateService.selectInstance).toHaveBeenCalledWith(null);
    expect(component.isDetailOpen()).toBe(false);
  });

  it('should cancel instance and notify user', () => {
    const inst = testInstances[0];
    component.cancelInstance(inst);
    expect(mockOperateService.cancelInstance).toHaveBeenCalledWith('inst-1');
    expect(mockMessage.info).toHaveBeenCalledWith(
      expect.stringContaining('inst-1')
    );
  });
});
