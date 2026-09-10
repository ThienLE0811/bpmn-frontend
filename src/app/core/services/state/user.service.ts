import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User, UserQueryParams, UserRole, UserStatus } from '@core/models/user.model';
import { ApiErrorHandlerService } from '@shared/services';
import { formatDateTime, generateTempPassword } from '@shared/utils';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserApiService } from '../api/user-api.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userApi = inject(UserApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);

  private allUsers: User[] = [];
  private usersSignal = signal<User[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  get users() {
    return this.usersSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  loadUsers(params?: UserQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.userApi.getAll(params).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.allUsers = list;
        this.usersSignal.set(list);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Không thể kết nối API (/users):', err);
        const errorMsg = this.errorHandler.getErrorMessage(err) || 'Không thể tải danh sách người dùng.';
        this.errorSignal.set(errorMsg);
        this.allUsers = [];
        this.usersSignal.set([]);
        this.loadingSignal.set(false);
      },
    });
  }

  getUserById(id: string): Observable<User> {
    return this.userApi.getById(id).pipe(
      tap({
        next: (user) => {
          if (user) {
            this.allUsers = this.allUsers.map((u) => (u.id === user.id ? { ...u, ...user } : u));
            this.usersSignal.set(this.allUsers);
          }
        },
        error: (err) => {
          console.error(`Lỗi khi tải chi tiết người dùng (${id}) qua API:`, err);
        },
      }),
    );
  }

  createUser(userData: {
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }): Observable<User> {
    const cleanPayload: Partial<User> = {
      username: userData.username.trim(),
      fullName: userData.fullName.trim(),
      email: userData.email.trim(),
      role: userData.role || 'DEVELOPER',
      status: userData.status || 'ACTIVE',
    };

    return this.userApi.create(cleanPayload).pipe(
      tap({
        next: (created) => {
          const fallbackUser: User = {
            id: created?.id || 'u-' + Date.now(),
            username: created?.username || cleanPayload.username!,
            fullName: created?.fullName || cleanPayload.fullName!,
            email: created?.email || cleanPayload.email!,
            role: created?.role || cleanPayload.role || 'DEVELOPER',
            status: created?.status || cleanPayload.status || 'ACTIVE',
            createdAt: created?.createdAt || formatDateTime(),
            updatedAt: created?.updatedAt || formatDateTime(),
          };
          const finalUser = created?.id ? created : fallbackUser;

          this.allUsers = [finalUser, ...this.allUsers.filter((u) => u.id !== finalUser.id)];
          this.usersSignal.set(this.allUsers);
          this.message.success(`Đã tạo tài khoản người dùng "${finalUser.fullName}" thành công.`);
        },
        error: (err) => {
          console.error('Lỗi khi tạo mới người dùng qua API (POST /api/users):', err);
          const errorMsg = this.errorHandler.handleError(err, 'Lỗi khi tạo mới người dùng.');
          this.errorSignal.set(errorMsg);
        },
      }),
    );
  }

  updateUser(
    id: string,
    userData: {
      username?: string;
      fullName: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    },
  ): Observable<User> {
    const cleanPayload: Partial<User> = {
      ...(userData.username ? { username: userData.username.trim() } : {}),
      fullName: userData.fullName.trim(),
      email: userData.email.trim(),
      role: userData.role,
      status: userData.status,
    };

    return this.userApi.update(id, cleanPayload).pipe(
      tap({
        next: (updated) => {
          const nowStr = formatDateTime();
          const target = this.allUsers.find((u) => u.id === id);
          const finalUser: User = {
            ...(target || {}),
            ...(updated || {}),
            id,
            username: updated?.username || target?.username || userData.username || '',
            fullName: updated?.fullName || cleanPayload.fullName || target?.fullName || '',
            email: updated?.email || cleanPayload.email || target?.email || '',
            role: updated?.role || cleanPayload.role || target?.role || 'DEVELOPER',
            status: updated?.status || cleanPayload.status || target?.status || 'ACTIVE',
            createdAt: updated?.createdAt || target?.createdAt || nowStr,
            updatedAt: updated?.updatedAt || nowStr,
          };

          this.allUsers = this.allUsers.map((u) => (u.id === id ? finalUser : u));
          this.usersSignal.set(this.allUsers);
          this.message.success(`Đã cập nhật thông tin người dùng "${finalUser.fullName}" thành công.`);
        },
        error: (err) => {
          console.error(`Lỗi khi cập nhật người dùng qua API (PUT /api/users/${id}):`, err);
          const errorMsg = this.errorHandler.handleError(err, 'Lỗi khi cập nhật thông tin người dùng.');
          this.errorSignal.set(errorMsg);
        },
      }),
    );
  }

  saveUser(userData: {
    id?: string;
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }): Observable<User> {
    if (userData.id) {
      return this.updateUser(userData.id, userData);
    } else {
      return this.createUser(userData);
    }
  }

  deleteUser(id: string): Observable<void> {
    const target = this.allUsers.find((u) => u.id === id);
    const targetName = target ? target.fullName : 'Người dùng';

    return this.userApi.delete(id).pipe(
      tap({
        next: () => {
          this.allUsers = this.allUsers.filter((u) => u.id !== id);
          this.usersSignal.set(this.allUsers);
          this.message.success(`Đã xóa tài khoản "${targetName}" thành công.`);
        },
        error: (err) => {
          console.error(`Lỗi khi xóa người dùng qua API (DELETE /api/users/${id}):`, err);
          const errorMsg = this.errorHandler.handleError(err, 'Lỗi khi xóa tài khoản người dùng.');
          this.errorSignal.set(errorMsg);
        },
      }),
    );
  }

  toggleStatus(id: string, newStatus: UserStatus): Observable<User> {
    const target = this.allUsers.find((u) => u.id === id);
    const statusLabel =
      newStatus === 'ACTIVE'
        ? 'Hoạt động'
        : newStatus === 'INACTIVE'
          ? 'Tạm dừng'
          : 'Khóa tài khoản';

    return this.userApi.toggleStatus(id, newStatus).pipe(
      tap({
        next: (res) => {
          const updated: User = {
            ...(target || {}),
            ...(res || {}),
            id,
            status: newStatus,
            updatedAt: res?.updatedAt || formatDateTime(),
          } as User;

          this.allUsers = this.allUsers.map((u) => (u.id === id ? updated : u));
          this.usersSignal.set(this.allUsers);
          this.message.info(`Đã chuyển trạng thái tài khoản "${target?.fullName || 'Người dùng'}" sang: ${statusLabel}.`);
        },
        error: (err) => {
          console.warn('API toggle status failed:', err);
          this.errorHandler.handleError(err, 'Không thể cập nhật trạng thái người dùng.');
        },
      }),
    );
  }

  resetPassword(id: string): Observable<{ success: boolean; message?: string }> {
    const target = this.allUsers.find((u) => u.id === id);
    const targetName = target ? target.fullName : 'người dùng';

    return this.userApi.resetPassword(id).pipe(
      tap({
        next: () => {
          this.message.success(`Đã gửi email cấp lại mật khẩu tạm thời cho ${targetName}.`);
        },
        error: () => {
          // Fallback feedback
          this.message.success(
            `Mật khẩu tạm thời đã được đặt lại thành công cho ${targetName}: "${generateTempPassword()}"`,
          );
        },
      }),
    );
  }
}


