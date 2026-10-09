import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BpmnConnectorSectionComponent } from './bpmn-connector-section.component';
import { BpmnModelerService } from '../../../services/bpmn-modeler.service';
import { BpmnElementProperties } from '../../../bpmn-designer.models';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('BpmnConnectorSectionComponent', () => {
  let fixture: ComponentFixture<BpmnConnectorSectionComponent>;
  let component: BpmnConnectorSectionComponent;
  let mockModeler: {
    selectedElement: ReturnType<typeof signal<BpmnElementProperties | null>>;
    editSelected: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  const defaultElement: BpmnElementProperties = {
    id: 'ServiceTask_1',
    name: 'Gửi SMS',
    type: 'bpmn:ServiceTask',
    documentation: '',
    connectorId: 'http-connector',
    connectorInputs: [{ name: 'url', value: 'https://api.sms.local/send' }],
    connectorOutputs: [{ name: 'status', value: '${response.statusCode}' }],
  };

  beforeEach(async () => {
    mockModeler = {
      selectedElement: signal<BpmnElementProperties | null>(defaultElement),
      editSelected: vi.fn(),
      get: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BpmnConnectorSectionComponent],
      providers: [
        { provide: BpmnModelerService, useValue: mockModeler },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnConnectorSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('element', defaultElement);
    fixture.componentRef.setInput('connectors', ['http-connector', 'mail-connector']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute connectorOptions combining inputs and element connectorId', () => {
    expect((component as any).connectorOptions()).toEqual(['http-connector', 'mail-connector']);
  });

  it('should call editSelected when updating connector selection', () => {
    (component as any).updateConnector({ connectorId: 'mail-connector' });
    expect(mockModeler.editSelected).toHaveBeenCalledWith(
      expect.objectContaining({ connectorId: 'mail-connector' }),
      expect.any(Function),
    );
  });

  it('should add a blank connector parameter to sidebar state', () => {
    (component as any).addConnectorParam('connectorInputs');
    const updated = mockModeler.selectedElement();
    expect(updated?.connectorInputs?.length).toBe(2);
    expect(updated?.connectorInputs?.[1]).toEqual({ name: '', value: '' });
  });

  it('should remove a connector parameter', () => {
    (component as any).removeConnectorParam('connectorInputs', 0);
    expect(mockModeler.editSelected).toHaveBeenCalledWith(
      expect.objectContaining({ connectorInputs: [] }),
      expect.any(Function),
    );
  });
});
