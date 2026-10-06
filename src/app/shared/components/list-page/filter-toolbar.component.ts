import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';

/**
 * Thanh công cụ phía trên bảng: ô tìm kiếm + nút Tìm kiếm / Đặt lại bên trái, nút làm mới bên phải.
 * Bộ lọc riêng của trang (select, toggle...) chiếu vào sau ô tìm kiếm qua `<ng-content>`;
 * nội dung thêm bên phải dùng `<ng-content select="[toolbarRight]">`.
 * Phần tử chiếu vào dùng các class phẳng trong `styles/_list-page.scss` (`.filter-field`, `.filter-select`, ...).
 */
@Component({
  selector: 'app-filter-toolbar',
  standalone: true,
  imports: [FormsModule, NzIconModule, NzInputModule],
  templateUrl: './filter-toolbar.component.html',
  styleUrl: './filter-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterToolbarComponent {
  readonly searchText = model<string>('');
  readonly placeholder = input<string>('Tìm kiếm...');
  readonly filtered = input<boolean>(false);
  readonly loading = input<boolean>(false);
  /** Tắt khi trang đã có nút làm mới ở chỗ khác (ví dụ trên header). */
  readonly showRefresh = input<boolean>(true);

  readonly searchSubmit = output<void>();
  readonly filtersReset = output<void>();
  readonly reload = output<void>();
}
