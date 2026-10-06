import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CaseService, FormSchemaService } from '@core/services';
import { BpmnProcess, FormDefinition, ProcessInstance } from '@core/models';
import { DynamicFormRendererComponent } from '@shared/components/dynamic-form-renderer/dynamic-form-renderer.component';

type SampleProcess = 'order' | 'loan' | 'leave';

const SAMPLE_PROCESS_KEYS: Record<SampleProcess, string> = {
  order: 'Process_OrderFulfillment',
  loan: 'Process_LoanApproval',
  leave: 'Process_LeaveRequest',
};

/** Modal khởi động một case mới: chọn quy trình, điền biểu mẫu khởi chạy, gọi API start. */
@Component({
  selector: 'app-case-start-modal',
  standalone: true,
  imports: [FormsModule, NzIconModule, NzModalModule, NzSelectModule, DynamicFormRendererComponent],
  templateUrl: './case-start-modal.component.html',
  styleUrl: './case-start-modal.component.scss',
})
export class CaseStartModalComponent {
  private readonly caseService = inject(CaseService);
  private readonly formSchemaService = inject(FormSchemaService);
  private readonly message = inject(NzMessageService);

  readonly processes = input<BpmnProcess[]>([]);
  /** Phát case vừa được tạo để trang mở drawer chi tiết. */
  readonly started = output<ProcessInstance>();

  protected readonly isVisible = signal<boolean>(false);
  protected readonly isStarting = this.caseService.isStarting;
  protected readonly processId = signal<string>('');
  protected readonly formSchema = signal<FormDefinition | null>(null);
  protected readonly formValues = signal<Record<string, unknown>>({});
  protected readonly isFormValid = signal<boolean>(true);

  open(preselectProcessId?: string): void {
    const first = this.processes()[0];
    const targetId = preselectProcessId || first?.id || first?.processKey;
    if (targetId) {
      this.selectProcess(targetId);
    }
    this.isVisible.set(true);
  }

  protected close(): void {
    this.isVisible.set(false);
  }

  protected selectProcess(processId: string): void {
    this.processId.set(processId);
    this.loadStartForm(processId);
  }

  /** Nạp biểu mẫu mẫu; chỉ đổi quy trình đang chọn khi quy trình mẫu thực sự tồn tại. */
  protected applySample(sample: SampleProcess): void {
    const key = SAMPLE_PROCESS_KEYS[sample];
    const found = this.processes().find((p) => p.processKey === key || p.id === key);
    if (found) {
      this.processId.set(found.id || found.processKey);
    }
    this.loadStartForm(key);
  }

  private loadStartForm(processIdOrKey: string): void {
    const proc = this.processes().find(
      (p) => p.id === processIdOrKey || p.processKey === processIdOrKey,
    );
    const schema = this.formSchemaService.getFormForProcessStart(
      proc?.processKey || processIdOrKey,
    );
    this.formSchema.set(schema);
    this.formValues.set(this.formSchemaService.extractFormValues(schema));
    this.isFormValid.set(true);
  }

  protected submit(): void {
    const processId = this.processId();
    if (!processId) {
      this.message.warning('Vui lòng chọn một Quy trình BPMN để khởi động.');
      return;
    }
    if (!this.isFormValid()) {
      this.message.warning('Dữ liệu biểu mẫu khởi tạo chưa hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    this.caseService.startCase({ processId, variables: this.formValues() }).subscribe({
      next: (created) => {
        this.close();
        if (created) {
          this.started.emit(created);
        }
      },
      // Lỗi đã được CaseService hiển thị
      error: () => undefined,
    });
  }
}
