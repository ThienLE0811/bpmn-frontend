import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { DEFAULT_BPMN_XML } from '@shared/constants';
import { DesignerHeaderComponent } from '../designer-header/designer-header.component';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface BpmnElementProperties {
  id: string;
  name: string;
  type: string;
  documentation: string;
  // User & Task execution
  assignee?: string;
  candidateGroups?: string;
  candidateUsers?: string;
  dueDate?: string;
  priority?: string;
  // Sequence flow
  conditionExpression?: string;
  // Service & Automation
  topic?: string;
  delegateExpression?: string;
  javaClass?: string;
  calledElement?: string;
}

export interface BpmnTypeMeta {
  label: string;
  category: 'task' | 'gateway' | 'event' | 'flow' | 'other';
  icon: string;
  color: string;
}

@Component({
  selector: 'app-bpmn-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, DesignerHeaderComponent, NzIconModule],
  templateUrl: './bpmn-designer.component.html',
  styleUrl: './bpmn-designer.component.scss',
})
export class BpmnDesignerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLDivElement>;

  @Input() processData: BpmnProcess | null = null;
  @Output() save = new EventEmitter<{ name: string; xml: string }>();
  @Output() closed = new EventEmitter<void>();

  protected bpmnModeler: any;
  protected processName = signal<string>('Quy trình BPMN mới');
  readonly isModified = signal<boolean>(false);
  protected currentZoom = signal<number>(100);
  protected selectedElement = signal<BpmnElementProperties | null>(null);
  protected activeSidebarTab = signal<'general' | 'execution' | 'advanced'>('general');
  protected copiedId = signal<boolean>(false);
  private initialProcessName = '';

  hasChanges(): boolean {
    const isTitleChanged = this.processName() !== this.initialProcessName;
    return this.isModified() || isTitleChanged;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['processData']) {
      const name = this.processData?.name || 'Quy trình BPMN mới';
      this.processName.set(name);
      this.initialProcessName = name;
      if (this.bpmnModeler) {
        const xmlToLoad = this.processData?.bpmnXml || DEFAULT_BPMN_XML;
        this.importDiagram(xmlToLoad);
      }
    }
  }

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
        const bo = element.businessObject;

        const documentation = bo.documentation?.[0]?.text || '';
        const conditionExpression =
          bo.conditionExpression?.body || bo.conditionExpression?.text || '';

        const assignee =
          bo.assignee || bo.get?.('camunda:assignee') || bo.$attrs?.['camunda:assignee'] || '';
        const candidateGroups =
          bo.candidateGroups ||
          bo.get?.('camunda:candidateGroups') ||
          bo.$attrs?.['camunda:candidateGroups'] ||
          '';
        const candidateUsers =
          bo.candidateUsers ||
          bo.get?.('camunda:candidateUsers') ||
          bo.$attrs?.['camunda:candidateUsers'] ||
          '';
        const dueDate =
          bo.dueDate || bo.get?.('camunda:dueDate') || bo.$attrs?.['camunda:dueDate'] || '';
        const priority =
          bo.priority || bo.get?.('camunda:priority') || bo.$attrs?.['camunda:priority'] || '';

        const topic = bo.topic || bo.get?.('camunda:topic') || bo.$attrs?.['camunda:topic'] || '';
        const delegateExpression =
          bo.delegateExpression ||
          bo.get?.('camunda:delegateExpression') ||
          bo.$attrs?.['camunda:delegateExpression'] ||
          '';
        const javaClass =
          bo.class || bo.get?.('camunda:class') || bo.$attrs?.['camunda:class'] || '';
        const calledElement = bo.calledElement || bo.get?.('calledElement') || '';

        this.selectedElement.set({
          id: element.id,
          name: bo.name || '',
          type: element.type,
          documentation,
          assignee,
          candidateGroups,
          candidateUsers,
          dueDate,
          priority,
          conditionExpression,
          topic,
          delegateExpression,
          javaClass,
          calledElement,
        });
      } else {
        this.selectedElement.set(null);
      }
    });

    const initialXml = this.processData?.bpmnXml || DEFAULT_BPMN_XML;
    const name = this.processData?.name || 'Quy trình BPMN mới';
    this.processName.set(name);
    this.initialProcessName = name;
    this.importDiagram(initialXml);
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

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const xml = e.target?.result as string;
        if (xml) {
          this.importDiagram(xml).then(() => {
            this.isModified.set(true);
          });
        }
      };
      reader.readAsText(file);
    }
  }

  async getDiagramXml(): Promise<string> {
    try {
      if (this.bpmnModeler) {
        const { xml } = await this.bpmnModeler.saveXML({ format: true });
        return xml || '';
      }
    } catch (err) {
      console.error('Lỗi khi lấy sơ đồ BPMN XML:', err);
    }
    return this.processData?.bpmnXml || DEFAULT_BPMN_XML;
  }

  async onSave(): Promise<void> {
    try {
      const { xml } = await this.bpmnModeler.saveXML({ format: true });
      if (xml) {
        this.save.emit({
          name: this.processName(),
          xml,
        });
        this.isModified.set(false);
      }
    } catch (err) {
      console.error('Lỗi khi lưu sơ đồ BPMN:', err);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  async exportXml(): Promise<void> {
    try {
      const { xml } = await this.bpmnModeler.saveXML({ format: true });
      if (xml) {
        this.downloadFile(xml, `${this.processName()}.bpmn`, 'application/xml');
      }
    } catch (err) {
      console.error('Lỗi khi xuất BPMN XML:', err);
    }
  }

  async exportSvg(): Promise<void> {
    try {
      const { svg } = await this.bpmnModeler.saveSVG();
      if (svg) {
        this.downloadFile(svg, `${this.processName()}.svg`, 'image/svg+xml');
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

  updateSelectedElementDocumentation(docText: string): void {
    const currentSel = this.selectedElement();
    if (!currentSel) return;

    const modeling = this.bpmnModeler.get('modeling');
    const bpmnFactory = this.bpmnModeler.get('bpmnFactory');
    const elementRegistry = this.bpmnModeler.get('elementRegistry');
    const element = elementRegistry.get(currentSel.id);

    if (element) {
      const doc = docText ? [bpmnFactory.create('bpmn:Documentation', { text: docText })] : [];
      modeling.updateProperties(element, { documentation: doc });
      this.selectedElement.set({
        ...currentSel,
        documentation: docText,
      });
    }
  }

  updateSelectedElementProperty(propName: keyof BpmnElementProperties, value: any): void {
    const currentSel = this.selectedElement();
    if (!currentSel) return;

    const modeling = this.bpmnModeler.get('modeling');
    const bpmnFactory = this.bpmnModeler.get('bpmnFactory');
    const elementRegistry = this.bpmnModeler.get('elementRegistry');
    const element = elementRegistry.get(currentSel.id);

    if (element) {
      if (propName === 'conditionExpression') {
        if (value && value.trim()) {
          const formalExpression = bpmnFactory.create('bpmn:FormalExpression', {
            body: value.trim(),
          });
          modeling.updateProperties(element, { conditionExpression: formalExpression });
        } else {
          modeling.updateProperties(element, { conditionExpression: undefined });
        }
      } else {
        const updatePayload: Record<string, any> = {};
        updatePayload[propName] = value || undefined;
        modeling.updateProperties(element, updatePayload);
      }

      this.selectedElement.set({
        ...currentSel,
        [propName]: value,
      });
    }
  }

  copyElementId(id: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        this.copiedId.set(true);
        setTimeout(() => this.copiedId.set(false), 2000);
      });
    }
  }

  getTypeMeta(type?: string): BpmnTypeMeta {
    if (!type) {
      return { label: 'Chưa chọn', category: 'other', icon: 'appstore', color: '#64748b' };
    }

    const typeMap: Record<string, BpmnTypeMeta> = {
      'bpmn:UserTask': {
        label: 'Task Người dùng (User Task)',
        category: 'task',
        icon: 'user',
        color: '#2563eb',
      },
      'bpmn:ServiceTask': {
        label: 'Tác vụ Tự động (Service Task)',
        category: 'task',
        icon: 'api',
        color: '#7c3aed',
      },
      'bpmn:ScriptTask': {
        label: 'Kịch bản (Script Task)',
        category: 'task',
        icon: 'code',
        color: '#0891b2',
      },
      'bpmn:SendTask': {
        label: 'Gửi tin nhắn (Send Task)',
        category: 'task',
        icon: 'send',
        color: '#4f46e5',
      },
      'bpmn:ReceiveTask': {
        label: 'Nhận tin nhắn (Receive Task)',
        category: 'task',
        icon: 'mail',
        color: '#0d9488',
      },
      'bpmn:ManualTask': {
        label: 'Tác vụ thủ công (Manual Task)',
        category: 'task',
        icon: 'tool',
        color: '#ea580c',
      },
      'bpmn:BusinessRuleTask': {
        label: 'Luật quyết định (Business Rule Task)',
        category: 'task',
        icon: 'table',
        color: '#d97706',
      },
      'bpmn:CallActivity': {
        label: 'Gọi quy trình con (Call Activity)',
        category: 'task',
        icon: 'apartment',
        color: '#2563eb',
      },
      'bpmn:SubProcess': {
        label: 'Quy trình con (Sub Process)',
        category: 'task',
        icon: 'folder-open',
        color: '#475569',
      },
      'bpmn:ExclusiveGateway': {
        label: 'Cổng rẽ nhánh XOR (Exclusive Gateway)',
        category: 'gateway',
        icon: 'branches',
        color: '#ca8a04',
      },
      'bpmn:ParallelGateway': {
        label: 'Cổng song song AND (Parallel Gateway)',
        category: 'gateway',
        icon: 'plus-circle',
        color: '#16a34a',
      },
      'bpmn:InclusiveGateway': {
        label: 'Cổng bao hàm OR (Inclusive Gateway)',
        category: 'gateway',
        icon: 'check-circle',
        color: '#65a30d',
      },
      'bpmn:EventBasedGateway': {
        label: 'Cổng theo sự kiện (Event Gateway)',
        category: 'gateway',
        icon: 'thunderbolt',
        color: '#9333ea',
      },
      'bpmn:SequenceFlow': {
        label: 'Luồng điều hướng (Sequence Flow)',
        category: 'flow',
        icon: 'arrow-right',
        color: '#e11d48',
      },
      'bpmn:StartEvent': {
        label: 'Sự kiện Bắt đầu (Start Event)',
        category: 'event',
        icon: 'play-circle',
        color: '#16a34a',
      },
      'bpmn:EndEvent': {
        label: 'Sự kiện Kết thúc (End Event)',
        category: 'event',
        icon: 'stop',
        color: '#dc2626',
      },
      'bpmn:IntermediateCatchEvent': {
        label: 'Bắt sự kiện (Catch Event)',
        category: 'event',
        icon: 'clock-circle',
        color: '#d97706',
      },
      'bpmn:IntermediateThrowEvent': {
        label: 'Phát sự kiện (Throw Event)',
        category: 'event',
        icon: 'alert',
        color: '#ea580c',
      },
      'bpmn:BoundaryEvent': {
        label: 'Sự kiện biên (Boundary Event)',
        category: 'event',
        icon: 'warning',
        color: '#c026d3',
      },
      'bpmn:Participant': {
        label: 'Pool / Phân vùng (Participant)',
        category: 'other',
        icon: 'layout',
        color: '#334155',
      },
      'bpmn:Lane': {
        label: 'Lane (Làn xử lý)',
        category: 'other',
        icon: 'column-width',
        color: '#64748b',
      },
    };

    return (
      typeMap[type] || {
        label: type.replace('bpmn:', ''),
        category: 'other',
        icon: 'appstore',
        color: '#64748b',
      }
    );
  }

  isUserOrTask(type?: string): boolean {
    if (!type) return false;
    return ['bpmn:UserTask', 'bpmn:ManualTask'].includes(type);
  }

  isSequenceFlow(type?: string): boolean {
    return type === 'bpmn:SequenceFlow';
  }

  isServiceOrScript(type?: string): boolean {
    if (!type) return false;
    return ['bpmn:ServiceTask', 'bpmn:ScriptTask', 'bpmn:SendTask', 'bpmn:ReceiveTask'].includes(
      type,
    );
  }

  isCallActivity(type?: string): boolean {
    return type === 'bpmn:CallActivity';
  }

  hasExecutionConfig(type?: string): boolean {
    return (
      this.isUserOrTask(type) ||
      this.isSequenceFlow(type) ||
      this.isServiceOrScript(type) ||
      this.isCallActivity(type)
    );
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
