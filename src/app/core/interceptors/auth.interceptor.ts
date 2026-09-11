import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';

const RETRY_HEADER = 'X-Retry-After-Refresh';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const message = inject(NzMessageService);

  const token = authService.getToken();

  // Không đính kèm Authorization header khi gọi API login hoặc refresh
  const isAuthEndpoint =
    req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // 1. Nếu chính request /auth/login hoặc /auth/refresh trả về 401
        if (isAuthEndpoint) {
          if (req.url.includes('/auth/refresh')) {
            if (!router.url.includes('/login')) {
              message.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
              authService.logout(false, false);
              router.navigate(['/login'], {
                queryParams: { returnUrl: router.url },
              });
            }
          }
          return throwError(() => error);
        }

        // 2. Tránh lặp vô hạn nếu request đã được retry 1 lần sau refresh mà vẫn 401
        if (req.headers.has(RETRY_HEADER)) {
          if (!router.url.includes('/login')) {
            message.warning('Không thể xác thực quyền truy cập. Vui lòng đăng nhập lại.');
            authService.logout(false, false);
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url },
            });
          }
          return throwError(() => error);
        }

        // 3. Nếu có refreshToken, thử gọi /api/auth/refresh để lấy accessToken mới
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return authService.refreshAccessToken().pipe(
            switchMap((newToken) => {
              // Gửi lại request ban đầu với accessToken mới và cờ chống lặp
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                  [RETRY_HEADER]: 'true',
                },
              });
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              if (!router.url.includes('/login')) {
                message.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                authService.logout(false, false);
                router.navigate(['/login'], {
                  queryParams: { returnUrl: router.url },
                });
              }
              return throwError(() => refreshErr);
            }),
          );
        }

        // 4. Không có refreshToken -> bắt buộc đăng nhập lại
        if (!router.url.includes('/login')) {
          message.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          authService.logout(false, false);
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
        }
      }

      return throwError(() => error);
    }),
  );
};

