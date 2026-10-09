import { FormFieldDefinition, FormFieldType } from '@core/models/form-schema.model';

export const AVAILABLE_FIELD_TYPES: Array<{ label: string; value: FormFieldType }> = [
  { label: 'Văn bản (Text)', value: 'text' },
  { label: 'Đoạn văn (Textarea)', value: 'textarea' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Tiền tệ (VNĐ)', value: 'currency' },
  { label: 'Bật/Tắt (Boolean Switch)', value: 'boolean' },
  { label: 'Chọn một (Radio)', value: 'radio' },
  { label: 'Ngày tháng (Date)', value: 'date' },
];

/**
 * Định dạng số thành chuỗi tiền tệ VND (vi-VN ₫)
 */
export function formatVnd(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

/**
 * Phân tích chuỗi số/tiền tệ thành số
 */
export function parseVnd(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/\D/g, '');
  return clean ? Number(clean) : 0;
}

/**
 * Kiểm tra tính hợp lệ của một trường form
 */
export function validateFormField(field: FormFieldDefinition, value: any): string | null {
  if (field.required) {
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return `Trường "${field.label || field.key}" là bắt buộc.`;
    }
  }

  if (field.type === 'number' || field.type === 'currency') {
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        return 'Giá trị phải là chữ số hợp lệ.';
      }
      if (field.min !== undefined && num < field.min) {
        const minText = field.type === 'currency' ? formatVnd(field.min) : field.min;
        return `Giá trị tối thiểu là ${minText}.`;
      }
      if (field.max !== undefined && num > field.max) {
        const maxText = field.type === 'currency' ? formatVnd(field.max) : field.max;
        return `Giá trị tối đa là ${maxText}.`;
      }
    }
  }

  return null;
}

/**
 * Kiểm tra tất cả các trường và trả về dictionary các lỗi
 */
export function validateAllFormFields(
  fields: FormFieldDefinition[],
  values: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const err = validateFormField(f, values[f.key]);
    if (err) {
      errors[f.key] = err;
    }
  }
  return errors;
}
