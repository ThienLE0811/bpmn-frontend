import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BpmnXmlEditorComponent } from './bpmn-xml-editor.component';
import { BpmnXmlSyncService } from '../services/bpmn-xml-sync.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { provideTestIcons } from '@shared/testing/test-icon-provider';

describe('BpmnXmlEditorComponent', () => {
  let fixture: ComponentFixture<BpmnXmlEditorComponent>;
  let component: BpmnXmlEditorComponent;
  let mockXmlSync: {
    xmlContent: ReturnType<typeof signal<string>>;
    xmlError: ReturnType<typeof signal<string | null>>;
    isSyncing: ReturnType<typeof signal<boolean>>;
    isAutoSync: ReturnType<typeof signal<boolean>>;
    onXmlInput: ReturnType<typeof vi.fn>;
    applyXml: ReturnType<typeof vi.fn>;
    toggleAutoSync: ReturnType<typeof vi.fn>;
    pasteFromClipboard: ReturnType<typeof vi.fn>;
    formatXml: ReturnType<typeof vi.fn>;
    replaceXml: ReturnType<typeof vi.fn>;
  };
  let mockMessage: { info: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockXmlSync = {
      xmlContent: signal('<?xml version="1.0"?>\n<bpmn:definitions>\n</bpmn:definitions>'),
      xmlError: signal(null),
      isSyncing: signal(false),
      isAutoSync: signal(true),
      onXmlInput: vi.fn(),
      applyXml: vi.fn(),
      toggleAutoSync: vi.fn(),
      pasteFromClipboard: vi.fn(),
      formatXml: vi.fn(),
      replaceXml: vi.fn(),
    };
    mockMessage = {
      info: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BpmnXmlEditorComponent],
      providers: [
        { provide: BpmnXmlSyncService, useValue: mockXmlSync },
        { provide: NzMessageService, useValue: mockMessage },
        provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnXmlEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and calculate line numbers', () => {
    expect(component).toBeTruthy();
    expect((component as any).lineNumbersArray()).toEqual([1, 2, 3]);
  });

  it('should delegate onXmlInput to sync service', () => {
    (component as any).onXmlInput('<new-xml/>');
    expect(mockXmlSync.onXmlInput).toHaveBeenCalledWith('<new-xml/>');
  });

  it('should delegate applyXml to sync service', () => {
    (component as any).applyXml();
    expect(mockXmlSync.applyXml).toHaveBeenCalledWith(undefined, true);
  });

  it('should delegate formatXml to sync service', () => {
    (component as any).formatXml();
    expect(mockXmlSync.formatXml).toHaveBeenCalled();
  });
});
