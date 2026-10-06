import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DmnDecisionService } from '@core/services';
import { DmnDecision, getDefinitionStatusMeta } from '@core/models';
import { DmnDesignerComponent } from '@shared/components/dmn-designer/dmn-designer.component';
import {
  AdvancedFilterPanelComponent,
  FilterToolbarComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusPillComponent,
} from '@shared/components/list-page';
import {
  DefinitionEditorStore,
  DesignerModalComponent,
  DesignerModalLabels,
} from '@shared/components/designer-modal';
import { TableAutoHeightDirective } from '@shared/directives';
import { createListFilter, sortByString, sortByNumber } from '@shared/utils';

interface DmnDecisionForm {
  decisionKey: string;
  name: string;
  description: string;
  hitPolicy: string;
  category: string;
  version: number;
  status: string;
}

@Component({
  selector: 'app-dmn-list',
  standalone: true,
  imports: [
    FormsModule,
    FormField,
    NzTableModule,
    NzPopconfirmModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    // Cung cấp NzModalService cho DefinitionEditorStore (hộp xác nhận khi đóng)
    NzModalModule,
    DmnDesignerComponent,
    TableAutoHeightDirective,
    PageHeaderComponent,
    StatCardComponent,
    FilterToolbarComponent,
    AdvancedFilterPanelComponent,
    StatusPillComponent,
    DesignerModalComponent,
  ],
  templateUrl: './dmn-list.component.html',
  styleUrl: './dmn-list.component.scss',
})
export class DmnListComponent implements OnInit {
  @ViewChild(DmnDesignerComponent) private designer?: DmnDesignerComponent;

  private readonly dmnService = inject(DmnDecisionService);

  protected readonly isStatsOpen = signal<boolean>(false);
  protected readonly isAdvancedFilterOpen = signal<boolean>(false);
  protected readonly pageIndex = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly decisions = this.dmnService.decisions;
  protected readonly isLoading = this.dmnService.isLoading;
  protected readonly publishedCount = computed(
    () => this.decisions().filter((d) => d.status === 'PUBLISHED').length,
  );
  protected readonly draftCount = computed(
    () => this.decisions().filter((d) => d.status === 'DRAFT').length,
  );

  // Bộ lọc (gửi lên API)
  protected readonly filter = createListFilter({
    decisionKey: '',
    name: '',
    category: 'ALL',
    hitPolicy: 'ALL',
    status: 'ALL',
    version: '' as string | number,
    createdBy: '',
  });
  protected readonly filterModel = this.filter.model;
  protected readonly isFiltered = this.filter.isFiltered;
  protected readonly activeFilterCount = this.filter.activeCount;

  // Form thông tin bảng quyết định trong modal
  protected readonly decisionFormModel = signal<DmnDecisionForm>({
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

  protected readonly editor = new DefinitionEditorStore<DmnDecision, DmnDecisionForm>({
    formModel: this.decisionFormModel,
    form: this.decisionForm,
    keyField: 'decisionKey',
    entityLabel: 'Bảng quyết định',
    designer: () => this.designer,
    createDefaults: () => ({
      decisionKey: 'DMN-DEC-' + (this.decisions().length + 1).toString().padStart(2, '0'),
      name: 'Bảng quyết định mới',
      description: '',
      hitPolicy: 'FIRST',
      category: 'GENERAL',
      version: 1,
      status: 'DRAFT',
    }),
    toForm: (decision) => ({
      decisionKey: decision.decisionKey || '',
      name: decision.name || '',
      description: decision.description || '',
      hitPolicy: decision.hitPolicy || 'FIRST',
      category: decision.category || 'GENERAL',
      version: typeof decision.version === 'number' ? decision.version : 1,
      status: decision.status || 'DRAFT',
    }),
    load: (id) => this.dmnService.getDecisionById(id),
    create: (f, xml, fallbackName) =>
      this.dmnService.createDecision({
        decisionKey: f.decisionKey,
        name: f.name.trim() || fallbackName,
        description: f.description,
        hitPolicy: f.hitPolicy,
        category: f.category,
        dmnXml: xml,
      }),
    update: (decision, f, xml, fallbackName) =>
      this.dmnService.updateDecision(decision.id, {
        name: f.name.trim() || fallbackName,
        description: f.description,
        hitPolicy: f.hitPolicy,
        category: f.category,
        status: f.status,
        dmnXml: xml,
      }),
    remove: (id) => this.dmnService.deleteDecision(id),
  });

  protected readonly modalLabels: DesignerModalLabels = {
    entity: 'Bảng Quyết định',
    icon: 'table',
    loadingText: 'Đang tải dữ liệu chi tiết bảng quyết định từ máy chủ...',
    viewSubtitle: 'Xem thông tin chi tiết và quy tắc quyết định DMN',
    editSubtitle: 'Thiết lập thông số và quy tắc quyết định DMN',
    createButton: 'Tạo DMN',
    deleteButton: 'Xóa quyết định',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa bảng quyết định này không?',
    format: 'OMG DMN 1.3 XML',
  };

  protected readonly getDefinitionStatusMeta = getDefinitionStatusMeta;

  // Sắp xếp bảng
  protected readonly sortDecisionKey = sortByString<DmnDecision>('decisionKey');
  protected readonly sortName = sortByString<DmnDecision>('name');
  protected readonly sortCategory = sortByString<DmnDecision>('category');
  protected readonly sortHitPolicy = sortByString<DmnDecision>('hitPolicy');
  protected readonly sortVersion = sortByNumber<DmnDecision>('version');
  protected readonly sortStatus = sortByString<DmnDecision>('status');
  protected readonly sortUpdatedAt = sortByString<DmnDecision>('updatedAt');

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.pageIndex.set(1);
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
    this.filter.reset();
    this.search();
  }

  onStatusChange(status: string): void {
    this.filter.patch({ status });
    this.search();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
  }
}
