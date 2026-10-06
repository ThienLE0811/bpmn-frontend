import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DEFAULT_BPMN_XML } from '@shared/constants';
import { copyToClipboard } from '@shared/utils/clipboard.util';
import { BpmnXmlSyncService } from '../services/bpmn-xml-sync.service';
import { computeXmlStats } from '../utils/bpmn-xml.utils';

@Component({
  selector: 'app-bpmn-xml-editor',
  standalone: true,
  imports: [FormsModule, NzIconModule],
  templateUrl: './bpmn-xml-editor.component.html',
  styleUrl: './bpmn-xml-editor.component.scss',
})
export class BpmnXmlEditorComponent {
  private xmlSync = inject(BpmnXmlSyncService);
  private message = inject(NzMessageService);
  private xmlGutterRef = viewChild<ElementRef<HTMLDivElement>>('xmlGutter');

  readonly readOnly = input<boolean>(false);

  protected xmlContent = this.xmlSync.xmlContent;
  protected xmlError = this.xmlSync.xmlError;
  protected isSyncing = this.xmlSync.isSyncing;
  protected isAutoSync = this.xmlSync.isAutoSync;
  protected copiedXml = signal<boolean>(false);

  protected xmlStats = computed(() => computeXmlStats(this.xmlContent()));
  protected lineNumbersArray = computed(() => {
    const count = this.xmlContent() ? this.xmlContent().split('\n').length : 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  protected onXmlInput(newXml: string): void {
    this.xmlSync.onXmlInput(newXml);
  }

  protected applyXml(): void {
    this.xmlSync.applyXml(undefined, true);
  }

  protected toggleAutoSync(): void {
    this.xmlSync.toggleAutoSync();
  }

  protected pasteFromClipboard(): void {
    this.xmlSync.pasteFromClipboard();
  }

  protected formatXml(): void {
    this.xmlSync.formatXml();
  }

  protected resetToDefaultXml(): void {
    this.xmlSync.replaceXml(DEFAULT_BPMN_XML);
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.xmlSync.loadFile(file);
    }
  }

  protected async copyXmlToClipboard(): Promise<void> {
    const copied = await copyToClipboard(
      this.xmlContent(),
      this.message,
      'Đã sao chép toàn bộ mã BPMN XML vào Clipboard!',
    );
    if (copied) {
      this.copiedXml.set(true);
      setTimeout(() => this.copiedXml.set(false), 2000);
    }
  }

  protected onEditorScroll(event: Event): void {
    const gutter = this.xmlGutterRef()?.nativeElement;
    if (gutter) {
      gutter.scrollTop = (event.target as HTMLElement).scrollTop;
    }
  }
}
