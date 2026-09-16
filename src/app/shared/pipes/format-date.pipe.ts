import { Pipe, PipeTransform } from '@angular/core';
import { formatDisplayDateTime } from '../utils/date.util';

/**
 * Pure Pipe định dạng ngày tháng hiển thị an toàn trên giao diện
 * Cách dùng: {{ dateString | formatDate }} hoặc {{ dateString | formatDate:'N/A' }}
 */
@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(value?: string | number | Date | null, fallback = '--'): string {
    return formatDisplayDateTime(value, fallback);
  }
}
