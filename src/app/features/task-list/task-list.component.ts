import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { TaskService, FormSchemaService } from '@core/services';
import { TaskResponse, getTaskStatusMeta, FormDefinition } from '@core/models';
import { TableAutoHeightDirective } from '@shared/directives';
import { DynamicFormRendererComponent } from '@shared/components/dynamic-form-renderer/dynamic-form-renderer.component';
import {
  copyToClipboard,
  sortByString,
  sortByDate,
} from '@shared/utils';
import { AvatarColorPipe, UserInitialsPipe, FormatDatePipe } from '@shared/pipes';

@Component({
  selector: 'app-task-list',
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
    TableAutoHeightDirective,
    AvatarColorPipe,
    UserInitialsPipe,
    FormatDatePipe,
    DynamicFormRendererComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  protected readonly taskService = inject(TaskService);
  protected readonly formSchemaService = inject(FormSchemaService);
  private readonly message = inject(NzMessageService);

  // Trạng thái UI
  readonly isStatsOpen = signal<boolean>(true);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isCompleteModalVisible = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Dữ liệu chọn & Biểu mẫu động
  readonly selectedTask = signal<TaskResponse | null>(null);
  readonly selectedTaskFormSchema = signal<FormDefinition | null>(null);
  readonly taskFormVariables = signal<Record<string, unknown>>({});
  readonly isFormValid = signal<boolean>(true);

  // Bộ lọc
  readonly filterModel = signal<{
    search: string;
    status: string;
    mine: boolean;
  }>({
    search: '',
    status: 'ALL',
    mine: false,
  });

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

  // Kiểm tra có đang áp dụng bộ lọc hay không
  readonly isFiltered = computed(() => {
    const f = this.filterModel();
    return !!f.search.trim() || f.status !== 'ALL' || f.mine;
  });

  // Helpers
  readonly getTaskStatusMeta = getTaskStatusMeta;

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
    this.filterModel.set({
      search: '',
      status: 'ALL',
      mine: false,
    });
    this.search();
  }

  toggleMineOnly(val: boolean): void {
    this.filterModel.update((m) => ({ ...m, mine: val }));
    this.search();
  }

  onStatusFilterChange(status: string): void {
    this.filterModel.update((m) => ({ ...m, status }));
    this.search();
  }

  toggleStats(): void {
    this.isStatsOpen.set(!this.isStatsOpen());
  }

  // Drawer chi tiết
  openDetailDrawer(task: TaskResponse): void {
    this.selectedTask.set(task);
    this.isDrawerOpen.set(true);
  }

  closeDetailDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  // Claim Task
  claimTask(task: TaskResponse, event?: Event): void {
    if (event) event.stopPropagation();
    // Lỗi đã được TaskService hiển thị - chỉ cần nuốt để không thành unhandled error
    this.taskService.claimTask(task.id).subscribe({ error: () => undefined });
  }

  // Complete Task Modal
  openCompleteModal(task: TaskResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTask.set(task);

    // Xác định Form thích hợp cho task
    const schema = this.formSchemaService.getFormForTask(
      task.nodeId,
      undefined,
      task.processInstanceId
    );
    this.selectedTaskFormSchema.set(schema);

    const initVals = this.formSchemaService.extractFormValues(schema, {
      comment: `Hoàn thành tác vụ ${task.name}`,
      approved: true,
    });
    this.taskFormVariables.set(initVals);
    this.isFormValid.set(true);
    this.isCompleteModalVisible.set(true);
  }

  onFormValuesChange(vals: Record<string, unknown>): void {
    this.taskFormVariables.set(vals);
  }

  closeCompleteModal(): void {
    this.isCompleteModalVisible.set(false);
  }

  submitCompleteTask(): void {
    const task = this.selectedTask();
    if (!task) return;

    if (!this.isFormValid()) {
      this.message.warning('Dữ liệu biểu mẫu chưa hợp lệ, vui lòng kiểm tra lại trước khi hoàn tất.');
      return;
    }

    const variables = this.taskFormVariables();

    this.isSubmitting.set(true);
    this.taskService.completeTask(task.id, variables).subscribe({
      next: (completed) => {
        this.isSubmitting.set(false);
        this.closeCompleteModal();
        if (this.isDrawerOpen()) {
          // Cập nhật lại task đang xem trong drawer bằng dữ liệu backend trả về
          this.selectedTask.set(completed);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
  }

  copyToClipboard(text: string, event?: Event): void {
    copyToClipboard(text, this.message, undefined, event);
  }

  // Sắp xếp bảng
  sortName = sortByString<TaskResponse>('name');
  sortStatus = sortByString<TaskResponse>('status');
  sortCreatedAt = sortByDate<TaskResponse>('createdAt');
}
