import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { AuthService } from '@core/services';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzDropdownModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private router = inject(Router);
  protected readonly authService = inject(AuthService);

  isCollapsed = signal<boolean>(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url),
    ),
    { initialValue: this.router.url },
  );

  protected breadcrumb = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/dashboard')) {
      return 'BPMN & DMN Platform / Tổng quan & Thống kê';
    }
    if (url.includes('/decisions') || url.includes('/dmn')) {
      return 'BPMN & DMN Platform / Bảng Quyết định DMN';
    }
    if (url.includes('/users')) {
      return 'BPMN & DMN Platform / Quản lý Người dùng';
    }
    if (url.includes('/operate')) {
      return 'BPMN & DMN Platform / Camunda Operate - Giám sát Quy trình';
    }
    return 'BPMN & DMN Platform / Quản lý Quy trình BPMN';
  });

  protected userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'AD';
    if (user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.fullName.substring(0, 2).toUpperCase();
    }
    return user.username ? user.username.substring(0, 2).toUpperCase() : 'AD';
  });

  toggleCollapsed(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  logout(): void {
    this.authService.logout();
  }
}

