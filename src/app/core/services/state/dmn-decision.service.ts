import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { extractContent, extractPageMetadata } from '@core/models';
import { ApiErrorHandlerService } from '@shared/services';
import { DmnApiService, DmnQueryParams } from '../api/dmn-api.service';

@Injectable({
  providedIn: 'root',
})
export class DmnDecisionService {
  private readonly dmnApi = inject(DmnApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);
  private decisionsSignal = signal<DmnDecision[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private totalElementsSignal = signal<number>(0);
  private totalPagesSignal = signal<number>(1);
  private currentPageSignal = signal<number>(1);
  private pageSizeSignal = signal<number>(20);

  constructor() {}

  get decisions() {
    return this.decisionsSignal.asReadonly();
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

  getDecisionById(id: string): Observable<DmnDecision> {
    return this.dmnApi.getById(id).pipe(
      tap((detail) => {
        if (detail) {
          this.decisionsSignal.update((list) =>
            list.map((item) => (item.id === detail.id ? { ...item, ...detail } : item)),
          );
        }
      }),
    );
  }

  loadDecisions(params?: DmnQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.dmnApi.getAll(params).subscribe({
      next: (data) => {
        const list = extractContent(data);
        const meta = extractPageMetadata(data, list.length);
        this.decisionsSignal.set(list);
        this.totalElementsSignal.set(meta.totalElements);
        this.totalPagesSignal.set(meta.totalPages);
        this.currentPageSignal.set(meta.page);
        this.pageSizeSignal.set(meta.size);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Không thể tải danh sách quyết định DMN (/dmn-decisions):', err);
        const errorText = this.errorHandler.handleError(
          err,
          'Lỗi khi tải danh sách quyết định DMN từ máy chủ.',
        );
        this.errorSignal.set(errorText);
        this.loadingSignal.set(false);
      },
    });
  }

  createDecision(payload: {
    decisionKey: string;
    name: string;
    description?: string;
    hitPolicy?: string;
    category?: string;
    dmnXml?: string | null;
  }): Observable<DmnDecision> {
    const cleanPayload: Partial<DmnDecision> = {
      decisionKey: payload.decisionKey.trim(),
      name: payload.name.trim(),
      description: payload.description || '',
      hitPolicy: payload.hitPolicy || 'FIRST',
      category: payload.category || 'GENERAL',
      dmnXml: payload.dmnXml || '',
    };

    return this.dmnApi.create(cleanPayload).pipe(
      tap({
        next: (created) => {
          if (created) {
            this.decisionsSignal.update((list) => [
              created,
              ...list.filter((d) => d.id !== created.id),
            ]);
            this.message.success(`Đã tạo mới bảng quyết định "${created.name}" thành công.`);
          }
        },
        error: (err) => {
          console.error('Lỗi khi tạo mới DMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi tạo mới bảng quyết định DMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      }),
    );
  }

  updateDecision(
    id: string,
    payload: {
      name?: string;
      description?: string;
      hitPolicy?: string;
      category?: string;
      status?: string;
      dmnXml?: string | null;
    },
  ): Observable<DmnDecision> {
    // Partial merge: Chỉ gửi các trường được truyền để backend giữ nguyên các trường khác
    const cleanPayload: Partial<DmnDecision> = {};
    if (payload.name !== undefined) cleanPayload.name = payload.name.trim();
    if (payload.description !== undefined) cleanPayload.description = payload.description;
    if (payload.hitPolicy !== undefined) cleanPayload.hitPolicy = payload.hitPolicy;
    if (payload.category !== undefined) cleanPayload.category = payload.category;
    if (payload.status !== undefined) cleanPayload.status = payload.status;
    if (payload.dmnXml !== undefined && payload.dmnXml !== null)
      cleanPayload.dmnXml = payload.dmnXml;

    return this.dmnApi.update(id, cleanPayload).pipe(
      tap({
        next: (updated) => {
          if (updated) {
            this.decisionsSignal.update((list) =>
              list.map((item) =>
                item.id === id
                  ? { ...item, ...updated, createdBy: item.createdBy || updated.createdBy }
                  : item,
              ),
            );
            this.message.success(
              `Đã cập nhật bảng quyết định "${updated.name || cleanPayload.name || ''}" thành công.`,
            );
          }
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật DMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi cập nhật bảng quyết định DMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      }),
    );
  }

  deleteDecision(id: string): Observable<unknown> {
    return this.dmnApi.delete(id).pipe(
      tap({
        next: () => {
          this.decisionsSignal.update((list) => list.filter((p) => p.id !== id));
          this.message.success('Đã xóa bảng quyết định thành công.');
        },
        error: (err) => {
          console.error('Lỗi khi xóa DMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi xóa bảng quyết định DMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      }),
    );
  }
}
