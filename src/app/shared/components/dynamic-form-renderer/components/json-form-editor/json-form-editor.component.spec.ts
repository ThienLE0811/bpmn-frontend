import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { JsonFormEditorComponent } from './json-form-editor.component';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('JsonFormEditorComponent', () => {
  let fixture: ComponentFixture<JsonFormEditorComponent>;
  let component: JsonFormEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormEditorComponent],
      providers: [provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonFormEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit textChange when editing textarea', () => {
    let emitted = '';
    component.textChange.subscribe((val) => (emitted = val));

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = '{"foo": "bar"}';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emitted).toBe('{"foo": "bar"}');
  });

  it('should emit toolbar button events', () => {
    let formatted = false;
    let cleared = false;
    let copied = false;

    component.formatRequested.subscribe(() => (formatted = true));
    component.clearRequested.subscribe(() => (cleared = true));
    component.copyRequested.subscribe(() => (copied = true));

    const buttons = fixture.nativeElement.querySelectorAll('.btn-json-action');
    expect(buttons.length).toBe(3);

    buttons[0].click();
    expect(formatted).toBe(true);

    buttons[1].click();
    expect(cleared).toBe(true);

    buttons[2].click();
    expect(copied).toBe(true);
  });

  it('should display error message when jsonError is set', () => {
    expect(fixture.nativeElement.querySelector('.json-error-banner')).toBeNull();

    fixture.componentRef.setInput('jsonError', 'Cú pháp JSON không hợp lệ');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.json-error-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Cú pháp JSON không hợp lệ');
  });
});
