import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { BpmnProcessService } from '@core/services';
import { BpmnProcess, BpmnProcessStatus } from '@core/models';
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
export class BpmnListComponent implements OnInit {
  @ViewChild(BpmnDesignerComponent) protected designerComponent?: BpmnDesignerComponent;

  private bpmnService = inject(BpmnProcessService);
  private modal = inject(NzModalService);

  ngOnInit(): void {
    this.loadProcesses();
  }

  protected isModalOpen = signal<boolean>(false);
  protected selectedProcess = signal<BpmnProcess | null>(null);
  protected pageSize = signal<number>(10);
  protected designerWidth = signal<number | null>(null);
  private resizeId = -1;
  private initialFormModel: {
    processKey: string;
    name: string;
    description: string;
    category: string;
    version: number;
    status: string;
  } | null = null;

  // Signal Form for Process Information
  protected readonly processFormModel = signal({
    processKey: '',
    name: '',
    description: '',
    category: 'GENERAL',
    version: 1,
    status: 'DRAFT',
  });

  protected readonly processForm = form(this.processFormModel, (schema) => {
    required(schema.processKey, { message: 'Mã quy trình không được để trống' });
    required(schema.name, { message: 'Tên quy trình không được để trống' });
    required(schema.category, { message: 'Danh mục không được để trống' });
  });

  protected processes = this.bpmnService.processes;
  protected isLoading = this.bpmnService.isLoading;

  protected publishedCount = computed(
    () => this.processes().filter((p) => p.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.processes().filter((p) => p.status === 'DRAFT').length,
  );

  // Table Sort Comparators
  protected sortProcessKey = (a: BpmnProcess, b: BpmnProcess): number =>
    a.processKey.localeCompare(b.processKey);

  protected sortCategory = (a: BpmnProcess, b: BpmnProcess): number =>
    a.category.localeCompare(b.category);

  protected sortName = (a: BpmnProcess, b: BpmnProcess): number => a.name.localeCompare(b.name);

  protected sortVersion = (a: BpmnProcess, b: BpmnProcess): number => a.version - b.version;

  protected sortStatus = (a: BpmnProcess, b: BpmnProcess): number =>
    a.status.localeCompare(b.status);

  protected sortUpdatedAt = (a: BpmnProcess, b: BpmnProcess): number =>
    a.updatedAt.localeCompare(b.updatedAt);

  loadProcesses() {
    return this.bpmnService.loadProcesses();
  }

  onSideResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.resizeId);
    this.resizeId = requestAnimationFrame(() => {
      if (width) {
        this.designerWidth.set(width);
      }
    });
  }

  openCreateModal(): void {
    const nextKey = 'BPMN-PROC-' + (this.processes().length + 1).toString().padStart(2, '0');
    const initial = {
      processKey: nextKey,
      name: 'Quy trình mới',
      description: '',
      category: 'GENERAL',
      version: 1,
      status: 'DRAFT',
    };
    this.selectedProcess.set(null);
    this.processFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isModalOpen.set(true);
  }

  openEditModal(process: BpmnProcess): void {
    const initial = {
      processKey: process.processKey,
      name: process.name,
      description: process.description || '',
      category: process.category || 'GENERAL',
      version: process.version || 1,
      status: process.status || 'DRAFT',
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
      current.processKey !== this.initialFormModel.processKey ||
      current.name !== this.initialFormModel.name ||
      current.description !== this.initialFormModel.description ||
      current.category !== this.initialFormModel.category ||
      current.version !== this.initialFormModel.version ||
      current.status !== this.initialFormModel.status
    );
  }

  closeModal(): void {
    if (this.hasUnsavedChanges()) {
      this.modal.confirm({
        nzTitle: 'Xác nhận đóng',
        nzContent:
          'Quy trình đã có thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?',
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
        processKey: formVal.processKey,
        name: formVal.name.trim() || event.name,
        description: formVal.description,
        category: formVal.category,
        version: Number(formVal.version) || 1,
        status: formVal.status,
        bpmnXml: event.xml,
      });

      this.forceCloseModal();
    });
  }

  deleteProcess(process: BpmnProcess, event?: Event): void {
    event?.stopPropagation();
    this.bpmnService.deleteProcess(process.id);
  }
}
