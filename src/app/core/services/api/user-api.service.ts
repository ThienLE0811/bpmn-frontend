import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserQueryParams, UserStatus } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/users';

  getAll(params?: UserQueryParams): Observable<User[]> {
    const cleanParams: Record<string, string | number> = {};

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
      if (params['department'] && params['department'] !== 'ALL') {
        cleanParams['department'] = String(params['department']).trim();
      }
      if (params['status'] && params['status'] !== 'ALL') {
        cleanParams['status'] = String(params['status']).trim();
      }
      if (params['page'] !== undefined && params['page'] !== null) {
        cleanParams['page'] = params['page'];
      }
      if (params['size'] !== undefined && params['size'] !== null) {
        cleanParams['size'] = params['size'];
      }
    }

    return this.api.get<User[]>(this.endpoint, cleanParams);
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

  resetPassword(id: string): Observable<{ success: boolean; message?: string }> {
    return this.api.post<{ success: boolean; message?: string }>(`${this.endpoint}/${id}/reset-password`, {});
  }
}
