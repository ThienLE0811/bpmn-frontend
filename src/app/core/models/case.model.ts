export type ProcessInstanceStatus = 'RUNNING' | 'COMPLETED' | 'SUSPENDED' | 'TERMINATED' | string;

export interface ProcessInstance {
  id: string;
  processId: string;
  processVersion: number;
  status: ProcessInstanceStatus;
  currentNodeId: string | null; // node BPMN đang chờ (userTask id), null khi COMPLETED
  variables: Record<string, unknown>;
  startedBy: string;
  startedAt: string; // format "dd/MM/yyyy HH:mm:ss", không phải ISO-8601
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CaseInstance = ProcessInstance;

export interface StartProcessInstanceRequest {
  processId: string;
  variables?: Record<string, unknown>;
}

export interface ProcessInstanceQueryParams {
  page?: number;
  size?: number;
  status?: string;
  processId?: string;
  search?: string;
  [key: string]: unknown;
}

export interface CaseStatusMeta {
  key: string;
  label: string;
  color: string;
  tagColor: string;
  icon: string;
  badgeStatus: 'default' | 'success' | 'processing' | 'error' | 'warning';
}

export function getCaseStatusMeta(status: string | null | undefined): CaseStatusMeta {
  const s = (status || '').toUpperCase().trim();
  switch (s) {
    case 'RUNNING':
    case 'ACTIVE':
      return {
        key: 'RUNNING',
        label: 'Đang chạy',
        color: '#2563eb',
        tagColor: 'blue',
        icon: 'sync',
        badgeStatus: 'processing',
      };
    case 'COMPLETED':
      return {
        key: 'COMPLETED',
        label: 'Hoàn thành',
        color: '#10b981',
        tagColor: 'green',
        icon: 'check-circle',
        badgeStatus: 'success',
      };
    case 'SUSPENDED':
      return {
        key: 'SUSPENDED',
        label: 'Tạm dừng',
        color: '#f59e0b',
        tagColor: 'orange',
        icon: 'pause-circle',
        badgeStatus: 'warning',
      };
    case 'TERMINATED':
    case 'CANCELED':
      return {
        key: 'TERMINATED',
        label: 'Đã chấm dứt',
        color: '#ef4444',
        tagColor: 'red',
        icon: 'close-circle',
        badgeStatus: 'error',
      };
    default:
      return {
        key: s || 'UNKNOWN',
        label: status || 'Chưa xác định',
        color: '#64748b',
        tagColor: 'default',
        icon: 'question-circle',
        badgeStatus: 'default',
      };
  }
}
