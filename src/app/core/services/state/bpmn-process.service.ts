import { Injectable, inject, signal } from '@angular/core';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { ApiErrorHandlerService } from '@shared/services';
import { BpmnApiService } from '../api/bpmn-api.service';

@Injectable({
  providedIn: 'root',
})
export class BpmnProcessService {
  private readonly bpmnApi = inject(BpmnApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
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

  loadProcesses(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.bpmnApi.getAll().subscribe({
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
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

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

      // Gọi API cập nhật
      this.bpmnApi.update(processData.id, updatedItem).subscribe({
        next: (res) => {
          if (res) {
            this.processesSignal.set(
              this.processesSignal().map((i) => (i.id === res.id ? res : i)),
            );
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
      const newProc: BpmnProcess = {
        id: newId,
        processKey: newKey,
        name: processData.name || 'Quy trình mới',
        description: processData.description || 'Mô tả quy trình BPMN mới.',
        category: processData.category || 'GENERAL',
        version: processData.version !== undefined ? Number(processData.version) : 1,
        status: processData.status || 'DRAFT',
        bpmnXml: xmlContent,
        createdBy: 'Admin',
        updatedBy: null,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      // Gọi API tạo mới
      this.bpmnApi.create(newProc).subscribe({
        next: (res) => {
          if (res) {
            this.processesSignal.set(this.processesSignal().map((i) => (i.id === newId ? res : i)));
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

      this.processesSignal.set([newProc, ...list]);
      return newProc;
    }
  }

  deleteProcess(id: string): void {
    // Gọi API xóa
    this.bpmnApi.delete(id).subscribe({
      error: (err) => {
        console.error('Lỗi khi xóa BPMN qua API:', err);
        const errorText = this.errorHandler.handleError(err, 'Lỗi khi xóa quy trình BPMN qua API.');
        this.errorSignal.set(errorText);
      },
    });

    const filtered = this.processesSignal().filter((p) => p.id !== id);
    this.processesSignal.set(filtered);
  }
}
