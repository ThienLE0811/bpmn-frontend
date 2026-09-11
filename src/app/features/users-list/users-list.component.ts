import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { UserService, AuthService } from '@core/services';
import { User, UserRole, UserStatus } from '@core/models';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  getAvatarColor,
  getUserInitials,
  getUserRoleMeta,
  getUserStatusMeta,
  checkPer,
} from '@shared/utils';
import { TableAutoHeightDirective } from '@shared/directives';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormField,
    NzTableModule,
    NzPopconfirmModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzTagModule,
    NzDropdownModule,
    NzTooltipModule,
    NzDrawerModule,
    TableAutoHeightDirective,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  readonly loggedInUser = this.authService.currentUser;
  readonly isAdmin = computed(() => checkPer('ADMIN', this.loggedInUser()));

  // Cung cấp hàm checkPer dùng trong template và component
  protected readonly checkPer = checkPer;

  canEditUser(targetUser: User | null | undefined): boolean {
    if (!targetUser) return false;
    const current = this.loggedInUser();
    if (!current) return false;

    // Quản trị viên (ADMIN) có quyền sửa bất kỳ tài khoản nào
    if (checkPer('ADMIN', current)) return true;

    // Người dùng chỉ có quyền sửa chính bản thân mình
    const isSameId = !!current.id && !!targetUser.id && current.id === targetUser.id;
    const isSameUsername =
      !!current.username &&
      !!targetUser.username &&
      current.username.trim().toLowerCase() === targetUser.username.trim().toLowerCase();

    return isSameId || isSameUsername;
  }

  canDeleteUser(targetUser: User | null | undefined): boolean {
    if (!targetUser) return false;
    const current = this.loggedInUser();
    if (!current) return false;

    // Chỉ Quản trị viên (ADMIN) mới có quyền xóa tài khoản
    if (!checkPer('ADMIN', current)) return false;

    // Không cho phép tự xóa tài khoản của chính mình đang đăng nhập
    const isSameId = !!current.id && !!targetUser.id && current.id === targetUser.id;
    const isSameUsername =
      !!current.username &&
      !!targetUser.username &&
      current.username.trim().toLowerCase() === targetUser.username.trim().toLowerCase();

    return !isSameId && !isSameUsername;
  }


  ngOnInit(): void {
    this.search();
  }


  // UI state signals
  protected isModalOpen = signal<boolean>(false);
  protected isDetailDrawerOpen = signal<boolean>(false);
  protected isStatsOpen = signal<boolean>(false);
  protected selectedUser = signal<User | null>(null);
  protected detailUser = signal<User | null>(null);
  protected pageSize = signal<number>(10);
  protected isSubmitting = signal<boolean>(false);

  private initialFormModel: {
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password?: string;
  } | null = null;

  // Filter signal model
  protected readonly filterModel = signal({
    search: '',
    role: 'ALL',
    status: 'ALL',
  });

  protected readonly activeFilterCount = computed(() => {
    const m = this.filterModel();
    let count = 0;
    if (m.search.trim()) count++;
    if (m.role !== 'ALL') count++;
    if (m.status !== 'ALL') count++;
    return count;
  });

  protected readonly isFiltered = computed(() => this.activeFilterCount() > 0);

  // User form signal
  protected readonly passwordVisible = signal<boolean>(false);
  protected readonly passwordError = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }

  protected readonly userFormModel = signal({
    username: '',
    fullName: '',
    email: '',
    role: 'DEVELOPER' as UserRole,
    status: 'ACTIVE' as UserStatus,
    password: '',
  });

  protected readonly userForm = form(this.userFormModel, (schema) => {
    required(schema.username, { message: 'Tên đăng nhập không được để trống' });
    required(schema.fullName, { message: 'Họ và tên không được để trống' });
    required(schema.email, { message: 'Email không được để trống' });
    required(schema.role, { message: 'Vui lòng chọn vai trò người dùng' });
  });


  protected users = this.userService.users;
  protected isLoading = this.userService.isLoading;

  // Computed statistics
  protected totalCount = computed(() => this.users().length);
  protected activeCount = computed(() => this.users().filter((u) => u.status === 'ACTIVE').length);
  protected inactiveCount = computed(
    () => this.users().filter((u) => u.status === 'INACTIVE' || u.status === 'LOCKED').length,
  );
  protected adminCount = computed(() => this.users().filter((u) => u.role === 'ADMIN').length);
  protected developerCount = computed(() => this.users().filter((u) => u.role === 'DEVELOPER').length);

  toggleStats(): void {
    this.isStatsOpen.update((v) => !v);
  }

  search(): void {
    const m = this.filterModel();
    this.userService.loadUsers({
      search: m.search,
      role: m.role,
      status: m.status,
    });
  }

  resetFilters(): void {
    this.filterModel.set({
      search: '',
      role: 'ALL',
      status: 'ALL',
    });
    this.search();
  }

  onRoleFilterChange(role: string): void {
    this.filterModel.update((m) => ({ ...m, role }));
    this.search();
  }

  onStatusFilterChange(status: string): void {
    this.filterModel.update((m) => ({ ...m, status }));
    this.search();
  }

  loadUsers(): void {
    this.search();
  }

  // Sorting comparators
  protected sortFullName = (a: User, b: User): number => (a.fullName || '').localeCompare(b.fullName || '');
  protected sortUsername = (a: User, b: User): number => (a.username || '').localeCompare(b.username || '');
  protected sortEmail = (a: User, b: User): number => (a.email || '').localeCompare(b.email || '');
  protected sortRole = (a: User, b: User): number => (a.role || '').localeCompare(b.role || '');
  protected sortStatus = (a: User, b: User): number => (a.status || '').localeCompare(b.status || '');
  protected sortCreatedAt = (a: User, b: User): number => (a.createdAt || '').localeCompare(b.createdAt || '');
  protected sortUpdatedAt = (a: User, b: User): number => (a.updatedAt || '').localeCompare(b.updatedAt || '');

  openCreateModal(): void {
    if (!this.isAdmin()) {
      this.message.warning('Chỉ Quản trị viên (ADMIN) mới có quyền thêm người dùng mới.');
      return;
    }
    const initial = {
      username: '',
      fullName: '',
      email: '',
      role: 'DEVELOPER' as UserRole,
      status: 'ACTIVE' as UserStatus,
      password: '',
    };
    this.selectedUser.set(null);
    this.passwordVisible.set(false);
    this.passwordError.set(null);
    this.userFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  openEditModal(user: User, event?: Event): void {
    event?.stopPropagation();
    if (!this.canEditUser(user)) {
      this.message.warning('Bạn chỉ có quyền chỉnh sửa tài khoản của chính mình hoặc tài khoản có quyền Quản trị viên (ADMIN).');
      return;
    }
    const initial = {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
    };
    this.selectedUser.set(user);
    this.passwordVisible.set(false);
    this.passwordError.set(null);
    this.userFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }


  openDetailDrawer(user: User): void {
    this.detailUser.set(user);
    this.isDetailDrawerOpen.set(true);

    this.userService.getUserById(user.id).subscribe({
      next: (freshUser) => {
        if (freshUser && this.detailUser()?.id === user.id) {
          this.detailUser.set(freshUser);
        }
      },
      error: () => {
        // Fallback silently to table row data
      },
    });
  }

  closeDetailDrawer(): void {
    this.isDetailDrawerOpen.set(false);
    this.detailUser.set(null);
  }

  protected hasUnsavedChanges(): boolean {
    if (!this.initialFormModel) return false;
    const cur = this.userFormModel();
    return (
      cur.username !== this.initialFormModel.username ||
      cur.fullName !== this.initialFormModel.fullName ||
      cur.email !== this.initialFormModel.email ||
      cur.role !== this.initialFormModel.role ||
      cur.status !== this.initialFormModel.status ||
      cur.password !== (this.initialFormModel.password || '')
    );
  }

  closeModal(): void {
    if (this.hasUnsavedChanges()) {
      this.modal.confirm({
        nzTitle: 'Xác nhận hủy bỏ',
        nzContent: 'Thông tin người dùng đã có chỉnh sửa chưa được lưu. Bạn có chắc muốn đóng không?',
        nzOkText: 'Đóng không lưu',
        nzOkDanger: true,
        nzCancelText: 'Tiếp tục nhập',
        nzCentered: true,
        nzOnOk: () => {
          this.forceCloseModal();
        },
      });
    } else {
      this.forceCloseModal();
    }
  }

  protected forceCloseModal(): void {
    this.isModalOpen.set(false);
    this.selectedUser.set(null);
    this.initialFormModel = null;
    this.isSubmitting.set(false);
    this.passwordVisible.set(false);
    this.passwordError.set(null);
  }

  saveUser(): void {
    submit(this.userForm, async () => {
      const current = this.selectedUser();
      const formVal = this.userFormModel();
      this.passwordError.set(null);

      // Validate password
      if (!current?.id) {
        // Khi tạo mới: bắt buộc là ADMIN và phải nhập mật khẩu
        if (!this.isAdmin()) {
          this.message.error('Chỉ Quản trị viên (ADMIN) mới có quyền tạo người dùng mới.');
          return;
        }
        if (!formVal.password?.trim()) {
          this.passwordError.set('Vui lòng nhập mật khẩu khởi tạo cho người dùng mới.');
          return;
        }
        if (formVal.password.trim().length < 3) {
          this.passwordError.set('Mật khẩu phải có tối thiểu 3 ký tự.');
          return;
        }
      } else {
        if (!this.canEditUser(current)) {
          this.message.error('Bạn không có quyền chỉnh sửa tài khoản người dùng này.');
          return;
        }
        // Khi cập nhật: nếu có nhập thì phải >= 3 ký tự
        if (formVal.password?.trim() && formVal.password.trim().length < 3) {
          this.passwordError.set('Mật khẩu mới phải có tối thiểu 3 ký tự.');
          return;
        }
      }

      this.isSubmitting.set(true);


      if (!current?.id) {
        // Gọi API tạo mới: POST /api/users
        this.userService
          .createUser({
            username: formVal.username,
            fullName: formVal.fullName,
            email: formVal.email,
            role: formVal.role,
            status: formVal.status,
            password: formVal.password.trim(),
          })
          .subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.forceCloseModal();
            },
            error: () => {
              this.isSubmitting.set(false);
            },
          });
      } else {
        // Gọi API cập nhật: PUT /api/users/{id}
        this.userService
          .updateUser(current.id, {
            username: formVal.username,
            fullName: formVal.fullName,
            email: formVal.email,
            role: formVal.role,
            status: formVal.status,
            ...(formVal.password?.trim() ? { password: formVal.password.trim() } : {}),
          })
          .subscribe({
            next: (savedUser) => {
              this.isSubmitting.set(false);
              if (this.detailUser()?.id === current.id) {
                this.detailUser.set(savedUser);
              }
              this.forceCloseModal();
            },
            error: () => {
              this.isSubmitting.set(false);
            },
          });
      }
    });
  }


  deleteUser(user: User, event?: Event): void {
    event?.stopPropagation();
    if (!this.canDeleteUser(user)) {
      this.message.warning('Bạn không có quyền xóa tài khoản này.');
      return;
    }
    // Gọi API xóa: DELETE /api/users/{id}
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        if (this.detailUser()?.id === user.id) {
          this.closeDetailDrawer();
        }
      },
    });
  }

  toggleStatus(user: User, status: UserStatus, event?: Event): void {
    event?.stopPropagation();
    if (!this.isAdmin()) {
      this.message.warning('Chỉ Quản trị viên (ADMIN) mới có quyền thay đổi trạng thái tài khoản.');
      return;
    }
    this.userService.toggleStatus(user.id, status).subscribe({
      next: (updatedUser) => {
        if (this.detailUser()?.id === user.id) {
          this.detailUser.update((u) =>
            u ? { ...u, status, updatedAt: updatedUser.updatedAt } : null,
          );
        }
      },
    });
  }

  // Helpers for UI tags, avatar and initials (delegated to @shared/utils)

  protected readonly getRoleBadgeInfo = getUserRoleMeta;
  protected readonly getStatusBadgeInfo = getUserStatusMeta;
  protected readonly getAvatarColor = getAvatarColor;
  protected readonly getUserInitials = getUserInitials;
}
