import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { PageData } from '@core/models';

export interface BpmnQueryParams {
  processKey?: string;
  name?: string;
  category?: string;
  status?: string;
  version?: number;
  createdBy?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class BpmnApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/bpmn-processes';

  getAll(params?: BpmnQueryParams): Observable<PageData<BpmnProcess>> {
    const cleanParams: Record<string, string | number> = {
      page: params?.page !== undefined && params?.page !== null ? params.page : 1,
      size: params?.size !== undefined && params?.size !== null ? params.size : 20,
    };

    if (params) {
      if (params['processKey'] && String(params['processKey']).trim()) {
        cleanParams['processKey'] = String(params['processKey']).trim();
      }
      if (params['name'] && String(params['name']).trim()) {
        cleanParams['name'] = String(params['name']).trim();
      }
      if (params['category'] && params['category'] !== 'ALL') {
        cleanParams['category'] = String(params['category']).trim();
      }
      if (params['status'] && params['status'] !== 'ALL') {
        cleanParams['status'] = String(params['status']).trim();
      }
      if (params['version'] !== undefined && params['version'] !== null && String(params['version']).trim() !== '') {
        cleanParams['version'] = Number(params['version']);
      }
      if (params['createdBy'] && String(params['createdBy']).trim()) {
        cleanParams['createdBy'] = String(params['createdBy']).trim();
      }
    }

    return this.api.get<PageData<BpmnProcess>>(this.endpoint, cleanParams);
  }

  getById(id: string): Observable<BpmnProcess> {
    return this.api.get<BpmnProcess>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<BpmnProcess>): Observable<BpmnProcess> {
    return this.api.post<BpmnProcess>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<BpmnProcess>): Observable<BpmnProcess> {
    return this.api.put<BpmnProcess>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
