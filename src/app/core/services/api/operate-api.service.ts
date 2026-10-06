import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PageData, extractContent, extractPageMetadata } from '@core/models';
import {
  OperateProcessInstance,
  ProcessIncident,
  ProcessVariable,
  ActivityExecution,
  OperateMetrics,
  OperateFilterParams,
} from '@core/models/operate.model';
import { mapToOperateProcessInstance } from '@shared/utils';

@Injectable({
  providedIn: 'root',
})
export class OperateApiService {
  private readonly api = inject(ApiService);
  private readonly baseEndpoint = '/operate';
  private readonly instancesEndpoint = '/process-instances';

  getMetrics(): Observable<OperateMetrics> {
    return this.api.get<OperateMetrics>(`${this.baseEndpoint}/metrics`);
  }

  getInstances(filters?: OperateFilterParams): Observable<PageData<OperateProcessInstance>> {
    const cleanParams: Record<string, string | number> = {
      page: filters?.page !== undefined && filters?.page !== null ? filters.page : 1,
      size: filters?.size !== undefined && filters?.size !== null ? filters.size : 20,
    };
    if (filters) {
      if (filters.search && filters.search.trim()) cleanParams['search'] = filters.search.trim();
      if (filters.state && filters.state !== 'ALL') {
        const s = filters.state.toUpperCase();
        if (s === 'ACTIVE') {
          cleanParams['status'] = 'RUNNING';
        } else if (s === 'CANCELED') {
          cleanParams['status'] = 'TERMINATED';
        } else if (s === 'INCIDENT') {
          cleanParams['status'] = 'SUSPENDED';
        } else {
          cleanParams['status'] = filters.state;
        }
      }
      if (filters.processDefinitionKey) cleanParams['processId'] = filters.processDefinitionKey;
    }

    return this.api.get<PageData<any>>(this.instancesEndpoint, cleanParams).pipe(
      map((res) => {
        const rawList = extractContent(res);
        const mappedList = rawList.map((item) => mapToOperateProcessInstance(item));
        const meta = extractPageMetadata(res, mappedList.length);
        return {
          content: mappedList,
          page: meta.page,
          size: meta.size,
          totalElements: meta.totalElements,
          totalPages: meta.totalPages,
        };
      }),
    );
  }

  getInstanceDetail(id: string): Observable<OperateProcessInstance> {
    return this.api
      .get<any>(`${this.instancesEndpoint}/${id}`)
      .pipe(map((item) => mapToOperateProcessInstance(item)));
  }

  getIncidents(instanceId: string): Observable<ProcessIncident[]> {
    return this.api.get<ProcessIncident[]>(`${this.instancesEndpoint}/${instanceId}/incidents`);
  }

  getVariables(instanceId: string): Observable<ProcessVariable[]> {
    return this.api.get<ProcessVariable[]>(`${this.instancesEndpoint}/${instanceId}/variables`);
  }

  getAuditTrail(instanceId: string): Observable<ActivityExecution[]> {
    return this.api.get<ActivityExecution[]>(`${this.instancesEndpoint}/${instanceId}/audit-trail`);
  }

  retryIncident(incidentId: string): Observable<void> {
    return this.api.post<void>(`${this.baseEndpoint}/incidents/${incidentId}/retry`, {});
  }

  cancelInstance(instanceId: string): Observable<void> {
    return this.api.post<void>(`${this.instancesEndpoint}/${instanceId}/cancel`, {});
  }
}
