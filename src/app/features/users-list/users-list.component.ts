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
  protected isAdvancedFilterOpen = signal<boolean>(false);
  protected selectedUser = signal<User | null>(null);
  protected detailUser = signal<User | null>(null);
  protected pageSize = signal<number>(10);

  private initialFormModel: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    department: string;
    status: UserStatus;
    notes: string;
  } | null = null;

  // Filter signal model
  protected readonly filterModel = signal({
    search: '',
    role: 'ALL',
    status: 'ALL',
    department: 'ALL',
    phone: '',
  });

  protected readonly activeFilterCount = computed(() => {
    const m = this.filterModel();
    let count = 0;
    if (m.search.trim()) count++;
    if (m.role !== 'ALL') count++;
    if (m.status !== 'ALL') count++;
    if (m.department !== 'ALL') count++;
    if (m.phone.trim()) count++;
    return count;
  });

  protected readonly isFiltered = computed(() => this.activeFilterCount() > 0);

  // Departments list for dropdown filter & selection
  protected readonly departments = [
    'Ban Công nghệ Thông tin',
    'Khối Quản trị Vận hành',
    'Trung tâm Phát triển Giải pháp',
    'Phòng Kiểm soát Tuân thủ & Rủi ro',
    'Ban Tài chính Kế toán',
    'Khối Kinh doanh & Marketing',
    'Đối tác Tư vấn Độc lập',
  ];

  // User form signal
  protected readonly userFormModel = signal({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'DESIGNER' as UserRole,
    department: 'Ban Công nghệ Thông tin',
    status: 'ACTIVE' as UserStatus,
    notes: '',
  });

  protected readonly userForm = form(this.userFormModel, (schema) => {
    required(schema.username, { message: 'Tên đăng nhập không được để trống' });
    required(schema.fullName, { message: 'Họ và tên không được để trống' });
    required(schema.email, { message: 'Email không được để trống' });
    required(schema.role, { message: 'Vui lòng chọn vai trò người dùng' });
    required(schema.department, { message: 'Vui lòng chọn phòng ban' });
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
  protected designerCount = computed(() => this.users().filter((u) => u.role === 'DESIGNER').length);

  toggleStats(): void {
    this.isStatsOpen.update((v) => !v);
  }

  toggleAdvancedFilter(): void {
    this.isAdvancedFilterOpen.update((v) => !v);
  }

  search(): void {
    const m = this.filterModel();
    this.userService.loadUsers({
      search: m.search,
      role: m.role,
      status: m.status,
      department: m.department,
    });
  }

  resetFilters(): void {
    this.filterModel.set({
      search: '',
      role: 'ALL',
      status: 'ALL',
      department: 'ALL',
      phone: '',
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

  onDepartmentFilterChange(department: string): void {
    this.filterModel.update((m) => ({ ...m, department }));
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
  protected sortDepartment = (a: User, b: User): number => (a.department || '').localeCompare(b.department || '');
  protected sortStatus = (a: User, b: User): number => (a.status || '').localeCompare(b.status || '');
  protected sortLastLogin = (a: User, b: User): number => (a.lastLogin || '').localeCompare(b.lastLogin || '');

  openCreateModal(): void {
    const initial = {
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'DESIGNER' as UserRole,
      department: 'Trung tâm Phát triển Giải pháp',
      status: 'ACTIVE' as UserStatus,
      notes: '',
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
      phone: user.phone || '',
      role: user.role,
      department: user.department,
      status: user.status,
      notes: user.notes || '',
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
      cur.phone !== this.initialFormModel.phone ||
      cur.role !== this.initialFormModel.role ||
      cur.department !== this.initialFormModel.department ||
      cur.status !== this.initialFormModel.status ||
      cur.notes !== this.initialFormModel.notes
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
        phone: formVal.phone,
        role: formVal.role,
        department: formVal.department,
        status: formVal.status,
        notes: formVal.notes,
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

  // Helpers for UI tags and colors
  getRoleBadgeInfo(role: UserRole): { label: string; class: string; icon: string } {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên', class: 'role-badge admin', icon: 'safety' };
      case 'MANAGER':
        return { label: 'Quản lý', class: 'role-badge manager', icon: 'crown' };
      case 'DESIGNER':
        return { label: 'Thiết kế quy trình', class: 'role-badge designer', icon: 'appstore-add' };
      case 'VIEWER':
      default:
        return { label: 'Người xem', class: 'role-badge viewer', icon: 'eye' };
    }
  }

  getStatusBadgeInfo(status: UserStatus): { label: string; class: string } {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Hoạt động', class: 'status-tag active' };
      case 'INACTIVE':
        return { label: 'Tạm dừng', class: 'status-tag inactive' };
      case 'LOCKED':
        return { label: 'Đã khóa', class: 'status-tag locked' };
      default:
        return { label: 'Không xác định', class: 'status-tag' };
    }
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
