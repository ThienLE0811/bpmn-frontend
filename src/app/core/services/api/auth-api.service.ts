import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, LoginResponse } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/auth';

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.endpoint}/login`, payload);
  }
}
