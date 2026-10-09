import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterToolbarComponent } from './filter-toolbar.component';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('FilterToolbarComponent', () => {
  let fixture: ComponentFixture<FilterToolbarComponent>;
  let component: FilterToolbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterToolbarComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default inputs', () => {
    expect(component).toBeTruthy();
    expect(component.placeholder()).toBe('Tìm kiếm...');
    expect(component.searchText()).toBe('');
  });

  it('should emit searchSubmit when form/button submitted', () => {
    const searchSpy = vi.fn();
    component.searchSubmit.subscribe(searchSpy);

    const btn = fixture.nativeElement.querySelector('.btn-search') as HTMLButtonElement;
    if (btn) {
      btn.click();
      expect(searchSpy).toHaveBeenCalled();
    }
  });

  it('should emit reload when refresh button clicked', () => {
    const reloadSpy = vi.fn();
    component.reload.subscribe(reloadSpy);

    const refreshBtn = fixture.nativeElement.querySelector('.btn-reload') as HTMLButtonElement;
    if (refreshBtn) {
      refreshBtn.click();
      expect(reloadSpy).toHaveBeenCalled();
    }
  });
});
