import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaseStartModalComponent } from './case-start-modal.component';
import { CaseService, FormSchemaService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BpmnProcess, ProcessInstance } from '@core/models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('CaseStartModalComponent', () => {
  let fixture: ComponentFixture<CaseStartModalComponent>;
  let component: CaseStartModalComponent;
  let mockCaseService: {
    isStarting: ReturnType<typeof signal<boolean>>;
    startCase: ReturnType<typeof vi.fn>;
  };
  let mockFormSchemaService: {
    getFormForProcessStart: ReturnType<typeof vi.fn>;
    extractFormValues: ReturnType<typeof vi.fn>;
  };
  let mockMessage: { warning: ReturnType<typeof vi.fn> };

  const sampleProcesses: BpmnProcess[] = [
    {
      id: 'proc-1',
      processKey: 'Process_OrderFulfillment',
      name: 'Xử lý đơn hàng',
      description: 'Quy trình xử lý đơn hàng',
      category: 'ORDER',
      version: 1,
      bpmnXml: null,
      status: 'PUBLISHED',
      createdBy: 'admin',
      updatedBy: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const createdCase: ProcessInstance = {
    id: 'case-99',
    processId: 'proc-1',
    processVersion: 1,
    status: 'RUNNING',
    currentNodeId: 'StartEvent_1',
    variables: {},
    startedBy: 'admin',
    startedAt: '01/03/2026 10:00:00',
    completedAt: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  };

  beforeEach(async () => {
    mockCaseService = {
      isStarting: signal(false),
      startCase: vi.fn().mockReturnValue(of(createdCase)),
    };
    mockFormSchemaService = {
      getFormForProcessStart: vi.fn().mockReturnValue({ id: 'form-1', fields: [] }),
      extractFormValues: vi.fn().mockReturnValue({ orderId: 'ORD-123' }),
    };
    mockMessage = {
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CaseStartModalComponent],
      providers: [
        { provide: CaseService, useValue: mockCaseService },
        { provide: FormSchemaService, useValue: mockFormSchemaService },
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseStartModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('processes', sampleProcesses);
    fixture.detectChanges();
  });

  it('should create in hidden state', () => {
    expect(component).toBeTruthy();
    expect((component as any).isVisible()).toBe(false);
  });

  it('should open and preselect process', () => {
    component.open();
    expect((component as any).isVisible()).toBe(true);
    expect((component as any).processId()).toBe('proc-1');
  });

  it('should submit case and emit started event', () => {
    const startedSpy = vi.fn();
    component.started.subscribe(startedSpy);

    component.open('proc-1');
    (component as any).submit();

    expect(mockCaseService.startCase).toHaveBeenCalledWith({
      processId: 'proc-1',
      variables: { orderId: 'ORD-123' },
    });
    expect(startedSpy).toHaveBeenCalledWith(createdCase);
    expect((component as any).isVisible()).toBe(false);
  });

  it('should prevent submission when no process is selected', () => {
    (component as any).processId.set('');
    (component as any).submit();
    expect(mockMessage.warning).toHaveBeenCalled();
    expect(mockCaseService.startCase).not.toHaveBeenCalled();
  });
});
