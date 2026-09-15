export interface Workflow {
  id: string;
  key?: string;
  name?: string;
  description?: string;
  version?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface WorkflowQueryParams {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}
