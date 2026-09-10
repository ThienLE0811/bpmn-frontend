import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  input,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { DEFAULT_BPMN_XML } from '@shared/constants';

@Component({
  selector: 'app-operate-viewer',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzTooltipModule],
  templateUrl: './operate-viewer.component.html',
  styleUrl: './operate-viewer.component.scss',
})
export class OperateViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLDivElement>;

  readonly xml = input<string | null>(null);
  readonly activeActivities = input<string[]>([]);
  readonly incidentActivities = input<string[]>([]);
  readonly completedActivities = input<string[]>([]);

  protected isDiagramReady = signal<boolean>(false);
  protected hasError = signal<boolean>(false);

  private viewer: NavigatedViewer | null = null;

  constructor() {
    effect(() => {
      const xml = this.xml();
      const active = this.activeActivities();
      const incidents = this.incidentActivities();
      const completed = this.completedActivities();

      if (this.viewer && this.canvasRef) {
        this.renderDiagram(xml, active, incidents, completed);
      }
    });
  }

  ngAfterViewInit(): void {
    try {
      this.viewer = new NavigatedViewer({
        container: this.canvasRef.nativeElement,
      });

      this.renderDiagram(
        this.xml(),
        this.activeActivities(),
        this.incidentActivities(),
        this.completedActivities(),
      );
    } catch (e) {
      console.error('Không thể khởi tạo BPMN Viewer:', e);
      this.hasError.set(true);
    }
  }

  ngOnDestroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }

  private async renderDiagram(
    xml: string | null,
    active: string[],
    incidents: string[],
    completed: string[],
  ): Promise<void> {
    if (!this.viewer) return;

    const xmlToLoad = xml && xml.trim().length > 0 ? xml : DEFAULT_BPMN_XML;

    try {
      this.hasError.set(false);
      this.isDiagramReady.set(false);

      await this.viewer.importXML(xmlToLoad);

      const canvas = this.viewer.get<any>('canvas');
      const overlays = this.viewer.get<any>('overlays');

      canvas.zoom('fit-viewport');

      // Clear existing markers / overlays
      overlays.clear();

      // Highlight completed activities
      completed.forEach((actId) => {
        try {
          canvas.addMarker(actId, 'bpmn-highlight-completed');
        } catch {
          // Ignore if element is not in diagram
        }
      });

      // Highlight active activities
      active.forEach((actId) => {
        try {
          canvas.addMarker(actId, 'bpmn-highlight-active');
          overlays.add(actId, {
            position: { top: -10, right: 10 },
            html: '<div class="token-pulse-badge" title="Đang thực thi">1</div>',
          });
        } catch {
          // Ignore
        }
      });

      // Highlight incident activities
      incidents.forEach((actId) => {
        try {
          canvas.addMarker(actId, 'bpmn-highlight-incident');
          overlays.add(actId, {
            position: { top: -12, right: -12 },
            html: '<div class="incident-badge" title="Sự cố dừng quy trình">!</div>',
          });
        } catch {
          // Ignore
        }
      });

      this.isDiagramReady.set(true);
    } catch (err) {
      console.error('Lỗi khi import XML vào Operate Viewer:', err);
      this.hasError.set(true);
      this.isDiagramReady.set(false);
    }
  }

  zoomIn(): void {
    if (this.viewer) {
      const zoomScroll = this.viewer.get<any>('zoomScroll');
      zoomScroll?.stepZoom?.(1);
    }
  }

  zoomOut(): void {
    if (this.viewer) {
      const zoomScroll = this.viewer.get<any>('zoomScroll');
      zoomScroll?.stepZoom?.(-1);
    }
  }

  fitViewport(): void {
    if (this.viewer) {
      const canvas = this.viewer.get<any>('canvas');
      canvas?.zoom?.('fit-viewport');
    }
  }
}
