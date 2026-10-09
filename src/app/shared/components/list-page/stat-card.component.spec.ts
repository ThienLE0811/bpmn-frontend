import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StatCardComponent } from './stat-card.component';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;
  let component: StatCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
  });

  it('should create and render label and value', () => {
    fixture.componentRef.setInput('icon', 'file-text');
    fixture.componentRef.setInput('label', 'Tổng quy trình');
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.stat-label')?.textContent).toBe('Tổng quy trình');
    expect(host.querySelector('.stat-value')?.textContent).toBe('42');
  });

  it('should apply active and clickable classes when set', () => {
    fixture.componentRef.setInput('icon', 'branches');
    fixture.componentRef.setInput('label', 'Đang hoạt động');
    fixture.componentRef.setInput('clickable', true);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('clickable')).toBe(true);
    expect(host.classList.contains('active')).toBe(true);
  });

  it('should render pulse indicator when pulse is true', () => {
    fixture.componentRef.setInput('icon', 'thunderbolt');
    fixture.componentRef.setInput('label', 'Đang thực thi');
    fixture.componentRef.setInput('pulse', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.pulse-indicator')).toBeTruthy();
  });
});
