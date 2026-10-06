import { Component, computed, inject, output, signal } from '@angular/core';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TaskService } from '@core/services';
import { TaskResponse, canClaimTask, canCompleteTask, getTaskStatusMeta } from '@core/models';
import { FormatDatePipe } from '@shared/pipes';
import { copyToClipboard } from '@shared/utils';

/**
 * Drawer chi tiết một User Task. Đọc task theo id từ TaskService nên tự cập nhật sau khi
 * nhận việc / hoàn thành (service thay bản ghi trong danh sách bằng dữ liệu backend trả về).
 */
@Component({
  selector: 'app-task-detail-drawer',
  standalone: true,
  imports: [NzDrawerModule, NzIconModule, NzTagModule, FormatDatePipe],
  templateUrl: './task-detail-drawer.component.html',
  styleUrl: './task-detail-drawer.component.scss',
})
export class TaskDetailDrawerComponent {
  private readonly taskService = inject(TaskService);
  private readonly message = inject(NzMessageService);

  /** Người dùng bấm "Hoàn thành công việc" - trang mở modal hoàn thành. */
  readonly completeRequested = output<TaskResponse>();

  protected readonly isOpen = signal<boolean>(false);
  private readonly openedTask = signal<TaskResponse | null>(null);

  protected readonly task = computed(() => {
    const opened = this.openedTask();
    if (!opened) return null;
    return this.taskService.tasks().find((t) => t.id === opened.id) ?? opened;
  });

  protected readonly getTaskStatusMeta = getTaskStatusMeta;
  protected readonly canClaim = canClaimTask;
  protected readonly canComplete = canCompleteTask;

  open(task: TaskResponse): void {
    this.openedTask.set(task);
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected claim(task: TaskResponse): void {
    // Lỗi đã được TaskService hiển thị
    this.taskService.claimTask(task.id).subscribe({ error: () => undefined });
  }

  protected copy(text: string): void {
    copyToClipboard(text, this.message);
  }
}
