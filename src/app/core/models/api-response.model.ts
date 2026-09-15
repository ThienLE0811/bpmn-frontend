export interface ApiErrorDetail {
  errorCode: string | number;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  status: 'OK' | 'FAIL';
  data: T;
  errors?: ApiErrorDetail | null;
}

/**
 * Cấu trúc phân trang trả về từ backend cho các endpoint GET list:
 * {
 *   "content": [...],
 *   "page": 1,
 *   "size": 20,
 *   "totalElements": 8,
 *   "totalPages": 4
 * }
 */
export interface PageData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type PageResponse<T> = PageData<T>;

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PageMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Trích xuất danh sách mảng từ response data.
 * Hỗ trợ an toàn cả dạng PageData { content: [...] } lẫn mảng thuần T[] (dữ liệu mock/fallback).
 */
export function extractContent<T>(data: PageData<T> | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && 'content' in data && Array.isArray((data as PageData<T>).content)) {
    return (data as PageData<T>).content;
  }
  return [];
}

/**
 * Trích xuất metadata phân trang từ response.
 */
export function extractPageMetadata<T>(
  data: PageData<T> | T[] | null | undefined,
  fallbackLength = 0,
): PageMetadata {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'content' in data) {
    const p = data as PageData<T>;
    return {
      page: p.page ?? 1,
      size: p.size ?? 20,
      totalElements: p.totalElements ?? (Array.isArray(p.content) ? p.content.length : 0),
      totalPages: p.totalPages ?? 1,
    };
  }
  const len = Array.isArray(data) ? data.length : fallbackLength;
  return {
    page: 1,
    size: len || 20,
    totalElements: len,
    totalPages: 1,
  };
}

