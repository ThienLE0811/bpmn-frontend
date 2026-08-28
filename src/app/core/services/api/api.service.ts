import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private buildUrl(endpoint: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
  }

  private unwrapData<T>() {
    return map((response: ApiResponse<T> | T) => {
      if (response && typeof response === 'object' && 'status' in response) {
        const apiRes = response as ApiResponse<T>;
        if (apiRes.status === 'FAIL') {
          const errorDetail = apiRes.errors;
          const errorMsg =
            errorDetail?.message?.trim() ||
            (errorDetail?.errorCode !== undefined
              ? `Lỗi xử lý (Mã lỗi: ${errorDetail.errorCode})`
              : 'Yêu cầu không thành công.');
          const error = new Error(errorMsg);
          (error as unknown as { errorCode?: string | number; errors?: ApiResponse<T>['errors'] }).errorCode =
            errorDetail?.errorCode;
          (error as unknown as { errorCode?: string | number; errors?: ApiResponse<T>['errors'] }).errors =
            errorDetail;
          throw error;
        }
        return apiRes.data;
      }
      return response as T;
    });
  }

  get<T>(
    endpoint: string,
    params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>
  ): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.buildUrl(endpoint), { params })
      .pipe(this.unwrapData<T>());
  }

  post<T>(endpoint: string, body: unknown, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.buildUrl(endpoint), body, options)
      .pipe(this.unwrapData<T>());
  }

  put<T>(endpoint: string, body: unknown, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.buildUrl(endpoint), body, options)
      .pipe(this.unwrapData<T>());
  }

  patch<T>(endpoint: string, body: unknown, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.buildUrl(endpoint), body, options)
      .pipe(this.unwrapData<T>());
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.buildUrl(endpoint))
      .pipe(this.unwrapData<T>());
  }
}

