import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { ApiErrorHandlerService } from '@shared/services';
import { formatIsoDateTime } from '@shared/utils';
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

  constructor() {}

  get decisions() {
    return this.decisionsSignal.asReadonly();
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
        if (Array.isArray(data)) {
          this.decisionsSignal.set(data);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Không thể kết nối API (/dmn-decisions), fallback về dữ liệu mẫu:', err);
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
    createdBy?: string;
  }): Observable<DmnDecision> {
    const cleanPayload: Partial<DmnDecision> = {
      decisionKey: payload.decisionKey.trim(),
      name: payload.name.trim(),
      description: payload.description || '',
      hitPolicy: payload.hitPolicy || 'FIRST',
      category: payload.category || 'GENERAL',
      dmnXml: payload.dmnXml || '',
      createdBy: payload.createdBy || 'Admin',
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
      updatedBy?: string;
    },
  ): Observable<DmnDecision> {
    // Partial merge: Chỉ gửi các trường được truyền để backend giữ nguyên các trường khác
    const cleanPayload: Partial<DmnDecision> = {};
    if (payload.name !== undefined) cleanPayload.name = payload.name.trim();
    if (payload.description !== undefined) cleanPayload.description = payload.description;
    if (payload.hitPolicy !== undefined) cleanPayload.hitPolicy = payload.hitPolicy;
    if (payload.category !== undefined) cleanPayload.category = payload.category;
    if (payload.status !== undefined) cleanPayload.status = payload.status;
    if (payload.dmnXml !== undefined && payload.dmnXml !== null) cleanPayload.dmnXml = payload.dmnXml;
    cleanPayload.updatedBy = payload.updatedBy || 'Admin';

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

  saveDecision(
    decisionData: Partial<DmnDecision> & { name: string; dmnXml?: string; xml?: string },
  ): DmnDecision {
    const list = this.decisionsSignal();
    const nowStr = formatIsoDateTime();
    const xmlContent =
      decisionData.dmnXml !== undefined
        ? decisionData.dmnXml
        : decisionData.xml !== undefined
          ? decisionData.xml
          : '';

    if (decisionData.id) {
      // Update existing
      const existing = list.find((i) => i.id === decisionData.id);
      const updatedItem: DmnDecision = {
        id: decisionData.id,
        decisionKey: decisionData.decisionKey || existing?.decisionKey || '',
        name: decisionData.name || existing?.name || '',
        description:
          decisionData.description !== undefined
            ? decisionData.description
            : existing?.description || '',
        hitPolicy: decisionData.hitPolicy || existing?.hitPolicy || 'FIRST',
        category: decisionData.category || existing?.category || 'GENERAL',
        version:
          typeof decisionData.version === 'number'
            ? decisionData.version
            : (existing?.version ?? 1),
        status: decisionData.status || existing?.status || 'DRAFT',
        dmnXml: xmlContent || existing?.dmnXml || '',
        createdBy: existing?.createdBy || 'Admin',
        updatedBy: decisionData.updatedBy || 'Admin',
        createdAt: existing?.createdAt || nowStr,
        updatedAt: nowStr,
      };

      const cleanPayload: Partial<DmnDecision> = {
        name: updatedItem.name,
        description: updatedItem.description,
        hitPolicy: updatedItem.hitPolicy,
        category: updatedItem.category,
        status: updatedItem.status,
        dmnXml: updatedItem.dmnXml,
        updatedBy: 'Admin',
      };

      this.dmnApi.update(decisionData.id, cleanPayload).subscribe({
        next: (res) => {
          if (res) {
            this.decisionsSignal.update((items) =>
              items.map((i) =>
                i.id === res.id ? { ...i, ...res, createdBy: i.createdBy || res.createdBy } : i,
              ),
            );
            this.message.success(`Đã cập nhật bảng quyết định "${res.name}" thành công.`);
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
      });

      const updated = list.map((item) => {
        if (item.id === decisionData.id) {
          return {
            ...item,
            ...updatedItem,
          };
        }
        return item;
      });
      this.decisionsSignal.set(updated);
      return updated.find((i) => i.id === decisionData.id)!;
    } else {
      // Create new
      const newId = 'dmn_' + Date.now();
      const newKey =
        decisionData.decisionKey || 'DMN-DEC-' + (list.length + 1).toString().padStart(2, '0');
      const cleanPayload: Partial<DmnDecision> = {
        decisionKey: newKey,
        name: decisionData.name || 'Bảng quyết định mới',
        description: decisionData.description || 'Mô tả bảng quyết định DMN mới.',
        hitPolicy: decisionData.hitPolicy || 'FIRST',
        category: decisionData.category || 'GENERAL',
        dmnXml: xmlContent,
        createdBy: decisionData.createdBy || 'Admin',
      };

      const newDmn: DmnDecision = {
        id: newId,
        decisionKey: newKey,
        name: cleanPayload.name || 'Bảng quyết định mới',
        description: cleanPayload.description || '',
        hitPolicy: cleanPayload.hitPolicy || 'FIRST',
        category: cleanPayload.category || 'GENERAL',
        version: 1,
        status: 'DRAFT',
        dmnXml: xmlContent,
        createdBy: cleanPayload.createdBy || 'Admin',
        updatedBy: null as any,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      this.dmnApi.create(cleanPayload).subscribe({
        next: (res) => {
          if (res) {
            this.decisionsSignal.update((items) => [
              res,
              ...items.filter((i) => i.id !== newId && i.id !== res.id),
            ]);
            this.message.success(`Đã tạo bảng quyết định "${res.name}" thành công.`);
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
      });

      this.decisionsSignal.update((items) => [newDmn, ...items]);
      return newDmn;
    }
  }
}
