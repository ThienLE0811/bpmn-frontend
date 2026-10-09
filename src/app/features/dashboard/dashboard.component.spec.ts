import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { BpmnProcessService, DmnDecisionService } from '@core/services';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let mockBpmnService: any;
  let mockDmnService: any;

  const testProcesses = [
    { id: '1', name: 'P1', status: 'PUBLISHED', category: 'HR' },
    { id: '2', name: 'P2', status: 'DRAFT', category: 'HR' },
    { id: '3', name: 'P3', status: 'ARCHIVED', category: 'FINANCE' },
  ];

  const testDecisions = [
    { id: '1', name: 'D1', status: 'PUBLISHED' },
    { id: '2', name: 'D2', status: 'DRAFT' },
  ];

  beforeEach(async () => {
    mockBpmnService = {
      processes: signal(testProcesses),
      isLoading: signal(false),
      loadProcesses: vi.fn(),
    };

    mockDmnService = {
      decisions: signal(testDecisions),
      isLoading: signal(false),
      loadDecisions: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: BpmnProcessService, useValue: mockBpmnService },
        { provide: DmnDecisionService, useValue: mockDmnService },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockBpmnService.loadProcesses).toHaveBeenCalled();
    expect(mockDmnService.loadDecisions).toHaveBeenCalled();
  });

  it('should compute metrics accurately', () => {
    expect(component.bpmnTotal()).toBe(3);
    expect(component.bpmnPublished()).toBe(1);
    expect(component.bpmnDraft()).toBe(1);
    expect(component.bpmnArchived()).toBe(1);

    expect(component.dmnTotal()).toBe(2);
    expect(component.dmnPublished()).toBe(1);
    expect(component.dmnDraft()).toBe(1);

    expect(component.grandTotal()).toBe(5);
    expect(component.totalPublished()).toBe(2);
    expect(component.publishedRate()).toBe(40); // 2 / 5 = 40%
  });

  it('should generate correct chart series', () => {
    const colSeries = component.columnChartSeries();
    expect(colSeries.length).toBe(2);
    expect(colSeries[0].data).toEqual([1, 1, 1]); // bpmn: pub, draft, arch
    expect(colSeries[1].data).toEqual([1, 1, 0]); // dmn: pub, draft, arch

    const donutSeries = component.statusDonutSeries();
    expect(donutSeries).toEqual([2, 2, 1]); // totalPub, totalDraft, totalArch

    const radialSeries = component.readinessRadialSeries();
    expect(radialSeries[0]).toBe(33); // 1 / 3 = 33%
    expect(radialSeries[1]).toBe(50); // 1 / 2 = 50%
  });

  it('should compute category distribution for BPMN processes', () => {
    const catData = component.categoriesData();
    expect(catData.categories).toContain('HR');
    expect(catData.categories).toContain('FINANCE');

    const catSeries = component.categoryChartSeries();
    expect(catSeries[0].data.length).toBe(catData.categories.length);
  });
});
