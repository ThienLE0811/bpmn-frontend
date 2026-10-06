import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

export type StatTone = 'primary' | 'neutral' | 'warning' | 'indigo' | 'success' | 'info';

/**
 * Thẻ số liệu trong lưới thống kê. Muốn bấm để lọc thì đặt `clickable` và gắn `(click)` lên thẻ;
 * `active` đánh dấu bộ lọc đang áp dụng.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NzIconModule],
  template: `
    <div class="stat-icon" [class]="'tone-' + tone()">
      <span nz-icon [nzType]="icon()" nzTheme="outline" [nzSpin]="iconSpin()"></span>
    </div>
    <div class="stat-info">
      <span class="stat-label">{{ label() }}</span>
      <span class="stat-value" [class]="highlightValue() ? 'tone-text-' + tone() : ''">{{
        value()
      }}</span>
    </div>
    @if (pulse()) {
      <span class="pulse-indicator"></span>
    }
  `,
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.clickable]': 'clickable()',
    '[class.active]': 'active()',
  },
})
export class StatCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input<number | string>(0);
  readonly tone = input<StatTone>('primary');
  readonly iconSpin = input<boolean>(false);
  /** Tô màu con số theo tông của thẻ. */
  readonly highlightValue = input<boolean>(false);
  readonly clickable = input<boolean>(false);
  readonly active = input<boolean>(false);
  /** Chấm nhấp nháy ở góc - báo hiệu có mục đang chạy. */
  readonly pulse = input<boolean>(false);
}
