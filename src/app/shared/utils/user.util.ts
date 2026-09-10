import { UserRole, UserStatus } from '@core/models';

export interface UserRoleMeta {
  label: string;
  class: string;
  icon: string;
}

export interface UserStatusMeta {
  label: string;
  class: string;
}

/**
 * Trích xuất 1-2 ký tự viết tắt đại diện từ họ và tên người dùng (Initials)
 * Ví dụ: "Lê Văn Thiện" -> "LT", "Admin" -> "AD"
 */
export function getUserInitials(fullName: string): string {
  if (!fullName || !fullName.trim()) return '??';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Tạo màu gradient avatar nhất quán dựa trên mã băm chuỗi tên
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Lấy thông tin nhãn hiển thị, CSS class và icon cho từng vai trò người dùng
 */
export function getUserRoleMeta(role: UserRole): UserRoleMeta {
  switch (role) {
    case 'ADMIN':
      return { label: 'Quản trị viên', class: 'role-badge admin', icon: 'safety' };
    case 'DEVELOPER':
      return { label: 'Lập trình viên', class: 'role-badge developer', icon: 'code' };
    case 'MANAGER':
      return { label: 'Quản lý', class: 'role-badge manager', icon: 'crown' };
    case 'DESIGNER':
      return { label: 'Thiết kế quy trình', class: 'role-badge designer', icon: 'appstore-add' };
    case 'VIEWER':
    default:
      return { label: 'Người xem', class: 'role-badge viewer', icon: 'eye' };
  }
}

/**
 * Lấy thông tin nhãn hiển thị và CSS class cho từng trạng thái tài khoản
 */
export function getUserStatusMeta(status: UserStatus): UserStatusMeta {
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

/**
 * Tạo mật khẩu tạm thời ngẫu nhiên (ví dụ: BPMN@4829)
 */
export function generateTempPassword(prefix = 'BPMN'): string {
  const code = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}@${code}`;
}
