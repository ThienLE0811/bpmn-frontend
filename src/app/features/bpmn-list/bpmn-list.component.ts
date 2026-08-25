import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BpmnProcessService } from '@core/services/bpmn-process.service';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { BpmnDesignerComponent } from '@shared/components/bpmn-designer/bpmn-designer.component';

@Component({
  selector: 'app-bpmn-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BpmnDesignerComponent],
  templateUrl: './bpmn-list.component.html',
  styleUrl: './bpmn-list.component.scss',
})
export class BpmnListComponent {
  private bpmnService = inject(BpmnProcessService);

  protected searchTerm = signal<string>('');
  protected isModalOpen = signal<boolean>(false);
  protected selectedProcess = signal<BpmnProcess | null>(null);

  protected processes = this.bpmnService.processes;

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

  deleteProcess(process: BpmnProcess, event: Event): void {
    event.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa quy trình "${process.name}" không?`)) {
      this.bpmnService.deleteProcess(process.id);
    }
  }
}
