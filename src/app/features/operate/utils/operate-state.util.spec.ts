import { describe, it, expect } from 'vitest';
import { getOperateStateTagColor, getOperateStateLabel } from './operate-state.util';

describe('operate-state.util', () => {
  describe('getOperateStateTagColor', () => {
    it('should return processing for ACTIVE or RUNNING', () => {
      expect(getOperateStateTagColor('ACTIVE')).toBe('processing');
      expect(getOperateStateTagColor('running')).toBe('processing');
    });

    it('should return error for INCIDENT or FAILED', () => {
      expect(getOperateStateTagColor('INCIDENT')).toBe('error');
      expect(getOperateStateTagColor('failed')).toBe('error');
    });

    it('should return success for COMPLETED', () => {
      expect(getOperateStateTagColor('COMPLETED')).toBe('success');
      expect(getOperateStateTagColor('completed')).toBe('success');
    });

    it('should return default for CANCELED, TERMINATED or unknown', () => {
      expect(getOperateStateTagColor('CANCELED')).toBe('default');
      expect(getOperateStateTagColor('CANCELLED')).toBe('default');
      expect(getOperateStateTagColor('TERMINATED')).toBe('default');
      expect(getOperateStateTagColor('UNKNOWN_STATE')).toBe('default');
    });
  });

  describe('getOperateStateLabel', () => {
    it('should return correct Vietnamese labels for known states', () => {
      expect(getOperateStateLabel('ACTIVE')).toBe('Đang chạy');
      expect(getOperateStateLabel('INCIDENT')).toBe('Sự cố (Incident)');
      expect(getOperateStateLabel('COMPLETED')).toBe('Hoàn thành');
      expect(getOperateStateLabel('CANCELED')).toBe('Đã hủy');
    });

    it('should return fallback for unknown state', () => {
      expect(getOperateStateLabel('CUSTOM_STATE')).toBe('CUSTOM_STATE');
      expect(getOperateStateLabel('')).toBe('Chưa xác định');
    });
  });
});
