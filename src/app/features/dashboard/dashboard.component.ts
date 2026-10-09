import { Component, inject, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexNonAxisChartSeries } from 'ng-apexcharts';

import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { BpmnProcessService, DmnDecisionService } from '@core/services';
import {
  calculateStatusCounts,
  calculateRate,
  calculateCategoryDistribution,
} from './utils/dashboard-metrics.util';
import {
  buildColumnChartOptions,
  buildStatusDonutOptions,
  buildCategoryChartOptions,
  buildReadinessRadialOptions,
  ChartOptions,
} from './utils/dashboard-charts.config';

export type { ChartOptions };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    NgApexchartsModule,
    NzGridModule,
    NzIconModule,
    NzTagModule,
    NzButtonModule,
    NzProgressModule,
    NzEmptyModule,
    NzSpinModule,
    NzTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly bpmnService = inject(BpmnProcessService);
  private readonly dmnService = inject(DmnDecisionService);

  // Read signals from state services
  readonly processes = this.bpmnService.processes;
  readonly decisions = this.dmnService.decisions;
  readonly isBpmnLoading = this.bpmnService.isLoading;
  readonly isDmnLoading = this.dmnService.isLoading;

  readonly isLoading = computed(() => this.isBpmnLoading() || this.isDmnLoading());

  // Metrics computation using pure utilities
  readonly bpmnCounts = computed(() => calculateStatusCounts(this.processes()));
  readonly bpmnTotal = computed(() => this.bpmnCounts().total);
  readonly bpmnPublished = computed(() => this.bpmnCounts().published);
  readonly bpmnDraft = computed(() => this.bpmnCounts().draft);
  readonly bpmnArchived = computed(() => this.bpmnCounts().archived);

  readonly dmnCounts = computed(() => calculateStatusCounts(this.decisions()));
  readonly dmnTotal = computed(() => this.dmnCounts().total);
  readonly dmnPublished = computed(() => this.dmnCounts().published);
  readonly dmnDraft = computed(() => this.dmnCounts().draft);
  readonly dmnArchived = computed(() => this.dmnCounts().archived);

  readonly grandTotal = computed(() => this.bpmnTotal() + this.dmnTotal());
  readonly totalPublished = computed(() => this.bpmnPublished() + this.dmnPublished());
  readonly totalDraft = computed(() => this.bpmnDraft() + this.dmnDraft());
  readonly totalArchived = computed(() => this.bpmnArchived() + this.dmnArchived());

  readonly publishedRate = computed(() => calculateRate(this.totalPublished(), this.grandTotal()));
  readonly bpmnPublishedRate = computed(() => calculateRate(this.bpmnPublished(), this.bpmnTotal()));
  readonly dmnPublishedRate = computed(() => calculateRate(this.dmnPublished(), this.dmnTotal()));

  // Category counts for BPMN
  readonly categoriesData = computed(() => calculateCategoryDistribution(this.processes()));

  // ==========================================
  // APEXCHARTS CONFIGURATIONS & SERIES
  // ==========================================

  // 1. Comparison Column/Bar Chart
  readonly columnChartSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Quy trình BPMN',
      data: [this.bpmnPublished(), this.bpmnDraft(), this.bpmnArchived()],
    },
    {
      name: 'Bảng quyết định DMN',
      data: [this.dmnPublished(), this.dmnDraft(), this.dmnArchived()],
    },
  ]);
  readonly columnChartOptions = buildColumnChartOptions();

  // 2. Status Breakdown Donut Chart
  readonly statusDonutSeries = computed<ApexNonAxisChartSeries>(() => [
    this.totalPublished(),
    this.totalDraft(),
    this.totalArchived(),
  ]);
  readonly statusDonutOptions = buildStatusDonutOptions(() => this.grandTotal());

  // 3. Category Breakdown Bar Chart
  readonly categoryChartSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Số lượng quy trình',
      data: this.categoriesData().counts,
    },
  ]);
  readonly categoryChartOptions = computed(() =>
    buildCategoryChartOptions(this.categoriesData().categories)
  );

  // 4. Readiness & Health RadialBar Chart
  readonly readinessRadialSeries = computed<ApexNonAxisChartSeries>(() => [
    this.bpmnPublishedRate(),
    this.dmnPublishedRate(),
  ]);
  readonly readinessRadialOptions = buildReadinessRadialOptions(() => this.publishedRate());

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.bpmnService.loadProcesses();
    this.dmnService.loadDecisions();
  }
}
