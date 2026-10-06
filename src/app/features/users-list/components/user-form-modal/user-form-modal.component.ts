import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AuthService, UserService } from '@core/services';
import { User, UserRole, UserStatus } from '@core/models';
import { canEditUser, checkPer } from '@shared/utils';

interface UserFormValue {
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
}

const MIN_PASSWORD_LENGTH = 3;

function emptyForm(): UserFormValue {
  return {
    username: '',
    fullName: '',
    email: '',
    role: 'DEVELOPER',
    status: 'ACTIVE',
    password: '',
  };
}

/** Modal tạo mới / cập nhật người dùng, kèm kiểm tra quyền và hỏi xác nhận khi đóng còn thay đổi. */
@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [FormField, NzIconModule, NzInputModule, NzModalModule, NzSelectModule],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss',
})
export class UserFormModalComponent {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);

  protected readonly isOpen = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  /** null khi đang tạo mới. */
  protected readonly editingUser = signal<User | null>(null);
  protected readonly passwordVisible = signal<boolean>(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly isAdmin = computed(() => checkPer('ADMIN', this.authService.currentUser()));

  protected readonly formModel = signal<UserFormValue>(emptyForm());
  protected readonly userForm = form(this.formModel, (schema) => {
    required(schema.username, { message: 'Tên đăng nhập không được để trống' });
    required(schema.fullName, { message: 'Họ và tên không được để trống' });
    required(schema.email, { message: 'Email không được để trống' });
    required(schema.role, { message: 'Vui lòng chọn vai trò người dùng' });
  });

  private initialForm: UserFormValue | null = null;

  openCreate(): void {
    if (!this.isAdmin()) {
      this.message.warning('Chỉ Quản trị viên (ADMIN) mới có quyền thêm người dùng mới.');
      return;
    }
    this.openWith(null, emptyForm());
  }

  openEdit(user: User): void {
    if (!canEditUser(this.authService.currentUser(), user)) {
      this.message.warning(
        'Bạn chỉ có quyền chỉnh sửa tài khoản của chính mình hoặc tài khoản có quyền Quản trị viên (ADMIN).',
      );
      return;
    }
    this.openWith(user, {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
    });
  }

  /** Đóng modal; hỏi xác nhận nếu còn thay đổi chưa lưu. */
  protected requestClose(): void {
    if (!this.hasUnsavedChanges()) {
      this.forceClose();
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy bỏ',
      nzContent: 'Thông tin người dùng đã có chỉnh sửa chưa được lưu. Bạn có chắc muốn đóng không?',
      nzOkText: 'Đóng không lưu',
      nzOkDanger: true,
      nzCancelText: 'Tiếp tục nhập',
      nzCentered: true,
      nzOnOk: () => this.forceClose(),
    });
  }

  protected save(): void {
    void submit(this.userForm, async () => {
      const editing = this.editingUser();
      const value = this.formModel();
      this.passwordError.set(null);

      if (!this.validate(editing, value)) return;

      const password = value.password.trim();
      const request = editing?.id
        ? this.userService.updateUser(editing.id, {
            username: value.username,
            fullName: value.fullName,
            email: value.email,
            role: value.role,
            status: value.status,
            ...(password ? { password } : {}),
          })
        : this.userService.createUser({
            username: value.username,
            fullName: value.fullName,
            email: value.email,
            role: value.role,
            status: value.status,
            password,
          });

      this.isSubmitting.set(true);
      request.subscribe({
        next: () => this.forceClose(),
        // Lỗi đã được UserService hiển thị
        error: () => this.isSubmitting.set(false),
      });
    });
  }

  /** Kiểm tra quyền và mật khẩu: bắt buộc khi tạo mới, tùy chọn khi cập nhật. */
  private validate(editing: User | null, value: UserFormValue): boolean {
    const password = value.password.trim();
    if (!editing?.id) {
      if (!this.isAdmin()) {
        this.message.error('Chỉ Quản trị viên (ADMIN) mới có quyền tạo người dùng mới.');
        return false;
      }
      if (!password) {
        this.passwordError.set('Vui lòng nhập mật khẩu khởi tạo cho người dùng mới.');
        return false;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        this.passwordError.set(`Mật khẩu phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
        return false;
      }
      return true;
    }

    if (!canEditUser(this.authService.currentUser(), editing)) {
      this.message.error('Bạn không có quyền chỉnh sửa tài khoản người dùng này.');
      return false;
    }
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      this.passwordError.set(`Mật khẩu mới phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
      return false;
    }
    return true;
  }

  private openWith(user: User | null, value: UserFormValue): void {
    this.editingUser.set(user);
    this.passwordVisible.set(false);
    this.passwordError.set(null);
    this.formModel.set({ ...value });
    this.initialForm = { ...value };
    this.isOpen.set(true);
  }

  private hasUnsavedChanges(): boolean {
    const initial = this.initialForm;
    if (!initial) return false;
    const current = this.formModel();
    return (Object.keys(initial) as (keyof UserFormValue)[]).some((k) => current[k] !== initial[k]);
  }

  private forceClose(): void {
    this.isOpen.set(false);
    this.editingUser.set(null);
    this.initialForm = null;
    this.isSubmitting.set(false);
    this.passwordVisible.set(false);
    this.passwordError.set(null);
  }
}
