import { Signal, WritableSignal, computed, signal } from '@angular/core';

export interface ListFilter<T extends object> {
  /** Giá trị bộ lọc hiện tại - dùng trực tiếp với `[ngModel]` / `.set()` / `.update()`. */
  readonly model: WritableSignal<T>;
  /** Số trường đang khác giá trị mặc định. */
  readonly activeCount: Signal<number>;
  readonly isFiltered: Signal<boolean>;
  patch(changes: Partial<T>): void;
  reset(): void;
}

/** Chuỗi được trim, null/undefined coi như chuỗi rỗng - để '  ' hay null không bị tính là đang lọc. */
function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * State bộ lọc dùng chung cho các trang danh sách: một trường được tính là "đang lọc"
 * khi giá trị (đã chuẩn hóa) khác giá trị mặc định truyền vào.
 */
export function createListFilter<T extends object>(defaults: T): ListFilter<T> {
  const model = signal<T>({ ...defaults });
  const keys = Object.keys(defaults) as (keyof T)[];

  const activeCount = computed(() => {
    const current = model();
    return keys.filter((k) => normalize(current[k]) !== normalize(defaults[k])).length;
  });

  return {
    model,
    activeCount,
    isFiltered: computed(() => activeCount() > 0),
    patch: (changes) => model.update((m) => ({ ...m, ...changes })),
    reset: () => model.set({ ...defaults }),
  };
}
