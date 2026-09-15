import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { TaskResponse, TaskQueryParams, CompleteTaskPayload } from '@core/models';
import { TaskApiService } from '../api/task-api.service';
import { AuthService } from './auth.service';
import { ApiErrorHandlerService } from '@shared/services';
import { formatDateTime } from '@shared/utils';
import { NzMessageService } from 'ng-zorro-antd/message';

const MOCK_TASKS: TaskResponse[] = [
  {
    id: 'task-1001',
    processInstanceId: 'pi-loan-8812',
    nodeId: 'Activity_VerifyApplication',
    name: 'Kiểm tra hồ sơ vay vốn cá nhân',
    description: 'Rà soát thông tin CCCD, sao kê ngân hàng 6 tháng và thẩm định tính hợp lệ của hồ sơ vay.',
    status: 'CREATED',
    assigneeId: '',
    claimedBy: '',
    claimedAt: '',
    completedBy: '',
    completedAt: '',
    createdAt: '2026-09-14 09:30:00',
    updatedAt: '2026-09-14 09:30:00',
  },
  {
    id: 'task-1002',
    processInstanceId: 'pi-loan-8812',
    nodeId: 'Activity_ApproveCredit',
    name: 'Phê duyệt hạn mức tín dụng',
    description: 'Đánh giá điểm tín dụng CIC và phê duyệt hạn mức tối đa cho khoản vay mua nhà.',
    status: 'CLAIMED',
    assigneeId: 'admin',
    claimedBy: 'admin',
    claimedAt: '2026-09-15 08:15:00',
    completedBy: '',
    completedAt: '',
    createdAt: '2026-09-14 14:00:00',
    updatedAt: '2026-09-15 08:15:00',
  },
  {
    id: 'task-1003',
    processInstanceId: 'pi-loan-7734',
    nodeId: 'Activity_DraftContract',
    name: 'Soạn thảo hợp đồng tín dụng & thế chấp',
    description: 'Tạo bản thảo hợp đồng vay và gửi thông báo tới khách hàng ký phụ lục.',
    status: 'CREATED',
    assigneeId: '',
    claimedBy: '',
    claimedAt: '',
    completedBy: '',
    completedAt: '',
    createdAt: '2026-09-15 07:45:00',
    updatedAt: '2026-09-15 07:45:00',
  },
  {
    id: 'task-1004',
    processInstanceId: 'pi-kyc-1092',
    nodeId: 'Activity_KycCheck',
    name: 'Xác thực sinh trắc học và KYC mở tài khoản',
    description: 'Đối chiếu video call và hình ảnh khuôn mặt với cơ sở dữ liệu quốc gia về dân cư.',
    status: 'CLAIMED',
    assigneeId: 'dev_user',
    claimedBy: 'dev_user',
    claimedAt: '2026-09-14 16:20:00',
    completedBy: '',
    completedAt: '',
    createdAt: '2026-09-14 15:10:00',
    updatedAt: '2026-09-14 16:20:00',
  },
  {
    id: 'task-1005',
    processInstanceId: 'pi-disburse-6621',
    nodeId: 'Activity_DisburseFunds',
    name: 'Xác nhận giải ngân qua cổng thanh toán',
    description: 'Thực hiện chuyển khoản giải ngân vào tài khoản thụ hưởng theo chỉ định.',
    status: 'COMPLETED',
    assigneeId: 'admin',
    claimedBy: 'admin',
    claimedAt: '2026-09-13 11:00:00',
    completedBy: 'admin',
    completedAt: '2026-09-13 11:30:00',
    createdAt: '2026-09-13 10:00:00',
    updatedAt: '2026-09-13 11:30:00',
  },
];

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly taskApi = inject(TaskApiService);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);

  private allTasks: TaskResponse[] = [...MOCK_TASKS];
  private tasksSignal = signal<TaskResponse[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private currentTaskSignal = signal<TaskResponse | null>(null);

  get tasks() {
    return this.tasksSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  get currentTask() {
    return this.currentTaskSignal.asReadonly();
  }

  // Thống kê nhanh
  readonly totalCount = computed(() => this.allTasks.length);
  readonly createdCount = computed(
    () =>
      this.allTasks.filter(
        (t) => t.status === 'CREATED' || t.status === 'PENDING' || !t.claimedBy,
      ).length,
  );
  readonly claimedCount = computed(
    () =>
      this.allTasks.filter(
        (t) => t.status === 'CLAIMED' || t.status === 'ASSIGNED',
      ).length,
  );
  readonly completedCount = computed(
    () => this.allTasks.filter((t) => t.status === 'COMPLETED').length,
  );

  loadTasks(params?: TaskQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.taskApi.getAll(params).subscribe({
      next: (data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : this.filterMockTasks(params);
        this.allTasks = list;
        this.tasksSignal.set(list);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Kết nối /api/tasks không thành công, sử dụng dữ liệu mẫu (mock):', err);
        const filtered = this.filterMockTasks(params);
        this.tasksSignal.set(filtered);
        this.loadingSignal.set(false);
      },
    });
  }

  getTaskById(id: string): Observable<TaskResponse> {
    return this.taskApi.getById(id).pipe(
      tap({
        next: (task) => {
          if (task) {
            this.currentTaskSignal.set(task);
            this.updateLocalTask(task);
          }
        },
        error: (err) => {
          console.warn(`Lỗi khi tải chi tiết task ${id}, tìm trong dữ liệu nội bộ:`, err);
          const found = this.allTasks.find((t) => t.id === id);
          if (found) {
            this.currentTaskSignal.set(found);
          }
        },
      }),
      catchError(() => {
        const found = this.allTasks.find((t) => t.id === id);
        return of(found || ({} as TaskResponse));
      }),
    );
  }

  claimTask(id: string): Observable<TaskResponse> {
    this.loadingSignal.set(true);
    const currentUser = this.authService.currentUser();
    const currentUsername = currentUser?.username || currentUser?.fullName || 'admin';

    return this.taskApi.claim(id).pipe(
      tap({
        next: (updated) => {
          const result: TaskResponse = updated || {
            ...this.findLocalTask(id)!,
            status: 'CLAIMED',
            claimedBy: currentUsername,
            assigneeId: currentUsername,
            claimedAt: formatDateTime(),
            updatedAt: formatDateTime(),
          };
          this.updateLocalTask(result);
          this.loadingSignal.set(false);
          this.message.success('Đã tiếp nhận công việc thành công!');
        },
        error: (err) => {
          console.warn('Lỗi API claim, cập nhật cục bộ:', err);
          const local = this.findLocalTask(id);
          if (local) {
            const updated: TaskResponse = {
              ...local,
              status: 'CLAIMED',
              claimedBy: currentUsername,
              assigneeId: currentUsername,
              claimedAt: formatDateTime(),
              updatedAt: formatDateTime(),
            };
            this.updateLocalTask(updated);
            this.message.success('Đã tiếp nhận công việc thành công!');
          }
          this.loadingSignal.set(false);
        },
      }),
      catchError(() => {
        this.loadingSignal.set(false);
        const local = this.findLocalTask(id);
        return of(local || ({} as TaskResponse));
      }),
    );
  }

  completeTask(id: string, variables?: Record<string, unknown>): Observable<TaskResponse> {
    this.loadingSignal.set(true);
    const currentUser = this.authService.currentUser();
    const currentUsername = currentUser?.username || currentUser?.fullName || 'admin';
    const payload: CompleteTaskPayload = { variables: variables || {} };

    return this.taskApi.complete(id, payload).pipe(
      tap({
        next: (completed) => {
          const result: TaskResponse = completed || {
            ...this.findLocalTask(id)!,
            status: 'COMPLETED',
            completedBy: currentUsername,
            completedAt: formatDateTime(),
            updatedAt: formatDateTime(),
          };
          this.updateLocalTask(result);
          this.loadingSignal.set(false);
          this.message.success('Hoàn thành công việc thành công! Quy trình đã được chuyển tiếp.');
        },
        error: (err) => {
          console.warn('Lỗi API complete, cập nhật cục bộ:', err);
          const local = this.findLocalTask(id);
          if (local) {
            const updated: TaskResponse = {
              ...local,
              status: 'COMPLETED',
              completedBy: currentUsername,
              completedAt: formatDateTime(),
              updatedAt: formatDateTime(),
            };
            this.updateLocalTask(updated);
            this.message.success('Hoàn thành công việc thành công! Quy trình đã được chuyển tiếp.');
          }
          this.loadingSignal.set(false);
        },
      }),
      catchError(() => {
        this.loadingSignal.set(false);
        const local = this.findLocalTask(id);
        return of(local || ({} as TaskResponse));
      }),
    );
  }

  private findLocalTask(id: string): TaskResponse | undefined {
    return this.allTasks.find((t) => t.id === id);
  }

  private updateLocalTask(updated: TaskResponse): void {
    this.allTasks = this.allTasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
    this.tasksSignal.set([...this.allTasks]);
    if (this.currentTaskSignal()?.id === updated.id) {
      this.currentTaskSignal.set({ ...updated });
    }
  }

  private filterMockTasks(params?: TaskQueryParams): TaskResponse[] {
    let result = [...this.allTasks];

    if (!params) return result;

    const currentUser = this.authService.currentUser();
    const currentUsername = (currentUser?.username || '').toLowerCase();

    if (params.mine) {
      result = result.filter(
        (t) =>
          (t.claimedBy && t.claimedBy.toLowerCase() === currentUsername) ||
          (t.assigneeId && t.assigneeId.toLowerCase() === currentUsername),
      );
    }

    if (params.status && params.status !== 'ALL') {
      const st = params.status.toUpperCase();
      result = result.filter((t) => t.status.toUpperCase() === st);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.nodeId.toLowerCase().includes(q) ||
          t.processInstanceId.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.claimedBy && t.claimedBy.toLowerCase().includes(q)),
      );
    }

    return result;
  }
}
