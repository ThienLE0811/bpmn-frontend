import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * Thanh tiêu đề của trang danh sách: tiêu đề, mô tả, nút ẩn/hiện thống kê.
 * Nút hành động riêng của trang được chiếu vào bằng `<ng-content>`;
 * dòng nhãn phía trên tiêu đề dùng `<ng-content select="[pageEyebrow]">`.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.plain]': "variant() === 'plain'",
  },
})
export class PageHeaderComponent {
  /**
   * `bar`: thanh trắng có viền dưới, dùng cho trang có vùng nội dung cuộn riêng (task, case).
   * `plain`: nền trong suốt, dùng cho trang có layout padding (bpmn, dmn, users).
   */
  readonly variant = input<'bar' | 'plain'>('bar');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly showStatsToggle = input<boolean>(true);
  readonly statsOpen = model<boolean>(false);
}
