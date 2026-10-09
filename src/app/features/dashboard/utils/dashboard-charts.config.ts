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

export interface ColumnChartOptions {
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
}

export interface StatusDonutOptions {
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  responsive: ApexResponsive[];
}

export interface CategoryChartOptions {
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  colors: string[];
  dataLabels: ApexDataLabels;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
}

export interface ReadinessRadialOptions {
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  colors: string[];
  labels: string[];
  legend: ApexLegend;
  stroke: ApexStroke;
}

/**
 * Cấu hình biểu đồ cột so sánh BPMN và DMN theo trạng thái
 */
export function buildColumnChartOptions(): ColumnChartOptions {
  return {
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
}

/**
 * Cấu hình biểu đồ tròn Donut cơ cấu trạng thái toàn hệ thống
 */
export function buildStatusDonutOptions(grandTotalFn: () => number): StatusDonutOptions {
  return {
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
              formatter: () => grandTotalFn().toString(),
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
          const total = grandTotalFn();
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
}

/**
 * Cấu hình biểu đồ ngang phân bố theo phân hệ nghiệp vụ BPMN
 */
export function buildCategoryChartOptions(categories: string[]): CategoryChartOptions {
  return {
    chart: {
      type: 'bar',
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
      textAnchor: 'start',
      style: {
        colors: ['#ffffff'],
        fontSize: '12px',
        fontWeight: 600,
      },
      formatter: (val: number) => `${val} quy trình`,
      offsetX: 0,
    },
    xaxis: {
      categories,
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
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} quy trình`,
      },
    },
  };
}

/**
 * Cấu hình biểu đồ vòng RadialBar chỉ số sẵn sàng vận hành
 */
export function buildReadinessRadialOptions(publishedRateFn: () => number): ReadinessRadialOptions {
  return {
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
            formatter: () => `${publishedRateFn()}%`,
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
}
