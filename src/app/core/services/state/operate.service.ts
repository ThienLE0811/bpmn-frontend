import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  OperateProcessInstance,
  ProcessIncident,
  ProcessVariable,
  ActivityExecution,
  OperateMetrics,
  OperateFilterParams,
  extractContent,
  extractPageMetadata,
} from '@core/models';
import { OperateApiService } from '../api/operate-api.service';
import { BpmnProcessService } from './bpmn-process.service';
import { ApiErrorHandlerService } from '@shared/services';

@Injectable({
  providedIn: 'root',
})
export class OperateService {
  private readonly operateApi = inject(OperateApiService);
  private readonly bpmnService = inject(BpmnProcessService);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  private readonly instancesSignal = signal<OperateProcessInstance[]>([]);
  private readonly metricsSignal = signal<OperateMetrics | null>(null);
  private readonly selectedInstanceSignal = signal<OperateProcessInstance | null>(null);
  private readonly incidentsSignal = signal<ProcessIncident[]>([]);
  private readonly variablesSignal = signal<ProcessVariable[]>([]);
  private readonly auditTrailSignal = signal<ActivityExecution[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly detailLoadingSignal = signal<boolean>(false);
  private readonly actionLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly totalElementsSignal = signal<number>(0);
  private readonly totalPagesSignal = signal<number>(1);
  private readonly currentPageSignal = signal<number>(1);
  private readonly pageSizeSignal = signal<number>(20);

  readonly filterState = signal<string>('ALL');
  readonly searchTerm = signal<string>('');

  get instances() {
    return this.instancesSignal.asReadonly();
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

  get metrics() {
    return this.metricsSignal.asReadonly();
  }

  get selectedInstance() {
    return this.selectedInstanceSignal.asReadonly();
  }

  get incidents() {
    return this.incidentsSignal.asReadonly();
  }

  get variables() {
    return this.variablesSignal.asReadonly();
  }

  get auditTrail() {
    return this.auditTrailSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get isDetailLoading() {
    return this.detailLoadingSignal.asReadonly();
  }

  get isActionLoading() {
    return this.actionLoadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  loadMetrics(): void {
    this.operateApi.getMetrics().subscribe({
      next: (data) => this.metricsSignal.set(data),
      error: (err) => {
        console.warn('Lỗi khi tải metrics từ API, tính toán từ instances hiện tại:', err);
        if (this.instancesSignal().length > 0) {
          this.metricsSignal.set(this.computeMetrics(this.instancesSignal(), this.totalElementsSignal()));
        }
      },
    });
  }

  loadInstances(filters?: OperateFilterParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const mergedFilters: OperateFilterParams = {
      state: this.filterState(),
      search: this.searchTerm(),
      ...filters,
    };

    this.operateApi.getInstances(mergedFilters).subscribe({
      next: (data) => {
        let list = extractContent(data);
        const meta = extractPageMetadata(data, list.length);

        // Nạp danh mục quy trình nếu chưa có để map tên hiển thị
        if (this.bpmnService.processes().length === 0) {
          this.bpmnService.loadProcesses();
        }

        // Bổ sung tên quy trình hiển thị từ BpmnProcessService
        const procs = this.bpmnService.processes();
        if (procs.length > 0) {
          list = list.map((item) => {
            const pKey = item.processDefinitionKey || item.processId;
            const p = procs.find((proc) => proc.id === pKey || proc.processKey === pKey);
            if (p && (!item.processDefinitionName || item.processDefinitionName === item.processDefinitionKey)) {
              return { ...item, processDefinitionName: p.name };
            }
            return item;
          });
        }

        this.instancesSignal.set(list);
        this.totalElementsSignal.set(meta.totalElements);
        this.totalPagesSignal.set(meta.totalPages);
        this.currentPageSignal.set(meta.page);
        this.pageSizeSignal.set(meta.size);
        this.loadingSignal.set(false);

        // Cập nhật metrics nếu metrics API chưa có kết quả
        if (!this.metricsSignal()) {
          this.metricsSignal.set(this.computeMetrics(list, meta.totalElements));
        }
      },
      error: (err) => {
        const msg = this.errorHandler.handleError(err, 'Không thể tải danh sách phiên thực thi.');
        this.errorSignal.set(msg);
        this.loadingSignal.set(false);
      },
    });
  }

  selectInstance(instance: OperateProcessInstance | null): void {
    if (!instance) {
      this.selectedInstanceSignal.set(null);
      this.incidentsSignal.set([]);
      this.variablesSignal.set([]);
      this.auditTrailSignal.set([]);
      return;
    }

    // Tìm BPMN XML và tên quy trình từ BpmnProcessService nếu instance chưa có
    const pKey = instance.processDefinitionKey || instance.processId;
    const proc = this.bpmnService.processes().find((p) => p.id === pKey || p.processKey === pKey);
    const updatedInstance: OperateProcessInstance = { ...instance };

    if (!updatedInstance.bpmnXml && proc?.bpmnXml) {
      updatedInstance.bpmnXml = proc.bpmnXml;
    }
    if (proc && (!updatedInstance.processDefinitionName || updatedInstance.processDefinitionName === pKey)) {
      updatedInstance.processDefinitionName = proc.name;
    }

    this.selectedInstanceSignal.set(updatedInstance);

    // Nếu chưa có XML nhưng có proc.id, gọi API để lấy XML
    if (!updatedInstance.bpmnXml && proc?.id) {
      this.bpmnService.getProcessById(proc.id).subscribe((p) => {
        if (p?.bpmnXml) {
          this.selectedInstanceSignal.update((current) =>
            current && current.id === instance.id ? { ...current, bpmnXml: p.bpmnXml } : current,
          );
        }
      });
    }

    // Tiền nạp variables từ raw instance.variables nếu có
    if (instance.variables && typeof instance.variables === 'object' && Object.keys(instance.variables).length > 0) {
      const prefilledVars: ProcessVariable[] = Object.entries(instance.variables).map(([name, value]) => ({
        name,
        value,
        type: Array.isArray(value) ? 'Array' : typeof value,
        lastUpdated: instance.updatedAt || instance.startedAt || instance.startDate || '',
      }));
      this.variablesSignal.set(prefilledVars);
    } else {
      this.variablesSignal.set([]);
    }

    this.detailLoadingSignal.set(true);
    forkJoin({
      incidents: this.operateApi.getIncidents(instance.id),
      variables: this.operateApi.getVariables(instance.id),
      audit: this.operateApi.getAuditTrail(instance.id),
    }).subscribe({
      next: ({ incidents, variables, audit }) => {
        this.incidentsSignal.set(incidents || []);
        // Nếu API chuyên biệt trả về biến thì dùng biến từ API, nếu không giữ biến prefilled từ instance
        if (variables && variables.length > 0) {
          this.variablesSignal.set(variables);
        }
        this.auditTrailSignal.set(audit || []);
        this.detailLoadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Lỗi khi tải dữ liệu chi tiết instance:', err);
        this.detailLoadingSignal.set(false);
      },
    });
  }

  private computeMetrics(list: OperateProcessInstance[], total?: number): OperateMetrics {
    const totalCount = total !== undefined ? total : list.length;
    const active = list.filter((i) => i.state === 'ACTIVE').length;
    const incidents = list.filter((i) => i.state === 'INCIDENT').length;
    const completed = list.filter((i) => i.state === 'COMPLETED').length;
    const canceled = list.filter((i) => i.state === 'CANCELED').length;
    return {
      totalInstances: totalCount,
      activeInstances: active,
      completedInstances: completed,
      incidentInstances: incidents,
      canceledInstances: canceled,
    };
  }

  retryIncident(incidentId: string, instanceId: string): void {
    this.actionLoadingSignal.set(true);
    this.operateApi.retryIncident(incidentId, instanceId).subscribe({
      next: () => {
        this.actionLoadingSignal.set(false);
        // Refresh instance detail & lists
        this.operateApi.getInstanceDetail(instanceId).subscribe((updated) => {
          this.selectedInstanceSignal.set(updated);
        });
        this.incidentsSignal.update((list) => list.filter((i) => i.id !== incidentId));
        this.loadInstances();
        this.loadMetrics();
      },
      error: (err) => {
        this.actionLoadingSignal.set(false);
        this.errorHandler.handleError(err, 'Không thể thử lại sự cố này.');
      },
    });
  }

  cancelInstance(instanceId: string): void {
    this.actionLoadingSignal.set(true);
    this.operateApi.cancelInstance(instanceId).subscribe({
      next: () => {
        this.actionLoadingSignal.set(false);
        if (this.selectedInstanceSignal()?.id === instanceId) {
          this.selectedInstanceSignal.update((inst) =>
            inst ? { ...inst, state: 'CANCELED', endDate: new Date().toISOString() } : null,
          );
        }
        this.loadInstances();
        this.loadMetrics();
      },
      error: (err) => {
        this.actionLoadingSignal.set(false);
        this.errorHandler.handleError(err, 'Không thể hủy phiên thực thi này.');
      },
    });
  }

  setFilterState(state: string): void {
    this.filterState.set(state);
    this.loadInstances();
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.loadInstances();
  }
}
