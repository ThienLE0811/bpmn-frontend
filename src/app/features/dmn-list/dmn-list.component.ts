import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { DmnDecisionService } from '@core/services';
import { DmnDecision, DmnDecisionStatus } from '@core/models';
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
export class DmnListComponent implements OnInit {
  @ViewChild(DmnDesignerComponent) protected designerComponent?: DmnDesignerComponent;

  private dmnService = inject(DmnDecisionService);
  private modal = inject(NzModalService);

  ngOnInit(): void {
    this.loadDecisions();
  }

  loadDecisions(): void {
    this.dmnService.loadDecisions();
  }

  protected isModalOpen = signal<boolean>(false);
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
    required(schema.version, { message: 'Phiên bản không được để trống' });
  });

  protected decisions = this.dmnService.decisions;
  protected isLoading = this.dmnService.isLoading;

  protected publishedCount = computed(
    () => this.decisions().filter((d) => d.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.decisions().filter((d) => d.status === 'DRAFT').length,
  );

  // Table Sort Comparators
  protected sortDecisionKey = (a: DmnDecision, b: DmnDecision): number =>
    (a.decisionKey || '').localeCompare(b.decisionKey || '');

  protected sortName = (a: DmnDecision, b: DmnDecision): number =>
    (a.name || '').localeCompare(b.name || '');

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
    this.isModalOpen.set(true);
  }

  openEditModal(decision: DmnDecision): void {
    const initial = {
      decisionKey: decision.decisionKey,
      name: decision.name,
      description: decision.description || '',
      hitPolicy: decision.hitPolicy || 'FIRST',
      category: decision.category || 'GENERAL',
      version: typeof decision.version === 'number' ? decision.version : 1,
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
        decisionKey: formVal.decisionKey,
        name: formVal.name.trim() || event.name,
        description: formVal.description,
        hitPolicy: formVal.hitPolicy,
        category: formVal.category,
        version: Number(formVal.version) || 1,
        status: formVal.status,
        dmnXml: event.xml,
      });

      this.forceCloseModal();
    });
  }

  deleteDecision(decision: DmnDecision, event?: Event): void {
    event?.stopPropagation();
    this.dmnService.deleteDecision(decision.id);
  }
}
