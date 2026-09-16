/**
 * Tiện ích generic so sánh sắp xếp cho bảng dữ liệu (Ng-Zorro nzSortFn hoặc JavaScript Array.sort)
 */

/**
 * So sánh 2 đối tượng theo trường kiểu chuỗi (String), tự động xử lý null/undefined và khoảng trắng
 */
export function sortByString<T>(key: keyof T, order: 'asc' | 'desc' = 'asc'): (a: T, b: T) => number {
  return (a: T, b: T): number => {
    const valA = String(a[key] ?? '').trim();
    const valB = String(b[key] ?? '').trim();
    const res = valA.localeCompare(valB);
    return order === 'asc' ? res : -res;
  };
}

/**
 * So sánh 2 đối tượng theo trường kiểu số (Number), tự động xử lý null/undefined
 */
export function sortByNumber<T>(key: keyof T, order: 'asc' | 'desc' = 'asc'): (a: T, b: T) => number {
  return (a: T, b: T): number => {
    const valA = Number(a[key] ?? 0);
    const valB = Number(b[key] ?? 0);
    return order === 'asc' ? valA - valB : valB - valA;
  };
}

/**
 * So sánh 2 đối tượng theo trường kiểu ngày tháng (Date/string ISO), tự động xử lý null/undefined
 */
export function sortByDate<T>(key: keyof T, order: 'asc' | 'desc' = 'asc'): (a: T, b: T) => number {
  return (a: T, b: T): number => {
    const timeA = a[key] ? new Date(a[key] as unknown as string).getTime() : 0;
    const timeB = b[key] ? new Date(b[key] as unknown as string).getTime() : 0;
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  };
}
