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
import { DmnDecisionService } from '@core/services';
import { DmnDecision } from '@core/models';
import { DmnDesignerComponent } from '@shared/components/dmn-designer/dmn-designer.component';
import { TableAutoHeightDirective } from '@shared/directives';

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
    NzInputModule,
    NzSelectModule,
    NzResizableModule,
    NzModalModule,
    NzSpinModule,
    DmnDesignerComponent,
    TableAutoHeightDirective,
  ],
  templateUrl: './dmn-list.component.html',
  styleUrl: './dmn-list.component.scss',
})
export class DmnListComponent implements OnInit {
  @ViewChild(DmnDesignerComponent) protected designerComponent?: DmnDesignerComponent;

  private dmnService = inject(DmnDecisionService);
  private modal = inject(NzModalService);

  ngOnInit(): void {
    this.search();
  }

  protected isModalOpen = signal<boolean>(false);
  protected modalMode = signal<'view' | 'edit' | 'create'>('edit');
  protected isDetailLoading = signal<boolean>(false);
  protected isSubmitting = signal<boolean>(false);
  protected isStatsOpen = signal<boolean>(false);
  protected selectedDecision = signal<DmnDecision | null>(null);
  protected pageSize = signal<number>(10);
  protected designerWidth = signal<number | null>(null);
  private resizeId = -1;
  private initialFormModel: {
    decisionKey: string;
    name: string;
    description: string;
    hitPolicy: string;
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
    decisionKey: '',
    name: '',
    category: 'ALL',
    hitPolicy: 'ALL',
    status: 'ALL',
    version: '' as string | number,
    createdBy: '',
  });

  protected readonly activeFilterCount = computed(() => {
    const m = this.filterModel();
    let count = 0;
    if (m.decisionKey.trim()) count++;
    if (m.name.trim()) count++;
    if (m.category !== 'ALL') count++;
    if (m.hitPolicy !== 'ALL') count++;
    if (m.status !== 'ALL') count++;
    if (m.version !== '' && m.version !== null && m.version !== undefined) count++;
    if (m.createdBy.trim()) count++;
    return count;
  });

  protected readonly isFiltered = computed(() => this.activeFilterCount() > 0);

  toggleAdvancedFilter(): void {
    this.isAdvancedFilterOpen.update((v) => !v);
  }

  // Signal Form for Decision Information
  protected readonly decisionFormModel = signal({
    decisionKey: '',
    name: '',
    description: '',
    hitPolicy: 'FIRST',
    category: 'GENERAL',
    version: 1,
    status: 'DRAFT',
  });

  protected readonly decisionForm = form(this.decisionFormModel, (schema) => {
    required(schema.decisionKey, { message: 'Mã bảng quyết định không được để trống' });
    required(schema.name, { message: 'Tên bảng quyết định không được để trống' });
    required(schema.category, { message: 'Danh mục không được để trống' });
  });

  protected decisions = this.dmnService.decisions;
  protected isLoading = this.dmnService.isLoading;

  protected publishedCount = computed(
    () => this.decisions().filter((d) => d.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.decisions().filter((d) => d.status === 'DRAFT').length,
  );

  search(): void {
    const m = this.filterModel();
    this.dmnService.loadDecisions({
      decisionKey: m.decisionKey,
      name: m.name,
      category: m.category,
      hitPolicy: m.hitPolicy,
      status: m.status,
      version: m.version !== '' && m.version !== null ? Number(m.version) : undefined,
      createdBy: m.createdBy,
    });
  }

  resetFilters(): void {
    this.filterModel.set({
      decisionKey: '',
      name: '',
      category: 'ALL',
      hitPolicy: 'ALL',
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

  onHitPolicyChange(hitPolicy: string): void {
    this.filterModel.update((m) => ({ ...m, hitPolicy }));
    this.search();
  }

  onStatusChange(status: string): void {
    this.filterModel.update((m) => ({ ...m, status }));
    this.search();
  }

  loadDecisions(): void {
    this.search();
  }

  // Table Sort Comparators
  protected sortDecisionKey = (a: DmnDecision, b: DmnDecision): number =>
    (a.decisionKey || '').localeCompare(b.decisionKey || '');

  protected sortName = (a: DmnDecision, b: DmnDecision): number =>
    (a.name || '').localeCompare(b.name || '');

  protected sortCategory = (a: DmnDecision, b: DmnDecision): number =>
    (a.category || '').localeCompare(b.category || '');

  protected sortHitPolicy = (a: DmnDecision, b: DmnDecision): number =>
    (a.hitPolicy || '').localeCompare(b.hitPolicy || '');

  protected sortVersion = (a: DmnDecision, b: DmnDecision): number =>
    (a.version || 0) - (b.version || 0);

  protected sortStatus = (a: DmnDecision, b: DmnDecision): number =>
    (a.status || '').localeCompare(b.status || '');

  protected sortUpdatedAt = (a: DmnDecision, b: DmnDecision): number =>
    (a.updatedAt || '').localeCompare(b.updatedAt || '');

  onSideResize({ width }: NzResizeEvent): void {
    cancelAnimationFrame(this.resizeId);
    this.resizeId = requestAnimationFrame(() => {
      if (width) {
        this.designerWidth.set(width);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    const nextKey = 'DMN-DEC-' + (this.decisions().length + 1).toString().padStart(2, '0');
    const initial = {
      decisionKey: nextKey,
      name: 'Bảng quyết định mới',
      description: '',
      hitPolicy: 'FIRST',
      category: 'GENERAL',
      version: 1,
      status: 'DRAFT',
    };
    this.selectedDecision.set(null);
    this.decisionFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
    this.isDetailLoading.set(false);
    this.isModalOpen.set(true);
  }

  openDetailModal(decision: DmnDecision, event?: Event): void {
    event?.stopPropagation();
    this.loadAndOpenModal(decision.id, 'view', decision);
  }

  openEditModal(decision: DmnDecision, event?: Event): void {
    event?.stopPropagation();
    this.loadAndOpenModal(decision.id, 'edit', decision);
  }

  switchToEditMode(): void {
    this.modalMode.set('edit');
  }

  private loadAndOpenModal(id: string, mode: 'view' | 'edit', fallbackDecision?: DmnDecision): void {
    this.modalMode.set(mode);
    this.isModalOpen.set(true);
    this.isDetailLoading.set(true);

    if (fallbackDecision) {
      this.selectedDecision.set(fallbackDecision);
      this.populateFormModel(fallbackDecision);
    }

    // Gọi API chi tiết /api/dmn-decisions/{id}
    this.dmnService.getDecisionById(id).subscribe({
      next: (detail) => {
        const fullData = detail || fallbackDecision;
        if (fullData) {
          this.selectedDecision.set(fullData);
          this.populateFormModel(fullData);
        }
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        console.warn(
          `Không thể tải chi tiết bảng quyết định (${id}) từ API /api/dmn-decisions/${id}, sử dụng dữ liệu tạm thời:`,
          err,
        );
        if (fallbackDecision) {
          this.selectedDecision.set(fallbackDecision);
          this.populateFormModel(fallbackDecision);
        }
        this.isDetailLoading.set(false);
      },
    });
  }

  private populateFormModel(decision: DmnDecision): void {
    const initial = {
      decisionKey: decision.decisionKey || '',
      name: decision.name || '',
      description: decision.description || '',
      hitPolicy: decision.hitPolicy || 'FIRST',
      category: decision.category || 'GENERAL',
      version: typeof decision.version === 'number' ? decision.version : 1,
      status: decision.status || 'DRAFT',
    };
    this.decisionFormModel.set({ ...initial });
    this.initialFormModel = { ...initial };
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
      current.decisionKey !== this.initialFormModel.decisionKey ||
      current.name !== this.initialFormModel.name ||
      current.description !== this.initialFormModel.description ||
      current.hitPolicy !== this.initialFormModel.hitPolicy ||
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
          'Bảng quyết định đã có thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?',
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
    this.isDetailLoading.set(false);
    this.isSubmitting.set(false);
  }

  submitFromSidebar(): void {
    if (this.designerComponent) {
      this.designerComponent.onSave();
    }
  }

  onSaveFromModal(event: { name: string; xml: string }): void {
    submit(this.decisionForm, async () => {
      const current = this.selectedDecision();
      const formVal = this.decisionFormModel();

      if (this.modalMode() === 'create' || !current?.id) {
        // Gọi API tạo mới: POST /api/dmn-decisions
        this.isSubmitting.set(true);
        this.dmnService
          .createDecision({
            decisionKey: formVal.decisionKey,
            name: formVal.name.trim() || event.name,
            description: formVal.description,
            hitPolicy: formVal.hitPolicy,
            category: formVal.category,
            dmnXml: event.xml,
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
        // Cập nhật bảng quyết định hiện tại: PUT /api/dmn-decisions/:id
        this.isSubmitting.set(true);
        this.dmnService
          .updateDecision(current.id, {
            name: formVal.name.trim() || event.name,
            description: formVal.description,
            hitPolicy: formVal.hitPolicy,
            category: formVal.category,
            status: formVal.status,
            dmnXml: event.xml,
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

  deleteDecision(decision: DmnDecision, event?: Event): void {
    event?.stopPropagation();
    // Gọi API xóa: DELETE /api/dmn-decisions/:id
    this.dmnService.deleteDecision(decision.id).subscribe();
  }

  deleteFromModal(): void {
    const current = this.selectedDecision();
    if (!current?.id) return;
    this.isSubmitting.set(true);
    // Gọi API xóa: DELETE /api/dmn-decisions/:id
    this.dmnService.deleteDecision(current.id).subscribe({
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
