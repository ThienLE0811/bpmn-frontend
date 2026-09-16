/**
 * Utility functions for date and time formatting
 */

/**
 * Formats a Date object or date-compatible string/number to 'DD/MM/YYYY HH:mm:ss' format.
 * Defaults to current date/time if no argument is provided.
 */
export function formatDateTime(date: Date | string | number = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a Date object or date-compatible string/number to 'DD/MM/YYYY' format.
 */
export function formatDate(date: Date | string | number = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a Date object or date-compatible string/number to 'YYYY-MM-DD HH:mm' (ISO-like string)
 */
export function formatIsoDateTime(date: Date | string | number = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString().replace('T', ' ').substring(0, 16);
}

/**
 * Định dạng hiển thị ngày giờ an toàn cho bảng/chi tiết (fallback về '--' nếu rỗng hoặc null)
 * Giữ nguyên nếu đã ở định dạng dd/MM/yyyy hoặc dd/MM/yyyy HH:mm:ss
 */
export function formatDisplayDateTime(
  dateStr?: string | number | Date | null,
  fallback = '--',
): string {
  if (!dateStr) return fallback;
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    return dateStr;
  }
  const formatted = formatDateTime(dateStr);
  return formatted || fallback;
}

