import { Component, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { BpmnProcessService, CaseService, OperateApiService } from '@core/services';
import { ProcessIncident, ProcessInstance, getCaseStatusMeta } from '@core/models';
import { ApiErrorHandlerService } from '@shared/services';
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
    NzButtonModule,
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
  private readonly operateApi = inject(OperateApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  /** Người dùng muốn xử lý User Task mà case đang dừng - trang lo việc điều hướng. */
  readonly taskRequested = output<string>();

  protected readonly isOpen = signal<boolean>(false);
  protected readonly selectedTab = signal<number>(0);
  protected readonly bpmnXml = signal<string | null>(null);

  protected readonly selectedCase = this.caseService.selectedCase;
  protected readonly isLoading = this.caseService.isDetailLoading;
  private readonly processes = this.bpmnService.processes;

  /** Incident của case FAILED (tối đa 1 phần tử); rỗng khi case không lỗi. */
  protected readonly incidents = signal<ProcessIncident[]>([]);
  protected readonly isRetrying = signal<boolean>(false);
  /** Tăng sau mỗi lần retry để tải lại incident dù case vẫn là cùng id/status FAILED. */
  private readonly incidentReloadTick = signal<number>(0);

  private readonly failedCaseRequest = computed(() => {
    const c = this.selectedCase();
    const failedId = c?.status?.toUpperCase() === 'FAILED' ? c.id : null;
    return { failedId, tick: this.incidentReloadTick() };
  });

  protected readonly isFailed = computed(() => this.failedCaseRequest().failedId !== null);
  protected readonly incident = computed<ProcessIncident | null>(() => this.incidents()[0] ?? null);

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

  /** Node connector bị lỗi - lấy từ incident, fallback về field trên case. */
  protected readonly incidentActivityIds = computed<string[]>(() => {
    const c = this.selectedCase();
    if (!this.isFailed() || !c) return [];
    const nodeId = this.incident()?.activityId ?? c.incidentNodeId ?? c.currentNodeId;
    return nodeId ? [nodeId] : [];
  });

  /** Node đang chạy - để viewer đánh dấu token. */
  protected readonly activeActivityIds = computed<string[]>(() => {
    const c = this.selectedCase();
    return c?.status === 'RUNNING' && c.currentNodeId ? [c.currentNodeId] : [];
  });

  protected readonly getCaseStatusMeta = getCaseStatusMeta;
  protected readonly formatDisplayTime = formatDisplayDateTime;

  constructor() {
    toObservable(this.failedCaseRequest)
      .pipe(
        switchMap(({ failedId }) =>
          failedId
            ? this.operateApi.getIncidents(failedId).pipe(catchError(() => of([])))
            : of([]),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((list) => this.incidents.set(list));
  }

  open(instance: ProcessInstance): void {
    this.incidents.set([]);
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

  /** Chạy lại connector đã lỗi; id của endpoint retry là id case (instanceId). */
  protected retryIncident(instanceId: string): void {
    this.isRetrying.set(true);
    this.operateApi.retryIncident(instanceId).subscribe({
      next: () => {
        this.isRetrying.set(false);
        this.message.success('Đã gửi lệnh thử lại. Đang cập nhật trạng thái vụ việc...');
        this.incidentReloadTick.update((n) => n + 1);
        this.caseService.getCaseById(instanceId).subscribe({ error: () => undefined });
      },
      error: (err) => {
        this.isRetrying.set(false);
        this.errorHandler.handleError(err, 'Không thể thử lại tác vụ lỗi này.');
      },
    });
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
