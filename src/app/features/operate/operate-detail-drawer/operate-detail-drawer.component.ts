import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzMessageService } from 'ng-zorro-antd/message';

import { OperateService } from '@core/services';
import {
  OperateProcessInstance,
  ProcessIncident,
} from '@core/models';
import { FormatDatePipe } from '@shared/pipes';
import { OperateViewerComponent } from '../operate-viewer/operate-viewer.component';
import {
  getOperateStateTagColor,
  getOperateStateLabel,
} from '../utils/operate-state.util';

@Component({
  selector: 'app-operate-detail-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzDrawerModule,
    NzTagModule,
    NzBadgeModule,
    NzIconModule,
    NzTabsModule,
    NzTimelineModule,
    NzPopconfirmModule,
    NzEmptyModule,
    NzTableModule,
    FormatDatePipe,
    OperateViewerComponent,
  ],
  templateUrl: './operate-detail-drawer.component.html',
  styleUrl: './operate-detail-drawer.component.scss',
})
export class OperateDetailDrawerComponent {
  protected readonly operateService = inject(OperateService);
  private readonly message = inject(NzMessageService);

  readonly isOpen = input<boolean>(false);
  readonly instance = input<OperateProcessInstance | null>(null);

  readonly close = output<void>();
  readonly instanceCancelled = output<OperateProcessInstance>();

  readonly getStateTagColor = getOperateStateTagColor;
  readonly getStateLabel = getOperateStateLabel;

  closeDrawer(): void {
    this.close.emit();
  }

  retryIncident(incident: ProcessIncident, instanceId: string): void {
    this.operateService.retryIncident(incident.id, instanceId);
    this.message.success(`Đã gửi lệnh kích hoạt lại tác vụ: ${incident.activityName}`);
  }

  cancelInstance(instance: OperateProcessInstance): void {
    this.operateService.cancelInstance(instance.id);
    this.instanceCancelled.emit(instance);
    this.message.info(`Đã hủy phiên thực thi ${instance.id}`);
  }
}
