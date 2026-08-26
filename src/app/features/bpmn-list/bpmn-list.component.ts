import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NzTableModule, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { BpmnProcessService } from '@core/services/bpmn-process.service';
import { BpmnProcess, BpmnProcessStatus } from '@core/models/bpmn-process.model';
import { BpmnDesignerComponent } from '@shared/components/bpmn-designer/bpmn-designer.component';

@Component({
  selector: 'app-bpmn-list',
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
    BpmnDesignerComponent,
  ],
  templateUrl: './bpmn-list.component.html',
  styleUrl: './bpmn-list.component.scss',
})
export class BpmnListComponent {
  @ViewChild(BpmnDesignerComponent) protected designerComponent?: BpmnDesignerComponent;

  private bpmnService = inject(BpmnProcessService);
  private modal = inject(NzModalService);

  protected searchTerm = signal<string>('');
  protected isModalOpen = signal<boolean>(false);
  protected selectedProcess = signal<BpmnProcess | null>(null);
  protected pageSize = signal<number>(10);
  protected designerWidth = signal<number | null>(null);
  private resizeId = -1;
  private initialFormModel: {
    code: string;
    name: string;
    description: string;
    version: string;
    status: BpmnProcessStatus;
  } | null = null;

  // Signal Form for Process Information
  protected readonly processFormModel = signal({
    code: '',
    name: '',
    description: '',
    version: 'v1.0.0',
    status: 'DRAFT' as BpmnProcessStatus,
  });

  protected readonly processForm = form(this.processFormModel, (schema) => {
    required(schema.code, { message: 'Mã quy trình không được để trống' });
    required(schema.name, { message: 'Tên quy trình không được để trống' });
    required(schema.version, { message: 'Phiên bản không được để trống' });
  });

  protected processes = this.bpmnService.processes;

  protected publishedCount = computed(
    () => this.processes().filter((p) => p.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.processes().filter((p) => p.status === 'DRAFT').length,
  );

  protected filteredProcesses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.processes();
    return this.processes().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term),
    );
  });

  // Table Sort Comparators
  protected sortCode = (a: BpmnProcess, b: BpmnProcess): number =>
    a.code.localeCompare(b.code);

  protected sortName = (a: BpmnProcess, b: BpmnProcess): number =>
    a.name.localeCompare(b.name);

  protected sortVersion = (a: BpmnProcess, b: BpmnProcess): number =>
    a.version.localeCompare(b.version);

  protected sortStatus = (a: BpmnProcess, b: BpmnProcess): number =>
    a.status.localeCompare(b.status);

  protected sortUpdatedAt = (a: BpmnProcess, b: BpmnProcess): number =>
    a.updatedAt.localeCompare(b.updatedAt);

  // Table Status Filter
  protected statusFilterList = [
    { text: 'Đã phát hành', value: 'PUBLISHED' },
    { text: 'Bản nháp', value: 'DRAFT' },
  ];

  protected statusFilterFn: NzTableFilterFn<BpmnProcess> = (
    list: string[],
    item: BpmnProcess,
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
    const nextCode = 'BPMN-PROC-' + (this.processes().length + 1).toString().padStart(2, '0');
    const initial = {
      code: nextCode,
      name: 'Quy trình mới',
      description: '',
      version: 'v1.0.0',
      status: 'DRAFT' as BpmnProcessStatus,
    };
    this.selectedProcess.set(null);
    this.processFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  openEditModal(process: BpmnProcess): void {
    const initial = {
      code: process.code,
      name: process.name,
      description: process.description || '',
      version: process.version || 'v1.0.0',
      status: process.status,
    };
    this.selectedProcess.set(process);
    this.processFormModel.set({ ...initial });
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
    const current = this.processFormModel();
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
        nzContent: 'Quy trình đã có thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?',
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
    this.selectedProcess.set(null);
    this.initialFormModel = null;
  }

  onSaveFromModal(event: { name: string; xml: string }): void {
    submit(this.processForm, async () => {
      const current = this.selectedProcess();
      const formVal = this.processFormModel();
      this.bpmnService.saveProcess({
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

  deleteProcess(process: BpmnProcess, event?: Event): void {
    event?.stopPropagation();
    this.bpmnService.deleteProcess(process.id);
  }
}
