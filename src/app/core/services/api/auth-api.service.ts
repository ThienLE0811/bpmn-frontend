import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/auth';

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.endpoint}/login`, payload);
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.api.post<RefreshTokenResponse>(`${this.endpoint}/refresh`, {
      refreshToken,
      refresh_token: refreshToken,
    });
  }

  logout(refreshToken?: string): Observable<unknown> {
    const payload = refreshToken
      ? { refreshToken, refresh_token: refreshToken }
      : {};
    return this.api.post<unknown>(`${this.endpoint}/logout`, payload);
  }
}
