import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, of, switchMap } from 'rxjs';
import {
  TaskResponse,
  TaskQueryParams,
  CompleteTaskPayload,
  extractContent,
  extractPageMetadata,
} from '@core/models';
import { TaskApiService } from '../api/task-api.service';
import { ApiErrorHandlerService } from '@shared/services';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly taskApi = inject(TaskApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);

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
  readonly totalCount = computed(() => this.totalElementsSignal() || this.tasksSignal().length);
  readonly createdCount = computed(
    () =>
      this.tasksSignal().filter(
        (t) => t.status === 'CREATED' || t.status === 'PENDING' || !t.claimedBy,
      ).length,
  );
  readonly claimedCount = computed(
    () =>
      this.tasksSignal().filter((t) => t.status === 'CLAIMED' || t.status === 'ASSIGNED').length,
  );
  readonly completedCount = computed(
    () => this.tasksSignal().filter((t) => t.status === 'COMPLETED').length,
  );

  loadTasks(params?: TaskQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.taskApi.getAll(params).subscribe({
      next: (data) => {
        const list = extractContent(data);
        const meta = extractPageMetadata(data, list.length);
        this.tasksSignal.set(list);
        this.totalElementsSignal.set(meta.totalElements);
        this.totalPagesSignal.set(meta.totalPages);
        this.currentPageSignal.set(meta.page);
        this.pageSizeSignal.set(meta.size);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('Không thể tải danh sách task (/tasks):', err);
        const errorMsg = this.errorHandler.handleError(err, 'Không thể tải danh sách công việc.');
        this.errorSignal.set(errorMsg);
        this.tasksSignal.set([]);
        this.totalElementsSignal.set(0);
        this.loadingSignal.set(false);
      },
    });
  }

  getTaskById(id: string): Observable<TaskResponse> {
    return this.taskApi.getById(id).pipe(
      tap({
        next: (task) => {
          this.currentTaskSignal.set(task);
          this.updateLocalTask(task);
        },
        error: (err) => {
          console.error(`Lỗi khi tải chi tiết task ${id}:`, err);
          this.errorHandler.handleError(err, 'Không thể tải chi tiết công việc.');
        },
      }),
    );
  }

  claimTask(id: string): Observable<TaskResponse> {
    this.loadingSignal.set(true);

    return this.taskApi.claim(id).pipe(
      switchMap((updated) => this.resolveTask(id, updated)),
      tap({
        next: (task) => {
          this.updateLocalTask(task);
          this.loadingSignal.set(false);
          this.message.success('Đã tiếp nhận công việc thành công!');
        },
        error: (err) => {
          console.error(`Lỗi khi tiếp nhận task ${id}:`, err);
          this.errorHandler.handleError(err, 'Không thể tiếp nhận công việc.');
          this.loadingSignal.set(false);
        },
      }),
    );
  }

  completeTask(id: string, variables?: Record<string, unknown>): Observable<TaskResponse> {
    this.loadingSignal.set(true);
    const payload: CompleteTaskPayload = { variables: variables || {} };

    return this.taskApi.complete(id, payload).pipe(
      switchMap((completed) => this.resolveTask(id, completed)),
      tap({
        next: (task) => {
          this.updateLocalTask(task);
          this.loadingSignal.set(false);
          this.message.success('Hoàn thành công việc thành công! Quy trình đã được chuyển tiếp.');
        },
        error: (err) => {
          console.error(`Lỗi khi hoàn thành task ${id}:`, err);
          this.errorHandler.handleError(err, 'Không thể hoàn thành công việc.');
          this.loadingSignal.set(false);
        },
      }),
    );
  }

  /** Khi endpoint trả về body rỗng, lấy lại task từ backend thay vì tự dựng dữ liệu phía client. */
  private resolveTask(
    id: string,
    response: TaskResponse | null | undefined,
  ): Observable<TaskResponse> {
    return response?.id ? of(response) : this.taskApi.getById(id);
  }

  private updateLocalTask(updated: TaskResponse): void {
    this.tasksSignal.update((list) =>
      list.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
    );
    if (this.currentTaskSignal()?.id === updated.id) {
      this.currentTaskSignal.set({ ...updated });
    }
  }
}
