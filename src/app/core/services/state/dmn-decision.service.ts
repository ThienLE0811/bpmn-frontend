import { Injectable, inject, signal } from '@angular/core';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { ApiErrorHandlerService } from '@shared/services';
import { DmnApiService } from '../api/dmn-api.service';

@Injectable({
  providedIn: 'root',
})
export class DmnDecisionService {
  private readonly dmnApi = inject(DmnApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
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

  loadDecisions(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.dmnApi.getAll().subscribe({
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

  saveDecision(
    decisionData: Partial<DmnDecision> & { name: string; dmnXml?: string; xml?: string },
  ): DmnDecision {
    const list = this.decisionsSignal();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
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

      // Gọi API cập nhật
      this.dmnApi.update(decisionData.id, updatedItem).subscribe({
        next: (res) => {
          if (res) {
            this.decisionsSignal.set(
              this.decisionsSignal().map((i) => (i.id === res.id ? res : i)),
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
      const newDmn: DmnDecision = {
        id: newId,
        decisionKey: newKey,
        name: decisionData.name || 'Bảng quyết định mới',
        description: decisionData.description || 'Mô tả bảng quyết định DMN mới.',
        hitPolicy: decisionData.hitPolicy || 'FIRST',
        category: decisionData.category || 'GENERAL',
        version: typeof decisionData.version === 'number' ? decisionData.version : 1,
        status: decisionData.status || 'DRAFT',
        dmnXml: xmlContent,
        createdBy: decisionData.createdBy || 'Admin',
        updatedBy: decisionData.updatedBy || 'Admin',
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      // Gọi API tạo mới
      this.dmnApi.create(newDmn).subscribe({
        next: (res) => {
          if (res) {
            this.decisionsSignal.set(this.decisionsSignal().map((i) => (i.id === newId ? res : i)));
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

      this.decisionsSignal.set([newDmn, ...list]);
      return newDmn;
    }
  }

  deleteDecision(id: string): void {
    // Gọi API xóa, chỉ cập nhật state khi API phản hồi thành công
    this.dmnApi.delete(id).subscribe({
      next: () => {
        const filtered = this.decisionsSignal().filter((p) => p.id !== id);
        this.decisionsSignal.set(filtered);
      },
      error: (err) => {
        console.error('Lỗi khi xóa DMN qua API:', err);
        const errorText = this.errorHandler.handleError(
          err,
          'Lỗi khi xóa bảng quyết định DMN qua API.',
        );
        this.errorSignal.set(errorText);
      },
    });
  }
}
