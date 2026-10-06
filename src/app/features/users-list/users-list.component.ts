import { Component, inject, signal, computed, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { UserService, AuthService } from '@core/services';
import { User, UserStatus } from '@core/models';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  getAvatarColor,
  getUserInitials,
  getUserRoleMeta,
  getUserStatusMeta,
  checkPer,
  canEditUser,
  canDeleteUser,
  sortByString,
  createListFilter,
} from '@shared/utils';
import {
  PageHeaderComponent,
  StatCardComponent,
  FilterToolbarComponent,
} from '@shared/components/list-page';
import { TableAutoHeightDirective } from '@shared/directives';
import { UserFormModalComponent } from './components/user-form-modal/user-form-modal.component';
import { UserDetailDrawerComponent } from './components/user-detail-drawer/user-detail-drawer.component';
import { AvatarColorPipe, UserInitialsPipe, FormatDatePipe } from '@shared/pipes';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzPopconfirmModule,
    NzIconModule,
    NzSelectModule,
    NzDropdownModule,
    TableAutoHeightDirective,
    AvatarColorPipe,
    UserInitialsPipe,
    FormatDatePipe,
    PageHeaderComponent,
    StatCardComponent,
    FilterToolbarComponent,
    UserFormModalComponent,
    UserDetailDrawerComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private message = inject(NzMessageService);

  readonly loggedInUser = this.authService.currentUser;
  readonly isAdmin = computed(() => checkPer('ADMIN', this.loggedInUser()));

  private readonly detailDrawer = viewChild(UserDetailDrawerComponent);

  protected canEdit(user: User): boolean {
    return canEditUser(this.loggedInUser(), user);
  }

  protected canDelete(user: User): boolean {
    return canDeleteUser(this.loggedInUser(), user);
  }

  ngOnInit(): void {
    this.search();
  }

  // UI state signals
  protected isStatsOpen = signal<boolean>(false);
  protected pageIndex = signal<number>(1);
  protected pageSize = signal<number>(10);

  // Bộ lọc
  protected readonly filter = createListFilter({ search: '', role: 'ALL', status: 'ALL' });
  protected readonly filterModel = this.filter.model;
  protected readonly isFiltered = this.filter.isFiltered;

  protected users = this.userService.users;
  protected isLoading = this.userService.isLoading;

  // Computed statistics
  protected totalCount = computed(() => this.userService.totalElements() || this.users().length);
  protected activeCount = computed(() => this.users().filter((u) => u.status === 'ACTIVE').length);
  protected inactiveCount = computed(
    () => this.users().filter((u) => u.status === 'INACTIVE' || u.status === 'LOCKED').length,
  );
  protected developerCount = computed(() => this.users().filter((u) => u.role === 'DEVELOPER').length);

  onPageIndexChange(page: number): void {
    // nz-table cũng phát pageIndexChange khi đổi pageSize - tránh gọi API 2 lần
    if (page === this.pageIndex()) return;
    this.pageIndex.set(page);
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.search();
  }

  /** Bộ lọc thay đổi - quay về trang đầu. */
  search(): void {
    this.pageIndex.set(1);
    this.loadUsers();
  }

  resetFilters(): void {
    this.filter.reset();
    this.search();
  }

  onRoleFilterChange(role: string): void {
    this.filter.patch({ role });
    this.search();
  }

  onStatusFilterChange(status: string): void {
    this.filter.patch({ status });
    this.search();
  }

  /** Tải lại trang hiện tại với bộ lọc hiện tại. */
  loadUsers(): void {
    const m = this.filterModel();
    this.userService.loadUsers({
      search: m.search,
      role: m.role,
      status: m.status,
      page: this.pageIndex(),
      size: this.pageSize(),
    });
  }

  // Sorting comparators
  protected sortFullName = sortByString<User>('fullName');
  protected sortEmail = sortByString<User>('email');
  protected sortRole = sortByString<User>('role');
  protected sortStatus = sortByString<User>('status');
  protected sortCreatedAt = sortByString<User>('createdAt');
  protected sortUpdatedAt = sortByString<User>('updatedAt');

  deleteUser(user: User, event?: Event): void {
    event?.stopPropagation();
    if (!this.canDelete(user)) {
      this.message.warning('Bạn không có quyền xóa tài khoản này.');
      return;
    }
    // Gọi API xóa: DELETE /api/users/{id}
    this.userService.deleteUser(user.id).subscribe({
      next: () => this.detailDrawer()?.closeIfShowing(user.id),
      // Lỗi đã được UserService hiển thị
      error: () => undefined,
    });
  }

  toggleStatus(user: User, status: UserStatus, event?: Event): void {
    event?.stopPropagation();
    if (!this.isAdmin()) {
      this.message.warning('Chỉ Quản trị viên (ADMIN) mới có quyền thay đổi trạng thái tài khoản.');
      return;
    }
    // Drawer đọc người dùng từ UserService nên tự cập nhật theo bản ghi mới
    this.userService.toggleStatus(user.id, status).subscribe({ error: () => undefined });
  }

  // Helpers for UI tags, avatar and initials (delegated to @shared/utils)

  protected readonly getRoleBadgeInfo = getUserRoleMeta;
  protected readonly getStatusBadgeInfo = getUserStatusMeta;
  protected readonly getAvatarColor = getAvatarColor;
  protected readonly getUserInitials = getUserInitials;
}
