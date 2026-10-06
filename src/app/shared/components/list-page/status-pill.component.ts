import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusTone } from '@core/models';

/** Nhãn trạng thái dạng viên thuốc có chấm màu. Lấy `label`/`tone` từ các hàm `get...StatusMeta`. */
@Component({
  selector: 'app-status-pill',
  standalone: true,
  template: `<span class="dot"></span><span>{{ label() }}</span>`,
  styleUrl: './status-pill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'tone-' + tone()",
  },
})
export class StatusPillComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('neutral');
}
