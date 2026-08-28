import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DmnDecision } from '@core/models/dmn-decision.model';

export interface DmnQueryParams {
  decisionKey?: string;
  name?: string;
  category?: string;
  hitPolicy?: string;
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
export class DmnApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/dmn-decisions';

  getAll(params?: DmnQueryParams): Observable<DmnDecision[]> {
    const cleanParams: Record<string, string | number> = {};

    if (params) {
      if (params['decisionKey'] && String(params['decisionKey']).trim()) {
        cleanParams['decisionKey'] = String(params['decisionKey']).trim();
      }
      if (params['name'] && String(params['name']).trim()) {
        cleanParams['name'] = String(params['name']).trim();
      }
      if (params['category'] && params['category'] !== 'ALL') {
        cleanParams['category'] = String(params['category']).trim();
      }
      if (params['hitPolicy'] && params['hitPolicy'] !== 'ALL') {
        cleanParams['hitPolicy'] = String(params['hitPolicy']).trim();
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
      if (params['page'] !== undefined && params['page'] !== null) {
        cleanParams['page'] = params['page'];
      }
      if (params['size'] !== undefined && params['size'] !== null) {
        cleanParams['size'] = params['size'];
      }
    }

    return this.api.get<DmnDecision[]>(this.endpoint, cleanParams);
  }

  getById(id: string): Observable<DmnDecision> {
    return this.api.get<DmnDecision>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<DmnDecision>): Observable<DmnDecision> {
    return this.api.post<DmnDecision>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<DmnDecision>): Observable<DmnDecision> {
    return this.api.put<DmnDecision>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
