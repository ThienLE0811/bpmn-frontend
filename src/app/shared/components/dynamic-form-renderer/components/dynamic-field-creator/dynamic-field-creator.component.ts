import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  FormFieldDefinition,
  FormFieldType,
} from '@core/models/form-schema.model';
import { AVAILABLE_FIELD_TYPES } from '../../utils/dynamic-form.utils';

@Component({
  selector: 'app-dynamic-field-creator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
  ],
  templateUrl: './dynamic-field-creator.component.html',
  styleUrl: './dynamic-field-creator.component.scss',
})
export class DynamicFieldCreatorComponent {
  private readonly message = inject(NzMessageService);

  readonly existingKeys = input<string[]>([]);
  readonly fieldCreated = output<FormFieldDefinition>();

  readonly isAddingField = signal<boolean>(false);
  readonly newFieldKey = signal<string>('');
  readonly newFieldLabel = signal<string>('');
  readonly newFieldType = signal<FormFieldType>('text');

  readonly availableFieldTypes = AVAILABLE_FIELD_TYPES;

  toggleAddField(): void {
    this.isAddingField.update((v) => !v);
    this.newFieldKey.set('');
    this.newFieldLabel.set('');
    this.newFieldType.set('text');
  }

  confirmAddField(): void {
    const key = this.newFieldKey().trim();
    if (!key) {
      this.message.warning('Vui lòng nhập tên mã biến (Variable Key).');
      return;
    }

    const IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!IDENTIFIER_REGEX.test(key)) {
      this.message.warning(
        'Mã biến không hợp lệ! Vui lòng chỉ dùng chữ cái, chữ số hoặc gạch dưới (VD: customerAge, discountRate).'
      );
      return;
    }

    const keys = this.existingKeys();
    if (keys.some((k) => k.toLowerCase() === key.toLowerCase())) {
      this.message.error(`Tên biến "${key}" đã tồn tại.`);
      return;
    }

    const type = this.newFieldType();
    const label = this.newFieldLabel().trim() || key;

    let defaultVal: any = '';
    if (type === 'boolean') defaultVal = true;
    if (type === 'number' || type === 'currency') defaultVal = 0;
    if (type === 'radio') defaultVal = 'option1';

    const newField: FormFieldDefinition = {
      key,
      label,
      type,
      defaultValue: defaultVal,
      colSpan: type === 'textarea' ? 24 : 12,
      options:
        type === 'radio'
          ? [
              { label: 'Lựa chọn 1', value: 'option1' },
              { label: 'Lựa chọn 2', value: 'option2' },
            ]
          : undefined,
    };

    this.fieldCreated.emit(newField);
    this.isAddingField.set(false);
  }
}
