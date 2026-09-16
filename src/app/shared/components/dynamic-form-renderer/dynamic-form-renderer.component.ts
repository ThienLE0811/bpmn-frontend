import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  FormDefinition,
  FormFieldDefinition,
  FormFieldType,
} from '@core/models/form-schema.model';
import { FormSchemaService } from '@core/services/state/form-schema.service';

@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzGridModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzDatePickerModule,
    NzRadioModule,
    NzIconModule,
    NzButtonModule,
    NzAlertModule,
    NzTagModule,
    NzTooltipModule,
  ],
  templateUrl: './dynamic-form-renderer.component.html',
  styleUrl: './dynamic-form-renderer.component.scss',
})
export class DynamicFormRendererComponent implements OnInit, OnChanges {
  private readonly formSchemaService = inject(FormSchemaService);
  private readonly message = inject(NzMessageService);

  // Inputs
  readonly schema = input<FormDefinition | null>(null);
  readonly initialValues = input<Record<string, unknown> | null>(null);
  readonly readOnly = input<boolean>(false);
  readonly showModeSwitch = input<boolean>(true);
  readonly allowAddField = input<boolean>(true);

  // Outputs
  readonly valuesChange = output<Record<string, unknown>>();
  readonly validityChange = output<boolean>();

  // State
  readonly activeMode = signal<'form' | 'json'>('form');
  readonly formValues = signal<Record<string, any>>({});
  readonly jsonText = signal<string>('{}');
  readonly jsonError = signal<string | null>(null);

  // Danh sách các trường động được người dùng thêm bổ sung
  readonly dynamicFields = signal<FormFieldDefinition[]>([]);
  readonly isAddingField = signal<boolean>(false);
  readonly newFieldKey = signal<string>('');
  readonly newFieldLabel = signal<string>('');
  readonly newFieldType = signal<FormFieldType>('text');

  // Gộp các trường từ Schema và các trường do người dùng tự thêm
  readonly allFields = computed<FormFieldDefinition[]>(() => {
    const s = this.schema();
    const schemaFields = s?.fields || [];
    const extra = this.dynamicFields();
    return [...schemaFields, ...extra];
  });

  readonly availableFieldTypes: Array<{ label: string; value: FormFieldType }> = [
    { label: 'Văn bản (Text)', value: 'text' },
    { label: 'Đoạn văn (Textarea)', value: 'textarea' },
    { label: 'Số (Number)', value: 'number' },
    { label: 'Tiền tệ (VNĐ)', value: 'currency' },
    { label: 'Bật/Tắt (Boolean Switch)', value: 'boolean' },
    { label: 'Ngày tháng (Date)', value: 'date' },
  ];

  // Tiền tệ VND formatter & parser
  formatterVnd = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '0 ₫';
    return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
  };

  parserVnd = (value: string): number => {
    const clean = value.replace(/\D/g, '');
    return clean ? Number(clean) : 0;
  };

  ngOnInit(): void {
    this.initializeFormData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['initialValues']) {
      this.initializeFormData();
    }
  }

  /**
   * Khởi tạo dữ liệu form từ Schema và initialValues
   */
  initializeFormData(): void {
    const s = this.schema();
    const initVals = this.initialValues() || {};

    let resolvedValues: Record<string, any> = {};

    if (s) {
      resolvedValues = this.formSchemaService.extractFormValues(s, initVals);
    } else {
      resolvedValues = { ...initVals };
    }

    // Tự động phát hiện nếu có key trong initialValues không nằm trong schema -> đưa vào dynamicFields
    if (s && initVals) {
      const existingKeys = new Set(s.fields.map((f) => f.key));
      const extras: FormFieldDefinition[] = [];

      for (const [k, v] of Object.entries(initVals)) {
        if (!existingKeys.has(k)) {
          extras.push({
            key: k,
            label: k,
            type: typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? 'number' : 'text',
            defaultValue: v,
            colSpan: 12,
          });
        }
      }
      this.dynamicFields.set(extras);
    }

    this.formValues.set(resolvedValues);
    this.updateJsonFromValues(resolvedValues);
    this.emitChanges();
  }

  /**
   * Cập nhật khi một trường trong Form thay đổi
   */
  onFieldChange(key: string, value: any): void {
    this.formValues.update((current) => {
      const updated = { ...current, [key]: value };
      this.updateJsonFromValues(updated);
      return updated;
    });

    this.jsonError.set(null);
    this.emitChanges();
  }

  /**
   * Chuyển đổi giữa chế độ Form trực quan và JSON text
   */
  switchMode(mode: 'form' | 'json'): void {
    if (mode === 'json') {
      this.updateJsonFromValues(this.formValues());
    } else {
      // Khi quay lại Form, thử parse JSON
      this.applyJsonToForm(this.jsonText());
    }
    this.activeMode.set(mode);
  }

  /**
   * Khi người dùng gõ trực tiếp trong ô JSON
   */
  onJsonTextChange(raw: string): void {
    this.jsonText.set(raw);
    this.applyJsonToForm(raw);
  }

  /**
   * Parse JSON và đồng bộ vào formValues
   */
  private applyJsonToForm(jsonString: string): boolean {
    try {
      if (!jsonString.trim()) {
        this.jsonError.set('Dữ liệu JSON không được để trống.');
        this.validityChange.emit(false);
        return false;
      }

      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        this.jsonError.set('Dữ liệu biến quy trình phải là một JSON Object (cặp key - value).');
        this.validityChange.emit(false);
        return false;
      }

      this.jsonError.set(null);
      this.formValues.set(parsed);
      this.emitChanges();
      return true;
    } catch (e: any) {
      this.jsonError.set(`Cú pháp JSON không hợp lệ: ${e?.message || 'Lỗi định dạng'}`);
      this.validityChange.emit(false);
      return false;
    }
  }

  private updateJsonFromValues(vals: Record<string, any>): void {
    try {
      this.jsonText.set(JSON.stringify(vals, null, 2));
    } catch {
      this.jsonText.set('{}');
    }
  }

  private emitChanges(): void {
    const vals = this.formValues();
    this.valuesChange.emit(vals);
    this.validityChange.emit(this.jsonError() === null);
  }

  /**
   * Mở form thêm biến tùy chỉnh
   */
  toggleAddField(): void {
    this.isAddingField.update((v) => !v);
    this.newFieldKey.set('');
    this.newFieldLabel.set('');
    this.newFieldType.set('text');
  }

  /**
   * Xác nhận thêm biến mới
   */
  confirmAddField(): void {
    const key = this.newFieldKey().trim();
    if (!key) {
      this.message.warning('Vui lòng nhập tên mã biến (Variable Key).');
      return;
    }

    // Kiểm tra trùng key
    const all = this.allFields();
    if (all.some((f) => f.key.toLowerCase() === key.toLowerCase())) {
      this.message.error(`Tên biến "${key}" đã tồn tại.`);
      return;
    }

    const type = this.newFieldType();
    const label = this.newFieldLabel().trim() || key;

    let defaultVal: any = '';
    if (type === 'boolean') defaultVal = true;
    if (type === 'number' || type === 'currency') defaultVal = 0;

    const newField: FormFieldDefinition = {
      key,
      label,
      type,
      defaultValue: defaultVal,
      colSpan: type === 'textarea' ? 24 : 12,
    };

    this.dynamicFields.update((f) => [...f, newField]);
    this.onFieldChange(key, defaultVal);
    this.isAddingField.set(false);
    this.message.success(`Đã thêm trường biến "${label}".`);
  }

  /**
   * Xóa trường biến động
   */
  removeDynamicField(key: string, event: Event): void {
    event.stopPropagation();
    this.dynamicFields.update((f) => f.filter((item) => item.key !== key));
    this.formValues.update((current) => {
      const next = { ...current };
      delete next[key];
      this.updateJsonFromValues(next);
      return next;
    });
    this.emitChanges();
    this.message.info(`Đã gỡ bỏ biến "${key}".`);
  }

  /**
   * Sao chép JSON vào clipboard
   */
  copyJson(): void {
    navigator.clipboard.writeText(this.jsonText()).then(() => {
      this.message.success('Đã sao chép chuỗi JSON vào bộ nhớ đệm!');
    });
  }

  /**
   * Format lại chuỗi JSON
   */
  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText());
      this.jsonText.set(JSON.stringify(parsed, null, 2));
      this.jsonError.set(null);
    } catch (e: any) {
      this.message.error('Không thể định dạng do lỗi cú pháp JSON.');
    }
  }
}
