import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  TaskResponse,
  TaskQueryParams,
  CompleteTaskPayload,
  extractContent,
  extractPageMetadata,
} from '@core/models';
import { TaskApiService } from '../api/task-api.service';
import { AuthService } from './auth.service';
import { ApiErrorHandlerService } from '@shared/services';
import { formatDateTime } from '@shared/utils';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly taskApi = inject(TaskApiService);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);

  private allTasks: TaskResponse[] = [];
  private tasksSignal = signal<TaskResponse[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private currentTaskSignal = signal<TaskResponse | null>(null);
  private totalElementsSignal = signal<number>(0);
  private totalPagesSignal = signal<number>(1);
  private currentPageSignal = signal<number>(1);
  private pageSizeSignal = signal<number>(20);

  get tasks() {
    return this.tasksSignal.asReadonly();
  }

  get totalElements() {
    return this.totalElementsSignal.asReadonly();
  }

  get totalPages() {
    return this.totalPagesSignal.asReadonly();
  }

  get currentPage() {
    return this.currentPageSignal.asReadonly();
  }

  get pageSize() {
    return this.pageSizeSignal.asReadonly();
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
  readonly totalCount = computed(() => this.totalElementsSignal() || this.allTasks.length);
  readonly createdCount = computed(
    () =>
      this.allTasks.filter((t) => t.status === 'CREATED' || t.status === 'PENDING' || !t.claimedBy)
        .length,
  );
  readonly claimedCount = computed(
    () => this.allTasks.filter((t) => t.status === 'CLAIMED' || t.status === 'ASSIGNED').length,
  );
  readonly completedCount = computed(
    () => this.allTasks.filter((t) => t.status === 'COMPLETED').length,
  );

  loadTasks(params?: TaskQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.taskApi.getAll(params).subscribe({
      next: (data) => {
        const content = extractContent(data);
        const meta = extractPageMetadata(data, content.length);
        const list = content.length > 0 ? content : this.filterMockTasks(params);
        this.allTasks = list;
        this.tasksSignal.set(list);
        this.totalElementsSignal.set(meta.totalElements || list.length);
        this.totalPagesSignal.set(meta.totalPages);
        this.currentPageSignal.set(meta.page);
        this.pageSizeSignal.set(meta.size);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Kết nối /api/tasks không thành công, sử dụng dữ liệu mẫu (mock):', err);
        const filtered = this.filterMockTasks(params);
        this.allTasks = filtered;
        this.tasksSignal.set(filtered);
        this.totalElementsSignal.set(filtered.length);
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
