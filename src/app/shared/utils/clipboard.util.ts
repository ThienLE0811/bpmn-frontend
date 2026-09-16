import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Tiện ích sao chép văn bản vào Clipboard an toàn, hỗ trợ fallback và thông báo NzMessage
 */
export async function copyToClipboard(
  text: string,
  message?: NzMessageService,
  successMessage?: string,
  event?: Event,
): Promise<boolean> {
  if (event) {
    event.stopPropagation();
  }
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback cho môi trường không có Clipboard API hoặc non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    if (message) {
      message.success(successMessage || `Đã sao chép: ${text}`);
    }
    return true;
  } catch (err) {
    console.warn('Lỗi khi sao chép clipboard:', err);
    if (message) {
      message.error('Không thể sao chép văn bản vào clipboard.');
    }
    return false;
  }
}
