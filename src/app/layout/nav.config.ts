import { UserRole } from '@core/models';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  roles?: UserRole[];
  disabled?: boolean;
  badge?: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan & Thống kê',
    icon: 'dashboard',
    route: '/dashboard',
  },
  {
    id: 'workspace',
    label: 'Không gian làm việc',
    icon: 'carry-out',
    children: [
      {
        id: 'tasks',
        label: 'Công việc (Tasks)',
        icon: 'check-square',
        route: '/tasks',
      },
      {
        id: 'cases',
        label: 'Hồ sơ vụ việc (Cases)',
        icon: 'folder-open',
        route: '/cases',
        disabled: true,
        badge: 'Sắp có',
      },
    ],
  },
  {
    id: 'process-definitions',
    label: 'Quy trình & Nghiệp vụ',
    icon: 'branches',
    children: [
      {
        id: 'processes',
        label: 'Quy trình BPMN',
        icon: 'deployment-unit',
        route: '/processes',
      },
      {
        id: 'decisions',
        label: 'Bảng quyết định DMN',
        icon: 'table',
        route: '/decisions',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Vận hành & Giám sát',
    icon: 'fund-projection-screen',
    children: [
      {
        id: 'operate',
        label: 'Camunda Operate',
        icon: 'monitor',
        route: '/operate',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Quản trị hệ thống',
    icon: 'setting',
    roles: ['ADMIN'],
    children: [
      {
        id: 'users',
        label: 'Quản lý Người dùng',
        icon: 'team',
        route: '/users',
        roles: ['ADMIN'],
      },
      {
        id: 'settings',
        label: 'Cấu hình hệ thống',
        icon: 'control',
        disabled: true,
        badge: 'Sắp có',
      },
    ],
  },
];

/**
 * Tự động tìm chuỗi breadcrumb dựa trên cấu hình NavItem và URL hiện tại
 */
export function findBreadcrumbTrail(items: NavItem[], currentUrl: string): string[] | null {
  const cleanUrl = currentUrl.split('?')[0].split('#')[0];

  for (const item of items) {
    if (item.route && (cleanUrl === item.route || cleanUrl.startsWith(item.route + '/'))) {
      return [item.label];
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.route && (cleanUrl === child.route || cleanUrl.startsWith(child.route + '/'))) {
          return [item.label, child.label];
        }
      }
    }
  }

  // Hỗ trợ redirect alias như /dmn -> Bảng quyết định DMN
  if (cleanUrl === '/dmn' || cleanUrl.startsWith('/dmn/')) {
    return ['Quy trình & Nghiệp vụ', 'Bảng quyết định DMN'];
  }

  return null;
}
