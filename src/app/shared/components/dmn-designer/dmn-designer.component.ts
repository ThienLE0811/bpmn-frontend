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
import DmnModeler from 'dmn-js/lib/Modeler';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { DEFAULT_DMN_XML } from '@shared/constants';
import { DesignerHeaderComponent } from '../designer-header/designer-header.component';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface DmnViewItem {
  id: string;
  name: string;
  type: string;
  element: any;
}

@Component({
  selector: 'app-dmn-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, DesignerHeaderComponent, NzIconModule],
  templateUrl: './dmn-designer.component.html',
  styleUrl: './dmn-designer.component.scss',
})
export class DmnDesignerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('dmnContainer', { static: true }) private dmnContainerRef!: ElementRef<HTMLDivElement>;

  @Input() decisionData: DmnDecision | null = null;
  @Output() save = new EventEmitter<{ name: string; xml: string }>();
  @Output() closed = new EventEmitter<void>();

  protected dmnModeler: any;
  protected decisionName = signal<string>('Bảng quyết định DMN mới');
  readonly isModified = signal<boolean>(false);
  protected currentZoom = signal<number>(100);
  protected views = signal<DmnViewItem[]>([]);
  protected activeViewId = signal<string>('');
  private initialDecisionName = '';
  private boundViewers = new WeakSet<any>();

  hasChanges(): boolean {
    const isTitleChanged = this.decisionName().trim() !== this.initialDecisionName.trim();
    return this.isModified() || isTitleChanged;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['decisionData']) {
      const name = this.decisionData?.name || 'Bảng quyết định DMN mới';
      this.decisionName.set(name);
      this.initialDecisionName = name;
      if (this.dmnModeler) {
        const xmlToLoad = this.decisionData?.dmnXml || DEFAULT_DMN_XML;
        this.importDiagram(xmlToLoad);
      }
    }
  }

  ngAfterViewInit(): void {
    this.dmnModeler = new DmnModeler({
      container: this.dmnContainerRef.nativeElement,
      keyboard: {
        bindTo: window,
      },
    });

    this.dmnModeler.on('views.changed', ({ views }: any) => {
      this.updateViewsList(views);
    });

    this.dmnModeler.on('viewer.created', ({ viewer }: any) => {
      this.bindViewerEvents(viewer);
    });

    this.dmnModeler.on('import.render.complete', ({ view }: any) => {
      if (view?.element) {
        this.activeViewId.set(view.element.id);
      }
      this.updateZoomLevel();
      const activeViewer = this.dmnModeler.getActiveViewer();
      if (activeViewer) {
        this.bindViewerEvents(activeViewer);
      }
    });

    const initialXml = this.decisionData?.dmnXml || DEFAULT_DMN_XML;
    const name = this.decisionData?.name || 'Bảng quyết định DMN mới';
    this.decisionName.set(name);
    this.initialDecisionName = name;
    this.importDiagram(initialXml);
  }

  ngOnDestroy(): void {
    if (this.dmnModeler) {
      this.dmnModeler.destroy();
    }
  }

  private bindViewerEvents(viewer: any): void {
    if (!viewer || this.boundViewers.has(viewer)) return;
    this.boundViewers.add(viewer);

    try {
      const onModified = () => {
        this.isModified.set(true);
      };

      viewer.on('commandStack.changed', onModified);
      viewer.on('commandStack.executed', onModified);
      viewer.on('commandStack.reverted', onModified);
      viewer.on('elements.changed', onModified);
      viewer.on('element.changed', onModified);
      viewer.on('root.added', onModified);
    } catch (err) {
      console.warn('Could not bind viewer events:', err);
    }
  }

  private updateViewsList(views: any[]): void {
    if (!views) return;
    const mapped: DmnViewItem[] = views.map((v) => ({
      id: v.element?.id || v.id,
      name: v.element?.name || v.element?.id || (v.type === 'drd' ? 'Sơ đồ DRD' : 'Decision Table'),
      type: v.type,
      element: v.element,
    }));
    this.views.set(mapped);

    const active = this.dmnModeler.getActiveView();
    if (active?.element) {
      this.activeViewId.set(active.element.id);
    }
  }

  async switchView(viewItem: DmnViewItem): Promise<void> {
    try {
      const rawViews = this.dmnModeler.getViews();
      const target = rawViews.find((v: any) => (v.element?.id || v.id) === viewItem.id);
      if (target) {
        await this.dmnModeler.open(target);
        const activeViewer = this.dmnModeler.getActiveViewer();
        if (activeViewer) {
          this.bindViewerEvents(activeViewer);
        }
        this.updateZoomLevel();
      }
    } catch (err) {
      console.error('Lỗi khi chuyển view DMN:', err);
    }
  }

  async importDiagram(xml: string): Promise<void> {
    try {
      await this.dmnModeler.importXML(xml);
      const views = this.dmnModeler.getViews();
      this.updateViewsList(views);
      this.updateZoomLevel();
      const activeViewer = this.dmnModeler.getActiveViewer();
      if (activeViewer) {
        this.bindViewerEvents(activeViewer);
      }
      this.isModified.set(false);
    } catch (err) {
      console.error('Lỗi khi tải sơ đồ DMN:', err);
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
      if (this.dmnModeler) {
        const { xml } = await this.dmnModeler.saveXML({ format: true });
        return xml || '';
      }
    } catch (err) {
      console.error('Lỗi khi lấy sơ đồ DMN XML:', err);
    }
    return this.decisionData?.dmnXml || DEFAULT_DMN_XML;
  }

  async onSave(): Promise<void> {
    try {
      const { xml } = await this.dmnModeler.saveXML({ format: true });
      if (xml) {
        this.save.emit({
          name: this.decisionName(),
          xml,
        });
        this.isModified.set(false);
        this.initialDecisionName = this.decisionName();
      }
    } catch (err) {
      console.error('Lỗi khi lưu DMN:', err);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  async exportXml(): Promise<void> {
    try {
      const { xml } = await this.dmnModeler.saveXML({ format: true });
      if (xml) {
        this.downloadFile(xml, `${this.decisionName()}.dmn`, 'application/xml');
      }
    } catch (err) {
      console.error('Lỗi khi xuất DMN XML:', err);
    }
  }

  async exportSvg(): Promise<void> {
    try {
      const activeViewer = this.dmnModeler.getActiveViewer();
      if (activeViewer && typeof activeViewer.saveSVG === 'function') {
        const { svg } = await activeViewer.saveSVG();
        if (svg) {
          this.downloadFile(svg, `${this.decisionName()}.svg`, 'image/svg+xml');
          return;
        }
      }
      // Fallback
      const { xml } = await this.dmnModeler.saveXML({ format: true });
      this.downloadFile(xml, `${this.decisionName()}.dmn`, 'application/xml');
    } catch (err) {
      console.error('Lỗi khi xuất hình ảnh SVG:', err);
    }
  }

  zoomIn(): void {
    const activeViewer = this.dmnModeler.getActiveViewer();
    const canvas = activeViewer?.get?.('canvas', false);
    if (canvas && typeof canvas.zoom === 'function') {
      canvas.zoom(canvas.zoom() * 1.2);
      this.updateZoomLevel();
    }
  }

  zoomOut(): void {
    const activeViewer = this.dmnModeler.getActiveViewer();
    const canvas = activeViewer?.get?.('canvas', false);
    if (canvas && typeof canvas.zoom === 'function') {
      canvas.zoom(canvas.zoom() / 1.2);
      this.updateZoomLevel();
    }
  }

  zoomReset(): void {
    const activeViewer = this.dmnModeler.getActiveViewer();
    const canvas = activeViewer?.get?.('canvas', false);
    if (canvas && typeof canvas.zoom === 'function') {
      canvas.zoom('fit-viewport');
      this.updateZoomLevel();
    }
  }

  undo(): void {
    const activeViewer = this.dmnModeler.getActiveViewer();
    const commandStack = activeViewer?.get?.('commandStack', false);
    if (commandStack?.canUndo()) {
      commandStack.undo();
    }
  }

  redo(): void {
    const activeViewer = this.dmnModeler.getActiveViewer();
    const commandStack = activeViewer?.get?.('commandStack', false);
    if (commandStack?.canRedo()) {
      commandStack.redo();
    }
  }

  private updateZoomLevel(): void {
    try {
      const activeViewer = this.dmnModeler.getActiveViewer();
      const canvas = activeViewer?.get?.('canvas', false);
      if (canvas && typeof canvas.zoom === 'function') {
        const zoom = Math.round(canvas.zoom() * 100);
        if (!isNaN(zoom) && zoom > 0) {
          this.currentZoom.set(zoom);
        }
      }
    } catch {
      // Ignore if not a canvas view
    }
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
