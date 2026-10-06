import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { CaseService, BpmnProcessService } from '@core/services';
import { ProcessInstance, getCaseStatusMeta } from '@core/models';
import {
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
import { CaseStartModalComponent } from './components/case-start-modal/case-start-modal.component';
import { CaseDetailDrawerComponent } from './components/case-detail-drawer/case-detail-drawer.component';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzSelectModule,
    NzTooltipModule,
    TableAutoHeightDirective,
    AvatarColorPipe,
    UserInitialsPipe,
    FormatDatePipe,
    PageHeaderComponent,
    StatCardComponent,
    FilterToolbarComponent,
    StatusPillComponent,
    CaseStartModalComponent,
    CaseDetailDrawerComponent,
  ],
  templateUrl: './case-list.component.html',
  styleUrl: './case-list.component.scss',
})
export class CaseListComponent implements OnInit {
  protected readonly caseService = inject(CaseService);
  protected readonly bpmnService = inject(BpmnProcessService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  // Trạng thái giao diện
  readonly isStatsOpen = signal<boolean>(true);

  // Bộ lọc
  readonly filter = createListFilter({ search: '', status: 'ALL', processId: 'ALL' });
  readonly filterModel = this.filter.model;
  readonly isFiltered = this.filter.isFiltered;

  // Dữ liệu từ Service
  readonly cases = this.caseService.cases;
  readonly isLoading = this.caseService.isLoading;
  readonly processes = this.bpmnService.processes;

  // Thống kê
  readonly totalCount = this.caseService.totalCount;
  readonly runningCount = this.caseService.runningCount;
  readonly completedCount = this.caseService.completedCount;

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
