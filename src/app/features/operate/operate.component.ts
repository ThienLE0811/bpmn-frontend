import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { OperateService } from '@core/services';
import { OperateProcessInstance } from '@core/models';
import { FormatDatePipe } from '@shared/pipes';
import { TableAutoHeightDirective } from '@shared/directives';
import { OperateDetailDrawerComponent } from './operate-detail-drawer/operate-detail-drawer.component';
import {
  getOperateStateTagColor,
  getOperateStateLabel,
} from './utils/operate-state.util';

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
    NzPopconfirmModule,
    NzTooltipModule,
    NzSpinModule,
    TableAutoHeightDirective,
    FormatDatePipe,
    OperateDetailDrawerComponent,
  ],
  templateUrl: './operate.component.html',
  styleUrl: './operate.component.scss',
})
export class OperateComponent implements OnInit {
  protected readonly operateService = inject(OperateService);
  private readonly message = inject(NzMessageService);

  readonly isStatsOpen = signal<boolean>(false);
  readonly isDetailOpen = signal<boolean>(false);
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(1);
  readonly searchInput = signal<string>('');

  readonly getStateTagColor = getOperateStateTagColor;
  readonly getStateLabel = getOperateStateLabel;

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

  cancelInstance(instance: OperateProcessInstance): void {
    this.operateService.cancelInstance(instance.id);
    this.message.info(`Đã hủy phiên thực thi ${instance.id}`);
  }
}
