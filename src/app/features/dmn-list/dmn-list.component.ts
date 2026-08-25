import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DmnDecisionService } from '@core/services/dmn-decision.service';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { DmnDesignerComponent } from '@shared/components/dmn-designer/dmn-designer.component';

@Component({
  selector: 'app-dmn-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DmnDesignerComponent],
  templateUrl: './dmn-list.component.html',
  styleUrl: './dmn-list.component.scss',
})
export class DmnListComponent {
  private dmnService = inject(DmnDecisionService);

  protected searchTerm = signal<string>('');
  protected isModalOpen = signal<boolean>(false);
  protected selectedDecision = signal<DmnDecision | null>(null);

  protected decisions = this.dmnService.decisions;

  protected publishedCount = computed(
    () => this.decisions().filter((d) => d.status === 'PUBLISHED').length,
  );

  protected draftCount = computed(
    () => this.decisions().filter((d) => d.status === 'DRAFT').length,
  );

  protected filteredDecisions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.decisions();
    return this.decisions().filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term),
    );
  });

  openCreateModal(): void {
    this.selectedDecision.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(decision: DmnDecision): void {
    this.selectedDecision.set(decision);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedDecision.set(null);
  }

  onSaveFromModal(event: { name: string; xml: string }): void {
    const current = this.selectedDecision();
    this.dmnService.saveDecision({
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

  deleteDecision(decision: DmnDecision, event: Event): void {
    event.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa bảng quyết định "${decision.name}" không?`)) {
      this.dmnService.deleteDecision(decision.id);
    }
  }
}
