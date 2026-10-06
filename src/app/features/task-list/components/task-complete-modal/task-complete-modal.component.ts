import { Component, inject, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FormSchemaService, TaskService } from '@core/services';
import { FormDefinition, TaskResponse } from '@core/models';
import { DynamicFormRendererComponent } from '@shared/components/dynamic-form-renderer/dynamic-form-renderer.component';

/** Modal hoàn thành User Task: điền biểu mẫu của task rồi gửi biến lên engine. */
@Component({
  selector: 'app-task-complete-modal',
  standalone: true,
  imports: [NzIconModule, NzModalModule, DynamicFormRendererComponent],
  templateUrl: './task-complete-modal.component.html',
  styleUrl: './task-complete-modal.component.scss',
})
export class TaskCompleteModalComponent {
  private readonly taskService = inject(TaskService);
  private readonly formSchemaService = inject(FormSchemaService);
  private readonly message = inject(NzMessageService);

  protected readonly isVisible = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly task = signal<TaskResponse | null>(null);
  protected readonly formSchema = signal<FormDefinition | null>(null);
  protected readonly formValues = signal<Record<string, unknown>>({});
  protected readonly isFormValid = signal<boolean>(true);

  open(task: TaskResponse): void {
    const schema = this.formSchemaService.getFormForTask(
      task.nodeId,
      undefined,
      task.processInstanceId,
    );
    this.task.set(task);
    this.formSchema.set(schema);
    this.formValues.set(
      this.formSchemaService.extractFormValues(schema, {
        comment: `Hoàn thành tác vụ ${task.name}`,
        approved: true,
      }),
    );
    this.isFormValid.set(true);
    this.isVisible.set(true);
  }

  protected close(): void {
    this.isVisible.set(false);
  }

  protected submit(): void {
    const task = this.task();
    if (!task) return;

    if (!this.isFormValid()) {
      this.message.warning(
        'Dữ liệu biểu mẫu chưa hợp lệ, vui lòng kiểm tra lại trước khi hoàn tất.',
      );
      return;
    }

    this.isSubmitting.set(true);
    this.taskService.completeTask(task.id, this.formValues()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
      },
      error: () => this.isSubmitting.set(false),
    });
  }
}
