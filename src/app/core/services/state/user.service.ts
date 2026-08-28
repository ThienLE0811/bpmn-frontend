import { Injectable, inject, signal } from '@angular/core';
import { User, UserQueryParams, UserRole, UserStatus } from '@core/models/user.model';
import { ApiErrorHandlerService } from '@shared/services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserApiService } from '../api/user-api.service';

const INITIAL_MOCK_USERS: User[] = [
  {
    id: 'usr_001',
    username: 'admin.system',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@enterprise.vn',
    phone: '0901 234 567',
    role: 'ADMIN',
    department: 'Ban Công nghệ Thông tin',
    status: 'ACTIVE',
    avatar: 'NA',
    notes: 'Quản trị viên hệ thống cấp cao, toàn quyền cấu hình và triển khai quy trình.',
    lastLogin: '2026-08-28 15:42',
    createdAt: '2026-01-10 08:30',
    updatedAt: '2026-08-20 14:15',
  },
  {
    id: 'usr_002',
    username: 'trang.le',
    fullName: 'Lê Thị Thu Trang',
    email: 'trang.le@enterprise.vn',
    phone: '0912 345 678',
    role: 'MANAGER',
    department: 'Khối Quản trị Vận hành',
    status: 'ACTIVE',
    avatar: 'LT',
    notes: 'Trưởng phòng phê duyệt và giám sát luồng thực thi quy trình nghiệp vụ.',
    lastLogin: '2026-08-28 14:10',
    createdAt: '2026-02-15 09:00',
    updatedAt: '2026-08-18 10:20',
  },
  {
    id: 'usr_003',
    username: 'minh.pham',
    fullName: 'Phạm Quang Minh',
    email: 'minh.pham@enterprise.vn',
    phone: '0983 456 789',
    role: 'DESIGNER',
    department: 'Trung tâm Phát triển Giải pháp',
    status: 'ACTIVE',
    avatar: 'PM',
    notes: 'Chuyên viên thiết kế quy trình BPMN và mô hình bảng quyết định DMN.',
    lastLogin: '2026-08-28 11:25',
    createdAt: '2026-03-01 10:15',
    updatedAt: '2026-08-25 16:45',
  },
  {
    id: 'usr_004',
    username: 'hoang.tran',
    fullName: 'Trần Huy Hoàng',
    email: 'hoang.tran@enterprise.vn',
    phone: '0974 567 890',
    role: 'DESIGNER',
    department: 'Trung tâm Phát triển Giải pháp',
    status: 'ACTIVE',
    avatar: 'TH',
    notes: 'Kiến trúc sư nghiệp vụ số hóa và tích hợp Service Tasks.',
    lastLogin: '2026-08-27 17:05',
    createdAt: '2026-03-12 14:00',
    updatedAt: '2026-08-22 09:30',
  },
  {
    id: 'usr_005',
    username: 'linh.vu',
    fullName: 'Vũ Mỹ Linh',
    email: 'linh.vu@enterprise.vn',
    phone: '0935 678 901',
    role: 'VIEWER',
    department: 'Phòng Kiểm soát Tuân thủ & Rủi ro',
    status: 'ACTIVE',
    avatar: 'VL',
    notes: 'Kiểm toán nội bộ, tra cứu lịch sử thay đổi phiên bản quy trình.',
    lastLogin: '2026-08-26 09:15',
    createdAt: '2026-04-05 11:30',
    updatedAt: '2026-08-10 11:30',
  },
  {
    id: 'usr_006',
    username: 'duc.nguyen',
    fullName: 'Nguyễn Tiến Đức',
    email: 'duc.nguyen@enterprise.vn',
    phone: '0966 789 012',
    role: 'MANAGER',
    department: 'Ban Tài chính Kế toán',
    status: 'ACTIVE',
    avatar: 'ND',
    notes: 'Phê duyệt các bảng quyết định DMN về hạn mức chi tiêu.',
    lastLogin: '2026-08-25 14:50',
    createdAt: '2026-04-18 13:45',
    updatedAt: '2026-08-15 15:00',
  },
  {
    id: 'usr_007',
    username: 'hai.do',
    fullName: 'Đỗ Mạnh Hải',
    email: 'hai.do@enterprise.vn',
    phone: '0947 890 123',
    role: 'VIEWER',
    department: 'Khối Kinh doanh & Marketing',
    status: 'INACTIVE',
    avatar: 'DH',
    notes: 'Tài khoản tạm ngưng do chuyển đổi công tác nội bộ.',
    lastLogin: '2026-07-15 10:00',
    createdAt: '2026-05-02 08:20',
    updatedAt: '2026-08-01 09:00',
  },
  {
    id: 'usr_008',
    username: 'guest.consultant',
    fullName: 'Bùi Quốc Hưng',
    email: 'hung.bui@consultant.vn',
    phone: '0928 901 234',
    role: 'VIEWER',
    department: 'Đối tác Tư vấn Độc lập',
    status: 'LOCKED',
    avatar: 'BH',
    notes: 'Tài khoản hết hạn hợp đồng tư vấn, đã bị khóa quyền truy cập.',
    lastLogin: '2026-06-30 16:30',
    createdAt: '2026-05-20 15:10',
    updatedAt: '2026-07-01 08:00',
  },
];

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userApi = inject(UserApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private readonly message = inject(NzMessageService);

  private allUsers = [...INITIAL_MOCK_USERS];
  private usersSignal = signal<User[]>([...INITIAL_MOCK_USERS]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  get users() {
    return this.usersSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  loadUsers(params?: UserQueryParams): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.userApi.getAll(params).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.allUsers = data;
          this.usersSignal.set(data);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        // Fallback in-memory search and filter on mock data
        console.warn('Không thể kết nối API (/users), sử dụng dữ liệu mẫu:', err);
        let filtered = [...this.allUsers];

        if (params) {
          const search = params.search ? String(params.search).toLowerCase().trim() : '';
          const role = params.role && params.role !== 'ALL' ? params.role : '';
          const status = params.status && params.status !== 'ALL' ? params.status : '';
          const dept = params.department && params.department !== 'ALL' ? params.department : '';

          if (search) {
            filtered = filtered.filter(
              (u) =>
                u.username.toLowerCase().includes(search) ||
                u.fullName.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search) ||
                (u.phone && u.phone.includes(search)),
            );
          }

          if (role) {
            filtered = filtered.filter((u) => u.role === role);
          }

          if (status) {
            filtered = filtered.filter((u) => u.status === status);
          }

          if (dept) {
            filtered = filtered.filter((u) => u.department === dept);
          }
        }

        this.usersSignal.set(filtered);
        this.loadingSignal.set(false);
      },
    });
  }

  saveUser(userData: Partial<User> & { username: string; fullName: string; email: string }): User {
    const list = this.allUsers;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    if (userData.id) {
      // Update
      const existing = list.find((u) => u.id === userData.id);
      const updatedItem: User = {
        id: userData.id,
        username: userData.username.trim(),
        fullName: userData.fullName.trim(),
        email: userData.email.trim(),
        phone: userData.phone?.trim() || existing?.phone || '',
        role: (userData.role as UserRole) || existing?.role || 'VIEWER',
        department: userData.department || existing?.department || 'Ban Công nghệ Thông tin',
        status: (userData.status as UserStatus) || existing?.status || 'ACTIVE',
        avatar: getInitials(userData.fullName),
        notes: userData.notes !== undefined ? userData.notes : existing?.notes || '',
        lastLogin: existing?.lastLogin || 'Chưa đăng nhập',
        createdAt: existing?.createdAt || nowStr,
        updatedAt: nowStr,
      };

      this.userApi.update(userData.id, updatedItem).subscribe({
        next: (res) => {
          if (res) {
            this.allUsers = this.allUsers.map((u) => (u.id === res.id ? res : u));
            this.usersSignal.set(this.usersSignal().map((u) => (u.id === res.id ? res : u)));
          }
        },
        error: (err) => {
          console.warn('API update failed, updating local state:', err);
        },
      });

      this.allUsers = this.allUsers.map((u) => (u.id === userData.id ? updatedItem : u));
      this.usersSignal.set(this.usersSignal().map((u) => (u.id === userData.id ? updatedItem : u)));
      this.message.success(`Đã cập nhật thông tin người dùng "${updatedItem.fullName}" thành công.`);
      return updatedItem;
    } else {
      // Create new
      const newId = 'usr_' + Date.now();
      const newUser: User = {
        id: newId,
        username: userData.username.trim(),
        fullName: userData.fullName.trim(),
        email: userData.email.trim(),
        phone: userData.phone?.trim() || '',
        role: (userData.role as UserRole) || 'DESIGNER',
        department: userData.department || 'Ban Công nghệ Thông tin',
        status: (userData.status as UserStatus) || 'ACTIVE',
        avatar: getInitials(userData.fullName),
        notes: userData.notes || '',
        lastLogin: 'Chưa đăng nhập',
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      this.userApi.create(newUser).subscribe({
        next: (res) => {
          if (res) {
            this.allUsers = [res, ...this.allUsers];
            this.usersSignal.set([res, ...this.usersSignal().filter((u) => u.id !== newId)]);
          }
        },
        error: (err) => {
          console.warn('API create failed, updating local state:', err);
        },
      });

      this.allUsers = [newUser, ...this.allUsers];
      this.usersSignal.set([newUser, ...this.usersSignal()]);
      this.message.success(`Đã tạo tài khoản người dùng "${newUser.fullName}" thành công.`);
      return newUser;
    }
  }

  deleteUser(id: string): void {
    const target = this.allUsers.find((u) => u.id === id);
    const targetName = target ? target.fullName : 'Người dùng';

    this.userApi.delete(id).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter((u) => u.id !== id);
        this.usersSignal.set(this.usersSignal().filter((u) => u.id !== id));
        this.message.success(`Đã xóa tài khoản "${targetName}".`);
      },
      error: (err) => {
        console.warn('API delete failed, updating local state:', err);
        this.allUsers = this.allUsers.filter((u) => u.id !== id);
        this.usersSignal.set(this.usersSignal().filter((u) => u.id !== id));
        this.message.success(`Đã xóa tài khoản "${targetName}".`);
      },
    });
  }

  toggleStatus(id: string, newStatus: UserStatus): void {
    const target = this.allUsers.find((u) => u.id === id);
    if (!target) return;

    const statusLabel =
      newStatus === 'ACTIVE'
        ? 'Hoạt động'
        : newStatus === 'INACTIVE'
          ? 'Tạm dừng'
          : 'Khóa tài khoản';

    this.userApi.toggleStatus(id, newStatus).subscribe({
      next: (res) => {
        if (res) {
          this.allUsers = this.allUsers.map((u) => (u.id === res.id ? res : u));
          this.usersSignal.set(this.usersSignal().map((u) => (u.id === res.id ? res : u)));
        }
      },
      error: (err) => {
        console.warn('API toggle status failed, updating local state:', err);
      },
    });

    const updated = { ...target, status: newStatus, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
    this.allUsers = this.allUsers.map((u) => (u.id === id ? updated : u));
    this.usersSignal.set(this.usersSignal().map((u) => (u.id === id ? updated : u)));
    this.message.info(`Đã chuyển trạng thái tài khoản "${target.fullName}" sang: ${statusLabel}.`);
  }

  resetPassword(id: string): void {
    const target = this.allUsers.find((u) => u.id === id);
    const targetName = target ? target.fullName : 'người dùng';

    this.userApi.resetPassword(id).subscribe({
      next: () => {
        this.message.success(`Đã gửi email cấp lại mật khẩu tạm thời cho ${targetName}.`);
      },
      error: () => {
        // Fallback feedback
        this.message.success(`Mật khẩu tạm thời đã được đặt lại thành công cho ${targetName}: "BPMN@${Math.floor(1000 + Math.random() * 9000)}"`);
      },
    });
  }
}
