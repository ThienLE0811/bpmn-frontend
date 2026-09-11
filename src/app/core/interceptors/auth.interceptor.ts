import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/services';
import { NzMessageService } from 'ng-zorro-antd/message';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const message = inject(NzMessageService);

  const token = authService.getToken();

  // Không đính kèm Authorization header khi gọi API login
  const isAuthLoginRequest = req.url.includes('/auth/login');

  let authReq = req;
  if (token && !isAuthLoginRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Tránh redirect lặp vô tận nếu đang ở màn hình login
        if (!router.url.includes('/login')) {
          message.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          authService.logout(false);
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
