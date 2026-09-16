/**
 * Tiện ích parse JSON an toàn, trả về đối tượng kết quả phân nhánh mà không ném ngoại lệ không mong muốn
 */
export function safeJsonParse<T = Record<string, unknown>>(
  rawJson: string | null | undefined,
  fallbackValue: T = {} as T,
): { success: true; data: T } | { success: false; error: string } {
  if (!rawJson || !rawJson.trim()) {
    return { success: true, data: fallbackValue };
  }
  try {
    const data = JSON.parse(rawJson.trim()) as T;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Cú pháp JSON không hợp lệ.',
    };
  }
}
