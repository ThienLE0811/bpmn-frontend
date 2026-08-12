export type BpmnProcessStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BpmnProcess {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  status: BpmnProcessStatus;
  updatedAt: string;
  xml: string;
}
