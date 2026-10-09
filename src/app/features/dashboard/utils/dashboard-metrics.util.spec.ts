import { describe, it, expect } from 'vitest';
import {
  calculateStatusCounts,
  calculateRate,
  calculateCategoryDistribution,
} from './dashboard-metrics.util';

describe('dashboard-metrics.util', () => {
  describe('calculateStatusCounts', () => {
    it('should correctly count items across all statuses', () => {
      const items = [
        { status: 'PUBLISHED' },
        { status: 'PUBLISHED' },
        { status: 'DRAFT' },
        { status: 'ARCHIVED' },
      ];

      const counts = calculateStatusCounts(items);
      expect(counts.total).toBe(4);
      expect(counts.published).toBe(2);
      expect(counts.draft).toBe(1);
      expect(counts.archived).toBe(1);
    });

    it('should handle empty or null items gracefully', () => {
      const counts = calculateStatusCounts([]);
      expect(counts.total).toBe(0);
      expect(counts.published).toBe(0);
      expect(counts.draft).toBe(0);
      expect(counts.archived).toBe(0);
    });
  });

  describe('calculateRate', () => {
    it('should calculate percentages rounded correctly', () => {
      expect(calculateRate(5, 10)).toBe(50);
      expect(calculateRate(1, 3)).toBe(33);
      expect(calculateRate(2, 3)).toBe(67);
      expect(calculateRate(0, 10)).toBe(0);
    });

    it('should return 0 when total is 0 or negative', () => {
      expect(calculateRate(5, 0)).toBe(0);
      expect(calculateRate(5, -1)).toBe(0);
    });
  });

  describe('calculateCategoryDistribution', () => {
    it('should group items by category', () => {
      const procs = [
        { category: 'HR' },
        { category: 'HR' },
        { category: 'FINANCE' },
        { category: undefined },
      ];

      const res = calculateCategoryDistribution(procs);
      expect(res.categories).toContain('HR');
      expect(res.categories).toContain('FINANCE');
      expect(res.categories).toContain('GENERAL');

      const hrIndex = res.categories.indexOf('HR');
      expect(res.counts[hrIndex]).toBe(2);

      const finIndex = res.categories.indexOf('FINANCE');
      expect(res.counts[finIndex]).toBe(1);

      const genIndex = res.categories.indexOf('GENERAL');
      expect(res.counts[genIndex]).toBe(1);
    });

    it('should handle empty process lists', () => {
      const res = calculateCategoryDistribution([]);
      expect(res.categories.length).toBe(0);
      expect(res.counts.length).toBe(0);
    });
  });
});
