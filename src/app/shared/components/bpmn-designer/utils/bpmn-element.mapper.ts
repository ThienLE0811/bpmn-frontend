import { BpmnElementProperties } from '../bpmn-designer.models';
import { getTimerDefinition, TIMER_TYPES } from './timer.utils';

/**
 * Camunda extension attributes may surface as a typed moddle property, via `get()`,
 * or as a raw `$attrs` entry depending on how the XML was loaded - check all three.
 */
function readCamundaAttr(bo: any, prop: string): string {
  return bo[prop] || bo.get?.(`camunda:${prop}`) || bo.$attrs?.[`camunda:${prop}`] || '';
}

export function readElementProperties(element: any): BpmnElementProperties {
  const bo = element.businessObject;

  // A gateway's `default` moddle property references the sequence-flow business
  // object directly (not its id string) - compare by id to know if THIS flow is it.
  const sourceDefault = element.source?.businessObject?.default;
  const isDefaultFlow = !!sourceDefault && sourceDefault.id === bo.id;

  const timerDef = getTimerDefinition(bo);
  const timerType = timerDef ? TIMER_TYPES.find((t) => timerDef[t]) || '' : '';
  const timerValue = timerType ? timerDef[timerType]?.body || '' : '';

  return {
    id: element.id,
    name: bo.name || '',
    type: element.type,
    documentation: bo.documentation?.[0]?.text || '',
    assignee: readCamundaAttr(bo, 'assignee'),
    candidateGroups: readCamundaAttr(bo, 'candidateGroups'),
    candidateUsers: readCamundaAttr(bo, 'candidateUsers'),
    dueDate: readCamundaAttr(bo, 'dueDate'),
    priority: readCamundaAttr(bo, 'priority'),
    formKey: readCamundaAttr(bo, 'formKey'),
    conditionExpression: bo.conditionExpression?.body || bo.conditionExpression?.text || '',
    isDefaultFlow,
    topic: readCamundaAttr(bo, 'topic'),
    delegateExpression: readCamundaAttr(bo, 'delegateExpression'),
    javaClass: readCamundaAttr(bo, 'class'),
    calledElement: bo.calledElement || bo.get?.('calledElement') || '',
    decisionRef: readCamundaAttr(bo, 'decisionRef'),
    resultVariable: readCamundaAttr(bo, 'resultVariable'),
    hasTimer: !!timerDef,
    timerType,
    timerValue,
    // cancelActivity defaults to true in the BPMN schema - only an explicit false is non-interrupting
    isInterrupting: bo.cancelActivity !== false,
  };
}
