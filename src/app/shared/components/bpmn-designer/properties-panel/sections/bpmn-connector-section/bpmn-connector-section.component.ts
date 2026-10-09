import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BpmnElementProperties, ConnectorParam } from '../../../bpmn-designer.models';
import { BpmnModelerService } from '../../../services/bpmn-modeler.service';

@Component({
  selector: 'app-bpmn-connector-section',
  standalone: true,
  imports: [FormsModule, NzIconModule],
  templateUrl: './bpmn-connector-section.component.html',
  styleUrl: './bpmn-connector-section.component.scss',
})
export class BpmnConnectorSectionComponent {
  private readonly modeler = inject(BpmnModelerService);

  readonly element = input.required<BpmnElementProperties>();
  readonly connectors = input<string[]>([]);

  /** Danh sách connector từ API, giữ thêm connectorId đang gán trong XML để không bị mất khi API không trả về. */
  protected readonly connectorOptions = computed(() => {
    const current = this.element().connectorId;
    const options = this.connectors();
    return current && !options.includes(current) ? [...options, current] : options;
  });

  /**
   * Connector config lives in `extensionElements > camunda:connector`. Choosing "no connector"
   * drops the whole element; parameters with a blank name are kept in the sidebar only (so a
   * freshly added row survives) and never written to the XML.
   */
  protected updateConnector(changes: {
    connectorId?: string;
    connectorInputs?: ConnectorParam[];
    connectorOutputs?: ConnectorParam[];
  }): void {
    const currentSel = this.element();
    const connectorId = changes.connectorId ?? currentSel.connectorId ?? '';
    const inputs = connectorId ? (changes.connectorInputs ?? currentSel.connectorInputs ?? []) : [];
    const outputs = connectorId
      ? (changes.connectorOutputs ?? currentSel.connectorOutputs ?? [])
      : [];

    this.modeler.editSelected(
      { connectorId, connectorInputs: inputs, connectorOutputs: outputs },
      (el: any) => this.writeConnector(el, connectorId, inputs, outputs),
    );
  }

  protected addConnectorParam(kind: 'connectorInputs' | 'connectorOutputs'): void {
    const currentSel = this.element();
    // Blank rows are not written to the XML, so only the sidebar state changes here.
    this.modeler.selectedElement.set({
      ...currentSel,
      [kind]: [...(currentSel[kind] ?? []), { name: '', value: '' }],
    });
  }

  protected updateConnectorParam(
    kind: 'connectorInputs' | 'connectorOutputs',
    index: number,
    patch: Partial<ConnectorParam>,
  ): void {
    const rows = (this.element()[kind] ?? []).map((p, i) => (i === index ? { ...p, ...patch } : p));
    this.updateConnector({ [kind]: rows });
  }

  protected removeConnectorParam(kind: 'connectorInputs' | 'connectorOutputs', index: number): void {
    const rows = (this.element()[kind] ?? []).filter((_, i) => i !== index);
    this.updateConnector({ [kind]: rows });
  }

  private writeConnector(
    element: any,
    connectorId: string,
    inputs: ConnectorParam[],
    outputs: ConnectorParam[],
  ): void {
    const bpmnFactory = this.modeler.get('bpmnFactory');
    const modeling = this.modeler.get('modeling');
    const bo = element.businessObject;
    const extension = bo.extensionElements;
    const otherValues = (extension?.values ?? []).filter((v: any) => v.$type !== 'camunda:Connector');

    const values = [...otherValues];
    if (connectorId) {
      const toParams = (type: string, rows: ConnectorParam[]) =>
        rows
          .filter((p) => p.name.trim())
          .map((p) => bpmnFactory.create(type, { name: p.name.trim(), value: p.value }));
      const inputOutput = bpmnFactory.create('camunda:InputOutput', {
        inputParameters: toParams('camunda:InputParameter', inputs),
        outputParameters: toParams('camunda:OutputParameter', outputs),
      });
      const connector = bpmnFactory.create('camunda:Connector', { connectorId, inputOutput });
      inputOutput.$parent = connector;
      [...inputOutput.inputParameters, ...inputOutput.outputParameters].forEach(
        (p: any) => (p.$parent = inputOutput),
      );
      values.push(connector);
    }

    if (!extension) {
      if (!values.length) return;
      const created = bpmnFactory.create('bpmn:ExtensionElements', { values });
      created.$parent = bo;
      values.forEach((v: any) => (v.$parent = created));
      modeling.updateProperties(element, { extensionElements: created });
    } else if (values.length) {
      values.forEach((v: any) => (v.$parent = extension));
      modeling.updateModdleProperties(element, extension, { values });
    } else {
      modeling.updateProperties(element, { extensionElements: undefined });
    }
  }
}
