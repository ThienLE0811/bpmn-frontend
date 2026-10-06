import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BpmnModelerService } from './bpmn-modeler.service';
import { beautifyXml, validateBpmnXml } from '../utils/bpmn-xml.utils';

/**
 * Two-way sync between the XML text and the modeler: canvas edits are serialized back into
 * `xmlContent`, and XML typed / pasted / uploaded is validated and imported into the canvas.
 * Lives at the designer level (not in the XML editor) so state survives switching view modes.
 */
@Injectable()
export class BpmnXmlSyncService implements OnDestroy {
  private modeler = inject(BpmnModelerService);
  private message = inject(NzMessageService);

  readonly xmlContent = signal<string>('');
  readonly xmlError = signal<string | null>(null);
  readonly isSyncing = signal<boolean>(false);
  readonly isAutoSync = signal<boolean>(true);
  /** Root process name found in XML imported into the modeler (editor, clipboard, file). */
  readonly processNameImported = new Subject<string>();

  private isSyncingFromXml = false;
  private modelerToXmlTimer: any = null;
  private xmlToModelerTimer: any = null;

  /** Must be called once, right after `BpmnModelerService.init()`. */
  attach(): void {
    this.modeler.on('commandStack.changed', () => {
      if (!this.isSyncingFromXml) {
        this.modeler.isModified.set(true);
        this.scheduleSyncFromModeler();
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.modelerToXmlTimer);
    clearTimeout(this.xmlToModelerTimer);
    this.processNameImported.complete();
  }

  /** Loads a diagram as the new pristine state (initial load or process switch). */
  async loadDiagram(xml: string): Promise<void> {
    try {
      await this.modeler.importXML(xml);
      this.modeler.fitViewport();
      this.modeler.isModified.set(false);
      this.xmlContent.set(xml);
      this.xmlError.set(null);
    } catch (err) {
      console.error('Lỗi khi tải sơ đồ BPMN:', err);
    }
  }

  // --- Modeler -> XML ---

  private scheduleSyncFromModeler(): void {
    clearTimeout(this.modelerToXmlTimer);
    this.modelerToXmlTimer = setTimeout(() => this.syncFromModeler(), 300);
  }

  async syncFromModeler(): Promise<string> {
    if (!this.modeler.isReady || this.isSyncingFromXml) return this.xmlContent();
    try {
      const xml = await this.modeler.saveXML();
      if (xml && xml !== this.xmlContent()) {
        this.xmlContent.set(xml);
      }
      return xml;
    } catch (err) {
      console.error('Lỗi khi trích xuất XML từ Modeler:', err);
      return this.xmlContent();
    }
  }

  // --- XML -> Modeler ---

  onXmlInput(newXml: string): void {
    this.xmlContent.set(newXml);
    this.modeler.isModified.set(true);

    if (this.isAutoSync()) {
      clearTimeout(this.xmlToModelerTimer);
      this.xmlToModelerTimer = setTimeout(() => this.applyXml(newXml), 350);
    }
  }

  async applyXml(xmlToApply?: string, notifySuccess = false): Promise<boolean> {
    const xml = (xmlToApply !== undefined ? xmlToApply : this.xmlContent()).trim();
    const validationError = validateBpmnXml(xml);
    if (validationError) {
      this.xmlError.set(validationError);
      return false;
    }

    this.isSyncingFromXml = true;
    this.isSyncing.set(true);
    try {
      await this.modeler.reimportXML(xml);

      const processName = this.modeler.getRootProcessName();
      if (processName) {
        this.processNameImported.next(processName);
      }
      this.xmlError.set(null);

      if (notifySuccess) {
        this.message.success('Đã nạp và cập nhật sơ đồ BPMN thành công!');
      }
      return true;
    } catch (err: any) {
      console.warn('Lỗi khi nạp XML vào Modeler:', err);
      this.xmlError.set('BPMN Modeler không thể phân tích XML này: ' + (err?.message || err));
      return false;
    } finally {
      this.isSyncingFromXml = false;
      this.isSyncing.set(false);
    }
  }

  /** Replaces the whole XML (file upload, reset to template) and applies it to the canvas. */
  replaceXml(xml: string): void {
    this.xmlContent.set(xml);
    this.modeler.isModified.set(true);
    this.applyXml(xml, true);
  }

  toggleAutoSync(): void {
    this.isAutoSync.update((v) => !v);
    if (this.isAutoSync()) {
      this.applyXml(this.xmlContent(), true);
    }
  }

  loadFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const xml = e.target?.result as string;
      if (xml) {
        this.replaceXml(xml);
      }
    };
    reader.readAsText(file);
  }

  async pasteFromClipboard(): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText())?.trim();
        if (text) {
          this.xmlContent.set(text);
          this.modeler.isModified.set(true);
          const success = await this.applyXml(text);
          if (success) {
            this.message.success('Đã dán và cập nhật sơ đồ từ Clipboard thành công!');
          } else {
            this.message.warning(
              'Đã dán mã XML nhưng phát hiện lỗi cú pháp, vui lòng xem chi tiết cảnh báo bên dưới.',
            );
          }
        } else {
          this.message.info('Bộ nhớ đệm (Clipboard) hiện không có nội dung.');
        }
      } else {
        this.message.info(
          'Vui lòng nhấp vào khung soạn thảo và nhấn Ctrl+V để dán mã XML trực tiếp.',
        );
      }
    } catch (err) {
      console.warn('Không thể đọc clipboard tự động:', err);
      this.message.info(
        'Vui lòng nhấp vào khung soạn thảo và nhấn Ctrl+V để dán mã XML trực tiếp.',
      );
    }
  }

  async formatXml(): Promise<void> {
    try {
      if (this.modeler.isReady) {
        const xml = await this.modeler.saveXML();
        if (xml) {
          this.xmlContent.set(xml);
          this.message.success('Đã căn chỉnh định dạng XML chuẩn BPMN 2.0!');
          return;
        }
      }
    } catch {
      // fallback
    }
    this.xmlContent.update((x) => beautifyXml(x));
    this.message.success('Đã căn chỉnh định dạng XML!');
  }
}
