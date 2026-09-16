import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  ProcessInstance,
  StartProcessInstanceRequest,
  ProcessInstanceQueryParams,
  extractContent,
  extractPageMetadata,
} from '@core/models';
import { CaseApiService } from '../api/case-api.service';
import { AuthService } from './auth.service';
import { ApiErrorHandlerService } from '@shared/services';

@Injectable({
  providedIn: 'root',
})
export class CaseService {
  private readonly caseApi = inject(CaseApiService);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);

  private casesSignal = signal<ProcessInstance[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private selectedCaseSignal = signal<ProcessInstance | null>(null);
  private detailLoadingSignal = signal<boolean>(false);
  private isStartingSignal = signal<boolean>(false);

  private totalElementsSignal = signal<number>(0);
  private totalPagesSignal = signal<number>(1);
  private currentPageSignal = signal<number>(1);
  private pageSizeSignal = signal<number>(10);

  get cases() {
    return this.casesSignal.asReadonly();
  }

  get selectedCase() {
    return this.selectedCaseSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get isDetailLoading() {
    return this.detailLoadingSignal.asReadonly();
  }

  get isStarting() {
    return this.isStartingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
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

  readonly totalCount = computed(() => this.totalElementsSignal() || this.casesSignal().length);
  readonly runningCount = computed(
    () => this.casesSignal().filter((c) => c.status === 'RUNNING' || c.status === 'ACTIVE').length,
  );
  readonly completedCount = computed(
    () => this.casesSignal().filter((c) => c.status === 'COMPLETED').length,
  );

  loadCases(params?: ProcessInstanceQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const queryParams: ProcessInstanceQueryParams = {
      page: params?.page ?? this.currentPageSignal(),
      size: params?.size ?? this.pageSizeSignal(),
      ...params,
    };

    this.caseApi.getAll(queryParams).subscribe({
      next: (data) => {
        const list = extractContent(data);
        const meta = extractPageMetadata(data, list.length);

        this.casesSignal.set(list);
        this.totalElementsSignal.set(meta.totalElements);
        this.totalPagesSignal.set(meta.totalPages);
        this.currentPageSignal.set(meta.page);
        this.pageSizeSignal.set(meta.size);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        const errMsg = this.errorHandler.handleError(
          err,
          'Không thể tải danh sách hồ sơ vụ việc (Cases).',
        );
        this.errorSignal.set(errMsg);
        this.loadingSignal.set(false);
      },
    });
  }

  getCaseById(id: string): Observable<ProcessInstance> {
    this.detailLoadingSignal.set(true);
    return this.caseApi.getById(id).pipe(
      tap({
        next: (detail) => {
          this.selectedCaseSignal.set(detail);
          this.detailLoadingSignal.set(false);
          // Cập nhật lại trong danh sách nếu có
          this.casesSignal.update((list) =>
            list.map((item) => (item.id === detail.id ? { ...item, ...detail } : item)),
          );
        },
        error: (err) => {
          this.detailLoadingSignal.set(false);
          this.errorHandler.handleError(err, `Không thể tải chi tiết vụ việc ID ${id}`);
        },
      }),
    );
  }

  selectCase(instance: ProcessInstance | null): void {
    this.selectedCaseSignal.set(instance);
    if (instance) {
      this.getCaseById(instance.id).subscribe();
    }
  }

  startCase(payload: StartProcessInstanceRequest): Observable<ProcessInstance> {
    this.isStartingSignal.set(true);
    return this.caseApi.startInstance(payload).pipe(
      tap({
        next: (created) => {
          this.isStartingSignal.set(false);
          this.message.success(`Đã khởi động case thành công (ID: ${created.id})`);
          this.loadCases();
        },
        error: (err) => {
          this.isStartingSignal.set(false);
          this.errorHandler.handleError(err, 'Không thể khởi động quy trình mới.');
        },
      }),
    );
  }
}
