import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

export type DesignerType = 'bpmn' | 'dmn';
export type DesignerMode = 'design' | 'xml';

@Component({
  selector: 'app-designer-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzDropdownModule, NzMenuModule],
  templateUrl: './designer-header.component.html',
  styleUrl: './designer-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignerHeaderComponent {
  /** Type of designer (BPMN or DMN) */
  type = input<DesignerType>('bpmn');

  /** Whether to show mode switch buttons (Sơ đồ / Mã XML) */
  showModeSwitch = input<boolean>(false);

  /** Active mode for designing (design / xml) */
  activeMode = model<DesignerMode>('design');

  /** Item name / title (two-way binding support) */
  title = model<string>('');

  /** Item code or ID */
  code = input<string | undefined>();

  /** Whether there are unsaved changes */
  isModified = input<boolean>(false);

  /** Current zoom level in percentage (e.g. 100) */
  currentZoom = input<number>(100);

  /** Custom placeholder for title input */
  placeholder = input<string>();

  /** Custom save button label */
  saveLabel = input<string>();

  /** Custom accepted file extensions for import */
  accept = input<string>();

  /** Title tooltip/title for close button */
  closeTitle = input<string>('Đóng');

  /** Title tooltip for SVG export */
  svgTitle = input<string>();

  /** Whether designer is in read-only mode */
  readOnly = input<boolean>(false);

  /** Whether to show token simulation controls (BPMN only) */
  showSimulation = input<boolean>(false);

  /** Whether token simulation is currently active */
  isSimulationActive = input<boolean>(false);

  /** Whether token simulation is paused */
  isSimulationPaused = input<boolean>(true);

  // Computed properties
  effectivePlaceholder = computed(() => {
    if (this.placeholder()) return this.placeholder()!;
    return this.type() === 'dmn' ? 'Nhập tên bảng quyết định...' : 'Nhập tên quy trình...';
  });

  effectiveSaveLabel = computed(() => {
    if (this.saveLabel()) return this.saveLabel()!;
    return this.type() === 'dmn' ? 'Lưu DMN' : 'Lưu quy trình';
  });

  effectiveAccept = computed(() => {
    if (this.accept()) return this.accept()!;
    return this.type() === 'dmn' ? '.dmn,.xml' : '.bpmn,.xml';
  });

  effectiveSvgTitle = computed(() => {
    if (this.svgTitle()) return this.svgTitle()!;
    return this.type() === 'dmn' ? 'Xuất hình ảnh DRD dạng SVG' : 'Xuất hình ảnh dạng SVG';
  });

  // Action events
  save = output<void>();
  closed = output<void>();
  fileSelected = output<Event>();
  pasteXml = output<void>();
  exportXml = output<void>();
  exportSvg = output<void>();
  undo = output<void>();
  redo = output<void>();
  zoomIn = output<void>();
  zoomOut = output<void>();
  zoomReset = output<void>();
  toggleSimulation = output<void>();
  simulationPlayPause = output<void>();
  simulationReset = output<void>();

  setMode(mode: DesignerMode): void {
    this.activeMode.set(mode);
  }

  onFileChange(event: Event): void {
    this.fileSelected.emit(event);
    const target = event.target as HTMLInputElement;
    if (target) {
      target.value = '';
    }
  }
}
