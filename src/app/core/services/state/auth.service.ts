import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map, shareReplay, finalize, of } from 'rxjs';
import { LoginRequest, LoginResponse, User, UserRole } from '@core/models';
import { AuthApiService } from '../api/auth-api.service';

const TOKEN_KEY = 'bpmn_access_token';
const REFRESH_TOKEN_KEY = 'bpmn_refresh_token';
const USER_KEY = 'bpmn_current_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.loadStoredToken());
  private readonly refreshTokenSignal = signal<string | null>(this.loadStoredRefreshToken());
  private readonly currentUserSignal = signal<User | null>(this.loadStoredUser());
  private readonly loadingSignal = signal<boolean>(false);

  private refreshToken$: Observable<string> | null = null;

  readonly token = this.tokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  private loadStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  private loadStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
      null
    );
  }

  private loadStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  login(credentials: LoginRequest, rememberMe = true): Observable<LoginResponse> {
    this.loadingSignal.set(true);

    return this.authApi.login(credentials).pipe(
      tap((res) => {
        this.loadingSignal.set(false);
        const dataObj =
          res && typeof res === 'object' && 'data' in res
            ? (res as { data?: Record<string, unknown> })['data']
            : undefined;

        const token =
          res.access_token ||
          res.token ||
          res.accessToken ||
          (dataObj
            ? ((dataObj['access_token'] ||
                dataObj['token'] ||
                dataObj['accessToken']) as string | undefined)
            : null) ||
          (typeof res === 'string' ? res : null);

        const refreshToken =
          res.refresh_token ||
          res.refreshToken ||
          (dataObj
            ? ((dataObj['refresh_token'] ||
                dataObj['refreshToken']) as string | undefined)
            : undefined);

        if (token) {
          this.setSession(token, credentials.username, res.user, rememberMe, refreshToken);
        }
      }),
      catchError((err) => {
        this.loadingSignal.set(false);
        return throwError(() => err);
      }),
    );
  }

  setSession(
    token: string,
    fallbackUsername: string,
    user?: User,
    rememberMe = true,
    refreshToken?: string,
  ): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Clear opposite storage
    if (rememberMe) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    storage.setItem(TOKEN_KEY, token);

    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      this.refreshTokenSignal.set(refreshToken);
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY);
      this.refreshTokenSignal.set(null);
    }

    // Resolve user object
    let resolvedUser = user;
    if (!resolvedUser) {
      resolvedUser = this.extractUserFromToken(token, fallbackUsername);
    }

    storage.setItem(USER_KEY, JSON.stringify(resolvedUser));

    this.tokenSignal.set(token);
    this.currentUserSignal.set(resolvedUser);
  }

  updateTokens(newToken: string, newRefreshToken?: string): void {
    const isLocal = typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
    const storage = isLocal ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, newToken);
    this.tokenSignal.set(newToken);

    if (newRefreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      this.refreshTokenSignal.set(newRefreshToken);
    }
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshToken$) {
      return this.refreshToken$;
    }

    const currentRefreshToken = this.getRefreshToken();
    if (!currentRefreshToken) {
      return throwError(() => new Error('Không tìm thấy refresh token.'));
    }

    this.refreshToken$ = this.authApi.refreshToken(currentRefreshToken).pipe(
      map((res) => {
        const dataObj =
          res && typeof res === 'object' && 'data' in res
            ? (res as { data?: Record<string, unknown> })['data']
            : undefined;

        const newAccessToken =
          res.access_token ||
          res.accessToken ||
          res.token ||
          (dataObj
            ? ((dataObj['access_token'] ||
                dataObj['accessToken'] ||
                dataObj['token']) as string | undefined)
            : undefined);

        if (!newAccessToken) {
          throw new Error('Không nhận được access token mới từ máy chủ.');
        }

        const newRefreshToken =
          res.refresh_token ||
          res.refreshToken ||
          (dataObj
            ? ((dataObj['refresh_token'] ||
                dataObj['refreshToken']) as string | undefined)
            : undefined) ||
          currentRefreshToken;

        this.updateTokens(newAccessToken, newRefreshToken);
        return newAccessToken;
      }),
      shareReplay(1),
      finalize(() => {
        this.refreshToken$ = null;
      }),
    );

    return this.refreshToken$;
  }

  logout(navigate = true, notifyBackend = true): void {
    const currentRefreshToken = this.getRefreshToken();

    if (notifyBackend && currentRefreshToken) {
      this.authApi
        .logout(currentRefreshToken)
        .pipe(
          catchError((err) => {
            console.warn('Lỗi khi gọi API logout:', err);
            return of(null);
          }),
        )
        .subscribe();
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }

    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUserSignal.set(null);

    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  private extractUserFromToken(token: string, fallbackUsername: string): User {
    let parsedPayload: Record<string, unknown> = {};

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(payloadBase64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        parsedPayload = JSON.parse(jsonPayload);
      }
    } catch {
      // Not a JWT or failed parsing, proceed with fallback
    }

    const username =
      (parsedPayload['sub'] as string) ||
      (parsedPayload['username'] as string) ||
      (parsedPayload['preferred_username'] as string) ||
      fallbackUsername;

    const email =
      (parsedPayload['email'] as string) ||
      `${username}@bpmn.local`;

    const fullName =
      (parsedPayload['name'] as string) ||
      (parsedPayload['fullName'] as string) ||
      username;

    let role: UserRole = 'ADMIN';
    const rawRole = (parsedPayload['role'] || parsedPayload['roles']) as string | string[] | undefined;
    if (typeof rawRole === 'string') {
      const upper = rawRole.toUpperCase();
      if (upper.includes('ADMIN')) role = 'ADMIN';
      else if (upper.includes('DEV')) role = 'DEVELOPER';
      else if (upper.includes('MAN')) role = 'MANAGER';
      else if (upper.includes('DES')) role = 'DESIGNER';
      else if (upper.includes('VIEW')) role = 'VIEWER';
    } else if (Array.isArray(rawRole) && rawRole.length > 0) {
      const first = String(rawRole[0]).toUpperCase();
      if (first.includes('ADMIN')) role = 'ADMIN';
      else if (first.includes('DEV')) role = 'DEVELOPER';
      else role = 'MANAGER';
    }

    return {
      id: (parsedPayload['id'] as string) || 'u-current',
      username,
      email,
      fullName,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
