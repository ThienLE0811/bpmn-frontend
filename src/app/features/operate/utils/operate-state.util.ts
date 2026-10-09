import { ProcessInstanceState } from '@core/models';

/**
 * Lấy màu badge/tag tương ứng với trạng thái phiên quy trình Operate
 */
export function getOperateStateTagColor(state: ProcessInstanceState | string): string {
  switch ((state || '').toUpperCase()) {
    case 'ACTIVE':
    case 'RUNNING':
      return 'processing';
    case 'INCIDENT':
    case 'FAILED':
      return 'error';
    case 'COMPLETED':
      return 'success';
    case 'CANCELED':
    case 'CANCELLED':
    case 'TERMINATED':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Lấy nhãn hiển thị tiếng Việt của trạng thái phiên quy trình Operate
 */
export function getOperateStateLabel(state: ProcessInstanceState | string): string {
  switch ((state || '').toUpperCase()) {
    case 'ACTIVE':
    case 'RUNNING':
      return 'Đang chạy';
    case 'INCIDENT':
    case 'FAILED':
      return 'Sự cố (Incident)';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'CANCELED':
    case 'CANCELLED':
    case 'TERMINATED':
      return 'Đã hủy';
    default:
      return state || 'Chưa xác định';
  }
}
