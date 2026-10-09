import { describe, it, expect } from 'vitest';
import {
  buildColumnChartOptions,
  buildStatusDonutOptions,
  buildCategoryChartOptions,
  buildReadinessRadialOptions,
} from './dashboard-charts.config';

describe('dashboard-charts.config', () => {
  it('should build column chart options properly', () => {
    const opts = buildColumnChartOptions();
    expect(opts.chart.type).toBe('bar');
    expect(opts.colors?.length).toBe(2);
    expect(opts.xaxis?.categories?.length).toBe(3);
  });

  it('should build status donut options and evaluate grand total formatter', () => {
    let mockTotal = 15;
    const opts = buildStatusDonutOptions(() => mockTotal);
    expect(opts.chart.type).toBe('donut');
    expect(opts.labels?.length).toBe(3);

    const totalFormatter = (opts.plotOptions?.pie?.donut?.labels?.total as any)?.formatter;
    expect(totalFormatter()).toBe('15');

    const tooltipFormatter = (opts.tooltip?.y as any)?.formatter;
    expect(tooltipFormatter(3)).toContain('3 mục (20.0%)');
  });

  it('should build category chart options with supplied categories', () => {
    const categories = ['HR', 'SALES', 'FINANCE'];
    const opts = buildCategoryChartOptions(categories);
    expect(opts.chart.type).toBe('bar');
    expect(opts.plotOptions?.bar?.horizontal).toBe(true);
    expect(opts.xaxis?.categories).toEqual(categories);
  });

  it('should build readiness radial options and evaluate average rate formatter', () => {
    let mockRate = 85;
    const opts = buildReadinessRadialOptions(() => mockRate);
    expect(opts.chart.type).toBe('radialBar');
    expect(opts.labels).toEqual(['BPMN Sẵn sàng', 'DMN Sẵn sàng']);

    const totalFormatter = (opts.plotOptions?.radialBar?.dataLabels?.total as any)?.formatter;
    expect(totalFormatter()).toBe('85%');
  });
});
