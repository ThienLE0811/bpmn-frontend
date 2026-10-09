import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserFormModalComponent } from './user-form-modal.component';
import { UserService, AuthService } from '@core/services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { User } from '@core/models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('UserFormModalComponent', () => {
  let fixture: ComponentFixture<UserFormModalComponent>;
  let component: UserFormModalComponent;
  let mockUserService: {
    createUser: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<User | null>>;
  };
  let mockModalService: {
    confirm: ReturnType<typeof vi.fn>;
  };
  let mockMessageService: {
    warning: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  const adminUser: User = {
    id: 'u-admin',
    username: 'admin',
    fullName: 'Admin User',
    email: 'admin@test.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const targetUser: User = {
    id: 'u-user',
    username: 'john',
    fullName: 'John Doe',
    email: 'john@test.com',
    role: 'DEVELOPER',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(async () => {
    mockUserService = {
      createUser: vi.fn().mockReturnValue(of(targetUser)),
      updateUser: vi.fn().mockReturnValue(of(targetUser)),
    };
    mockAuthService = {
      currentUser: signal(adminUser),
    };
    mockModalService = {
      confirm: vi.fn(),
    };
    mockMessageService = {
      warning: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserFormModalComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NzModalService, useValue: mockModalService },
        { provide: NzMessageService, useValue: mockMessageService },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in closed state', () => {
    expect(component).toBeTruthy();
    expect((component as any).isOpen()).toBe(false);
  });

  it('should allow admin to open create user modal', () => {
    component.openCreate();
    expect((component as any).isOpen()).toBe(true);
    expect((component as any).editingUser()).toBeNull();
  });

  it('should reject non-admin from opening create user modal', () => {
    mockAuthService.currentUser.set({ ...targetUser, role: 'DEVELOPER' });
    fixture.detectChanges();

    component.openCreate();
    expect((component as any).isOpen()).toBe(false);
    expect(mockMessageService.warning).toHaveBeenCalled();
  });

  it('should open edit mode with populated user fields', () => {
    component.openEdit(targetUser);
    expect((component as any).isOpen()).toBe(true);
    expect((component as any).editingUser()).toEqual(targetUser);
    expect((component as any).formModel().username).toBe('john');
  });
});
