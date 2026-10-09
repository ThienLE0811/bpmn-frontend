import { describe, it, expect } from 'vitest';
import {
  formatVnd,
  parseVnd,
  validateFormField,
  validateAllFormFields,
  AVAILABLE_FIELD_TYPES,
} from './dynamic-form.utils';
import { FormFieldDefinition } from '@core/models/form-schema.model';

describe('dynamic-form.utils', () => {
  describe('AVAILABLE_FIELD_TYPES', () => {
    it('should contain expected field types', () => {
      expect(AVAILABLE_FIELD_TYPES.length).toBeGreaterThan(0);
      const types = AVAILABLE_FIELD_TYPES.map((t) => t.value);
      expect(types).toContain('text');
      expect(types).toContain('number');
      expect(types).toContain('currency');
      expect(types).toContain('boolean');
    });
  });

  describe('formatVnd and parseVnd', () => {
    it('should format numbers to VND string correctly', () => {
      expect(formatVnd(null)).toBe('');
      expect(formatVnd(undefined)).toBe('');
      expect(formatVnd(NaN)).toBe('');
      const formatted = formatVnd(1000000);
      expect(formatted).toContain('1.000.000');
      expect(formatted).toContain('₫');
    });

    it('should parse VND string back to number', () => {
      expect(parseVnd('')).toBe(0);
      expect(parseVnd('1.000.000 ₫')).toBe(1000000);
      expect(parseVnd('500,000')).toBe(500000);
      expect(parseVnd('abc')).toBe(0);
    });
  });

  describe('validateFormField', () => {
    it('should validate required fields', () => {
      const field: FormFieldDefinition = {
        key: 'fullName',
        label: 'Họ và tên',
        type: 'text',
        required: true,
      };

      expect(validateFormField(field, null)).toContain('bắt buộc');
      expect(validateFormField(field, undefined)).toContain('bắt buộc');
      expect(validateFormField(field, '')).toContain('bắt buộc');
      expect(validateFormField(field, '   ')).toContain('bắt buộc');
      expect(validateFormField(field, 'Nguyen Van A')).toBeNull();
    });

    it('should validate number and currency min/max limits', () => {
      const numField: FormFieldDefinition = {
        key: 'amount',
        label: 'Số lượng',
        type: 'number',
        min: 10,
        max: 100,
      };

      expect(validateFormField(numField, 5)).toContain('tối thiểu');
      expect(validateFormField(numField, 150)).toContain('tối đa');
      expect(validateFormField(numField, 50)).toBeNull();

      const currField: FormFieldDefinition = {
        key: 'salary',
        label: 'Lương',
        type: 'currency',
        min: 1000000,
        max: 50000000,
      };

      expect(validateFormField(currField, 500000)).toContain('tối thiểu');
      expect(validateFormField(currField, 60000000)).toContain('tối đa');
      expect(validateFormField(currField, 20000000)).toBeNull();
    });
  });

  describe('validateAllFormFields', () => {
    it('should aggregate errors across all fields', () => {
      const fields: FormFieldDefinition[] = [
        { key: 'name', label: 'Tên', type: 'text', required: true },
        { key: 'age', label: 'Tuổi', type: 'number', min: 18 },
      ];

      const errors = validateAllFormFields(fields, { name: '', age: 10 });
      expect(errors['name']).toBeTruthy();
      expect(errors['age']).toBeTruthy();

      const validErrors = validateAllFormFields(fields, { name: 'Thien', age: 25 });
      expect(Object.keys(validErrors).length).toBe(0);
    });
  });
});
