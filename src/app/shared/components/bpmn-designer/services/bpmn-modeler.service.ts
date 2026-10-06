import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import TokenSimulationModule from 'bpmn-js-token-simulation';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BpmnElementProperties } from '../bpmn-designer.models';
import { readElementProperties } from '../utils/bpmn-element.mapper';
import { downloadFile } from '../utils/bpmn-xml.utils';

/**
 * Wraps the bpmn-js modeler instance of ONE designer: canvas, command stack, selection
 * and token simulation. Provided at the designer component level, never in root.
 */
@Injectable()
export class BpmnModelerService implements OnDestroy {
  private message = inject(NzMessageService);

  private modeler: any = null;
  private container?: HTMLElement;
  private isApplyingSidebarEdit = false;

  readonly selectedElement = signal<BpmnElementProperties | null>(null);
  readonly currentZoom = signal<number>(100);
  readonly isModified = signal<boolean>(false);
  readonly isSimulationActive = signal<boolean>(false);
  readonly isSimulationPaused = signal<boolean>(true);

  get isReady(): boolean {
    return !!this.modeler;
  }

  init(container: HTMLElement): void {
    this.container = container;
    this.modeler = new BpmnModeler({
      container,
      keyboard: {
        bindTo: window,
      },
      additionalModules: [TokenSimulationModule],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    });

    // Sync simulation mode with toolbar
    this.on('tokenSimulation.toggleMode', (event: any) => {
      const active = !!event?.active;
      this.isSimulationActive.set(active);
      if (!active) {
        this.isSimulationPaused.set(true);
      }
    });

    // Sync play/pause/reset simulation states
    this.on('tokenSimulation.playSimulation', () => this.isSimulationPaused.set(false));
    this.on('tokenSimulation.pauseSimulation', () => this.isSimulationPaused.set(true));
    this.on('tokenSimulation.resetSimulation', () => this.isSimulationPaused.set(true));

    this.on('commandStack.changed', () => {
      // Undo/redo and canvas-side edits (direct label editing, ...) don't touch the selection,
      // so the sidebar would keep showing stale values without this re-read.
      if (!this.isApplyingSidebarEdit) {
        this.refreshSelectedElement();
      }
    });

    this.on('selection.changed', (e: any) => {
      const element = e.newSelection?.[0];
      this.selectedElement.set(element ? readElementProperties(element) : null);
    });
  }

  ngOnDestroy(): void {
    if (this.isSimulationActive()) {
      try {
        this.modeler?.get('toggleMode')?.toggleMode(false);
      } catch (_) {}
    }
    this.modeler?.destroy();
    this.modeler = null;
  }

  // --- Raw bpmn-js access ---

  get<T = any>(serviceName: string): T {
    return this.modeler.get(serviceName);
  }

  on(event: string, callback: (event: any) => void): void {
    this.modeler.on(event, callback);
  }

  getElement(id: string): any {
    return this.modeler?.get('elementRegistry').get(id);
  }

  getRootProcessName(): string | undefined {
    const definitions = this.modeler?.getDefinitions?.();
    return definitions?.rootElements?.find((e: any) => e.$type === 'bpmn:Process')?.name;
  }

  async importXML(xml: string): Promise<void> {
    await this.modeler.importXML(xml);
  }

  /** Re-imports XML while keeping the user's current pan/zoom (falls back to fit-viewport). */
  async reimportXML(xml: string): Promise<void> {
    const canvas = this.get('canvas');
    let savedViewbox: any = null;
    try {
      const vb = canvas.viewbox();
      if (vb && Number.isFinite(vb.scale) && vb.width > 0 && vb.height > 0) {
        savedViewbox = vb;
      }
    } catch (_) {}

    await this.modeler.importXML(xml);

    try {
      if (this.hasCanvasSize()) {
        if (savedViewbox) {
          canvas.viewbox(savedViewbox);
        } else {
          canvas.zoom('fit-viewport');
        }
      }
    } catch (zoomErr) {
      console.warn('Bỏ qua lỗi điều chỉnh zoom canvas sau khi nạp XML:', zoomErr);
    }
    this.updateZoomLevel();
  }

  async saveXML(): Promise<string> {
    const { xml } = await this.modeler.saveXML({ format: true });
    return xml || '';
  }

  // --- Canvas ---

  fitViewport(): void {
    try {
      if (this.hasCanvasSize()) {
        this.get('canvas').zoom('fit-viewport');
      }
    } catch (zoomErr) {
      console.warn('Không thể tự động zoom canvas:', zoomErr);
    }
    this.updateZoomLevel();
  }

  /** Recompute canvas viewport once the DOM has settled after a layout shift (e.g. leaving XML mode). */
  refitAfterLayout(): void {
    setTimeout(() => {
      if (!this.modeler) return;
      this.get('canvas').resized();
      this.fitViewport();
    }, 80);
  }

  zoomIn(): void {
    const canvas = this.get('canvas');
    canvas.zoom(canvas.zoom() * 1.2);
    this.updateZoomLevel();
  }

  zoomOut(): void {
    const canvas = this.get('canvas');
    canvas.zoom(canvas.zoom() / 1.2);
    this.updateZoomLevel();
  }

  undo(): void {
    const commandStack = this.get('commandStack');
    if (commandStack.canUndo()) {
      commandStack.undo();
    }
  }

  redo(): void {
    const commandStack = this.get('commandStack');
    if (commandStack.canRedo()) {
      commandStack.redo();
    }
  }

  private hasCanvasSize(): boolean {
    return !!this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0;
  }

  private updateZoomLevel(): void {
    try {
      this.currentZoom.set(Math.round(this.get('canvas').zoom() * 100));
    } catch (_) {}
  }

  // --- Selection & sidebar edits ---

  /**
   * Runs a sidebar-originated modeling command without re-reading the selection afterwards:
   * the sidebar already holds the raw typed value, while the XML may store it trimmed - re-reading
   * mid-typing would strip trailing spaces out from under the cursor.
   */
  applySidebarEdit<T>(edit: () => T): T {
    this.isApplyingSidebarEdit = true;
    try {
      return edit();
    } finally {
      this.isApplyingSidebarEdit = false;
    }
  }

  private refreshSelectedElement(): void {
    const currentSel = this.selectedElement();
    if (!currentSel) return;

    const element = this.getElement(currentSel.id);
    this.selectedElement.set(element ? readElementProperties(element) : null);
  }

  // --- Token simulation ---

  toggleSimulation(): void {
    if (!this.modeler) return;
    try {
      const toggleMode = this.get('toggleMode');
      if (toggleMode) {
        const willBeActive = !this.isSimulationActive();
        toggleMode.toggleMode();
        if (willBeActive) {
          this.message.info(
            'Đã bật mô phỏng trực quan. Nhấp vào nút Play trên sự kiện Bắt đầu để quan sát token di chuyển qua các cổng!',
          );
        } else {
          this.message.info('Đã thoát chế độ mô phỏng.');
        }
      }
    } catch (err) {
      console.warn('Không thể bật/tắt token simulation:', err);
    }
  }

  toggleSimulationPlayPause(): void {
    if (!this.modeler) return;
    try {
      this.get('pauseSimulation')?.toggle();
    } catch (err) {
      console.warn('Lỗi khi thay đổi play/pause mô phỏng:', err);
    }
  }

  resetSimulation(): void {
    if (!this.modeler) return;
    try {
      const resetSimulation = this.get('resetSimulation');
      if (resetSimulation) {
        resetSimulation.resetSimulation();
        this.message.info('Đã đặt lại phiên mô phỏng.');
      }
    } catch (err) {
      console.warn('Lỗi khi đặt lại mô phỏng:', err);
    }
  }

  // --- Export ---

  async exportXml(fileName: string): Promise<void> {
    try {
      const xml = await this.saveXML();
      if (xml) {
        downloadFile(xml, `${fileName}.bpmn`, 'application/xml');
      }
    } catch (err) {
      console.error('Lỗi khi xuất BPMN XML:', err);
    }
  }

  async exportSvg(fileName: string): Promise<void> {
    try {
      const { svg } = await this.modeler.saveSVG();
      if (svg) {
        downloadFile(svg, `${fileName}.svg`, 'image/svg+xml');
      }
    } catch (err) {
      console.error('Lỗi khi xuất hình ảnh SVG:', err);
    }
  }
}
