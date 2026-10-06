import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ProcessInstance,
  StartProcessInstanceRequest,
  ProcessInstanceQueryParams,
  PageData,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class CaseApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/process-instances';

  getAll(params?: ProcessInstanceQueryParams): Observable<PageData<ProcessInstance>> {
    const cleanParams: Record<string, string | number> = {
      page: params?.page !== undefined && params?.page !== null ? params.page : 1,
      size: params?.size !== undefined && params?.size !== null ? params.size : 20,
    };

    if (params) {
      if (params.status && params.status !== 'ALL') {
        cleanParams['status'] = params.status;
      }
      if (params.processId && params.processId !== 'ALL') {
        cleanParams['processId'] = params.processId;
      }
      if (params.search && params.search.trim()) {
        cleanParams['search'] = params.search.trim();
      }
    }

    return this.api.get<PageData<ProcessInstance>>(this.endpoint, cleanParams);
  }

  getById(id: string): Observable<ProcessInstance> {
    return this.api.get<ProcessInstance>(`${this.endpoint}/${id}`);
  }

  startInstance(payload: StartProcessInstanceRequest): Observable<ProcessInstance> {
    return this.api.post<ProcessInstance>(this.endpoint, payload);
  }
}
