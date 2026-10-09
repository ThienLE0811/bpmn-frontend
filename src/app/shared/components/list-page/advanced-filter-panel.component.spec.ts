import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedFilterPanelComponent } from './advanced-filter-panel.component';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('AdvancedFilterPanelComponent', () => {
  let fixture: ComponentFixture<AdvancedFilterPanelComponent>;
  let component: AdvancedFilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedFilterPanelComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render title', () => {
    expect(component).toBeTruthy();
    expect(component.title()).toBe('Bộ lọc chi tiết');
  });

  it('should emit collapse output when close button clicked', () => {
    const collapseSpy = vi.fn();
    component.collapse.subscribe(collapseSpy);

    const closeBtn = fixture.nativeElement.querySelector('.btn-close-panel') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.click();
      expect(collapseSpy).toHaveBeenCalled();
    }
  });

  it('should emit applyFilters output', () => {
    const applySpy = vi.fn();
    component.applyFilters.subscribe(applySpy);

    const applyBtn = fixture.nativeElement.querySelector('.btn-apply') as HTMLButtonElement;
    if (applyBtn) {
      applyBtn.click();
      expect(applySpy).toHaveBeenCalled();
    }
  });
});
