import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';

import { CaseService, BpmnProcessService, AuthService } from '@core/services';
import {
  ProcessInstance,
  getCaseStatusMeta,
  StartProcessInstanceRequest,
  BpmnProcess,
} from '@core/models';
import { getAvatarColor, getUserInitials, formatDateTime } from '@shared/utils';
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
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzDrawerModule,
    NzModalModule,
    NzTooltipModule,
    NzBadgeModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzTabsModule,
    NzTimelineModule,
    NzSpinModule,
    NzEmptyModule,
    OperateViewerComponent,
  ],
  templateUrl: './case-list.component.html',
  styleUrl: './case-list.component.scss',
})
export class CaseListComponent implements OnInit {
  protected readonly caseService = inject(CaseService);
  protected readonly bpmnService = inject(BpmnProcessService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  // Trạng thái giao diện
  readonly isStatsOpen = signal<boolean>(true);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isStartModalVisible = signal<boolean>(false);
  readonly selectedDrawerTab = signal<number>(0);

  // Bộ lọc
  readonly filterModel = signal<{
    search: string;
    status: string;
    processId: string;
  }>({
    search: '',
    status: 'ALL',
    processId: 'ALL',
  });

  // Modal khởi động Case mới
  readonly startProcessId = signal<string>('');
  readonly startVariablesJson = signal<string>(
    JSON.stringify({ amount: 5000, customer: 'Khách hàng thử nghiệm', note: 'Khởi động từ portal' }, null, 2),
  );
  readonly jsonError = signal<string | null>(null);

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

  // Kiểm tra bộ lọc
  readonly isFiltered = computed(() => {
    const f = this.filterModel();
    return !!f.search.trim() || f.status !== 'ALL' || f.processId !== 'ALL';
  });

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
  readonly getAvatarColor = getAvatarColor;
  readonly getUserInitials = getUserInitials;

  ngOnInit(): void {
    this.bpmnService.loadProcesses();
    this.loadCases();
  }

  loadCases(): void {
    const { status, processId, search } = this.filterModel();
    this.caseService.loadCases({
      status: status !== 'ALL' ? status : undefined,
      processId: processId !== 'ALL' ? processId : undefined,
      search: search.trim() || undefined,
      page: 1,
      size: this.caseService.pageSize(),
    });
  }

  onPageSizeChange(size: number): void {
    this.caseService.loadCases({
      page: 1,
      size,
    });
  }

  onPageIndexChange(page: number): void {
    this.caseService.loadCases({
      page,
      size: this.caseService.pageSize(),
    });
  }

  search(): void {
    this.loadCases();
  }

  resetFilters(): void {
    this.filterModel.set({
      search: '',
      status: 'ALL',
      processId: 'ALL',
    });
    this.loadCases();
  }

  onStatusFilterChange(status: string): void {
    this.filterModel.update((m) => ({ ...m, status }));
    this.loadCases();
  }

  onProcessFilterChange(processId: string): void {
    this.filterModel.update((m) => ({ ...m, processId }));
    this.loadCases();
  }

  toggleStats(): void {
    this.isStatsOpen.set(!this.isStatsOpen());
  }

  // Khởi động case
  openStartModal(preselectProcessId?: string): void {
    if (preselectProcessId) {
      this.startProcessId.set(preselectProcessId);
    } else if (this.processes().length > 0 && !this.startProcessId()) {
      this.startProcessId.set(this.processes()[0].id || this.processes()[0].processKey);
    }
    this.jsonError.set(null);
    this.isStartModalVisible.set(true);
  }

  closeStartModal(): void {
    this.isStartModalVisible.set(false);
  }

  applySampleVariables(sampleType: 'order' | 'loan' | 'leave'): void {
    if (sampleType === 'order') {
      this.startVariablesJson.set(
        JSON.stringify(
          {
            orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
            amount: 5000000,
            customer: 'Công ty Cổ phần Công nghệ ABC',
            priority: 'HIGH',
          },
          null,
          2,
        ),
      );
    } else if (sampleType === 'loan') {
      this.startVariablesJson.set(
        JSON.stringify(
          {
            applicantName: 'Trần Văn Hoàng',
            loanAmount: 150000000,
            termMonths: 24,
            creditScore: 680,
          },
          null,
          2,
        ),
      );
    } else if (sampleType === 'leave') {
      this.startVariablesJson.set(
        JSON.stringify(
          {
            employeeName: this.authService.currentUser()?.fullName || 'Nguyễn Văn A',
            leaveType: 'Nghỉ phép năm',
            days: 2,
            reason: 'Nghỉ phép cá nhân',
          },
          null,
          2,
        ),
      );
    }
    this.jsonError.set(null);
  }

  submitStartCase(): void {
    const processId = this.startProcessId();
    if (!processId) {
      this.message.warning('Vui lòng chọn một Quy trình BPMN để khởi động.');
      return;
    }

    let parsedVariables: Record<string, unknown> = {};
    const rawJson = this.startVariablesJson().trim();
    if (rawJson) {
      try {
        parsedVariables = JSON.parse(rawJson);
        this.jsonError.set(null);
      } catch (err) {
        this.jsonError.set('Cú pháp JSON không hợp lệ. Vui lòng kiểm tra lại dấu ngoặc và dấu phẩy.');
        this.message.error('Dữ liệu biến (Variables) không đúng định dạng JSON.');
        return;
      }
    }

    const payload: StartProcessInstanceRequest = {
      processId,
      variables: parsedVariables,
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
  navigateToTask(taskNodeId: string, instanceId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/tasks'], {
      queryParams: {
        search: instanceId,
      },
    });
  }

  copyToClipboard(text: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.message.success(`Đã sao chép: ${text}`);
      });
    }
  }

  formatDisplayTime(dateStr?: string | null): string {
    if (!dateStr) return '--';
    // Nếu dateStr có định dạng dd/MM/yyyy HH:mm:ss thì hiển thị trực tiếp
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      return dateStr;
    }
    return formatDateTime(dateStr);
  }

  getProcessDisplayName(processId: string): string {
    const p = this.processes().find((item) => item.id === processId || item.processKey === processId);
    return p ? p.name : processId;
  }

  // Sắp xếp các cột bảng
  sortId = (a: ProcessInstance, b: ProcessInstance): number => a.id.localeCompare(b.id);
  sortProcess = (a: ProcessInstance, b: ProcessInstance): number =>
    this.getProcessDisplayName(a.processId).localeCompare(this.getProcessDisplayName(b.processId));
  sortStatus = (a: ProcessInstance, b: ProcessInstance): number => a.status.localeCompare(b.status);
  sortCurrentNode = (a: ProcessInstance, b: ProcessInstance): number =>
    (a.currentNodeId || '').localeCompare(b.currentNodeId || '');
  sortStartedBy = (a: ProcessInstance, b: ProcessInstance): number =>
    a.startedBy.localeCompare(b.startedBy);
  sortStartedAt = (a: ProcessInstance, b: ProcessInstance): number =>
    a.startedAt.localeCompare(b.startedAt);
  sortCompletedAt = (a: ProcessInstance, b: ProcessInstance): number =>
    (a.completedAt || '').localeCompare(b.completedAt || '');
}
