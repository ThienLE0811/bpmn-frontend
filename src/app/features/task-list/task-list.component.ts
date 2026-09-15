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
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';

import { TaskService, AuthService } from '@core/services';
import { TaskResponse, getTaskStatusMeta } from '@core/models';
import { TableAutoHeightDirective } from '@shared/directives';
import { getAvatarColor, getUserInitials } from '@shared/utils';

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
    NzBadgeModule,
    NzPopconfirmModule,
    NzSwitchModule,
    TableAutoHeightDirective,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  protected readonly taskService = inject(TaskService);
  protected readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);

  // Trạng thái UI
  readonly isStatsOpen = signal<boolean>(true);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isCompleteModalVisible = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Dữ liệu chọn
  readonly selectedTask = signal<TaskResponse | null>(null);
  readonly completeVariablesJson = signal<string>(
    JSON.stringify({ approved: true, comment: 'Đã thẩm định hồ sơ đạt yêu cầu' }, null, 2),
  );

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

  readonly pageSize = signal<number>(10);

  // Dữ liệu từ Service
  readonly tasks = this.taskService.tasks;
  readonly isLoading = this.taskService.isLoading;

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
  readonly getAvatarColor = getAvatarColor;
  readonly getUserInitials = getUserInitials;

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    const { status, mine, search } = this.filterModel();
    this.taskService.loadTasks({
      status: status !== 'ALL' ? status : undefined,
      mine: mine ? true : undefined,
      search: search.trim() || undefined,
    });
  }

  search(): void {
    this.loadTasks();
  }

  resetFilters(): void {
    this.filterModel.set({
      search: '',
      status: 'ALL',
      mine: false,
    });
    this.loadTasks();
  }

  toggleMineOnly(val: boolean): void {
    this.filterModel.update((m) => ({ ...m, mine: val }));
    this.loadTasks();
  }

  onStatusFilterChange(status: string): void {
    this.filterModel.update((m) => ({ ...m, status }));
    this.loadTasks();
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
    this.taskService.claimTask(task.id).subscribe();
  }

  // Complete Task Modal
  openCompleteModal(task: TaskResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTask.set(task);
    this.completeVariablesJson.set(
      JSON.stringify({ approved: true, comment: `Hoàn thành tác vụ ${task.name}` }, null, 2),
    );
    this.isCompleteModalVisible.set(true);
  }

  closeCompleteModal(): void {
    this.isCompleteModalVisible.set(false);
  }

  submitCompleteTask(): void {
    const task = this.selectedTask();
    if (!task) return;

    let variables: Record<string, unknown> = {};
    const rawJson = this.completeVariablesJson().trim();

    if (rawJson) {
      try {
        variables = JSON.parse(rawJson);
      } catch {
        this.message.error('Dữ liệu biến (Variables) không đúng định dạng JSON hợp lệ.');
        return;
      }
    }

    this.isSubmitting.set(true);
    this.taskService.completeTask(task.id, variables).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCompleteModal();
        if (this.isDrawerOpen()) {
          // Cập nhật lại task đang xem trong drawer
          this.selectedTask.set({
            ...task,
            status: 'COMPLETED',
            completedBy: this.authService.currentUser()?.username || 'admin',
          });
        }
      },
      error: () => {
        this.isSubmitting.set(false);
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

  // Sắp xếp bảng
  sortName = (a: TaskResponse, b: TaskResponse): number => a.name.localeCompare(b.name);
  sortStatus = (a: TaskResponse, b: TaskResponse): number => a.status.localeCompare(b.status);
  sortCreatedAt = (a: TaskResponse, b: TaskResponse): number =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}
