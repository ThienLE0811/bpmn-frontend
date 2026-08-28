export type DmnDecisionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DmnDecision {
  id: string;
  decisionKey: string;
  name: string;
  description: string;
  hitPolicy: string;
  category: string;
  version: number;
  dmnXml: string;
  status: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
