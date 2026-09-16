import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormSchemaService } from './form-schema.service';

describe('FormSchemaService', () => {
  let service: FormSchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormSchemaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return predefined registered forms', () => {
    const forms = service.getRegisteredForms();
    expect(forms.length).toBeGreaterThan(0);
    const orderForm = forms.find((f) => f.id === 'form_order_fulfillment');
    expect(orderForm).toBeDefined();
    expect(orderForm?.fields.length).toBeGreaterThan(0);
  });

  it('should resolve form for order task correctly', () => {
    const form = service.getFormForTask('Task_PackShip');
    expect(form.id).toBe('form_order_fulfillment');
    expect(form.fields.some((f) => f.key === 'trackingCode')).toBe(true);
  });

  it('should resolve form for loan approval task correctly', () => {
    const form = service.getFormForTask('Task_ReviewApplication');
    expect(form.id).toBe('form_loan_approval');
    expect(form.fields.some((f) => f.key === 'approved')).toBe(true);
  });

  it('should auto-infer schema from arbitrary variables', () => {
    const variables = {
      approved: true,
      amount: 15000000,
      customerNote: 'Khách hàng yêu cầu giao nhanh',
    };
    const inferred = service.inferSchemaFromVariables(variables, 'Inferred Form');
    expect(inferred.fields.length).toBe(3);

    const approvedField = inferred.fields.find((f) => f.key === 'approved');
    expect(approvedField?.type).toBe('boolean');

    const amountField = inferred.fields.find((f) => f.key === 'amount');
    expect(amountField?.type).toBe('currency');

    const noteField = inferred.fields.find((f) => f.key === 'customerNote');
    expect(noteField?.type).toBe('textarea');
  });

  it('should extract values combining schema defaults and existing values', () => {
    const form = service.getFormById('form_order_fulfillment')!;
    const values = service.extractFormValues(form, {
      trackingCode: 'CUSTOM-TRACKING-123',
    });
    expect(values['trackingCode']).toBe('CUSTOM-TRACKING-123');
    expect(values['carrier']).toBe('VNPOST');
    expect(values['isQualityChecked']).toBe(true);
  });
});
