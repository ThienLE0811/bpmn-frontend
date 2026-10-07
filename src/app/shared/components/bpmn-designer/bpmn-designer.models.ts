/** Một camunda:inputParameter / camunda:outputParameter của connector. */
export interface ConnectorParam {
  name: string;
  value: string;
}

export type TimerType = 'timeDuration' | 'timeDate' | 'timeCycle';

export interface BpmnElementProperties {
  id: string;
  name: string;
  type: string;
  documentation: string;
  // User & Task execution
  assignee?: string;
  candidateGroups?: string;
  candidateUsers?: string;
  dueDate?: string;
  priority?: string;
  formKey?: string;
  // Sequence flow
  conditionExpression?: string;
  isDefaultFlow?: boolean;
  // Service & Automation
  topic?: string;
  delegateExpression?: string;
  javaClass?: string;
  calledElement?: string;
  // Connector của Service Task (camunda:connector)
  connectorId?: string;
  connectorInputs?: ConnectorParam[];
  connectorOutputs?: ConnectorParam[];
  // Business Rule Task (DMN)
  decisionRef?: string;
  resultVariable?: string;
  // Timer Event (Start / Intermediate Catch / Boundary)
  hasTimer?: boolean;
  timerType?: TimerType | '';
  timerValue?: string;
  isInterrupting?: boolean;
}

export interface TimerPreset {
  label: string;
  value: string;
}

export interface TimerSummary {
  valid: boolean;
  text: string;
}

export interface BpmnTypeMeta {
  label: string;
  category: 'task' | 'gateway' | 'event' | 'flow' | 'other';
  icon: string;
  color: string;
}

export type PropertiesTab = 'general' | 'execution' | 'advanced';
