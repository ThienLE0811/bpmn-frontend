import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TaskResponse, TaskQueryParams, CompleteTaskPayload, PageData } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class TaskApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/tasks';

  getAll(params?: TaskQueryParams): Observable<PageData<TaskResponse>> {
    const cleanParams: Record<string, string | number | boolean> = {
      page: params?.page !== undefined && params?.page !== null ? params.page : 1,
      size: params?.size !== undefined && params?.size !== null ? params.size : 20,
    };

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
    }

    return this.api.get<PageData<TaskResponse>>(this.endpoint, cleanParams);
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
