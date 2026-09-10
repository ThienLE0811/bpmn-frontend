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
import { UserService } from '@core/services';
import { User, UserRole, UserStatus } from '@core/models';
import {
  getAvatarColor,
  getUserInitials,
  getUserRoleMeta,
  getUserStatusMeta,
} from '@shared/utils';

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
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private modal = inject(NzModalService);

  ngOnInit(): void {
    this.search();
  }

  // UI state signals
  protected isModalOpen = signal<boolean>(false);
  protected isDetailDrawerOpen = signal<boolean>(false);
  protected isStatsOpen = signal<boolean>(true);
  protected selectedUser = signal<User | null>(null);
  protected detailUser = signal<User | null>(null);
  protected pageSize = signal<number>(10);

  private initialFormModel: {
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
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
  protected readonly userFormModel = signal({
    username: '',
    fullName: '',
    email: '',
    role: 'DEVELOPER' as UserRole,
    status: 'ACTIVE' as UserStatus,
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
    const initial = {
      username: '',
      fullName: '',
      email: '',
      role: 'DEVELOPER' as UserRole,
      status: 'ACTIVE' as UserStatus,
    };
    this.selectedUser.set(null);
    this.userFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  openEditModal(user: User, event?: Event): void {
    event?.stopPropagation();
    const initial = {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    this.selectedUser.set(user);
    this.userFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  openDetailDrawer(user: User): void {
    this.detailUser.set(user);
    this.isDetailDrawerOpen.set(true);
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
      cur.status !== this.initialFormModel.status
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
  }

  saveUser(): void {
    submit(this.userForm, async () => {
      const current = this.selectedUser();
      const formVal = this.userFormModel();
      this.userService.saveUser({
        id: current?.id,
        username: formVal.username,
        fullName: formVal.fullName,
        email: formVal.email,
        role: formVal.role,
        status: formVal.status,
      });

      this.forceCloseModal();
    });
  }

  deleteUser(user: User, event?: Event): void {
    event?.stopPropagation();
    this.userService.deleteUser(user.id);
    if (this.detailUser()?.id === user.id) {
      this.closeDetailDrawer();
    }
  }

  toggleStatus(user: User, status: UserStatus, event?: Event): void {
    event?.stopPropagation();
    this.userService.toggleStatus(user.id, status);
    if (this.detailUser()?.id === user.id) {
      this.detailUser.update((u) => (u ? { ...u, status } : null));
    }
  }

  resetPassword(user: User, event?: Event): void {
    event?.stopPropagation();
    this.userService.resetPassword(user.id);
  }

  // Helpers for UI tags, avatar and initials (delegated to @shared/utils)
  protected readonly getRoleBadgeInfo = getUserRoleMeta;
  protected readonly getStatusBadgeInfo = getUserStatusMeta;
  protected readonly getAvatarColor = getAvatarColor;
  protected readonly getUserInitials = getUserInitials;
}
