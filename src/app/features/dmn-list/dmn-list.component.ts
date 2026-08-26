import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NzTableModule, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { DmnDecisionService } from '@core/services/dmn-decision.service';
import { DmnDecision, DmnDecisionStatus } from '@core/models/dmn-decision.model';
import { DmnDesignerComponent } from '@shared/components/dmn-designer/dmn-designer.component';

@Component({
  selector: 'app-dmn-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormField,
    NzTableModule,
    NzPopconfirmModule,
    NzIconModule,
    NzResizableModule,
    NzModalModule,
    DmnDesignerComponent,
  ],
  templateUrl: './dmn-list.component.html',
  styleUrl: './dmn-list.component.scss',
})
export class DmnListComponent {
  @ViewChild(DmnDesignerComponent) protected designerComponent?: DmnDesignerComponent;

  private dmnService = inject(DmnDecisionService);
  private modal = inject(NzModalService);

  protected searchTerm = signal<string>('');
  protected isModalOpen = signal<boolean>(false);
  protected selectedDecision = signal<DmnDecision | null>(null);
  protected pageSize = signal<number>(10);
  protected designerWidth = signal<number | null>(null);
  private resizeId = -1;
  private initialFormModel: {
    code: string;
    name: string;
    description: string;
    version: string;
    status: DmnDecisionStatus;
  } | null = null;

  // Signal Form for Decision Information
  protected readonly decisionFormModel = signal({
    code: '',
    name: '',
    description: '',
    version: 'v1.0.0',
    status: 'DRAFT' as DmnDecisionStatus,
  });

  protected readonly decisionForm = form(this.decisionFormModel, (schema) => {
    required(schema.code, { message: 'Mã bảng quyết định không được để trống' });
    required(schema.name, { message: 'Tên bảng quyết định không được để trống' });
    required(schema.version, { message: 'Phiên bản không được để trống' });
  });

  protected decisions = this.dmnService.decisions;

  protected publishedCount = computed(
    () => this.decisions().filter((d) => d.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.decisions().filter((d) => d.status === 'DRAFT').length,
  );

  protected filteredDecisions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.decisions();
    return this.decisions().filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term),
    );
  });

  // Table Sort Comparators
  protected sortCode = (a: DmnDecision, b: DmnDecision): number =>
    a.code.localeCompare(b.code);

  protected sortName = (a: DmnDecision, b: DmnDecision): number =>
    a.name.localeCompare(b.name);

  protected sortVersion = (a: DmnDecision, b: DmnDecision): number =>
    a.version.localeCompare(b.version);

  protected sortStatus = (a: DmnDecision, b: DmnDecision): number =>
    a.status.localeCompare(b.status);

  protected sortUpdatedAt = (a: DmnDecision, b: DmnDecision): number =>
    a.updatedAt.localeCompare(b.updatedAt);

  // Table Status Filter
  protected statusFilterList = [
    { text: 'Đã phát hành', value: 'PUBLISHED' },
    { text: 'Bản nháp', value: 'DRAFT' },
  ];

  protected statusFilterFn: NzTableFilterFn<DmnDecision> = (
    list: string[],
    item: DmnDecision,
  ): boolean => list.some((status) => item.status === status);

  onSideResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.resizeId);
    this.resizeId = requestAnimationFrame(() => {
      if (width) {
        this.designerWidth.set(width);
      }
    });
  }

  openCreateModal(): void {
    const nextCode = 'DMN-DEC-' + (this.decisions().length + 1).toString().padStart(2, '0');
    const initial = {
      code: nextCode,
      name: 'Bảng quyết định mới',
      description: '',
      version: 'v1.0.0',
      status: 'DRAFT' as DmnDecisionStatus,
    };
    this.selectedDecision.set(null);
    this.decisionFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  openEditModal(decision: DmnDecision): void {
    const initial = {
      code: decision.code,
      name: decision.name,
      description: decision.description || '',
      version: decision.version || 'v1.0.0',
      status: decision.status,
    };
    this.selectedDecision.set(decision);
    this.decisionFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  protected hasUnsavedChanges(): boolean {
    const isDesignerDirty = this.designerComponent?.hasChanges() ?? false;
    const isFormDirty = this.checkFormDirty();
    return isDesignerDirty || isFormDirty;
  }

  private checkFormDirty(): boolean {
    if (!this.initialFormModel) return false;
    const current = this.decisionFormModel();
    return (
      current.code !== this.initialFormModel.code ||
      current.name !== this.initialFormModel.name ||
      current.description !== this.initialFormModel.description ||
      current.version !== this.initialFormModel.version ||
      current.status !== this.initialFormModel.status
    );
  }

  closeModal(): void {
    if (this.hasUnsavedChanges()) {
      this.modal.confirm({
        nzTitle: 'Xác nhận đóng',
        nzContent: 'Bảng quyết định đã có thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?',
        nzOkText: 'Đóng không lưu',
        nzOkDanger: true,
        nzCancelText: 'Tiếp tục chỉnh sửa',
        nzIconType: 'exclamation-circle',
        nzCentered: true,
        nzOnOk: () => {
          this.forceCloseModal();
        },
      });
    } else {
      this.forceCloseModal();
    }
  }

  protected forceCloseModal(): void {
    this.isModalOpen.set(false);
    this.selectedDecision.set(null);
    this.initialFormModel = null;
  }

  onSaveFromModal(event: { name: string; xml: string }): void {
    submit(this.decisionForm, async () => {
      const current = this.selectedDecision();
      const formVal = this.decisionFormModel();
      this.dmnService.saveDecision({
        id: current?.id,
        code: formVal.code,
        name: formVal.name.trim() || event.name,
        description: formVal.description,
        version: formVal.version,
        status: formVal.status,
        xml: event.xml,
      });

      this.forceCloseModal();
    });
  }

  deleteDecision(decision: DmnDecision, event?: Event): void {
    event?.stopPropagation();
    this.dmnService.deleteDecision(decision.id);
  }
}
