import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  ProcessInstance,
  ProcessIncident,
  ProcessVariable,
  ActivityExecution,
  OperateMetrics,
  OperateFilterParams,
} from '@core/models/operate.model';
import { OperateApiService } from '../api/operate-api.service';
import { ApiErrorHandlerService } from '@shared/services';

@Injectable({
  providedIn: 'root',
})
export class OperateService {
  private readonly operateApi = inject(OperateApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  private readonly instancesSignal = signal<ProcessInstance[]>([]);
  private readonly metricsSignal = signal<OperateMetrics | null>(null);
  private readonly selectedInstanceSignal = signal<ProcessInstance | null>(null);
  private readonly incidentsSignal = signal<ProcessIncident[]>([]);
  private readonly variablesSignal = signal<ProcessVariable[]>([]);
  private readonly auditTrailSignal = signal<ActivityExecution[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly detailLoadingSignal = signal<boolean>(false);
  private readonly actionLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly filterState = signal<string>('ALL');
  readonly searchTerm = signal<string>('');

  get instances() {
    return this.instancesSignal.asReadonly();
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
      error: (err) => console.warn('Lỗi khi tải metrics:', err),
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
      next: (list) => {
        this.instancesSignal.set(list);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        const msg = this.errorHandler.handleError(err, 'Không thể tải danh sách phiên thực thi.');
        this.errorSignal.set(msg);
        this.loadingSignal.set(false);
      },
    });
  }

  selectInstance(instance: ProcessInstance | null): void {
    this.selectedInstanceSignal.set(instance);
    if (!instance) {
      this.incidentsSignal.set([]);
      this.variablesSignal.set([]);
      this.auditTrailSignal.set([]);
      return;
    }

    this.detailLoadingSignal.set(true);
    forkJoin({
      incidents: this.operateApi.getIncidents(instance.id),
      variables: this.operateApi.getVariables(instance.id),
      audit: this.operateApi.getAuditTrail(instance.id),
    }).subscribe({
      next: ({ incidents, variables, audit }) => {
        this.incidentsSignal.set(incidents);
        this.variablesSignal.set(variables);
        this.auditTrailSignal.set(audit);
        this.detailLoadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Lỗi khi tải dữ liệu chi tiết instance:', err);
        this.detailLoadingSignal.set(false);
      },
    });
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
