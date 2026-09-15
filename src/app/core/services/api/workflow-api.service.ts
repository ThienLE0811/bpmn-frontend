import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PageData, Workflow, WorkflowQueryParams } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class WorkflowApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/workflows';

  getAll(params?: WorkflowQueryParams): Observable<PageData<Workflow>> {
    const cleanParams: Record<string, string | number> = {
      page: params?.page !== undefined && params?.page !== null ? params.page : 1,
      size: params?.size !== undefined && params?.size !== null ? params.size : 20,
    };

    if (params) {
      if (params['search'] && String(params['search']).trim()) {
        cleanParams['search'] = String(params['search']).trim();
      }
      if (params['status'] && params['status'] !== 'ALL') {
        cleanParams['status'] = String(params['status']).trim();
      }
    }

    return this.api.get<PageData<Workflow>>(this.endpoint, cleanParams);
  }

  getById(id: string): Observable<Workflow> {
    return this.api.get<Workflow>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<Workflow>): Observable<Workflow> {
    return this.api.post<Workflow>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<Workflow>): Observable<Workflow> {
    return this.api.put<Workflow>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
