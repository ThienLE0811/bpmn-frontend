import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { DmnApiService } from '@core/services/api/dmn-api.service';
import { extractContent } from '@core/models';
import { DEFAULT_BPMN_XML } from '@shared/constants';
import {
  DesignerHeaderComponent,
  DesignerMode,
} from '../designer-header/designer-header.component';
import { PropertiesTab } from './bpmn-designer.models';
import { BpmnModelerService } from './services/bpmn-modeler.service';
import { BpmnXmlSyncService } from './services/bpmn-xml-sync.service';
import { BpmnPropertiesPanelComponent } from './properties-panel/bpmn-properties-panel.component';
import { BpmnXmlEditorComponent } from './xml-editor/bpmn-xml-editor.component';

const DEFAULT_PROCESS_NAME = 'Quy trình BPMN mới';

@Component({
  selector: 'app-bpmn-designer',
  standalone: true,
  imports: [DesignerHeaderComponent, BpmnPropertiesPanelComponent, BpmnXmlEditorComponent],
  providers: [BpmnModelerService, BpmnXmlSyncService],
  templateUrl: './bpmn-designer.component.html',
  styleUrl: './bpmn-designer.component.scss',
})
export class BpmnDesignerComponent implements AfterViewInit, OnChanges {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLDivElement>;

  protected readonly modeler = inject(BpmnModelerService);
  protected readonly xmlSync = inject(BpmnXmlSyncService);
  private readonly dmnApi = inject(DmnApiService);

  @Input() processData: BpmnProcess | null = null;
  @Input() readOnly = false;
  @Input() saveLabel?: string;
  @Input() initialMode: DesignerMode = 'design';
  @Input() showHeaderActions = false;
  @Output() save = new EventEmitter<{ name: string; xml: string }>();
  @Output() closed = new EventEmitter<void>();

  protected viewMode = signal<DesignerMode>('design');
  protected processName = signal<string>(DEFAULT_PROCESS_NAME);
  protected propertiesTab = signal<PropertiesTab>('general');
  protected dmnDecisionOptions = signal<DmnDecision[]>([]);
  protected currentZoom = this.modeler.currentZoom;
  readonly isModified = this.modeler.isModified;
  readonly isSimulationActive = this.modeler.isSimulationActive;
  readonly isSimulationPaused = this.modeler.isSimulationPaused;
  private initialProcessName = '';

  constructor() {
    this.xmlSync.processNameImported
      .pipe(takeUntilDestroyed())
      .subscribe((name) => this.processName.set(name));
  }

  hasChanges(): boolean {
    if (this.readOnly) return false;
    const isTitleChanged = this.processName() !== this.initialProcessName;
    return this.isModified() || isTitleChanged;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['processData']) {
      this.loadProcess();
    }
    if (changes['initialMode']?.currentValue) {
      this.setMode(changes['initialMode'].currentValue);
    }
  }

  ngAfterViewInit(): void {
    if (this.initialMode) {
      this.viewMode.set(this.initialMode);
    }

    this.modeler.init(this.canvasRef.nativeElement);
    this.xmlSync.attach();
    this.loadDmnDecisionOptions();
    this.loadProcess();
  }

  /** Resets name + diagram from `processData`; the diagram import waits for the modeler. */
  private loadProcess(): void {
    const name = this.processData?.name || DEFAULT_PROCESS_NAME;
    this.processName.set(name);
    this.initialProcessName = name;

    const xml = this.processData?.bpmnXml || DEFAULT_BPMN_XML;
    this.xmlSync.xmlContent.set(xml);
    if (this.modeler.isReady) {
      void this.xmlSync.loadDiagram(xml);
    }
  }

  private loadDmnDecisionOptions(): void {
    this.dmnApi.getAll({ page: 1, size: 100 }).subscribe({
      next: (data) => this.dmnDecisionOptions.set(extractContent(data)),
      error: (err) =>
        console.warn('Không thể tải danh sách DMN decision để gán cho Business Rule Task:', err),
    });
  }

  setMode(mode: DesignerMode): void {
    if (mode === 'xml' && this.isSimulationActive()) {
      this.modeler.toggleSimulation();
    }

    this.viewMode.set(mode);

    if (mode === 'xml') {
      // Ensure XML editor has latest diagram state
      void this.xmlSync.syncFromModeler();
    }
    if (mode === 'design') {
      this.modeler.refitAfterLayout();
    }
  }

  async getDiagramXml(): Promise<string> {
    try {
      if (this.modeler.isReady) {
        return (await this.modeler.saveXML()) || this.xmlSync.xmlContent();
      }
    } catch (err) {
      console.error('Lỗi khi lấy sơ đồ BPMN XML:', err);
    }
    return this.xmlSync.xmlContent() || this.processData?.bpmnXml || DEFAULT_BPMN_XML;
  }

  async onSave(): Promise<void> {
    try {
      // If currently in XML mode and modified, ensure it's applied
      if (this.viewMode() === 'xml') {
        await this.xmlSync.applyXml();
      }
      const finalXml = (await this.modeler.saveXML()) || this.xmlSync.xmlContent();
      if (finalXml) {
        this.save.emit({
          name: this.processName(),
          xml: finalXml,
        });
        this.isModified.set(false);
      }
    } catch (err) {
      console.error('Lỗi khi lưu sơ đồ BPMN:', err);
    }
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.xmlSync.loadFile(file);
    }
  }
}
