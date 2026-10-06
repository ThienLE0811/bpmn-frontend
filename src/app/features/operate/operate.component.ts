import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { OperateService } from '@core/services';
import { OperateProcessInstance, ProcessIncident, ProcessInstanceState } from '@core/models';
import { FormatDatePipe } from '@shared/pipes';
import { TableAutoHeightDirective } from '@shared/directives';
import { OperateViewerComponent } from './operate-viewer/operate-viewer.component';

@Component({
  selector: 'app-operate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzTagModule,
    NzBadgeModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDrawerModule,
    NzTabsModule,
    NzTimelineModule,
    NzPopconfirmModule,
    NzTooltipModule,
    NzEmptyModule,
    NzSpinModule,
    OperateViewerComponent,
    TableAutoHeightDirective,
    FormatDatePipe,
  ],
  templateUrl: './operate.component.html',
  styleUrl: './operate.component.scss',
})
export class OperateComponent implements OnInit {
  protected readonly operateService = inject(OperateService);
  private readonly message = inject(NzMessageService);

  protected isStatsOpen = signal<boolean>(false);
  protected isDetailOpen = signal<boolean>(false);
  protected pageSize = signal<number>(10);
  protected pageIndex = signal<number>(1);
  protected searchInput = signal<string>('');

  ngOnInit(): void {
    this.refresh();
  }

  toggleStats(): void {
    this.isStatsOpen.update((v) => !v);
  }

  refresh(): void {
    this.operateService.loadMetrics();
    this.operateService.loadInstances();
  }

  onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.operateService.setSearchTerm(value);
  }

  onFilterStateChange(state: string): void {
    this.operateService.setFilterState(state);
  }

  openDetail(instance: OperateProcessInstance): void {
    this.operateService.selectInstance(instance);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.operateService.selectInstance(null);
  }

  retryIncident(incident: ProcessIncident, instanceId: string): void {
    this.operateService.retryIncident(incident.id, instanceId);
    this.message.success(`Đã gửi lệnh kích hoạt lại tác vụ: ${incident.activityName}`);
  }

  cancelInstance(instance: OperateProcessInstance): void {
    this.operateService.cancelInstance(instance.id);
    this.message.info(`Đã hủy phiên thực thi ${instance.id}`);
  }

  getStateTagColor(state: ProcessInstanceState | string): string {
    switch ((state || '').toUpperCase()) {
      case 'ACTIVE':
      case 'RUNNING':
        return 'processing';
      case 'INCIDENT':
      case 'SUSPENDED':
      case 'FAILED':
        return 'error';
      case 'COMPLETED':
        return 'success';
      case 'CANCELED':
      case 'CANCELLED':
      case 'TERMINATED':
        return 'default';
      default:
        return 'default';
    }
  }

  getStateLabel(state: ProcessInstanceState | string): string {
    switch ((state || '').toUpperCase()) {
      case 'ACTIVE':
      case 'RUNNING':
        return 'Đang chạy';
      case 'INCIDENT':
      case 'SUSPENDED':
      case 'FAILED':
        return 'Sự cố (Incident)';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELED':
      case 'CANCELLED':
      case 'TERMINATED':
        return 'Đã hủy';
      default:
        return state || 'Chưa xác định';
    }
  }
}
