import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BpmnProcessService } from '@core/services';
import { BpmnProcess, BpmnProcessStatus } from '@core/models';
import { BpmnDesignerComponent } from '@shared/components/bpmn-designer/bpmn-designer.component';
import { TableAutoHeightDirective } from '@shared/directives';

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
    NzInputModule,
    NzSelectModule,
    NzResizableModule,
    NzModalModule,
    NzSpinModule,
    BpmnDesignerComponent,
    TableAutoHeightDirective,
  ],
  templateUrl: './bpmn-list.component.html',
  styleUrl: './bpmn-list.component.scss',
})
export class BpmnListComponent implements OnInit {
  @ViewChild(BpmnDesignerComponent) protected designerComponent?: BpmnDesignerComponent;

  private bpmnService = inject(BpmnProcessService);
  private modal = inject(NzModalService);

  ngOnInit(): void {
    this.search();
  }

  protected isModalOpen = signal<boolean>(false);
  protected modalMode = signal<'view' | 'edit' | 'create'>('edit');
  protected initialDesignerMode = signal<'design' | 'xml'>('design');
  protected isDetailLoading = signal<boolean>(false);
  protected isStatsOpen = signal<boolean>(false);
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

  toggleStats(): void {
    this.isStatsOpen.update((v) => !v);
  }

  // Filter State for Server-side API query
  protected isAdvancedFilterOpen = signal<boolean>(false);

  protected readonly filterModel = signal({
    processKey: '',
    name: '',
    category: 'ALL',
    status: 'ALL',
    version: '' as string | number,
    createdBy: '',
  });

  protected readonly activeFilterCount = computed(() => {
    const m = this.filterModel();
    let count = 0;
    if (m.processKey.trim()) count++;
    if (m.name.trim()) count++;
    if (m.category !== 'ALL') count++;
    if (m.status !== 'ALL') count++;
    if (m.version !== '' && m.version !== null && m.version !== undefined) count++;
    if (m.createdBy.trim()) count++;
    return count;
  });

  protected readonly isFiltered = computed(() => this.activeFilterCount() > 0);

  toggleAdvancedFilter(): void {
    this.isAdvancedFilterOpen.update((v) => !v);
  }

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

  search(): void {
    const m = this.filterModel();
    this.bpmnService.loadProcesses({
      processKey: m.processKey,
      name: m.name,
      category: m.category,
      status: m.status,
      version: m.version !== '' && m.version !== null ? Number(m.version) : undefined,
      createdBy: m.createdBy,
    });
  }

  resetFilters(): void {
    this.filterModel.set({
      processKey: '',
      name: '',
      category: 'ALL',
      status: 'ALL',
      version: '',
      createdBy: '',
    });
    this.search();
  }

  onCategoryChange(category: string): void {
    this.filterModel.update((m) => ({ ...m, category }));
    this.search();
  }

  onStatusChange(status: string): void {
    this.filterModel.update((m) => ({ ...m, status }));
    this.search();
  }

  loadProcesses(): void {
    this.search();
  }

  onSideResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.resizeId);
    this.resizeId = requestAnimationFrame(() => {
      if (width) {
        this.designerWidth.set(width);
      }
    });
  }

  openCreateModal(mode: 'design' | 'xml' = 'design'): void {
    this.initialDesignerMode.set(mode);
    this.modalMode.set('create');
    const nextKey = 'BPMN-PROC-' + (this.processes().length + 1).toString().padStart(2, '0');
    const initial = {
      processKey: nextKey,
      name: mode === 'xml' ? 'Quy trình tạo từ XML' : 'Quy trình mới',
      description: '',
      category: 'GENERAL',
      version: 1,
      status: 'DRAFT',
    };
    this.selectedProcess.set(null);
    this.processFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isDetailLoading.set(false);
    this.isModalOpen.set(true);
  }

  openDetailModal(process: BpmnProcess, event?: Event): void {
    event?.stopPropagation();
    this.initialDesignerMode.set('design');
    this.loadAndOpenModal(process.id, 'view', process);
  }

  openEditModal(process: BpmnProcess, event?: Event): void {
    event?.stopPropagation();
    this.initialDesignerMode.set('design');
    this.loadAndOpenModal(process.id, 'edit', process);
  }

  switchToEditMode(): void {
    this.modalMode.set('edit');
  }

  private loadAndOpenModal(id: string, mode: 'view' | 'edit', fallbackProcess?: BpmnProcess): void {
    this.modalMode.set(mode);
    this.isModalOpen.set(true);
    this.isDetailLoading.set(true);

    if (fallbackProcess) {
      this.selectedProcess.set(fallbackProcess);
      this.populateFormModel(fallbackProcess);
    }

    // Gọi API chi tiết /api/bpmn-processes/{id}
    this.bpmnService.getProcessById(id).subscribe({
      next: (detail) => {
        const fullData = detail || fallbackProcess;
        if (fullData) {
          this.selectedProcess.set(fullData);
          this.populateFormModel(fullData);
        }
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        console.warn(
          `Không thể tải chi tiết quy trình (${id}) từ API /api/bpmn-processes/${id}, sử dụng dữ liệu tạm thời:`,
          err,
        );
        if (fallbackProcess) {
          this.selectedProcess.set(fallbackProcess);
          this.populateFormModel(fallbackProcess);
        }
        this.isDetailLoading.set(false);
      },
    });
  }

  private populateFormModel(process: BpmnProcess): void {
    const initial = {
      processKey: process.processKey || '',
      name: process.name || '',
      description: process.description || '',
      category: process.category || 'GENERAL',
      version: process.version || 1,
      status: process.status || 'DRAFT',
    };
    this.processFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
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

  protected isSubmitting = signal<boolean>(false);

  protected forceCloseModal(): void {
    this.isModalOpen.set(false);
    this.selectedProcess.set(null);
    this.initialFormModel = null;
    this.isDetailLoading.set(false);
    this.isSubmitting.set(false);
  }

  submitFromSidebar(): void {
    if (this.designerComponent) {
      this.designerComponent.onSave();
    }
  }

  onSaveFromModal(event: { name: string; xml: string }): void {
    submit(this.processForm, async () => {
      const current = this.selectedProcess();
      const formVal = this.processFormModel();

      if (this.modalMode() === 'create' || !current?.id) {
        // Gọi API tạo mới: POST /api/bpmn-processes
        this.isSubmitting.set(true);
        this.bpmnService
          .createProcess({
            processKey: formVal.processKey,
            name: formVal.name.trim() || event.name,
            description: formVal.description,
            category: formVal.category,
            bpmnXml: event.xml,
            createdBy: 'Admin',
          })
          .subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.forceCloseModal();
            },
            error: () => {
              this.isSubmitting.set(false);
            },
          });
      } else {
        // Cập nhật quy trình hiện tại: PUT /api/bpmn-processes/:id
        this.isSubmitting.set(true);
        this.bpmnService
          .updateProcess(current.id, {
            name: formVal.name.trim() || event.name,
            description: formVal.description,
            category: formVal.category,
            status: formVal.status,
            bpmnXml: event.xml,
            updatedBy: 'Admin',
          })
          .subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.forceCloseModal();
            },
            error: () => {
              this.isSubmitting.set(false);
            },
          });
      }
    });
  }

  deleteProcess(process: BpmnProcess, event?: Event): void {
    event?.stopPropagation();
    // Gọi API xóa: DELETE /api/bpmn-processes/:id
    this.bpmnService.deleteProcess(process.id).subscribe();
  }

  deleteFromModal(): void {
    const current = this.selectedProcess();
    if (!current?.id) return;
    this.isSubmitting.set(true);
    // Gọi API xóa: DELETE /api/bpmn-processes/:id
    this.bpmnService.deleteProcess(current.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.forceCloseModal();
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
  }
}
