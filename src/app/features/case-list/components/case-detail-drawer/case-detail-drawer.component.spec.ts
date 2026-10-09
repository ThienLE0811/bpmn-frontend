import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaseDetailDrawerComponent } from './case-detail-drawer.component';
import { BpmnProcessService, CaseService, OperateApiService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiErrorHandlerService } from '@shared/services';
import { ProcessInstance } from '@core/models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';
import { OperateViewerComponent } from '../../../operate/operate-viewer/operate-viewer.component';

@Component({
  selector: 'app-operate-viewer',
  standalone: true,
  template: '<div class="mock-operate-viewer"></div>',
})
class MockOperateViewerComponent {
  xml = input<string | null>(null);
  activeActivities = input<string[]>([]);
  incidentActivities = input<string[]>([]);
}

describe('CaseDetailDrawerComponent', () => {
  let fixture: ComponentFixture<CaseDetailDrawerComponent>;
  let component: CaseDetailDrawerComponent;
  let mockCaseService: {
    selectedCase: ReturnType<typeof signal<ProcessInstance | null>>;
    isDetailLoading: ReturnType<typeof signal<boolean>>;
    selectCase: ReturnType<typeof vi.fn>;
    getCaseById: ReturnType<typeof vi.fn>;
  };
  let mockBpmnService: {
    processes: ReturnType<typeof signal<any[]>>;
    getProcessById: ReturnType<typeof vi.fn>;
  };
  let mockOperateApi: {
    getIncidents: ReturnType<typeof vi.fn>;
    retryIncident: ReturnType<typeof vi.fn>;
  };
  let mockMessage: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockErrorHandler: { handleError: ReturnType<typeof vi.fn> };

  const sampleCase: ProcessInstance = {
    id: 'inst-1',
    processId: 'proc-1',
    processVersion: 1,
    status: 'RUNNING',
    currentNodeId: 'Activity_CreditCheck',
    variables: { amount: 50000000, applicant: 'Nguyễn Văn A' },
    startedBy: 'admin',
    startedAt: '01/03/2026 10:00:00',
    completedAt: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  };

  beforeEach(async () => {
    mockCaseService = {
      selectedCase: signal<ProcessInstance | null>(sampleCase),
      isDetailLoading: signal(false),
      selectCase: vi.fn(),
      getCaseById: vi.fn().mockReturnValue(of(sampleCase)),
    };
    mockBpmnService = {
      processes: signal([{ id: 'proc-1', name: 'Duyệt vay vốn', bpmnXml: '<bpmn/>' }]),
      getProcessById: vi.fn().mockReturnValue(of({ bpmnXml: '<bpmn/>' })),
    };
    mockOperateApi = {
      getIncidents: vi.fn().mockReturnValue(of([])),
      retryIncident: vi.fn().mockReturnValue(of({})),
    };
    mockMessage = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockErrorHandler = {
      handleError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CaseDetailDrawerComponent],
      providers: [
        { provide: CaseService, useValue: mockCaseService },
        { provide: BpmnProcessService, useValue: mockBpmnService },
        { provide: OperateApiService, useValue: mockOperateApi },
        { provide: NzMessageService, useValue: mockMessage },
        { provide: ApiErrorHandlerService, useValue: mockErrorHandler },
        provideTestIcons(),
      ],
    })
      .overrideComponent(CaseDetailDrawerComponent, {
        remove: { imports: [OperateViewerComponent] },
        add: { imports: [MockOperateViewerComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CaseDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map variables into table rows', () => {
    const vars = (component as any).variables();
    expect(vars.length).toBe(2);
    expect(vars.some((v: any) => v.key === 'amount' && v.value === '50000000')).toBe(true);
    expect(vars.some((v: any) => v.key === 'applicant' && v.value === 'Nguyễn Văn A')).toBe(true);
  });

  it('should open and select case', () => {
    component.open(sampleCase);
    expect((component as any).isOpen()).toBe(true);
    expect(mockCaseService.selectCase).toHaveBeenCalledWith(sampleCase);
    expect((component as any).bpmnXml()).toBe('<bpmn/>');
  });

  it('should compute activeActivityIds for running cases', () => {
    expect((component as any).activeActivityIds()).toEqual(['Activity_CreditCheck']);
  });
});
