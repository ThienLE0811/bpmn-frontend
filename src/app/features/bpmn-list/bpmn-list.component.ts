import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BpmnProcessService } from '@core/services/bpmn-process.service';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { BpmnDesignerComponent } from '@shared/components/bpmn-designer/bpmn-designer.component';

@Component({
  selector: 'app-bpmn-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzPopconfirmModule,
    NzIconModule,
    BpmnDesignerComponent,
  ],
  templateUrl: './bpmn-list.component.html',
  styleUrl: './bpmn-list.component.scss',
})
export class BpmnListComponent {
  private bpmnService = inject(BpmnProcessService);

  protected searchTerm = signal<string>('');
  protected isModalOpen = signal<boolean>(false);
  protected selectedProcess = signal<BpmnProcess | null>(null);
  protected pageSize = signal<number>(10);

  protected processes = this.bpmnService.processes;

  protected publishedCount = computed(
    () => this.processes().filter((p) => p.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.processes().filter((p) => p.status === 'DRAFT').length,
  );

  protected filteredProcesses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.processes();
    return this.processes().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term),
    );
  });

  // Table Sort Comparators
  protected sortCode = (a: BpmnProcess, b: BpmnProcess): number =>
    a.code.localeCompare(b.code);

  protected sortName = (a: BpmnProcess, b: BpmnProcess): number =>
    a.name.localeCompare(b.name);

  protected sortVersion = (a: BpmnProcess, b: BpmnProcess): number =>
    a.version.localeCompare(b.version);

  protected sortStatus = (a: BpmnProcess, b: BpmnProcess): number =>
    a.status.localeCompare(b.status);

  protected sortUpdatedAt = (a: BpmnProcess, b: BpmnProcess): number =>
    a.updatedAt.localeCompare(b.updatedAt);

  // Table Status Filter
  protected statusFilterList = [
    { text: 'Đã phát hành', value: 'PUBLISHED' },
    { text: 'Bản nháp', value: 'DRAFT' },
  ];

  protected statusFilterFn: NzTableFilterFn<BpmnProcess> = (
    list: string[],
    item: BpmnProcess,
  ): boolean => list.some((status) => item.status === status);

  openCreateModal(): void {
    this.selectedProcess.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(process: BpmnProcess): void {
    this.selectedProcess.set(process);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedProcess.set(null);
  }

  onSaveFromModal(event: { name: string; xml: string }): void {
    const current = this.selectedProcess();
    this.bpmnService.saveProcess({
      id: current?.id,
      code: current?.code,
      description: current?.description,
      status: current?.status,
      version: current?.version,
      name: event.name,
      xml: event.xml,
    });

    this.closeModal();
  }

  deleteProcess(process: BpmnProcess, event?: Event): void {
    event?.stopPropagation();
    this.bpmnService.deleteProcess(process.id);
  }
}
