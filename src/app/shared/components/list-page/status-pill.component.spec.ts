import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StatusPillComponent } from './status-pill.component';

describe('StatusPillComponent', () => {
  let fixture: ComponentFixture<StatusPillComponent>;
  let component: StatusPillComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPillComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusPillComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('label', 'Đang chạy');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display label and apply default neutral tone', () => {
    fixture.componentRef.setInput('label', 'Chờ xử lý');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Chờ xử lý');
    expect(host.classList.contains('tone-neutral')).toBe(true);
  });

  it('should apply custom tone class to host', () => {
    fixture.componentRef.setInput('label', 'Thành công');
    fixture.componentRef.setInput('tone', 'success');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('tone-success')).toBe(true);
  });
});
