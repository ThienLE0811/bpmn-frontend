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
import { NAV_ITEMS, NavItem, findBreadcrumbTrail } from './nav.config';

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

  /**
   * Danh sách menu đã được lọc theo vai trò (Role-based access control)
   */
  protected menuItems = computed<NavItem[]>(() => {
    const currentUser = this.authService.currentUser();
    const userRole = currentUser?.role;

    return NAV_ITEMS.filter((item) => {
      if (item.roles && (!userRole || !item.roles.includes(userRole))) {
        return false;
      }
      return true;
    })
      .map((item) => {
        if (!item.children) return item;
        const filteredChildren = item.children.filter((child) => {
          if (child.roles && (!userRole || !child.roles.includes(userRole))) {
            return false;
          }
          return true;
        });
        return { ...item, children: filteredChildren };
      })
      .filter((item) => !item.children || item.children.length > 0 || item.route);
  });

  protected breadcrumb = computed(() => {
    const url = this.currentUrl();
    const trail = findBreadcrumbTrail(NAV_ITEMS, url);
    if (trail && trail.length > 0) {
      return ['BPMN Platform', ...trail].join(' / ');
    }
    return 'BPMN Platform / Quản lý Quy trình BPMN';
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

