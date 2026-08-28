import { HttpErrorResponse } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Trích xuất chuỗi thông báo lỗi người dùng dễ đọc từ các loại đối tượng lỗi (HttpErrorResponse, Error, string, ...)
 */
export function getApiErrorMessage(
  err: unknown,
  fallbackMessage = 'Đã có lỗi xảy ra khi xử lý yêu cầu.',
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc server backend.';
    }

    let serverMsg = '';
    if (typeof err.error === 'string') {
      serverMsg = err.error;
    } else if (err.error && typeof err.error === 'object') {
      const errObj = err.error as Record<string, unknown>;
      const errorField = errObj['errors'];

      if (typeof errorField === 'string') {
        serverMsg = errorField;
      } else if (errorField && typeof errorField === 'object' && !Array.isArray(errorField)) {
        const detail = errorField as { errorCode?: string | number; message?: string };
        if (detail.message && detail.message.trim().length > 0) {
          serverMsg = detail.message.trim();
        } else if (detail.errorCode !== undefined) {
          serverMsg = `Mã lỗi: ${detail.errorCode}`;
        }
      } else if (Array.isArray(errorField)) {
        serverMsg = errorField.filter(Boolean).join(', ');
      } else if (typeof errObj['message'] === 'string') {
        serverMsg = errObj['message'];
      } else if (typeof errObj['title'] === 'string') {
        serverMsg = errObj['title'];
      } else if (typeof errObj['error'] === 'string') {
        serverMsg = errObj['error'];
      }
    }


    switch (err.status) {
      case 400:
        return serverMsg
          ? `Yêu cầu không hợp lệ (400): ${serverMsg}`
          : 'Yêu cầu không hợp lệ (400). Vui lòng kiểm tra lại dữ liệu gửi lên.';
      case 401:
        return serverMsg || 'Phiên làm việc đã hết hạn hoặc chưa được xác thực (401).';
      case 403:
        return serverMsg || 'Bạn không có quyền thực hiện thao tác này (403).';
      case 404:
        return serverMsg || 'Không tìm thấy dữ liệu yêu cầu (404).';
      case 409:
        return serverMsg
          ? `Dữ liệu bị trùng lặp hoặc xung đột (409): ${serverMsg}`
          : 'Dữ liệu bị trùng lặp hoặc xung đột (409).';
      case 422:
        return serverMsg
          ? `Dữ liệu không thể xử lý (422): ${serverMsg}`
          : 'Dữ liệu không hợp lệ (422).';
      default:
        if (err.status >= 500 && err.status < 600) {
          return serverMsg
            ? `Lỗi hệ thống máy chủ (${err.status}): ${serverMsg}`
            : `Lỗi máy chủ nội bộ (${err.status}). Vui lòng thử lại sau.`;
        }
        return serverMsg || (err.status ? `Lỗi (${err.status}): ${fallbackMessage}` : fallbackMessage);
    }
  }

  if (err instanceof Error) {
    return err.message || fallbackMessage;
  }

  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }

  return fallbackMessage;
}

/**
 * Xử lý lỗi API: hiển thị nz-message và trả về chuỗi thông báo lỗi
 */
export function handleApiError(
  err: unknown,
  fallbackMessage = 'Đã có lỗi xảy ra khi gọi API.',
  messageService?: NzMessageService,
): string {
  const message = getApiErrorMessage(err, fallbackMessage);
  if (messageService) {
    messageService.error(message);
  }
  return message;
}
