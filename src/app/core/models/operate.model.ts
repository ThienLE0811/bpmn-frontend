export type ProcessInstanceState = 'ACTIVE' | 'COMPLETED' | 'CANCELED' | 'INCIDENT';

export interface OperateProcessInstance {
  id: string;
  processDefinitionKey: string;
  processDefinitionName: string;
  processVersion: number;
  bpmnXml?: string | null;
  startDate: string;
  endDate?: string | null;
  state: ProcessInstanceState;
  incidentCount: number;
  activeActivities: string[];
  incidentActivities: string[];
  completedActivities: string[];

  // Backend fields preserved
  processId?: string;
  status?: string;
  currentNodeId?: string | null;
  startedBy?: string;
  startedAt?: string;
  completedAt?: string | null;
  variables?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessIncident {
  id: string;
  processInstanceId: string;
  activityId: string;
  activityName: string;
  errorType: string;
  errorMessage: string;
  creationTime: string;
  state: 'OPEN' | 'RESOLVED';
}

export interface ProcessVariable {
  name: string;
  value: unknown;
  type: string;
  lastUpdated: string;
}

export interface ActivityExecution {
  id: string;
  activityId: string;
  activityName: string;
  activityType: string;
  state: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'FAILED';
  startTime: string;
  endTime?: string;
  duration?: string;
}

export interface OperateMetrics {
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  incidentInstances: number;
  canceledInstances: number;
}

export interface OperateFilterParams {
  search?: string;
  state?: string;
  processDefinitionKey?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}
