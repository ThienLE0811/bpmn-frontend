import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';

export type DesignerType = 'bpmn' | 'dmn';

@Component({
  selector: 'app-designer-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './designer-header.component.html',
  styleUrl: './designer-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignerHeaderComponent {
  /** Type of designer (BPMN or DMN) */
  type = input<DesignerType>('bpmn');

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
  exportXml = output<void>();
  exportSvg = output<void>();
  undo = output<void>();
  redo = output<void>();
  zoomIn = output<void>();
  zoomOut = output<void>();
  zoomReset = output<void>();

  onFileChange(event: Event): void {
    this.fileSelected.emit(event);
  }
}
