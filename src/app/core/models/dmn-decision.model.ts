export type DmnDecisionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DmnDecision {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  status: DmnDecisionStatus;
  updatedAt: string;
  xml: string;
}
