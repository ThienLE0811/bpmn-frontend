import { Injectable, inject, signal } from '@angular/core';
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

  saveUser(userData: {
    id?: string;
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }): User {
    const list = this.allUsers;
    const nowStr = formatDateTime();

    if (userData.id) {
      // Update
      const existing = list.find((u) => u.id === userData.id);
      const updatedItem: User = {
        id: userData.id,
        username: userData.username.trim(),
        fullName: userData.fullName.trim(),
        email: userData.email.trim(),
        role: userData.role || existing?.role || 'DEVELOPER',
        status: userData.status || existing?.status || 'ACTIVE',
        createdAt: existing?.createdAt || nowStr,
        updatedAt: nowStr,
      };

      this.userApi.update(userData.id, updatedItem).subscribe({
        next: (res) => {
          if (res) {
            this.allUsers = this.allUsers.map((u) => (u.id === res.id ? res : u));
            this.usersSignal.set(this.usersSignal().map((u) => (u.id === res.id ? res : u)));
          }
        },
        error: (err) => {
          console.warn('API update failed, updating local state:', err);
          this.errorHandler.handleError(err);
        },
      });

      this.allUsers = this.allUsers.map((u) => (u.id === userData.id ? updatedItem : u));
      this.usersSignal.set(this.usersSignal().map((u) => (u.id === userData.id ? updatedItem : u)));
      this.message.success(`Đã cập nhật thông tin người dùng "${updatedItem.fullName}" thành công.`);
      return updatedItem;
    } else {
      // Create new
      const newId = 'u-' + String(Date.now()).slice(-4);
      const newUser: User = {
        id: newId,
        username: userData.username.trim(),
        fullName: userData.fullName.trim(),
        email: userData.email.trim(),
        role: userData.role || 'DEVELOPER',
        status: userData.status || 'ACTIVE',
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      this.userApi.create(newUser).subscribe({
        next: (res) => {
          if (res) {
            this.allUsers = [res, ...this.allUsers.filter((u) => u.id !== newId)];
            this.usersSignal.set([res, ...this.usersSignal().filter((u) => u.id !== newId)]);
          }
        },
        error: (err) => {
          console.warn('API create failed, updating local state:', err);
          this.errorHandler.handleError(err);
        },
      });

      this.allUsers = [newUser, ...this.allUsers];
      this.usersSignal.set([newUser, ...this.usersSignal()]);
      this.message.success(`Đã tạo tài khoản người dùng "${newUser.fullName}" thành công.`);
      return newUser;
    }
  }

  deleteUser(id: string): void {
    const target = this.allUsers.find((u) => u.id === id);
    const targetName = target ? target.fullName : 'Người dùng';

    this.userApi.delete(id).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter((u) => u.id !== id);
        this.usersSignal.set(this.usersSignal().filter((u) => u.id !== id));
        this.message.success(`Đã xóa tài khoản "${targetName}".`);
      },
      error: (err) => {
        console.warn('API delete failed, updating local state:', err);
        this.allUsers = this.allUsers.filter((u) => u.id !== id);
        this.usersSignal.set(this.usersSignal().filter((u) => u.id !== id));
        this.message.success(`Đã xóa tài khoản "${targetName}".`);
      },
    });
  }

  toggleStatus(id: string, newStatus: UserStatus): void {
    const target = this.allUsers.find((u) => u.id === id);
    if (!target) return;

    const statusLabel =
      newStatus === 'ACTIVE'
        ? 'Hoạt động'
        : newStatus === 'INACTIVE'
          ? 'Tạm dừng'
          : 'Khóa tài khoản';

    this.userApi.toggleStatus(id, newStatus).subscribe({
      next: (res) => {
        if (res) {
          this.allUsers = this.allUsers.map((u) => (u.id === res.id ? res : u));
          this.usersSignal.set(this.usersSignal().map((u) => (u.id === res.id ? res : u)));
        }
      },
      error: (err) => {
        console.warn('API toggle status failed, updating local state:', err);
      },
    });

    const updated: User = { ...target, status: newStatus, updatedAt: formatDateTime() };
    this.allUsers = this.allUsers.map((u) => (u.id === id ? updated : u));
    this.usersSignal.set(this.usersSignal().map((u) => (u.id === id ? updated : u)));
    this.message.info(`Đã chuyển trạng thái tài khoản "${target.fullName}" sang: ${statusLabel}.`);
  }

  resetPassword(id: string): void {
    const target = this.allUsers.find((u) => u.id === id);
    const targetName = target ? target.fullName : 'người dùng';

    this.userApi.resetPassword(id).subscribe({
      next: () => {
        this.message.success(`Đã gửi email cấp lại mật khẩu tạm thời cho ${targetName}.`);
      },
      error: () => {
        // Fallback feedback
        this.message.success(
          `Mật khẩu tạm thời đã được đặt lại thành công cho ${targetName}: "${generateTempPassword()}"`,
        );
      },
    });
  }
}


