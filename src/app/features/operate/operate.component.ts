import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';

import { OperateService } from '@core/services';
import { ProcessInstance, ProcessIncident, ProcessInstanceState } from '@core/models';
import { formatDateTime } from '@shared/utils';
import { TableAutoHeightDirective } from '@shared/directives';
import { OperateViewerComponent } from './operate-viewer/operate-viewer.component';

@Component({
  selector: 'app-operate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzGridModule,
    NzTableModule,
    NzTagModule,
    NzBadgeModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDrawerModule,
    NzTabsModule,
    NzTimelineModule,
    NzDescriptionsModule,
    NzPopconfirmModule,
    NzTooltipModule,
    NzAlertModule,
    NzEmptyModule,
    NzSpinModule,
    NzDividerModule,
    OperateViewerComponent,
    TableAutoHeightDirective,
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

  openDetail(instance: ProcessInstance): void {
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

  cancelInstance(instance: ProcessInstance): void {
    this.operateService.cancelInstance(instance.id);
    this.message.info(`Đã hủy phiên thực thi ${instance.id}`);
  }

  formatTime(isoStr?: string | null): string {
    return isoStr ? formatDateTime(isoStr) : '--';
  }

  getStateTagColor(state: ProcessInstanceState): string {
    switch (state) {
      case 'ACTIVE':
        return 'processing';
      case 'INCIDENT':
        return 'error';
      case 'COMPLETED':
        return 'success';
      case 'CANCELED':
        return 'default';
      default:
        return 'default';
    }
  }

  getStateLabel(state: ProcessInstanceState): string {
    switch (state) {
      case 'ACTIVE':
        return 'Đang chạy';
      case 'INCIDENT':
        return 'Sự cố (Incident)';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELED':
        return 'Đã hủy';
      default:
        return state;
    }
  }
}
