import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  ProcessInstance,
  StartProcessInstanceRequest,
  ProcessInstanceQueryParams,
  PageData,
} from '@core/models';
import { formatDateTime } from '@shared/utils';

const MOCK_CASES: ProcessInstance[] = [
  {
    id: 'case-inst-1001',
    processId: 'Process_OrderFulfillment',
    processVersion: 1,
    status: 'RUNNING',
    currentNodeId: 'Task_PackShip',
    variables: {
      orderId: 'ORD-98241',
      customer: 'Công ty TNHH Hoàng Phát',
      amount: 15500000,
      paymentMethod: 'VNPAY_QR',
      isVip: true,
      itemsCount: 4,
    },
    startedBy: 'admin',
    startedAt: '16/09/2026 08:30:15',
    completedAt: null,
    createdAt: '2026-09-16T01:30:15.000Z',
    updatedAt: '2026-09-16T02:00:22.000Z',
  },
  {
    id: 'case-inst-1002',
    processId: 'Process_LoanApproval',
    processVersion: 2,
    status: 'RUNNING',
    currentNodeId: 'Task_ReviewApplication',
    variables: {
      applicantName: 'Nguyễn Văn Hùng',
      loanAmount: 250000000,
      termMonths: 36,
      creditScore: 720,
      purpose: 'Vay tiêu dùng mua xe ô tô',
    },
    startedBy: 'thienle',
    startedAt: '16/09/2026 09:15:40',
    completedAt: null,
    createdAt: '2026-09-16T02:15:40.000Z',
    updatedAt: '2026-09-16T02:15:40.000Z',
  },
  {
    id: 'case-inst-1003',
    processId: 'Process_LeaveRequest',
    processVersion: 1,
    status: 'COMPLETED',
    currentNodeId: null,
    variables: {
      employeeName: 'Trần Thị Mai',
      department: 'Kỹ thuật phần mềm',
      leaveType: 'Nghỉ phép năm',
      days: 3,
      reason: 'Việc gia đình',
      approved: true,
    },
    startedBy: 'maitt',
    startedAt: '15/09/2026 14:10:00',
    completedAt: '2026-09-15T07:45:00.000Z',
    createdAt: '2026-09-15T07:10:00.000Z',
    updatedAt: '2026-09-15T07:45:00.000Z',
  },
  {
    id: 'case-inst-1004',
    processId: 'Process_OrderFulfillment',
    processVersion: 1,
    status: 'COMPLETED',
    currentNodeId: null,
    variables: {
      orderId: 'ORD-98210',
      customer: 'Lê Thanh Bình',
      amount: 4200000,
      paymentMethod: 'COD',
      isVip: false,
    },
    startedBy: 'binhlt',
    startedAt: '15/09/2026 10:05:30',
    completedAt: '2026-09-15T04:30:10.000Z',
    createdAt: '2026-09-15T03:05:30.000Z',
    updatedAt: '2026-09-15T04:30:10.000Z',
  },
  {
    id: 'case-inst-1005',
    processId: 'Process_ContractReview',
    processVersion: 1,
    status: 'RUNNING',
    currentNodeId: 'Task_LegalApprove',
    variables: {
      contractNumber: 'HD-2026/09-08',
      partner: 'Tập đoàn ABC Global',
      value: 1200000000,
      priority: 'HIGH',
    },
    startedBy: 'admin',
    startedAt: '16/09/2026 10:00:00',
    completedAt: null,
    createdAt: '2026-09-16T03:00:00.000Z',
    updatedAt: '2026-09-16T03:00:00.000Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class CaseApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/process-instances';

  private mockCasesStore: ProcessInstance[] = [...MOCK_CASES];

  getAll(params?: ProcessInstanceQueryParams): Observable<PageData<ProcessInstance>> {
    const cleanParams: Record<string, string | number> = {
      page: params?.page !== undefined && params?.page !== null ? params.page : 1,
      size: params?.size !== undefined && params?.size !== null ? params.size : 20,
    };

    if (params) {
      if (params.status && params.status !== 'ALL') {
        cleanParams['status'] = params.status;
      }
      if (params.processId && params.processId !== 'ALL') {
        cleanParams['processId'] = params.processId;
      }
      if (params.search && params.search.trim()) {
        cleanParams['search'] = params.search.trim();
      }
    }

    return this.api.get<PageData<ProcessInstance>>(this.endpoint, cleanParams).pipe(
      catchError(() => {
        let list = [...this.mockCasesStore];

        if (params?.status && params.status !== 'ALL') {
          list = list.filter((item) => item.status.toUpperCase() === params.status?.toUpperCase());
        }

        if (params?.processId && params.processId !== 'ALL') {
          list = list.filter((item) => item.processId === params.processId);
        }

        if (params?.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (item) =>
              item.id.toLowerCase().includes(q) ||
              item.processId.toLowerCase().includes(q) ||
              (item.currentNodeId && item.currentNodeId.toLowerCase().includes(q)) ||
              item.startedBy.toLowerCase().includes(q),
          );
        }

        const page = Number(cleanParams['page']);
        const size = Number(cleanParams['size']);
        const start = (page - 1) * size;
        const pagedContent = list.slice(start, start + size);

        return of({
          content: pagedContent,
          page,
          size,
          totalElements: list.length,
          totalPages: Math.ceil(list.length / size) || 1,
        });
      }),
    );
  }

  getById(id: string): Observable<ProcessInstance> {
    return this.api.get<ProcessInstance>(`${this.endpoint}/${id}`).pipe(
      catchError(() => {
        const found = this.mockCasesStore.find((item) => item.id === id);
        if (found) {
          return of(found);
        }
        return throwError(() => new Error(`Không tìm thấy hồ sơ vụ việc với mã ${id}`));
      }),
    );
  }

  startInstance(payload: StartProcessInstanceRequest): Observable<ProcessInstance> {
    return this.api.post<ProcessInstance>(this.endpoint, payload).pipe(
      catchError(() => {
        const now = new Date();
        const newInstance: ProcessInstance = {
          id: `case-inst-${Date.now().toString().slice(-4)}`,
          processId: payload.processId,
          processVersion: 1,
          status: 'RUNNING',
          currentNodeId: 'Task_FirstStep',
          variables: payload.variables || {},
          startedBy: 'admin',
          startedAt: formatDateTime(now),
          completedAt: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        this.mockCasesStore = [newInstance, ...this.mockCasesStore];
        return of(newInstance);
      }),
    );
  }
}
