import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { CaseService, BpmnProcessService, FormSchemaService } from '@core/services';
import {
  ProcessInstance,
  getCaseStatusMeta,
  StartProcessInstanceRequest,
  FormDefinition,
} from '@core/models';
import { DynamicFormRendererComponent } from '@shared/components/dynamic-form-renderer/dynamic-form-renderer.component';
import {
  formatDisplayDateTime,
  copyToClipboard,
  sortByString,
  createListFilter,
} from '@shared/utils';
import {
  PageHeaderComponent,
  StatCardComponent,
  FilterToolbarComponent,
  StatusPillComponent,
} from '@shared/components/list-page';
import { AvatarColorPipe, UserInitialsPipe, FormatDatePipe } from '@shared/pipes';
import { TableAutoHeightDirective } from '@shared/directives';
import { OperateViewerComponent } from '../operate/operate-viewer/operate-viewer.component';

export interface VariableRow {
  key: string;
  value: string;
  type: string;
}

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzSelectModule,
    NzTagModule,
    NzDrawerModule,
    NzModalModule,
    NzTooltipModule,
    NzDescriptionsModule,
    NzTabsModule,
    NzTimelineModule,
    NzSpinModule,
    TableAutoHeightDirective,
    AvatarColorPipe,
    UserInitialsPipe,
    FormatDatePipe,
    OperateViewerComponent,
    DynamicFormRendererComponent,
    PageHeaderComponent,
    StatCardComponent,
    FilterToolbarComponent,
    StatusPillComponent,
  ],
  templateUrl: './case-list.component.html',
  styleUrl: './case-list.component.scss',
})
export class CaseListComponent implements OnInit {
  protected readonly caseService = inject(CaseService);
  protected readonly bpmnService = inject(BpmnProcessService);
  protected readonly formSchemaService = inject(FormSchemaService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  // Trạng thái giao diện
  readonly isStatsOpen = signal<boolean>(true);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isStartModalVisible = signal<boolean>(false);
  readonly selectedDrawerTab = signal<number>(0);

  // Bộ lọc
  readonly filter = createListFilter({ search: '', status: 'ALL', processId: 'ALL' });
  readonly filterModel = this.filter.model;
  readonly isFiltered = this.filter.isFiltered;

  // Modal khởi động Case mới & Biểu mẫu động
  readonly startProcessId = signal<string>('');
  readonly startFormSchema = signal<FormDefinition | null>(null);
  readonly startFormVariables = signal<Record<string, unknown>>({});
  readonly isStartFormValid = signal<boolean>(true);

  // BPMN XML của case được chọn để hiển thị trong Viewer
  readonly currentCaseBpmnXml = signal<string | null>(null);

  // Dữ liệu từ Service
  readonly cases = this.caseService.cases;
  readonly selectedCase = this.caseService.selectedCase;
  readonly isLoading = this.caseService.isLoading;
  readonly isDetailLoading = this.caseService.isDetailLoading;
  readonly isStarting = this.caseService.isStarting;
  readonly processes = this.bpmnService.processes;

  // Thống kê
  readonly totalCount = this.caseService.totalCount;
  readonly runningCount = this.caseService.runningCount;
  readonly completedCount = this.caseService.completedCount;

  // Chuyển đổi biến sang dạng bảng
  readonly selectedCaseVariables = computed<VariableRow[]>(() => {
    const c = this.selectedCase();
    if (!c || !c.variables) return [];
    return Object.entries(c.variables).map(([key, val]) => ({
      key,
      value: typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val),
      type: Array.isArray(val) ? 'Array' : typeof val,
    }));
  });

  // Định dạng JSON chuỗi của biến
  readonly selectedCaseVariablesJson = computed<string>(() => {
    const c = this.selectedCase();
    if (!c || !c.variables) return '{}';
    return JSON.stringify(c.variables, null, 2);
  });

  // Node đang chạy của case
  readonly activeActivityIds = computed<string[]>(() => {
    const c = this.selectedCase();
    if (c && c.status === 'RUNNING' && c.currentNodeId) {
      return [c.currentNodeId];
    }
    return [];
  });

  // Helpers
  readonly getCaseStatusMeta = getCaseStatusMeta;

  ngOnInit(): void {
    this.bpmnService.loadProcesses();
    this.loadCases();
  }

  /** Tải lại trang hiện tại với bộ lọc hiện tại. */
  loadCases(): void {
    this.queryCases(this.caseService.currentPage(), this.caseService.pageSize());
  }

  onPageSizeChange(size: number): void {
    this.queryCases(1, size);
  }

  onPageIndexChange(page: number): void {
    // nz-table cũng phát pageIndexChange khi đổi pageSize - tránh gọi API 2 lần
    if (page === this.caseService.currentPage()) return;
    this.queryCases(page, this.caseService.pageSize());
  }

  /** Bộ lọc thay đổi - quay về trang đầu. */
  search(): void {
    this.queryCases(1, this.caseService.pageSize());
  }

  resetFilters(): void {
    this.filter.reset();
    this.search();
  }

  onStatusFilterChange(status: string): void {
    this.filter.patch({ status });
    this.search();
  }

  onProcessFilterChange(processId: string): void {
    this.filter.patch({ processId });
    this.search();
  }

  /** Mọi lần gọi API đều phải kèm bộ lọc đang áp dụng, kể cả khi chuyển trang. */
  private queryCases(page: number, size: number): void {
    const { status, processId, search } = this.filterModel();
    this.caseService.loadCases({
      status: status !== 'ALL' ? status : undefined,
      processId: processId !== 'ALL' ? processId : undefined,
      search: search.trim() || undefined,
      page,
      size,
    });
  }

  // Khởi động case
  openStartModal(preselectProcessId?: string): void {
    let targetId = preselectProcessId;
    if (!targetId && this.processes().length > 0) {
      targetId = this.processes()[0].id || this.processes()[0].processKey;
    }
    if (targetId) {
      this.startProcessId.set(targetId);
      this.updateStartFormSchema(targetId);
    }
    this.isStartModalVisible.set(true);
  }

  onStartProcessChange(processId: string): void {
    this.startProcessId.set(processId);
    this.updateStartFormSchema(processId);
  }

  updateStartFormSchema(processId: string): void {
    const proc = this.processes().find((p) => p.id === processId || p.processKey === processId);
    const keyToResolve = proc?.processKey || processId;
    const schema = this.formSchemaService.getFormForProcessStart(keyToResolve);
    this.startFormSchema.set(schema);
    const initVals = this.formSchemaService.extractFormValues(schema);
    this.startFormVariables.set(initVals);
    this.isStartFormValid.set(true);
  }

  onStartFormValuesChange(vals: Record<string, unknown>): void {
    this.startFormVariables.set(vals);
  }

  closeStartModal(): void {
    this.isStartModalVisible.set(false);
  }

  applySampleVariables(sampleType: 'order' | 'loan' | 'leave'): void {
    let targetKey = 'Process_OrderFulfillment';
    if (sampleType === 'loan') targetKey = 'Process_LoanApproval';
    if (sampleType === 'leave') targetKey = 'Process_LeaveRequest';

    const found = this.processes().find((p) => p.processKey === targetKey || p.id === targetKey);
    if (found) {
      this.startProcessId.set(found.id || found.processKey);
    }
    this.updateStartFormSchema(targetKey);
  }

  submitStartCase(): void {
    const processId = this.startProcessId();
    if (!processId) {
      this.message.warning('Vui lòng chọn một Quy trình BPMN để khởi động.');
      return;
    }

    if (!this.isStartFormValid()) {
      this.message.warning('Dữ liệu biểu mẫu khởi tạo chưa hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    const payload: StartProcessInstanceRequest = {
      processId,
      variables: this.startFormVariables(),
    };

    this.caseService.startCase(payload).subscribe({
      next: (created) => {
        this.closeStartModal();
        if (created) {
          this.openDetailDrawer(created);
        }
      },
    });
  }

  // Drawer chi tiết
  openDetailDrawer(instance: ProcessInstance): void {
    this.caseService.selectCase(instance);
    this.selectedDrawerTab.set(0);

    // Tìm BPMN XML tương ứng của process nếu có
    const proc = this.processes().find(
      (p) => p.id === instance.processId || p.processKey === instance.processId,
    );
    if (proc && proc.bpmnXml) {
      this.currentCaseBpmnXml.set(proc.bpmnXml);
    } else {
      // Thử gọi getProcessById nếu chưa có XML
      if (proc?.id) {
        this.bpmnService.getProcessById(proc.id).subscribe((p) => {
          this.currentCaseBpmnXml.set(p?.bpmnXml || null);
        });
      } else {
        this.currentCaseBpmnXml.set(null);
      }
    }

    this.isDrawerOpen.set(true);
  }

  closeDetailDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  // Điều hướng nhanh đến trang Tasks nếu đang dừng ở User Task
  navigateToTask(instanceId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/tasks'], {
      queryParams: {
        search: instanceId,
      },
    });
  }

  copyToClipboard(text: string, event?: Event): void {
    copyToClipboard(text, this.message, undefined, event);
  }

  readonly formatDisplayTime = formatDisplayDateTime;

  getProcessDisplayName(processId: string): string {
    const p = this.processes().find((item) => item.id === processId || item.processKey === processId);
    return p ? p.name : processId;
  }

  // Sắp xếp các cột bảng
  sortId = sortByString<ProcessInstance>('id');
  sortProcess = (a: ProcessInstance, b: ProcessInstance): number =>
    this.getProcessDisplayName(a.processId).localeCompare(this.getProcessDisplayName(b.processId));
  sortStatus = sortByString<ProcessInstance>('status');
  sortCurrentNode = sortByString<ProcessInstance>('currentNodeId');
  sortStartedBy = sortByString<ProcessInstance>('startedBy');
  sortStartedAt = sortByString<ProcessInstance>('startedAt');
  sortCompletedAt = sortByString<ProcessInstance>('completedAt');
}
