import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  User,
  UserQueryParams,
  UserRole,
  UserStatus,
  extractContent,
  extractPageMetadata,
} from '@core/models';
import { ApiErrorHandlerService } from '@shared/services';
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
  private totalElementsSignal = signal<number>(0);
  private totalPagesSignal = signal<number>(1);
  private currentPageSignal = signal<number>(1);
  private pageSizeSignal = signal<number>(20);
  /** Tham số của lần tải gần nhất - dùng để tải lại khi API ghi trả về body rỗng. */
  private lastQuery?: UserQueryParams;

  get users() {
    return this.usersSignal.asReadonly();
  }

  get totalElements() {
    return this.totalElementsSignal.asReadonly();
  }

  get totalPages() {
    return this.totalPagesSignal.asReadonly();
  }

  get currentPage() {
    return this.currentPageSignal.asReadonly();
  }

  get pageSize() {
    return this.pageSizeSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  loadUsers(params?: UserQueryParams): void {
    this.lastQuery = params;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.userApi.getAll(params).subscribe({
      next: (data) => {
        const list = extractContent(data);
        const meta = extractPageMetadata(data, list.length);
        this.allUsers = list;
        this.usersSignal.set(list);
        this.totalElementsSignal.set(meta.totalElements);
        this.totalPagesSignal.set(meta.totalPages);
        this.currentPageSignal.set(meta.page);
        this.pageSizeSignal.set(meta.size);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Không thể kết nối API (/users):', err);
        const errorMsg =
          this.errorHandler.getErrorMessage(err) || 'Không thể tải danh sách người dùng.';
        this.errorSignal.set(errorMsg);
        this.allUsers = [];
        this.usersSignal.set([]);
        this.totalElementsSignal.set(0);
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
    password?: string;
  }): Observable<User> {
    const cleanPayload: Partial<User> = {
      username: userData.username.trim(),
      fullName: userData.fullName.trim(),
      email: userData.email.trim(),
      role: userData.role || 'DEVELOPER',
      status: userData.status || 'ACTIVE',
      ...(userData.password && userData.password.trim()
        ? { password: userData.password.trim() }
        : {}),
    };

    return this.userApi.create(cleanPayload).pipe(
      tap({
        next: (created) => {
          if (created?.id) {
            this.allUsers = [created, ...this.allUsers.filter((u) => u.id !== created.id)];
            this.usersSignal.set(this.allUsers);
          } else {
            // Backend không trả về bản ghi - tải lại thay vì tự dựng user với id giả
            this.loadUsers(this.lastQuery);
          }
          this.message.success(
            `Đã tạo tài khoản người dùng "${created?.fullName || cleanPayload.fullName}" thành công.`,
          );
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
      password?: string;
    },
  ): Observable<User> {
    const cleanPayload: Partial<User> = {
      ...(userData.username ? { username: userData.username.trim() } : {}),
      fullName: userData.fullName.trim(),
      email: userData.email.trim(),
      role: userData.role,
      status: userData.status,
      ...(userData.password && userData.password.trim()
        ? { password: userData.password.trim() }
        : {}),
    };

    return this.userApi.update(id, cleanPayload).pipe(
      tap({
        next: (updated) => {
          if (updated?.id) {
            this.allUsers = this.allUsers.map((u) => (u.id === id ? updated : u));
            this.usersSignal.set(this.allUsers);
          } else {
            // Backend không trả về bản ghi - tải lại thay vì tự ghép dữ liệu phía client
            this.loadUsers(this.lastQuery);
          }
          this.message.success(
            `Đã cập nhật thông tin người dùng "${updated?.fullName || cleanPayload.fullName}" thành công.`,
          );
        },
        error: (err) => {
          console.error(`Lỗi khi cập nhật người dùng qua API (PUT /api/users/${id}):`, err);
          const errorMsg = this.errorHandler.handleError(
            err,
            'Lỗi khi cập nhật thông tin người dùng.',
          );
          this.errorSignal.set(errorMsg);
        },
      }),
    );
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
          if (res?.id) {
            this.allUsers = this.allUsers.map((u) => (u.id === id ? res : u));
            this.usersSignal.set(this.allUsers);
          } else {
            // Backend không trả về bản ghi - tải lại thay vì tự gán trạng thái phía client
            this.loadUsers(this.lastQuery);
          }
          this.message.info(
            `Đã chuyển trạng thái tài khoản "${target?.fullName || 'Người dùng'}" sang: ${statusLabel}.`,
          );
        },
        error: (err) => {
          console.warn('API toggle status failed:', err);
          this.errorHandler.handleError(err, 'Không thể cập nhật trạng thái người dùng.');
        },
      }),
    );
  }
}
