import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { getDefinitionStatusMeta } from '@core/models';
import { StatusPillComponent } from '../list-page/status-pill.component';
import { DefinitionEditorView } from './definition-editor.store';

export interface DesignerModalLabels {
  /** Danh từ trong tiêu đề, ví dụ "Quy trình" -> "Chi tiết Quy trình". */
  entity: string;
  icon: string;
  loadingText: string;
  viewSubtitle: string;
  editSubtitle: string;
  createButton: string;
  deleteButton: string;
  deleteConfirm: string;
  /** Định dạng hiển thị trong khung siêu dữ liệu, ví dụ "OMG BPMN 2.0 XML". */
  format: string;
}

/**
 * Modal toàn màn hình: designer (kéo giãn được) bên trái, form thông tin bên phải.
 * - `[designer]`: phần tử designer. Trang phải tự bọc nó trong
 *   `@if (editor.isOpen() && !editor.isLoading())` vì nội dung chiếu vào luôn được khởi tạo.
 * - nội dung mặc định: các trường form (dùng class trong `styles/_definition-form.scss`).
 */
@Component({
  selector: 'app-designer-modal',
  standalone: true,
  imports: [NzIconModule, NzPopconfirmModule, NzResizableModule, NzSpinModule, StatusPillComponent],
  templateUrl: './designer-modal.component.html',
  styleUrl: './designer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignerModalComponent {
  readonly editor = input.required<DefinitionEditorView>();
  readonly labels = input.required<DesignerModalLabels>();
  /** Trạng thái đang chọn trên form (hiển thị ngay khi người dùng đổi, trước khi lưu). */
  readonly status = input<string>('DRAFT');

  protected readonly statusMeta = computed(() => getDefinitionStatusMeta(this.status()));
  protected readonly designerWidth = signal<number | null>(null);
  private resizeFrame = -1;

  protected onSideResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      if (width) this.designerWidth.set(width);
    });
  }
}
