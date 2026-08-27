import { Injectable, inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { getApiErrorMessage, handleApiError } from '../utils/error-handler.util';

@Injectable({
  providedIn: 'root',
})
export class ApiErrorHandlerService {
  private readonly message = inject(NzMessageService);

  /**
   * Trích xuất thông báo lỗi dễ đọc
   */
  getErrorMessage(err: unknown, fallbackMessage?: string): string {
    return getApiErrorMessage(err, fallbackMessage);
  }

  /**
   * Xử lý lỗi API: hiển thị nz-message error và trả về chuỗi nội dung lỗi
   */
  handleError(err: unknown, fallbackMessage?: string): string {
    return handleApiError(err, fallbackMessage, this.message);
  }
}
