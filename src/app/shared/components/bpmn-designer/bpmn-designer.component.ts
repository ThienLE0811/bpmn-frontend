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
  @Output() cancel = new EventEmitter<void>();

  protected bpmnModeler: any;
  protected processName = signal<string>('Quy trình BPMN mới');
  protected isModified = signal<boolean>(false);
  protected currentZoom = signal<number>(100);
  protected selectedElement = signal<BpmnElementProperties | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['processData'] && this.processData) {
      this.processName.set(this.processData.name || 'Quy trình BPMN');
      if (this.bpmnModeler) {
        const xmlToLoad = this.processData.xml || DEFAULT_BPMN_XML;
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

    const initialXml = this.processData?.xml || DEFAULT_BPMN_XML;
    if (this.processData?.name) {
      this.processName.set(this.processData.name);
    }
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
          this.importDiagram(xml);
        }
      };
      reader.readAsText(file);
    }
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
    this.cancel.emit();
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
