import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * Khung bộ lọc nâng cao xổ xuống dưới toolbar. Các trường lọc chiếu vào lưới qua `<ng-content>`,
 * mỗi trường bọc trong `.grid-form-item` (style trong `styles/_list-page.scss`).
 */
@Component({
  selector: 'app-advanced-filter-panel',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './advanced-filter-panel.component.html',
  styleUrl: './advanced-filter-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedFilterPanelComponent {
  readonly title = input<string>('Bộ lọc chi tiết');
  readonly filtered = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly applyFilters = output<void>();
  readonly filtersReset = output<void>();
  readonly collapse = output<void>();
}
