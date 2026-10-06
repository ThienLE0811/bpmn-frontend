import { User } from '@core/models';
import { checkPer } from './auth.util';

type Identity = Pick<User, 'id' | 'username'>;

/** Cùng một tài khoản: trùng id, hoặc trùng username (không phân biệt hoa thường, bỏ khoảng trắng). */
export function isSameUser(a: Identity, b: Identity): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  return (
    !!a.username &&
    !!b.username &&
    a.username.trim().toLowerCase() === b.username.trim().toLowerCase()
  );
}

/** ADMIN sửa được mọi tài khoản; người dùng khác chỉ sửa được chính mình. */
export function canEditUser(
  current: User | null | undefined,
  target: User | null | undefined,
): boolean {
  if (!current || !target) return false;
  return checkPer('ADMIN', current) || isSameUser(current, target);
}

/** Chỉ ADMIN được xóa, và không được tự xóa tài khoản đang đăng nhập. */
export function canDeleteUser(
  current: User | null | undefined,
  target: User | null | undefined,
): boolean {
  if (!current || !target) return false;
  return checkPer('ADMIN', current) && !isSameUser(current, target);
}
