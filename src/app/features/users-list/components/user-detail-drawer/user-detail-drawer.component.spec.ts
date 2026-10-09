import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserDetailDrawerComponent } from './user-detail-drawer.component';
import { UserService, AuthService } from '@core/services';
import { User } from '@core/models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('UserDetailDrawerComponent', () => {
  let fixture: ComponentFixture<UserDetailDrawerComponent>;
  let component: UserDetailDrawerComponent;
  let mockUserService: {
    users: ReturnType<typeof signal<User[]>>;
    getUserById: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<User | null>>;
  };

  const adminUser: User = {
    id: 'u-admin',
    username: 'admin',
    fullName: 'Admin User',
    email: 'admin@company.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const normalUser: User = {
    id: 'u-1',
    username: 'bob',
    fullName: 'Bob Smith',
    email: 'bob@company.com',
    role: 'DEVELOPER',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(async () => {
    mockUserService = {
      users: signal([normalUser]),
      getUserById: vi.fn().mockReturnValue(of(normalUser)),
    };
    mockAuthService = {
      currentUser: signal(adminUser),
    };

    await TestBed.configureTestingModule({
      imports: [UserDetailDrawerComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in closed state', () => {
    expect(component).toBeTruthy();
    expect((component as any).isOpen()).toBe(false);
  });

  it('should open and fetch user data', () => {
    component.open(normalUser);
    expect((component as any).isOpen()).toBe(true);
    expect((component as any).user()?.username).toBe('bob');
    expect(mockUserService.getUserById).toHaveBeenCalledWith('u-1');
  });

  it('should determine admin can edit and delete other users', () => {
    component.open(normalUser);
    expect((component as any).canEdit()).toBe(true);
    expect((component as any).canDelete()).toBe(true);
  });

  it('should close drawer on closeIfShowing match', () => {
    component.open(normalUser);
    expect((component as any).isOpen()).toBe(true);

    component.closeIfShowing('u-1');
    expect((component as any).isOpen()).toBe(false);
  });
});
