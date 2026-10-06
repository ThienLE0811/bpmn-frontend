import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { BpmnProcessService } from '@core/services';
import { BpmnProcess, getDefinitionStatusMeta } from '@core/models';
import { BpmnDesignerComponent } from '@shared/components/bpmn-designer/bpmn-designer.component';
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

interface BpmnProcessForm {
  processKey: string;
  name: string;
  description: string;
  category: string;
  version: number;
  status: string;
}

@Component({
  selector: 'app-bpmn-list',
  standalone: true,
  imports: [
    FormsModule,
    FormField,
    NzTableModule,
    NzListModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    // Cung cấp NzModalService cho DefinitionEditorStore (hộp xác nhận khi đóng)
    NzModalModule,
    BpmnDesignerComponent,
    TableAutoHeightDirective,
    PageHeaderComponent,
    StatCardComponent,
    FilterToolbarComponent,
    AdvancedFilterPanelComponent,
    StatusPillComponent,
    DesignerModalComponent,
  ],
  templateUrl: './bpmn-list.component.html',
  styleUrl: './bpmn-list.component.scss',
})
export class BpmnListComponent implements OnInit {
  @ViewChild(BpmnDesignerComponent) private designer?: BpmnDesignerComponent;

  private readonly bpmnService = inject(BpmnProcessService);

  protected readonly isStatsOpen = signal<boolean>(false);
  protected readonly isAdvancedFilterOpen = signal<boolean>(false);
  protected readonly viewDisplayMode = signal<'table' | 'list'>('table');
  protected readonly pageIndex = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly processes = this.bpmnService.processes;
  protected readonly isLoading = this.bpmnService.isLoading;
  protected readonly publishedCount = computed(
    () => this.processes().filter((p) => p.status === 'PUBLISHED').length,
  );
  protected readonly draftCount = computed(
    () => this.processes().filter((p) => p.status === 'DRAFT').length,
  );

  /** Chế độ xem danh sách tự phân trang (bảng dùng phân trang phía client của nz-table). */
  protected readonly paginatedProcesses = computed(() => {
    const page = this.pageIndex();
    const size = this.pageSize();
    return this.processes().slice((page - 1) * size, page * size);
  });

  // Bộ lọc (gửi lên API)
  protected readonly filter = createListFilter({
    processKey: '',
    name: '',
    category: 'ALL',
    status: 'ALL',
    version: '' as string | number,
    createdBy: '',
  });
  protected readonly filterModel = this.filter.model;
  protected readonly isFiltered = this.filter.isFiltered;
  protected readonly activeFilterCount = this.filter.activeCount;

  // Form thông tin quy trình trong modal
  protected readonly processFormModel = signal<BpmnProcessForm>({
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

  protected readonly editor = new DefinitionEditorStore<BpmnProcess, BpmnProcessForm>({
    formModel: this.processFormModel,
    form: this.processForm,
    keyField: 'processKey',
    entityLabel: 'Quy trình',
    designer: () => this.designer,
    createDefaults: () => ({
      processKey: 'BPMN-PROC-' + (this.processes().length + 1).toString().padStart(2, '0'),
      name: 'Quy trình mới',
      description: '',
      category: 'GENERAL',
      version: 1,
      status: 'DRAFT',
    }),
    toForm: (process) => ({
      processKey: process.processKey || '',
      name: process.name || '',
      description: process.description || '',
      category: process.category || 'GENERAL',
      version: process.version || 1,
      status: process.status || 'DRAFT',
    }),
    load: (id) => this.bpmnService.getProcessById(id),
    create: (f, xml, fallbackName) =>
      this.bpmnService.createProcess({
        processKey: f.processKey,
        name: f.name.trim() || fallbackName,
        description: f.description,
        category: f.category,
        bpmnXml: xml,
      }),
    update: (process, f, xml, fallbackName) =>
      this.bpmnService.updateProcess(process.id, {
        name: f.name.trim() || fallbackName,
        description: f.description,
        category: f.category,
        status: f.status,
        bpmnXml: xml,
      }),
    remove: (id) => this.bpmnService.deleteProcess(id),
    publish: (process) =>
      this.bpmnService.updateProcess(process.id, {
        name: process.name,
        description: process.description,
        category: process.category,
        status: 'PUBLISHED',
        bpmnXml: process.bpmnXml,
      }),
  });

  protected readonly modalLabels: DesignerModalLabels = {
    entity: 'Quy trình',
    icon: 'file-text',
    loadingText: 'Đang tải dữ liệu chi tiết quy trình từ máy chủ...',
    viewSubtitle: 'Xem thông tin chi tiết và dữ liệu nghiệp vụ quy trình',
    editSubtitle: 'Thiết lập thông số và dữ liệu nghiệp vụ quy trình',
    createButton: 'Tạo quy trình',
    deleteButton: 'Xóa quy trình',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa quy trình này không?',
    format: 'OMG BPMN 2.0 XML',
  };

  protected readonly getDefinitionStatusMeta = getDefinitionStatusMeta;

  // Sắp xếp bảng
  protected readonly sortProcessKey = sortByString<BpmnProcess>('processKey');
  protected readonly sortCategory = sortByString<BpmnProcess>('category');
  protected readonly sortName = sortByString<BpmnProcess>('name');
  protected readonly sortVersion = sortByNumber<BpmnProcess>('version');
  protected readonly sortStatus = sortByString<BpmnProcess>('status');
  protected readonly sortCreatedAt = sortByString<BpmnProcess>('createdAt');
  protected readonly sortUpdatedAt = sortByString<BpmnProcess>('updatedAt');

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.pageIndex.set(1);
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
