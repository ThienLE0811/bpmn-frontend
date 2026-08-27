import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexLegend,
  ApexTooltip,
  ApexStroke,
  ApexFill,
  ApexGrid,
  ApexResponsive,
} from 'ng-apexcharts';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { BpmnProcessService, DmnDecisionService } from '@core/services';
import { BpmnProcess, DmnDecision } from '@core/models';

export interface ChartOptions {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis | ApexYAxis[];
  dataLabels?: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  legend?: ApexLegend;
  tooltip?: ApexTooltip;
  stroke?: ApexStroke;
  fill?: ApexFill;
  grid?: ApexGrid;
  colors?: string[];
  labels?: string[];
  responsive?: ApexResponsive[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgApexchartsModule,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzIconModule,
    NzTagModule,
    NzButtonModule,
    NzProgressModule,
    NzBadgeModule,
    NzEmptyModule,
    NzSpinModule,
    NzTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private bpmnService = inject(BpmnProcessService);
  private dmnService = inject(DmnDecisionService);

  // Read signals from state services
  processes = this.bpmnService.processes;
  decisions = this.dmnService.decisions;
  isBpmnLoading = this.bpmnService.isLoading;
  isDmnLoading = this.dmnService.isLoading;

  isLoading = computed(() => this.isBpmnLoading() || this.isDmnLoading());

  // Metrics computation
  bpmnTotal = computed(() => this.processes().length);
  bpmnPublished = computed(() => this.processes().filter((p) => p.status === 'PUBLISHED').length);
  bpmnDraft = computed(() => this.processes().filter((p) => p.status === 'DRAFT').length);
  bpmnArchived = computed(() => this.processes().filter((p) => p.status === 'ARCHIVED').length);

  dmnTotal = computed(() => this.decisions().length);
  dmnPublished = computed(() => this.decisions().filter((d) => d.status === 'PUBLISHED').length);
  dmnDraft = computed(() => this.decisions().filter((d) => d.status === 'DRAFT').length);
  dmnArchived = computed(() => this.decisions().filter((d) => d.status === 'ARCHIVED').length);

  grandTotal = computed(() => this.bpmnTotal() + this.dmnTotal());
  totalPublished = computed(() => this.bpmnPublished() + this.dmnPublished());
  totalDraft = computed(() => this.bpmnDraft() + this.dmnDraft());
  totalArchived = computed(() => this.bpmnArchived() + this.dmnArchived());

  publishedRate = computed(() => {
    const total = this.grandTotal();
    return total > 0 ? Math.round((this.totalPublished() / total) * 100) : 0;
  });

  bpmnPublishedRate = computed(() => {
    const total = this.bpmnTotal();
    return total > 0 ? Math.round((this.bpmnPublished() / total) * 100) : 0;
  });

  dmnPublishedRate = computed(() => {
    const total = this.dmnTotal();
    return total > 0 ? Math.round((this.dmnPublished() / total) * 100) : 0;
  });

  // Category counts for BPMN
  categoriesData = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.processes()) {
      const cat = p.category || 'GENERAL';
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    const categories: string[] = [];
    const counts: number[] = [];
    map.forEach((count, cat) => {
      categories.push(cat);
      counts.push(count);
    });
    return { categories, counts };
  });

  // ==========================================
  // APEXCHARTS CONFIGURATIONS
  // ==========================================

  // 1. Comparison Column/Bar Chart (BPMN vs DMN across statuses)
  columnChartSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Quy trình BPMN',
      data: [this.bpmnPublished(), this.bpmnDraft(), this.bpmnArchived()],
    },
    {
      name: 'Bảng quyết định DMN',
      data: [this.dmnPublished(), this.dmnDraft(), this.dmnArchived()],
    },
  ]);

  columnChartOptions: {
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    colors: string[];
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    legend: ApexLegend;
    grid: ApexGrid;
    tooltip: ApexTooltip;
    responsive: ApexResponsive[];
  } = {
    chart: {
      type: 'bar',
      height: 310,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
      },
    },
    colors: ['#2563eb', '#8b5cf6'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '42%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 3,
      colors: ['transparent'],
    },
    xaxis: {
      categories: ['Đã xuất bản (Published)', 'Bản nháp (Draft)', 'Lưu trữ (Archived)'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      title: {
        text: 'Số lượng tài nguyên',
        style: {
          color: '#64748b',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
      min: 0,
      forceNiceScale: true,
      labels: {
        formatter: (val: number) => Math.round(val).toString(),
        style: {
          colors: '#64748b',
          fontSize: '12px',
        },
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      padding: { top: 10, right: 10, bottom: 0, left: 10 },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      fontWeight: 500,
      markers: {
        size: 7,
        shape: 'circle',
      },
      itemMargin: { horizontal: 12, vertical: 4 },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} mục`,
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          plotOptions: {
            bar: { columnWidth: '60%' },
          },
          legend: { position: 'bottom', horizontalAlign: 'center' },
        },
      },
    ],
  };

  // 2. Status Breakdown Donut Chart
  statusDonutSeries = computed<ApexNonAxisChartSeries>(() => [
    this.totalPublished(),
    this.totalDraft(),
    this.totalArchived(),
  ]);

  statusDonutOptions: {
    chart: ApexChart;
    labels: string[];
    colors: string[];
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    legend: ApexLegend;
    stroke: ApexStroke;
    tooltip: ApexTooltip;
    responsive: ApexResponsive[];
  } = {
    chart: {
      type: 'donut',
      height: 310,
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        speed: 700,
      },
    },
    labels: ['Đã xuất bản (Published)', 'Bản nháp (Draft)', 'Lưu trữ (Archived)'],
    colors: ['#10b981', '#f59e0b', '#94a3b8'],
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontWeight: 500,
              color: '#64748b',
              offsetY: -5,
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 700,
              color: '#0f172a',
              offsetY: 5,
              formatter: (val: string) => val,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Tổng tài nguyên',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              formatter: () => this.grandTotal().toString(),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      colors: ['#ffffff'],
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12.5px',
      fontWeight: 500,
      itemMargin: { horizontal: 8, vertical: 4 },
      markers: { size: 6, shape: 'circle' },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => {
          const total = this.grandTotal();
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
          return `${val} mục (${pct}%)`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 260 },
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  // 3. Category Breakdown Bar Chart (BPMN categories)
  categoryChartSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Số lượng quy trình',
      data: this.categoriesData().counts,
    },
  ]);

  categoryChartOptions = computed(() => ({
    chart: {
      type: 'bar' as const,
      height: 290,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: '50%',
        distributed: true,
      },
    },
    colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
    dataLabels: {
      enabled: true,
      textAnchor: 'start' as const,
      style: {
        colors: ['#ffffff'],
        fontSize: '12px',
        fontWeight: 600,
      },
      formatter: (val: number) => `${val} quy trình`,
      offsetX: 0,
    },
    xaxis: {
      categories: this.categoriesData().categories,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#334155',
          fontSize: '12px',
          fontWeight: 600,
        },
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    legend: { show: false },
    tooltip: {
      theme: 'light' as const,
      y: {
        formatter: (val: number) => `${val} quy trình`,
      },
    },
  }));

  // 4. Readiness & Health RadialBar Chart
  readinessRadialSeries = computed<ApexNonAxisChartSeries>(() => [
    this.bpmnPublishedRate(),
    this.dmnPublishedRate(),
  ]);

  readinessRadialOptions: {
    chart: ApexChart;
    plotOptions: ApexPlotOptions;
    colors: string[];
    labels: string[];
    legend: ApexLegend;
    stroke: ApexStroke;
  } = {
    chart: {
      type: 'radialBar',
      height: 290,
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 360,
        hollow: {
          margin: 5,
          size: '35%',
          background: 'transparent',
        },
        track: {
          background: '#f1f5f9',
          strokeWidth: '100%',
          margin: 8,
        },
        dataLabels: {
          name: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569',
            offsetY: -6,
          },
          value: {
            fontSize: '16px',
            fontWeight: 700,
            color: '#0f172a',
            offsetY: 4,
            formatter: (val: number) => `${val}%`,
          },
          total: {
            show: true,
            label: 'Trung bình',
            fontSize: '12px',
            color: '#64748b',
            formatter: () => `${this.publishedRate()}%`,
          },
        },
      },
    },
    colors: ['#2563eb', '#8b5cf6'],
    labels: ['BPMN Sẵn sàng', 'DMN Sẵn sàng'],
    legend: {
      show: true,
      floating: false,
      fontSize: '12.5px',
      position: 'bottom',
      horizontalAlign: 'center',
      itemMargin: { horizontal: 8, vertical: 4 },
      markers: { size: 6, shape: 'circle' },
    },
    stroke: {
      lineCap: 'round',
    },
  };

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.bpmnService.loadProcesses();
    this.dmnService.loadDecisions();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'Đã xuất bản';
      case 'DRAFT':
        return 'Bản nháp';
      case 'ARCHIVED':
        return 'Lưu trữ';
      default:
        return status;
    }
  }
}
