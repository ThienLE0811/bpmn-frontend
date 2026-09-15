export interface TaskResponse {
  id: string;
  processInstanceId: string;
  nodeId: string;
  name: string;
  description: string;
  status: string;
  assigneeId: string;
  claimedBy: string;
  claimedAt: string;
  completedBy: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskQueryParams {
  status?: string;
  mine?: boolean;
  search?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}

export interface CompleteTaskPayload {
  variables?: Record<string, unknown>;
}

export interface TaskStatusMeta {
  key: string;
  label: string;
  color: string;
  tagColor: string;
  icon: string;
  badgeStatus: 'default' | 'success' | 'processing' | 'error' | 'warning';
}

export function getTaskStatusMeta(status: string | null | undefined): TaskStatusMeta {
  const s = (status || '').toUpperCase().trim();
  switch (s) {
    case 'CREATED':
    case 'PENDING':
    case 'UNASSIGNED':
      return {
        key: 'CREATED',
        label: 'Chờ tiếp nhận',
        color: '#f59e0b',
        tagColor: 'orange',
        icon: 'clock-circle',
        badgeStatus: 'warning',
      };
    case 'ASSIGNED':
      return {
        key: 'ASSIGNED',
        label: 'Đã phân công',
        color: '#0284c7',
        tagColor: 'cyan',
        icon: 'user',
        badgeStatus: 'processing',
      };
    case 'CLAIMED':
      return {
        key: 'CLAIMED',
        label: 'Đang thực hiện',
        color: '#2563eb',
        tagColor: 'blue',
        icon: 'sync',
        badgeStatus: 'processing',
      };
    case 'COMPLETED':
      return {
        key: 'COMPLETED',
        label: 'Đã hoàn thành',
        color: '#10b981',
        tagColor: 'green',
        icon: 'check-circle',
        badgeStatus: 'success',
      };
    case 'CANCELED':
    case 'CANCELLED':
      return {
        key: 'CANCELED',
        label: 'Đã hủy',
        color: '#ef4444',
        tagColor: 'red',
        icon: 'close-circle',
        badgeStatus: 'error',
      };
    default:
      return {
        key: s || 'UNKNOWN',
        label: status || 'Chưa rõ',
        color: '#64748b',
        tagColor: 'default',
        icon: 'question-circle',
        badgeStatus: 'default',
      };
  }
}
