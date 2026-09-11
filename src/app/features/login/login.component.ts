import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AuthService } from '@core/services';
import { getApiErrorMessage } from '@shared/utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
    NzModalModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly passwordVisible = signal<boolean>(false);

  readonly loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    rememberMe: [true],
  });

  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const { username, password, rememberMe } = this.loginForm.getRawValue();

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ username: username.trim(), password }, rememberMe).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.message.success('Đăng nhập thành công!');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const errMsg = getApiErrorMessage(
          err,
          'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.',
        );
        this.errorMessage.set(errMsg);
      },
    });
  }

  showForgotPasswordInfo(): void {

    this.modal.info({
      nzTitle: 'Quên mật khẩu?',
      nzContent:
        'Để đảm bảo an ninh cho quy trình nghiệp vụ BPMN & DMN, tính năng đặt lại mật khẩu cần được quản trị viên hệ thống (Admin) thực hiện trong mục "Quản lý người dùng". Vui lòng liên hệ Admin hệ thống để được cấp lại mật khẩu.',
      nzOkText: 'Đã hiểu',
      nzMaskClosable: true,
    });
  }
}
