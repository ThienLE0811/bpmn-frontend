import { User, UserRole } from '@core/models';

/**
 * Lấy thông tin người dùng đang đăng nhập từ storage (localStorage / sessionStorage)
 */
export function getStoredCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw =
    localStorage.getItem('bpmn_current_user') ||
    sessionStorage.getItem('bpmn_current_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/**
 * Lấy access token hiện tại từ storage (localStorage / sessionStorage)
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('bpmn_access_token') ||
    sessionStorage.getItem('bpmn_access_token') ||
    null
  );
}

/**
 * Kiểm tra quyền (vai trò) của người dùng hiện tại hoặc một đối tượng người dùng cụ thể.
 * @param role Vai trò cần kiểm tra (ví dụ: 'ADMIN', 'DEVELOPER') hoặc danh sách vai trò ['ADMIN', 'MANAGER']
 * @param user (Tùy chọn) Đối tượng người dùng cần kiểm tra. Nếu không truyền, hàm sẽ tự động lấy thông tin từ phiên đăng nhập.
 * @returns boolean true nếu người dùng có vai trò khớp, ngược lại false
 *
 * Ví dụ:
 *   checkPer('ADMIN') // Kiểm tra người dùng hiện tại có phải ADMIN không
 *   checkPer(['ADMIN', 'MANAGER']) // Kiểm tra người dùng hiện tại có thuộc ADMIN hoặc MANAGER
 *   checkPer('ADMIN', targetUser) // Kiểm tra trên đối tượng người dùng cụ thể
 */
export function checkPer(
  role: UserRole | UserRole[] | string | string[],
  user?: User | null,
): boolean {
  const currentUser = user !== undefined ? user : getStoredCurrentUser();

  if (!currentUser || !currentUser.role) {
    return false;
  }

  const currentRole = String(currentUser.role).toUpperCase();

  if (Array.isArray(role)) {
    return role.map((r) => String(r).toUpperCase()).includes(currentRole);
  }

  return currentRole === String(role).toUpperCase();
}
