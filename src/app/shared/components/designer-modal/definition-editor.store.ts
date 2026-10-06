import { Signal, WritableSignal, inject, signal } from '@angular/core';
import { FieldTree, submit } from '@angular/forms/signals';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';

export type EditorMode = 'view' | 'edit' | 'create';

/** Trường chung của BPMN process / DMN decision mà modal cần hiển thị. */
export interface DefinitionRecord {
  id: string;
  name?: string;
  version?: number;
  status?: string;
  createdBy?: string;
  updatedBy?: string | null;
  updatedAt?: string;
}

/** Hợp đồng chung mà app-bpmn-designer và app-dmn-designer cùng đáp ứng. */
export interface DefinitionDesigner {
  hasChanges(): boolean;
  onSave(): void | Promise<void>;
}

export interface DesignerSaveEvent {
  name: string;
  xml: string;
}

export interface DefinitionEditorConfig<T extends DefinitionRecord, F extends object> {
  formModel: WritableSignal<F>;
  form: FieldTree<F>;
  /** Trường mã định danh - chỉ sửa được (và chỉ tính là "đã thay đổi") khi tạo mới. */
  keyField: keyof F;
  /** Danh từ dùng trong câu xác nhận, ví dụ "Quy trình". */
  entityLabel: string;
  designer: () => DefinitionDesigner | undefined;
  createDefaults(): F;
  toForm(record: T): F;
  load(id: string): Observable<T>;
  create(form: F, xml: string, fallbackName: string): Observable<unknown>;
  update(record: T, form: F, xml: string, fallbackName: string): Observable<unknown>;
  remove(id: string): Observable<unknown>;
  /** Phát hành (deploy). Bỏ trống nếu loại định nghĩa không hỗ trợ. */
  publish?(record: T): Observable<T | null | undefined>;
}

/** Phần của store mà <app-designer-modal> dùng - không phụ thuộc kiểu form cụ thể. */
export interface DefinitionEditorView {
  readonly isOpen: Signal<boolean>;
  readonly mode: Signal<EditorMode>;
  readonly isLoading: Signal<boolean>;
  readonly isSubmitting: Signal<boolean>;
  readonly isDeploying: Signal<boolean>;
  readonly selected: Signal<DefinitionRecord | null>;
  readonly canPublish: boolean;
  switchToEdit(): void;
  requestClose(): void;
  requestSave(): void;
  removeSelected(): void;
  publishSelected(): void;
}

/** Trường không tính vào kiểm tra "có thay đổi chưa lưu": phiên bản do máy chủ quản lý. */
const NON_EDITABLE_FIELDS = new Set<PropertyKey>(['version']);

/**
 * State và thao tác dùng chung của modal "designer + form thông tin" cho BPMN / DMN:
 * mở xem / sửa / tạo, tải chi tiết, hỏi xác nhận khi đóng còn thay đổi, lưu, xóa, phát hành.
 * Tạo bằng `new` trong field initializer của component (cần injection context cho NzModalService).
 */
export class DefinitionEditorStore<
  T extends DefinitionRecord,
  F extends object,
> implements DefinitionEditorView {
  private readonly modal = inject(NzModalService);
  private initialForm: F | null = null;

  readonly isOpen = signal<boolean>(false);
  readonly mode = signal<EditorMode>('edit');
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isDeploying = signal<boolean>(false);
  readonly selected = signal<T | null>(null);

  constructor(private readonly config: DefinitionEditorConfig<T, F>) {}

  get canPublish(): boolean {
    return !!this.config.publish;
  }

  openCreate(): void {
    const defaults = this.config.createDefaults();
    this.mode.set('create');
    this.selected.set(null);
    this.setForm(defaults);
    this.isLoading.set(false);
    this.isOpen.set(true);
  }

  openView(record: T, event?: Event): void {
    event?.stopPropagation();
    this.loadAndOpen(record, 'view');
  }

  openEdit(record: T, event?: Event): void {
    event?.stopPropagation();
    this.loadAndOpen(record, 'edit');
  }

  switchToEdit(): void {
    this.mode.set('edit');
  }

  /** Đóng modal; hỏi xác nhận nếu còn thay đổi chưa lưu. */
  requestClose(): void {
    if (!this.hasUnsavedChanges()) {
      this.forceClose();
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận đóng',
      nzContent: `${this.config.entityLabel} đã có thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?`,
      nzOkText: 'Đóng không lưu',
      nzOkDanger: true,
      nzCancelText: 'Tiếp tục chỉnh sửa',
      nzIconType: 'exclamation-circle',
      nzCentered: true,
      nzOnOk: () => this.forceClose(),
    });
  }

  forceClose(): void {
    this.isOpen.set(false);
    this.selected.set(null);
    this.initialForm = null;
    this.isLoading.set(false);
    this.isSubmitting.set(false);
    this.isDeploying.set(false);
  }

  /** Nút Lưu / Tạo ở footer: nhờ designer xuất XML, designer sẽ phát (save) về `save()`. */
  requestSave(): void {
    void this.config.designer()?.onSave();
  }

  save(event: DesignerSaveEvent): void {
    void submit(this.config.form, async () => {
      const current = this.selected();
      const formValue = this.config.formModel();
      const request =
        this.mode() === 'create' || !current?.id
          ? this.config.create(formValue, event.xml, event.name)
          : this.config.update(current, formValue, event.xml, event.name);
      this.runAndClose(request);
    });
  }

  /** Xóa từ dòng của bảng / danh sách. */
  remove(record: T): void {
    this.config.remove(record.id).subscribe({ error: () => undefined });
  }

  removeSelected(): void {
    const current = this.selected();
    if (current?.id) {
      this.runAndClose(this.config.remove(current.id));
    }
  }

  publishSelected(): void {
    const current = this.selected();
    if (!current?.id || !this.config.publish) return;

    this.isDeploying.set(true);
    this.config.publish(current).subscribe({
      next: (updated) => {
        if (updated?.id) {
          this.isDeploying.set(false);
          this.applyRecord(updated);
        } else {
          // Endpoint không trả về bản ghi - lấy lại từ backend thay vì tự gán trạng thái
          this.config.load(current.id).subscribe({
            next: (fresh) => this.applyRecord(fresh),
            complete: () => this.isDeploying.set(false),
            error: () => this.isDeploying.set(false),
          });
        }
      },
      error: () => this.isDeploying.set(false),
    });
  }

  hasUnsavedChanges(): boolean {
    if (this.mode() === 'view') return false;
    return (this.config.designer()?.hasChanges() ?? false) || this.isFormDirty();
  }

  private loadAndOpen(row: T, mode: Exclude<EditorMode, 'create'>): void {
    this.mode.set(mode);
    this.isOpen.set(true);
    this.isLoading.set(true);
    // Hiển thị ngay dữ liệu của dòng (đã lấy từ backend), rồi thay bằng bản chi tiết
    this.applyRecord(row);

    this.config.load(row.id).subscribe({
      next: (detail) => {
        if (detail) this.applyRecord(detail);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn(`Không thể tải chi tiết (${row.id}), dùng dữ liệu của danh sách:`, err);
        this.isLoading.set(false);
      },
    });
  }

  private applyRecord(record: T): void {
    this.selected.set(record);
    this.setForm(this.config.toForm(record));
  }

  private setForm(value: F): void {
    this.config.formModel.set({ ...value });
    this.initialForm = { ...value };
  }

  private isFormDirty(): boolean {
    const initial = this.initialForm;
    if (!initial) return false;
    const current = this.config.formModel();
    return (Object.keys(initial) as (keyof F)[]).some((key) => {
      if (NON_EDITABLE_FIELDS.has(key)) return false;
      if (key === this.config.keyField && this.mode() !== 'create') return false;
      return current[key] !== initial[key];
    });
  }

  private runAndClose(request: Observable<unknown>): void {
    this.isSubmitting.set(true);
    request.subscribe({
      next: () => this.forceClose(),
      error: () => this.isSubmitting.set(false),
    });
  }
}
