import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services';
import { Router, ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: { login: ReturnType<typeof vi.fn> };
  let mockRouter: { navigateByUrl: ReturnType<typeof vi.fn> };
  let mockMessage: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let mockModal: { info: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn().mockReturnValue(of({ token: 'mock-token' })),
    };
    mockRouter = {
      navigateByUrl: vi.fn(),
    };
    mockMessage = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockModal = {
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: { returnUrl: '/processes' } } },
        },
        { provide: NzMessageService, useValue: mockMessage },
        { provide: NzModalService, useValue: mockModal },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form before submission', () => {
    component.loginForm.setValue({
      username: '',
      password: '',
      rememberMe: false,
    });

    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.loginForm.invalid).toBe(true);
  });

  it('should toggle password visibility', () => {
    expect(component.passwordVisible()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.passwordVisible()).toBe(true);
  });

  it('should call authService login and navigate upon valid form submission', () => {
    component.loginForm.setValue({
      username: 'admin',
      password: 'password123',
      rememberMe: true,
    });

    component.onSubmit();
    expect(mockAuthService.login).toHaveBeenCalledWith(
      { username: 'admin', password: 'password123' },
      true,
    );
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/processes');
  });

  it('should display error message on login failure', () => {
    mockAuthService.login.mockReturnValue(throwError(() => new Error('Tài khoản không đúng')));

    component.loginForm.setValue({
      username: 'admin',
      password: 'wrongpassword',
      rememberMe: true,
    });

    component.onSubmit();
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeTruthy();
  });
});
