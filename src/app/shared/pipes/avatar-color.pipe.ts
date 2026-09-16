import { Pipe, PipeTransform } from '@angular/core';
import { getAvatarColor } from '../utils/user.util';

/**
 * Pure Pipe tính toán màu gradient đại diện dựa trên chuỗi tên
 * Cách dùng: [style.background]="user.fullName | avatarColor"
 */
@Pipe({
  name: 'avatarColor',
  standalone: true,
})
export class AvatarColorPipe implements PipeTransform {
  transform(name?: string | null): string {
    return getAvatarColor(name || '');
  }
}
