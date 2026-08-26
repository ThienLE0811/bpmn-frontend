import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule, NzTableFilterFn } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DmnDecisionService } from '@core/services/dmn-decision.service';
import { DmnDecision } from '@core/models/dmn-decision.model';
import { DmnDesignerComponent } from '@shared/components/dmn-designer/dmn-designer.component';

@Component({
  selector: 'app-dmn-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzPopconfirmModule,
    NzIconModule,
    DmnDesignerComponent,
  ],
  templateUrl: './dmn-list.component.html',
  styleUrl: './dmn-list.component.scss',
})
export class DmnListComponent {
  private dmnService = inject(DmnDecisionService);

  protected searchTerm = signal<string>('');
  protected isModalOpen = signal<boolean>(false);
  protected selectedDecision = signal<DmnDecision | null>(null);
  protected pageSize = signal<number>(10);

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

  // Table Sort Comparators
  protected sortCode = (a: DmnDecision, b: DmnDecision): number =>
    a.code.localeCompare(b.code);

  protected sortName = (a: DmnDecision, b: DmnDecision): number =>
    a.name.localeCompare(b.name);

  protected sortVersion = (a: DmnDecision, b: DmnDecision): number =>
    a.version.localeCompare(b.version);

  protected sortStatus = (a: DmnDecision, b: DmnDecision): number =>
    a.status.localeCompare(b.status);

  protected sortUpdatedAt = (a: DmnDecision, b: DmnDecision): number =>
    a.updatedAt.localeCompare(b.updatedAt);

  // Table Status Filter
  protected statusFilterList = [
    { text: 'Đã phát hành', value: 'PUBLISHED' },
    { text: 'Bản nháp', value: 'DRAFT' },
  ];

  protected statusFilterFn: NzTableFilterFn<DmnDecision> = (
    list: string[],
    item: DmnDecision,
  ): boolean => list.some((status) => item.status === status);

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

  deleteDecision(decision: DmnDecision, event?: Event): void {
    event?.stopPropagation();
    this.dmnService.deleteDecision(decision.id);
  }
}
