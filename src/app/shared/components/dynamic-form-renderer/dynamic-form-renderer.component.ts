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
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';

import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  FormDefinition,
  FormFieldDefinition,
} from '@core/models/form-schema.model';
import { FormSchemaService } from '@core/services/state/form-schema.service';
import {
  formatVnd,
  parseVnd,
  validateFormField,
  validateAllFormFields,
} from './utils/dynamic-form.utils';
import { JsonFormEditorComponent } from './components/json-form-editor/json-form-editor.component';
import { DynamicFieldCreatorComponent } from './components/dynamic-field-creator/dynamic-field-creator.component';

@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TextFieldModule,
    NzGridModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzDatePickerModule,
    NzRadioModule,
    NzIconModule,
    NzTagModule,
    JsonFormEditorComponent,
    DynamicFieldCreatorComponent,
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
  readonly fieldErrors = signal<Record<string, string>>({});

  // Danh sách các trường động được người dùng thêm bổ sung
  readonly dynamicFields = signal<FormFieldDefinition[]>([]);

  // Gộp các trường từ Schema và các trường do người dùng tự thêm
  readonly allFields = computed<FormFieldDefinition[]>(() => {
    const s = this.schema();
    const schemaFields = s?.fields || [];
    const extra = this.dynamicFields();
    return [...schemaFields, ...extra];
  });

  // Danh sách tên mã biến của tất cả trường để kiểm tra trùng lặp
  readonly allFieldKeys = computed<string[]>(() =>
    this.allFields().map((f) => f.key)
  );

  // Set chứa key các trường động để tra cứu O(1) trong template
  readonly dynamicKeySet = computed<Set<string>>(
    () => new Set(this.dynamicFields().map((f) => f.key))
  );

  // Tiền tệ VND formatter & parser
  readonly formatterVnd = formatVnd;
  readonly parserVnd = parseVnd;

  readonly fieldCreator = viewChild<DynamicFieldCreatorComponent>(DynamicFieldCreatorComponent);

  openAddField(): void {
    this.fieldCreator()?.toggleAddField();
  }

  ngOnInit(): void {
    this.initializeFormData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const valuesChanged =
      !!changes['initialValues'] &&
      changes['initialValues'].currentValue !== this.formValues();
    if (changes['schema'] || valuesChanged) {
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
    this.checkAllFieldsValid(resolvedValues);
    this.emitChanges();
  }

  /**
   * Quét và cập nhật trạng thái lỗi của tất cả trường
   */
  checkAllFieldsValid(values?: Record<string, any>): boolean {
    const vals = values ?? this.formValues();
    const fields = this.allFields();
    const errors = validateAllFormFields(fields, vals);
    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
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

    const field = this.allFields().find((f) => f.key === key);
    if (field) {
      const err = validateFormField(field, value);
      this.fieldErrors.update((current) => {
        const next = { ...current };
        if (err) {
          next[key] = err;
        } else {
          delete next[key];
        }
        return next;
      });
    }

    this.jsonError.set(null);
    this.emitChanges();
  }

  /**
   * Chuyển đổi giữa chế độ Form trực quan và JSON text
   */
  switchMode(mode: 'form' | 'json'): void {
    if (mode === 'json') {
      this.updateJsonFromValues(this.formValues());
      this.activeMode.set(mode);
    } else {
      const success = this.applyJsonToForm(this.jsonText());
      if (!success) {
        this.message.error('Vui lòng sửa lỗi cú pháp JSON trước khi chuyển về biểu mẫu trực quan.');
        return;
      }
      this.activeMode.set(mode);
    }
  }

  /**
   * Khi người dùng gõ trực tiếp trong ô JSON
   */
  onJsonTextChange(raw: string): void {
    this.jsonText.set(raw);
    this.applyJsonToForm(raw);
  }

  /**
   * Thêm trường động mới do người dùng tạo
   */
  addDynamicField(field: FormFieldDefinition): void {
    this.dynamicFields.update((f) => [...f, field]);
    this.onFieldChange(field.key, field.defaultValue);
    this.message.success(`Đã thêm trường biến "${field.label}".`);
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
    this.fieldErrors.update((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    this.emitChanges();
    this.message.info(`Đã gỡ bỏ biến "${key}".`);
  }

  /**
   * Khôi phục toàn bộ biểu mẫu về giá trị mặc định của Schema
   */
  resetToDefaults(): void {
    this.dynamicFields.set([]);
    this.fieldErrors.set({});
    this.initializeFormData();
    this.message.info('Đã khôi phục các trường và giá trị về mặc định.');
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
    } catch {
      this.message.error('Không thể định dạng do lỗi cú pháp JSON.');
    }
  }

  /**
   * Xóa trắng dữ liệu JSON
   */
  clearJson(): void {
    this.jsonText.set('{}');
    this.applyJsonToForm('{}');
    this.message.info('Đã làm trống dữ liệu JSON.');
  }

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
      this.checkAllFieldsValid(parsed);
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
    const isFieldsValid = Object.keys(this.fieldErrors()).length === 0;
    const isJsonValid = this.jsonError() === null;
    this.valuesChange.emit(vals);
    this.validityChange.emit(isFieldsValid && isJsonValid);
  }
}
