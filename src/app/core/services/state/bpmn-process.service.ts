import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { ApiErrorHandlerService } from '@shared/services';
import { formatIsoDateTime } from '@shared/utils';
import { BpmnApiService, BpmnQueryParams } from '../api/bpmn-api.service';

@Injectable({
  providedIn: 'root',
})
export class BpmnProcessService {
  private readonly bpmnApi = inject(BpmnApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);
  private processesSignal = signal<BpmnProcess[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  constructor() {}

  get processes() {
    return this.processesSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  getProcessById(id: string): Observable<BpmnProcess> {
    return this.bpmnApi.getById(id).pipe(
      tap((detail) => {
        if (detail) {
          this.processesSignal.update((list) =>
            list.map((item) => (item.id === detail.id ? { ...item, ...detail } : item)),
          );
        }
      }),
    );
  }

  loadProcesses(params?: BpmnQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.bpmnApi.getAll(params).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.processesSignal.set(data);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Không thể kết nối API (/bpmn-processes), fallback về dữ liệu mẫu:', err);
        const errorText = this.errorHandler.handleError(
          err,
          'Lỗi khi tải danh sách quy trình BPMN từ máy chủ.',
        );
        this.errorSignal.set(errorText);
        this.loadingSignal.set(false);
      },
    });
  }

  saveProcess(
    processData: Partial<BpmnProcess> & {
      name: string;
      bpmnXml?: string | null;
      xml?: string | null;
    },
  ): BpmnProcess {
    const list = this.processesSignal();
    const nowStr = formatIsoDateTime();

    const xmlContent =
      processData.bpmnXml !== undefined
        ? processData.bpmnXml
        : processData.xml !== undefined
          ? processData.xml
          : null;

    if (processData.id) {
      // Update existing
      const existing = list.find((i) => i.id === processData.id);
      const updatedItem: BpmnProcess = {
        id: processData.id,
        processKey: processData.processKey || existing?.processKey || '',
        name: processData.name || existing?.name || '',
        description:
          processData.description !== undefined
            ? processData.description
            : existing?.description || '',
        category: processData.category || existing?.category || 'GENERAL',
        version:
          processData.version !== undefined ? Number(processData.version) : existing?.version || 1,
        status: processData.status || existing?.status || 'DRAFT',
        bpmnXml: xmlContent !== null ? xmlContent : existing?.bpmnXml || null,
        createdBy: existing?.createdBy || 'Admin',
        updatedBy: 'Admin',
        createdAt: existing?.createdAt || nowStr,
        updatedAt: nowStr,
      };

      // Clean payload chỉ gửi các trường Update DTO hợp lệ để tránh lỗi 400 backend
      const cleanUpdatePayload: Partial<BpmnProcess> = {
        name: updatedItem.name,
        description: updatedItem.description,
        category: updatedItem.category,
        status: updatedItem.status,
        bpmnXml: updatedItem.bpmnXml,
      };

      // Gọi API cập nhật: PUT /api/bpmn-processes/:id
      this.bpmnApi.update(processData.id, cleanUpdatePayload).subscribe({
        next: (res) => {
          if (res) {
            this.processesSignal.update((items) =>
              items.map((i) =>
                i.id === res.id ? { ...i, ...res, createdBy: i.createdBy || res.createdBy } : i,
              ),
            );
            this.message.success(`Đã cập nhật quy trình "${res.name}" thành công.`);
          }
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi cập nhật quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      });

      const updated = list.map((item) => {
        if (item.id === processData.id) {
          return {
            ...item,
            ...updatedItem,
          };
        }
        return item;
      });
      this.processesSignal.set(updated);
      return updated.find((i) => i.id === processData.id)!;
    } else {
      // Create new
      const newId = 'proc_' + Date.now();
      const newKey =
        processData.processKey || 'BPMN-PROC-' + (list.length + 1).toString().padStart(2, '0');
      const cleanPayload: Partial<BpmnProcess> = {
        processKey: newKey,
        name: processData.name || 'Quy trình mới',
        description: processData.description || '',
        category: processData.category || 'GENERAL',
        bpmnXml: xmlContent,
      };

      const newProc: BpmnProcess = {
        id: newId,
        processKey: newKey,
        name: cleanPayload.name || 'Quy trình mới',
        description: cleanPayload.description || '',
        category: cleanPayload.category || 'GENERAL',
        version: 1,
        status: 'DRAFT',
        bpmnXml: xmlContent,
        createdBy: 'Admin',
        updatedBy: null,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      // Gọi API tạo mới /api/bpmn-processes
      this.bpmnApi.create(cleanPayload).subscribe({
        next: (res) => {
          if (res) {
            this.processesSignal.update((items) => [
              res,
              ...items.filter((i) => i.id !== newId && i.id !== res.id),
            ]);
            this.message.success(`Đã tạo quy trình "${res.name}" thành công.`);
          }
        },
        error: (err) => {
          console.error('Lỗi khi tạo mới BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi tạo mới quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      });

      this.processesSignal.update((items) => [newProc, ...items]);
      return newProc;
    }
  }

  createProcess(payload: {
    processKey: string;
    name: string;
    description?: string;
    category: string;
    bpmnXml?: string | null;
  }): Observable<BpmnProcess> {
    const cleanPayload: Partial<BpmnProcess> = {
      processKey: payload.processKey.trim(),
      name: payload.name.trim(),
      description: payload.description || '',
      category: payload.category || 'GENERAL',
      bpmnXml: payload.bpmnXml || null,
    };

    return this.bpmnApi.create(cleanPayload).pipe(
      tap({
        next: (created) => {
          if (created) {
            this.processesSignal.update((list) => [
              created,
              ...list.filter((p) => p.id !== created.id),
            ]);
            this.message.success(`Đã tạo mới quy trình "${created.name}" thành công.`);
          }
        },
        error: (err) => {
          console.error('Lỗi khi tạo mới BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi tạo mới quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      }),
    );
  }

  updateProcess(
    id: string,
    payload: {
      name: string;
      description?: string;
      category?: string;
      status?: string;
      bpmnXml?: string | null;
    },
  ): Observable<BpmnProcess> {
    const cleanPayload: Partial<BpmnProcess> = {
      name: payload.name.trim(),
      description: payload.description || '',
      category: payload.category || 'GENERAL',
      status: payload.status || 'DRAFT',
      bpmnXml: payload.bpmnXml !== undefined ? payload.bpmnXml : null,
    };

    return this.bpmnApi.update(id, cleanPayload).pipe(
      tap({
        next: (updated) => {
          if (updated) {
            this.processesSignal.update((list) =>
              list.map((item) =>
                item.id === id
                  ? { ...item, ...updated, createdBy: item.createdBy || updated.createdBy }
                  : item,
              ),
            );
            this.message.success(`Đã cập nhật quy trình "${updated.name || cleanPayload.name}" thành công.`);
          }
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi cập nhật quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      }),
    );
  }

  deleteProcess(id: string): Observable<unknown> {
    return this.bpmnApi.delete(id).pipe(
      tap({
        next: () => {
          this.processesSignal.update((list) => list.filter((p) => p.id !== id));
          this.message.success('Đã xóa quy trình thành công.');
        },
        error: (err) => {
          console.error('Lỗi khi xóa BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi xóa quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      }),
    );
  }
}
