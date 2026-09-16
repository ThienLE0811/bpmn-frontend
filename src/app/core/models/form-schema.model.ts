export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'boolean'
  | 'select'
  | 'radio'
  | 'date';

export interface FormFieldOption {
  label: string;
  value: any;
  description?: string;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: FormFieldOption[];
  colSpan?: number; // 12: nửa hàng, 24: nguyên hàng trong grid
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  fields: FormFieldDefinition[];
  category?: string;
}
