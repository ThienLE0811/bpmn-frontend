import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DesignerHeaderComponent } from './designer-header.component';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('DesignerHeaderComponent', () => {
  let fixture: ComponentFixture<DesignerHeaderComponent>;
  let component: DesignerHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignerHeaderComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(DesignerHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and have default BPMN configs', () => {
    expect(component).toBeTruthy();
    expect(component.type()).toBe('bpmn');
    expect(component.effectivePlaceholder()).toBe('Nhập tên quy trình...');
    expect(component.effectiveSaveLabel()).toBe('Lưu quy trình');
    expect(component.effectiveAccept()).toBe('.bpmn,.xml');
  });

  it('should adapt computed labels when type is dmn', () => {
    fixture.componentRef.setInput('type', 'dmn');
    fixture.detectChanges();

    expect(component.effectivePlaceholder()).toBe('Nhập tên bảng quyết định...');
    expect(component.effectiveSaveLabel()).toBe('Lưu DMN');
    expect(component.effectiveAccept()).toBe('.dmn,.xml');
  });

  it('should set active mode when setMode is called', () => {
    component.setMode('xml');
    expect(component.activeMode()).toBe('xml');

    component.setMode('design');
    expect(component.activeMode()).toBe('design');
  });

  it('should emit fileSelected on file change and clear file input value', () => {
    const fileSpy = vi.fn();
    component.fileSelected.subscribe(fileSpy);

    const input = document.createElement('input');
    input.type = 'file';
    const mockEvent = { target: input } as unknown as Event;

    component.onFileChange(mockEvent);
    expect(fileSpy).toHaveBeenCalledWith(mockEvent);
    expect(input.value).toBe('');
  });
});
