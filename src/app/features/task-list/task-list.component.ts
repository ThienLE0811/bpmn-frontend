import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { TaskService } from '@core/services';
import { TaskResponse, canClaimTask, getTaskStatusMeta } from '@core/models';
import { TableAutoHeightDirective } from '@shared/directives';
import { copyToClipboard, sortByString, sortByDate, createListFilter } from '@shared/utils';
import {
  PageHeaderComponent,
  StatCardComponent,
  FilterToolbarComponent,
} from '@shared/components/list-page';
import { TaskDetailDrawerComponent } from './components/task-detail-drawer/task-detail-drawer.component';
import { TaskCompleteModalComponent } from './components/task-complete-modal/task-complete-modal.component';
import { AvatarColorPipe, UserInitialsPipe, FormatDatePipe } from '@shared/pipes';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzSelectModule,
    NzTagModule,
    NzTooltipModule,
    TableAutoHeightDirective,
    AvatarColorPipe,
    UserInitialsPipe,
    FormatDatePipe,
    PageHeaderComponent,
    StatCardComponent,
    FilterToolbarComponent,
    TaskDetailDrawerComponent,
    TaskCompleteModalComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  protected readonly taskService = inject(TaskService);
  private readonly message = inject(NzMessageService);

  // Trạng thái UI
  readonly isStatsOpen = signal<boolean>(true);

  // Bộ lọc
  readonly filter = createListFilter({ search: '', status: 'ALL', mine: false });
  readonly filterModel = this.filter.model;
  readonly isFiltered = this.filter.isFiltered;

  readonly pageIndex = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Dữ liệu từ Service
  readonly tasks = this.taskService.tasks;
  readonly isLoading = this.taskService.isLoading;
  readonly totalElements = this.taskService.totalElements;

  // Thống kê
  readonly totalCount = this.taskService.totalCount;
  readonly createdCount = this.taskService.createdCount;
  readonly claimedCount = this.taskService.claimedCount;
  readonly completedCount = this.taskService.completedCount;

  // Helpers
  readonly getTaskStatusMeta = getTaskStatusMeta;
  readonly canClaim = canClaimTask;

  ngOnInit(): void {
    this.loadTasks();
  }

  onPageIndexChange(page: number): void {
    // nz-table cũng phát pageIndexChange khi đổi pageSize - tránh gọi API 2 lần
    if (page === this.pageIndex()) return;
    this.pageIndex.set(page);
    this.loadTasks();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.search();
  }

  /** Tải lại trang hiện tại với bộ lọc hiện tại. */
  loadTasks(): void {
    const { status, mine, search } = this.filterModel();
    this.taskService.loadTasks({
      status: status !== 'ALL' ? status : undefined,
      mine: mine ? true : undefined,
      search: search.trim() || undefined,
      page: this.pageIndex(),
      size: this.pageSize(),
    });
  }

  /** Bộ lọc thay đổi - quay về trang đầu. */
  search(): void {
    this.pageIndex.set(1);
    this.loadTasks();
  }

  resetFilters(): void {
    this.filter.reset();
    this.search();
  }

  toggleMineOnly(val: boolean): void {
    this.filter.patch({ mine: val });
    this.search();
  }

  onStatusFilterChange(status: string): void {
    this.filter.patch({ status });
    this.search();
  }

  // Claim Task
  claimTask(task: TaskResponse, event?: Event): void {
    if (event) event.stopPropagation();
    // Lỗi đã được TaskService hiển thị - chỉ cần nuốt để không thành unhandled error
    this.taskService.claimTask(task.id).subscribe({ error: () => undefined });
  }

  copyToClipboard(text: string, event?: Event): void {
    copyToClipboard(text, this.message, undefined, event);
  }

  // Sắp xếp bảng
  sortName = sortByString<TaskResponse>('name');
  sortStatus = sortByString<TaskResponse>('status');
  sortCreatedAt = sortByDate<TaskResponse>('createdAt');
}
