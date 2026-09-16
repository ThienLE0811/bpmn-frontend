import { Pipe, PipeTransform } from '@angular/core';
import { getUserInitials } from '../utils/user.util';

/**
 * Pure Pipe trích xuất 1-2 ký tự viết tắt đại diện từ họ tên người dùng
 * Cách dùng: {{ user.fullName | userInitials }}
 */
@Pipe({
  name: 'userInitials',
  standalone: true,
})
export class UserInitialsPipe implements PipeTransform {
  transform(fullName?: string | null): string {
    return getUserInitials(fullName || '');
  }
}
