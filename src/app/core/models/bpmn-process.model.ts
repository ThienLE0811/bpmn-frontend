export type BpmnProcessStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BpmnProcess {
  id: string;
  processKey: string;
  name: string;
  description: string;
  category: string;
  version: number;
  bpmnXml: string | null;
  status: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
