import { BpmnElementProperties, BpmnTypeMeta } from '../bpmn-designer.models';

const BPMN_TYPE_META: Record<string, BpmnTypeMeta> = {
  'bpmn:UserTask': {
    label: 'Task Người dùng (User Task)',
    category: 'task',
    icon: 'user',
    color: '#2563eb',
  },
  'bpmn:ServiceTask': {
    label: 'Tác vụ Tự động (Service Task)',
    category: 'task',
    icon: 'api',
    color: '#7c3aed',
  },
  'bpmn:ScriptTask': {
    label: 'Kịch bản (Script Task)',
    category: 'task',
    icon: 'code',
    color: '#0891b2',
  },
  'bpmn:SendTask': {
    label: 'Gửi tin nhắn (Send Task)',
    category: 'task',
    icon: 'send',
    color: '#4f46e5',
  },
  'bpmn:ReceiveTask': {
    label: 'Nhận tin nhắn (Receive Task)',
    category: 'task',
    icon: 'mail',
    color: '#0d9488',
  },
  'bpmn:ManualTask': {
    label: 'Tác vụ thủ công (Manual Task)',
    category: 'task',
    icon: 'tool',
    color: '#ea580c',
  },
  'bpmn:BusinessRuleTask': {
    label: 'Luật quyết định (Business Rule Task)',
    category: 'task',
    icon: 'table',
    color: '#d97706',
  },
  'bpmn:CallActivity': {
    label: 'Gọi quy trình con (Call Activity)',
    category: 'task',
    icon: 'apartment',
    color: '#2563eb',
  },
  'bpmn:SubProcess': {
    label: 'Quy trình con (Sub Process)',
    category: 'task',
    icon: 'folder-open',
    color: '#475569',
  },
  'bpmn:ExclusiveGateway': {
    label: 'Cổng rẽ nhánh XOR (Exclusive Gateway)',
    category: 'gateway',
    icon: 'branches',
    color: '#ca8a04',
  },
  'bpmn:ParallelGateway': {
    label: 'Cổng song song AND (Parallel Gateway)',
    category: 'gateway',
    icon: 'plus-circle',
    color: '#16a34a',
  },
  'bpmn:InclusiveGateway': {
    label: 'Cổng bao hàm OR (Inclusive Gateway)',
    category: 'gateway',
    icon: 'check-circle',
    color: '#65a30d',
  },
  'bpmn:EventBasedGateway': {
    label: 'Cổng theo sự kiện (Event Gateway)',
    category: 'gateway',
    icon: 'thunderbolt',
    color: '#9333ea',
  },
  'bpmn:SequenceFlow': {
    label: 'Luồng điều hướng (Sequence Flow)',
    category: 'flow',
    icon: 'arrow-right',
    color: '#e11d48',
  },
  'bpmn:StartEvent': {
    label: 'Sự kiện Bắt đầu (Start Event)',
    category: 'event',
    icon: 'play-circle',
    color: '#16a34a',
  },
  'bpmn:EndEvent': {
    label: 'Sự kiện Kết thúc (End Event)',
    category: 'event',
    icon: 'stop',
    color: '#dc2626',
  },
  'bpmn:IntermediateCatchEvent': {
    label: 'Bắt sự kiện (Catch Event)',
    category: 'event',
    icon: 'clock-circle',
    color: '#d97706',
  },
  'bpmn:IntermediateThrowEvent': {
    label: 'Phát sự kiện (Throw Event)',
    category: 'event',
    icon: 'alert',
    color: '#ea580c',
  },
  'bpmn:BoundaryEvent': {
    label: 'Sự kiện biên (Boundary Event)',
    category: 'event',
    icon: 'warning',
    color: '#c026d3',
  },
  'bpmn:Participant': {
    label: 'Pool / Phân vùng (Participant)',
    category: 'other',
    icon: 'layout',
    color: '#334155',
  },
  'bpmn:Lane': {
    label: 'Lane (Làn xử lý)',
    category: 'other',
    icon: 'column-width',
    color: '#64748b',
  },
};

const BRANCHING_GATEWAY_TYPES = ['bpmn:ExclusiveGateway', 'bpmn:InclusiveGateway'];

export function getBpmnTypeMeta(type?: string): BpmnTypeMeta {
  if (!type) {
    return { label: 'Chưa chọn', category: 'other', icon: 'appstore', color: '#64748b' };
  }
  return (
    BPMN_TYPE_META[type] || {
      label: type.replace('bpmn:', ''),
      category: 'other',
      icon: 'appstore',
      color: '#64748b',
    }
  );
}

export function isUserOrTask(type?: string): boolean {
  return !!type && ['bpmn:UserTask', 'bpmn:ManualTask'].includes(type);
}

export function isSequenceFlow(type?: string): boolean {
  return type === 'bpmn:SequenceFlow';
}

export function isServiceOrScript(type?: string): boolean {
  return (
    !!type &&
    ['bpmn:ServiceTask', 'bpmn:ScriptTask', 'bpmn:SendTask', 'bpmn:ReceiveTask'].includes(type)
  );
}

export function isServiceTask(type?: string): boolean {
  return type === 'bpmn:ServiceTask';
}

export function isCallActivity(type?: string): boolean {
  return type === 'bpmn:CallActivity';
}

export function isBusinessRuleTask(type?: string): boolean {
  return type === 'bpmn:BusinessRuleTask';
}

export function isBoundaryEvent(type?: string): boolean {
  return type === 'bpmn:BoundaryEvent';
}

export function isBranchingGateway(type?: string): boolean {
  return !!type && BRANCHING_GATEWAY_TYPES.includes(type);
}

export function hasExecutionConfig(element: BpmnElementProperties): boolean {
  const type = element.type;
  return (
    isUserOrTask(type) ||
    isSequenceFlow(type) ||
    isServiceOrScript(type) ||
    isCallActivity(type) ||
    isBusinessRuleTask(type) ||
    !!element.hasTimer
  );
}
