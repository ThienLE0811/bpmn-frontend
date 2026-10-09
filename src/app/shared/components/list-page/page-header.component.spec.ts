import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PageHeaderComponent } from './page-header.component';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create and render title and description', () => {
    fixture.componentRef.setInput('title', 'Quản lý Quy trình');
    fixture.componentRef.setInput('description', 'Danh sách sơ đồ BPMN 2.0');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h2')?.textContent).toContain('Quản lý Quy trình');
    expect(host.querySelector('p')?.textContent).toContain('Danh sách sơ đồ BPMN 2.0');
  });

  it('should toggle statsOpen on button click', () => {
    fixture.componentRef.setInput('title', 'Tasks');
    fixture.componentRef.setInput('showStatsToggle', true);
    component.statsOpen.set(false);
    fixture.detectChanges();

    const toggleBtn = fixture.nativeElement.querySelector('.btn-outline-stats') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.statsOpen()).toBe(true);
  });
});
