import { Component, computed, inject, output, signal } from '@angular/core';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { AuthService, UserService } from '@core/services';
import { User } from '@core/models';
import { AvatarColorPipe, FormatDatePipe, UserInitialsPipe } from '@shared/pipes';
import { canDeleteUser, canEditUser, getUserRoleMeta, getUserStatusMeta } from '@shared/utils';

/**
 * Drawer hồ sơ người dùng. Đọc bản ghi theo id từ UserService nên tự cập nhật sau khi
 * sửa / đổi trạng thái; sửa và xóa được chuyển cho trang xử lý.
 */
@Component({
  selector: 'app-user-detail-drawer',
  standalone: true,
  imports: [
    NzDrawerModule,
    NzIconModule,
    NzPopconfirmModule,
    AvatarColorPipe,
    FormatDatePipe,
    UserInitialsPipe,
  ],
  templateUrl: './user-detail-drawer.component.html',
  styleUrl: './user-detail-drawer.component.scss',
})
export class UserDetailDrawerComponent {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly editRequested = output<User>();
  readonly deleteRequested = output<User>();

  protected readonly isOpen = signal<boolean>(false);
  private readonly openedUser = signal<User | null>(null);

  protected readonly user = computed(() => {
    const opened = this.openedUser();
    if (!opened) return null;
    return this.userService.users().find((u) => u.id === opened.id) ?? opened;
  });
  protected readonly canEdit = computed(() =>
    canEditUser(this.authService.currentUser(), this.user()),
  );
  protected readonly canDelete = computed(() =>
    canDeleteUser(this.authService.currentUser(), this.user()),
  );

  protected readonly getRoleBadgeInfo = getUserRoleMeta;
  protected readonly getStatusBadgeInfo = getUserStatusMeta;

  open(user: User): void {
    this.openedUser.set(user);
    this.isOpen.set(true);
    // Lấy bản mới nhất; service cập nhật vào danh sách nên `user()` tự đổi theo
    this.userService.getUserById(user.id).subscribe({
      next: (fresh) => {
        if (fresh?.id === this.openedUser()?.id) this.openedUser.set(fresh);
      },
      error: () => undefined,
    });
  }

  /** Đóng nếu drawer đang hiển thị người dùng này (ví dụ sau khi tài khoản bị xóa). */
  closeIfShowing(userId: string): void {
    if (this.openedUser()?.id === userId) this.close();
  }

  protected close(): void {
    this.isOpen.set(false);
    this.openedUser.set(null);
  }
}
