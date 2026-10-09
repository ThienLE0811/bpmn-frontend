export interface StatusCounts {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

/**
 * Tính toán số lượng theo từng trạng thái (PUBLISHED, DRAFT, ARCHIVED)
 */
export function calculateStatusCounts<T extends { status?: string }>(items: T[]): StatusCounts {
  const safeItems = items || [];
  return {
    total: safeItems.length,
    published: safeItems.filter((i) => i.status === 'PUBLISHED').length,
    draft: safeItems.filter((i) => i.status === 'DRAFT').length,
    archived: safeItems.filter((i) => i.status === 'ARCHIVED').length,
  };
}

/**
 * Tính tỷ lệ phần trăm (0 - 100%) làm tròn
 */
export function calculateRate(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export interface CategoryDistribution {
  categories: string[];
  counts: number[];
}

/**
 * Gom nhóm quy trình theo phân hệ / lĩnh vực (category)
 */
export function calculateCategoryDistribution<T extends { category?: string }>(
  processes: T[]
): CategoryDistribution {
  const map = new Map<string, number>();
  for (const p of processes || []) {
    const cat = p.category || 'GENERAL';
    map.set(cat, (map.get(cat) || 0) + 1);
  }
  const categories: string[] = [];
  const counts: number[] = [];
  map.forEach((count, cat) => {
    categories.push(cat);
    counts.push(count);
  });
  return { categories, counts };
}
