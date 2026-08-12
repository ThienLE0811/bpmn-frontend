import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import BpmnModeler from 'bpmn-js/lib/Modeler';

export interface BpmnElementProperties {
  id: string;
  name: string;
  type: string;
  documentation: string;
}

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Bắt đầu quy trình">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Xử lý hồ sơ">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Phê duyệt?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Pass</bpmn:outgoing>
      <bpmn:outgoing>Flow_Reject</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_Approved" name="Phê duyệt và thông báo">
      <bpmn:incoming>Flow_Pass</bpmn:incoming>
      <bpmn:outgoing>Flow_End1</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Rejected" name="Từ chối và phản hồi">
      <bpmn:incoming>Flow_Reject</bpmn:incoming>
      <bpmn:outgoing>Flow_End2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Quy trình hoàn tất">
      <bpmn:incoming>Flow_End1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_2" name="Quy trình bị hủy">
      <bpmn:incoming>Flow_End2</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_Pass" name="Đạt" sourceRef="Gateway_1" targetRef="Task_Approved" />
    <bpmn:sequenceFlow id="Flow_Reject" name="Không đạt" sourceRef="Gateway_1" targetRef="Task_Rejected" />
    <bpmn:sequenceFlow id="Flow_End1" sourceRef="Task_Approved" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_End2" sourceRef="Task_Rejected" targetRef="EndEvent_2" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="156" y="203" width="85" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_Task1_di" bpmnElement="Task_1">
        <dc:Bounds x="270" y="138" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">
        <dc:Bounds x="445" y="153" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="441" y="123" width="58" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_TaskApp_di" bpmnElement="Task_Approved">
        <dc:Bounds x="560" y="80" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_TaskRej_di" bpmnElement="Task_Rejected">
        <dc:Bounds x="560" y="220" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_End1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="762" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="736" y="145" width="89" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_End2_di" bpmnElement="EndEvent_2">
        <dc:Bounds x="762" y="242" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="742" y="285" width="77" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="178" />
        <di:waypoint x="270" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="390" y="178" />
        <di:waypoint x="445" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Pass_di" bpmnElement="Flow_Pass">
        <di:waypoint x="470" y="153" />
        <di:waypoint x="470" y="120" />
        <di:waypoint x="560" y="120" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="476" y="133" width="19" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Reject_di" bpmnElement="Flow_Reject">
        <di:waypoint x="470" y="203" />
        <di:waypoint x="470" y="260" />
        <di:waypoint x="560" y="260" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="475" y="229" width="53" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_End1_di" bpmnElement="Flow_End1">
        <di:waypoint x="700" y="120" />
        <di:waypoint x="762" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_End2_di" bpmnElement="Flow_End2">
        <di:waypoint x="700" y="260" />
        <di:waypoint x="762" y="260" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

@Component({
  selector: 'app-bpmn-designer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bpmn-designer.component.html',
  styleUrl: './bpmn-designer.component.scss',
})
export class BpmnDesignerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLDivElement>;

  protected bpmnModeler: any;
  protected currentFileName = signal<string>('workflow-bpmn.bpmn');
  protected isModified = signal<boolean>(false);
  protected currentZoom = signal<number>(100);
  protected selectedElement = signal<BpmnElementProperties | null>(null);

  ngAfterViewInit(): void {
    this.bpmnModeler = new BpmnModeler({
      container: this.canvasRef.nativeElement,
      keyboard: {
        bindTo: window,
      },
    });

    this.bpmnModeler.on('commandStack.changed', () => {
      this.isModified.set(true);
    });

    this.bpmnModeler.on('selection.changed', (e: any) => {
      const selection = e.newSelection;
      if (selection && selection.length > 0) {
        const element = selection[0];
        const businessObject = element.businessObject;
        this.selectedElement.set({
          id: element.id,
          name: businessObject.name || '',
          type: element.type,
          documentation: businessObject.documentation?.[0]?.text || '',
        });
      } else {
        this.selectedElement.set(null);
      }
    });

    this.importDiagram(DEFAULT_BPMN_XML);
  }

  ngOnDestroy(): void {
    if (this.bpmnModeler) {
      this.bpmnModeler.destroy();
    }
  }

  async importDiagram(xml: string): Promise<void> {
    try {
      await this.bpmnModeler.importXML(xml);
      const canvas = this.bpmnModeler.get('canvas');
      canvas.zoom('fit-viewport');
      this.updateZoomLevel();
      this.isModified.set(false);
    } catch (err) {
      console.error('Lỗi khi tải sơ đồ BPMN:', err);
    }
  }

  createNewDiagram(): void {
    this.currentFileName.set('new-process.bpmn');
    this.importDiagram(DEFAULT_BPMN_XML);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.currentFileName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const xml = e.target?.result as string;
        if (xml) {
          this.importDiagram(xml);
        }
      };
      reader.readAsText(file);
    }
  }

  async exportXml(): Promise<void> {
    try {
      const { xml } = await this.bpmnModeler.saveXML({ format: true });
      if (xml) {
        this.downloadFile(xml, this.currentFileName(), 'application/xml');
        this.isModified.set(false);
      }
    } catch (err) {
      console.error('Lỗi khi xuất BPMN XML:', err);
    }
  }

  async exportSvg(): Promise<void> {
    try {
      const { svg } = await this.bpmnModeler.saveSVG();
      if (svg) {
        const svgFileName = this.currentFileName().replace(/\.(bpmn|xml)$/, '') + '.svg';
        this.downloadFile(svg, svgFileName, 'image/svg+xml');
      }
    } catch (err) {
      console.error('Lỗi khi xuất hình ảnh SVG:', err);
    }
  }

  zoomIn(): void {
    const canvas = this.bpmnModeler.get('canvas');
    canvas.zoom(canvas.zoom() * 1.2);
    this.updateZoomLevel();
  }

  zoomOut(): void {
    const canvas = this.bpmnModeler.get('canvas');
    canvas.zoom(canvas.zoom() / 1.2);
    this.updateZoomLevel();
  }

  zoomReset(): void {
    const canvas = this.bpmnModeler.get('canvas');
    canvas.zoom('fit-viewport');
    this.updateZoomLevel();
  }

  undo(): void {
    const commandStack = this.bpmnModeler.get('commandStack');
    if (commandStack.canUndo()) {
      commandStack.undo();
    }
  }

  redo(): void {
    const commandStack = this.bpmnModeler.get('commandStack');
    if (commandStack.canRedo()) {
      commandStack.redo();
    }
  }

  updateSelectedElementName(newName: string): void {
    const currentSel = this.selectedElement();
    if (!currentSel) return;

    const modeling = this.bpmnModeler.get('modeling');
    const elementRegistry = this.bpmnModeler.get('elementRegistry');
    const element = elementRegistry.get(currentSel.id);

    if (element) {
      modeling.updateLabel(element, newName);
      this.selectedElement.set({
        ...currentSel,
        name: newName,
      });
    }
  }

  private updateZoomLevel(): void {
    const canvas = this.bpmnModeler.get('canvas');
    const zoom = Math.round(canvas.zoom() * 100);
    this.currentZoom.set(zoom);
  }

  private downloadFile(content: string, fileName: string, contentType: string): void {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
