import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserQueryParams, UserStatus } from '@core/models/user.model';
import { PageData } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/users';

  getAll(params?: UserQueryParams): Observable<PageData<User>> {
    const cleanParams: Record<string, string | number> = {
      page: params?.page !== undefined && params?.page !== null ? params.page : 1,
      size: params?.size !== undefined && params?.size !== null ? params.size : 20,
    };

    if (params) {
      if (params['search'] && String(params['search']).trim()) {
        cleanParams['search'] = String(params['search']).trim();
      }
      if (params['username'] && String(params['username']).trim()) {
        cleanParams['username'] = String(params['username']).trim();
      }
      if (params['fullName'] && String(params['fullName']).trim()) {
        cleanParams['fullName'] = String(params['fullName']).trim();
      }
      if (params['email'] && String(params['email']).trim()) {
        cleanParams['email'] = String(params['email']).trim();
      }
      if (params['role'] && params['role'] !== 'ALL') {
        cleanParams['role'] = String(params['role']).trim();
      }
      if (params['status'] && params['status'] !== 'ALL') {
        cleanParams['status'] = String(params['status']).trim();
      }
    }

    return this.api.get<PageData<User>>(this.endpoint, cleanParams);
  }

  getById(id: string): Observable<User> {
    return this.api.get<User>(`${this.endpoint}/${id}`);
  }

  create(payload: Partial<User>): Observable<User> {
    return this.api.post<User>(this.endpoint, payload);
  }

  update(id: string, payload: Partial<User>): Observable<User> {
    return this.api.put<User>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  toggleStatus(id: string, status: UserStatus): Observable<User> {
    return this.api.patch<User>(`${this.endpoint}/${id}/status`, { status });
  }
}

