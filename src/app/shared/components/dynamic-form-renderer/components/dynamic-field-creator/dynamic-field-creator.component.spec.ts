import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicFieldCreatorComponent } from './dynamic-field-creator.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { provideTestIcons } from '@shared/testing/test-icon-provider';
import { FormFieldDefinition } from '@core/models/form-schema.model';

describe('DynamicFieldCreatorComponent', () => {
  let fixture: ComponentFixture<DynamicFieldCreatorComponent>;
  let component: DynamicFieldCreatorComponent;
  let mockMessage: {
    warning: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockMessage = {
      warning: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DynamicFieldCreatorComponent],
      providers: [
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFieldCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.isAddingField()).toBe(false);
  });

  it('should toggle adding field mode', () => {
    component.toggleAddField();
    expect(component.isAddingField()).toBe(true);

    component.toggleAddField();
    expect(component.isAddingField()).toBe(false);
  });

  it('should warn when key is empty or invalid', () => {
    component.isAddingField.set(true);
    component.newFieldKey.set('');
    component.confirmAddField();
    expect(mockMessage.warning).toHaveBeenCalledWith(
      expect.stringContaining('Vui lòng nhập tên mã biến')
    );

    mockMessage.warning.mockClear();
    component.newFieldKey.set('invalid-key-name!');
    component.confirmAddField();
    expect(mockMessage.warning).toHaveBeenCalledWith(
      expect.stringContaining('Mã biến không hợp lệ')
    );
  });

  it('should prevent duplicate key', () => {
    fixture.componentRef.setInput('existingKeys', ['customerName', 'age']);
    fixture.detectChanges();

    component.isAddingField.set(true);
    component.newFieldKey.set('customername');
    component.confirmAddField();
    expect(mockMessage.error).toHaveBeenCalledWith(
      expect.stringContaining('đã tồn tại')
    );
  });

  it('should emit fieldCreated when key and options are valid', () => {
    let createdField: FormFieldDefinition | undefined;
    component.fieldCreated.subscribe((field) => (createdField = field));

    fixture.componentRef.setInput('existingKeys', ['customerName']);
    component.isAddingField.set(true);
    component.newFieldKey.set('discountCode');
    component.newFieldLabel.set('Mã giảm giá');
    component.newFieldType.set('text');

    component.confirmAddField();
    expect(createdField).toBeTruthy();
    expect(createdField?.key).toBe('discountCode');
    expect(createdField?.label).toBe('Mã giảm giá');
    expect(createdField?.type).toBe('text');
    expect(component.isAddingField()).toBe(false);
  });
});
