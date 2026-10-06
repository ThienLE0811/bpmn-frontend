import { Component, computed, inject, output, signal } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { BpmnProcessService, CaseService } from '@core/services';
import { ProcessInstance, getCaseStatusMeta } from '@core/models';
import { AvatarColorPipe, FormatDatePipe, UserInitialsPipe } from '@shared/pipes';
import { copyToClipboard, formatDisplayDateTime } from '@shared/utils';
import { OperateViewerComponent } from '../../../operate/operate-viewer/operate-viewer.component';

export interface VariableRow {
  key: string;
  value: string;
  type: string;
}

/** Drawer chi tiết một case: tổng quan + tiến trình, biến dữ liệu, sơ đồ BPMN có đánh dấu token. */
@Component({
  selector: 'app-case-detail-drawer',
  standalone: true,
  imports: [
    NzDescriptionsModule,
    NzDrawerModule,
    NzIconModule,
    NzSpinModule,
    NzTableModule,
    NzTabsModule,
    NzTagModule,
    NzTimelineModule,
    AvatarColorPipe,
    FormatDatePipe,
    UserInitialsPipe,
    OperateViewerComponent,
  ],
  templateUrl: './case-detail-drawer.component.html',
  styleUrl: './case-detail-drawer.component.scss',
})
export class CaseDetailDrawerComponent {
  private readonly caseService = inject(CaseService);
  private readonly bpmnService = inject(BpmnProcessService);
  private readonly message = inject(NzMessageService);

  /** Người dùng muốn xử lý User Task mà case đang dừng - trang lo việc điều hướng. */
  readonly taskRequested = output<string>();

  protected readonly isOpen = signal<boolean>(false);
  protected readonly selectedTab = signal<number>(0);
  protected readonly bpmnXml = signal<string | null>(null);

  protected readonly selectedCase = this.caseService.selectedCase;
  protected readonly isLoading = this.caseService.isDetailLoading;
  private readonly processes = this.bpmnService.processes;

  protected readonly variables = computed<VariableRow[]>(() => {
    const c = this.selectedCase();
    if (!c?.variables) return [];
    return Object.entries(c.variables).map(([key, val]) => ({
      key,
      value: typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val),
      type: Array.isArray(val) ? 'Array' : typeof val,
    }));
  });

  protected readonly variablesJson = computed<string>(() => {
    const c = this.selectedCase();
    return c?.variables ? JSON.stringify(c.variables, null, 2) : '{}';
  });

  /** Node đang chạy - để viewer đánh dấu token. */
  protected readonly activeActivityIds = computed<string[]>(() => {
    const c = this.selectedCase();
    return c?.status === 'RUNNING' && c.currentNodeId ? [c.currentNodeId] : [];
  });

  protected readonly getCaseStatusMeta = getCaseStatusMeta;
  protected readonly formatDisplayTime = formatDisplayDateTime;

  open(instance: ProcessInstance): void {
    this.caseService.selectCase(instance);
    this.selectedTab.set(0);
    this.loadBpmnXml(instance.processId);
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected processDisplayName(processId: string): string {
    return this.findProcess(processId)?.name ?? processId;
  }

  protected copy(text: string): void {
    copyToClipboard(text, this.message);
  }

  private loadBpmnXml(processId: string): void {
    const proc = this.findProcess(processId);
    if (proc?.bpmnXml) {
      this.bpmnXml.set(proc.bpmnXml);
    } else if (proc?.id) {
      this.bpmnXml.set(null);
      this.bpmnService.getProcessById(proc.id).subscribe({
        next: (p) => this.bpmnXml.set(p?.bpmnXml || null),
        error: () => this.bpmnXml.set(null),
      });
    } else {
      this.bpmnXml.set(null);
    }
  }

  private findProcess(processId: string) {
    return this.processes().find((p) => p.id === processId || p.processKey === processId);
  }
}
