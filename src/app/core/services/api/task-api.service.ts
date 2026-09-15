import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TaskResponse, TaskQueryParams, CompleteTaskPayload } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class TaskApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/tasks';

  getAll(params?: TaskQueryParams): Observable<TaskResponse[]> {
    const cleanParams: Record<string, string | number | boolean> = {};

    if (params) {
      if (params.status && params.status !== 'ALL') {
        cleanParams['status'] = params.status;
      }
      if (params.mine !== undefined && params.mine !== null) {
        cleanParams['mine'] = params.mine;
      }
      if (params.search && params.search.trim()) {
        cleanParams['search'] = params.search.trim();
      }
      if (params.page !== undefined && params.page !== null) {
        cleanParams['page'] = params.page;
      }
      if (params.size !== undefined && params.size !== null) {
        cleanParams['size'] = params.size;
      }
    }

    return this.api.get<TaskResponse[]>(this.endpoint, cleanParams);
  }

  getById(id: string): Observable<TaskResponse> {
    return this.api.get<TaskResponse>(`${this.endpoint}/${id}`);
  }

  claim(id: string): Observable<TaskResponse> {
    return this.api.post<TaskResponse>(`${this.endpoint}/${id}/claim`, {});
  }

  complete(id: string, payload?: CompleteTaskPayload): Observable<TaskResponse> {
    return this.api.post<TaskResponse>(`${this.endpoint}/${id}/complete`, payload || {});
  }
}
