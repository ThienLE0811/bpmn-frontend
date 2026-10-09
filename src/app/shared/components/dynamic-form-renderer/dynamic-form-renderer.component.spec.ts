import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicFormRendererComponent } from './dynamic-form-renderer.component';
import { FormSchemaService } from '@core/services/state/form-schema.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormDefinition } from '@core/models/form-schema.model';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('DynamicFormRendererComponent', () => {
  let fixture: ComponentFixture<DynamicFormRendererComponent>;
  let component: DynamicFormRendererComponent;
  let mockMessage: {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  const testSchema: FormDefinition = {
    id: 'test_form',
    name: 'Biểu mẫu kiểm tra',
    fields: [
      { key: 'customerName', label: 'Tên khách hàng', type: 'text', required: true },
      { key: 'age', label: 'Tuổi', type: 'number', min: 18 },
      { key: 'isVip', label: 'Khách VIP', type: 'boolean', defaultValue: false },
    ],
  };

  beforeEach(async () => {
    mockMessage = {
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DynamicFormRendererComponent],
      providers: [
        FormSchemaService,
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormRendererComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('schema', testSchema);
    fixture.componentRef.setInput('initialValues', { customerName: 'Nguyễn Văn A', age: 25 });
    fixture.detectChanges();
  });

  it('should create and initialize values from inputs', () => {
    expect(component).toBeTruthy();
    expect(component.formValues()['customerName']).toBe('Nguyễn Văn A');
    expect(component.formValues()['age']).toBe(25);
    expect(component.formValues()['isVip']).toBe(false);
  });

  it('should switch between form and json modes', () => {
    expect(component.activeMode()).toBe('form');

    component.switchMode('json');
    expect(component.activeMode()).toBe('json');
    expect(component.jsonText()).toContain('customerName');

    component.switchMode('form');
    expect(component.activeMode()).toBe('form');
  });

  it('should validate required fields properly', () => {
    component.onFieldChange('customerName', '');
    expect(component.fieldErrors()['customerName']).toBeTruthy();

    component.onFieldChange('customerName', 'Trần B');
    expect(component.fieldErrors()['customerName']).toBeFalsy();
  });

  it('should allow adding dynamic fields', () => {
    component.addDynamicField({
      key: 'extraNote',
      label: 'Ghi chú thêm',
      type: 'textarea',
      defaultValue: '',
      colSpan: 24,
    });
    expect(component.dynamicFields().some((f) => f.key === 'extraNote')).toBe(true);
    expect(component.allFields().some((f) => f.key === 'extraNote')).toBe(true);
    expect(component.allFieldKeys()).toContain('extraNote');
  });

  it('should allow removing dynamic fields', () => {
    component.addDynamicField({
      key: 'tempField',
      label: 'Tạm thời',
      type: 'text',
      defaultValue: '123',
    });
    expect(component.dynamicFields().some((f) => f.key === 'tempField')).toBe(true);

    const dummyEvent = new MouseEvent('click');
    component.removeDynamicField('tempField', dummyEvent);
    expect(component.dynamicFields().some((f) => f.key === 'tempField')).toBe(false);
  });
});
