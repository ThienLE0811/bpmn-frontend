import { OperateProcessInstance, ProcessInstanceState } from '@core/models';

/**
 * Chuyển đổi dữ liệu raw từ API GET /process-instances sang định dạng OperateProcessInstance
 */
export function mapToOperateProcessInstance(
  raw: any,
  processNameMap?: Map<string, string>,
): OperateProcessInstance {
  if (!raw) {
    return {
      id: '',
      processDefinitionKey: '',
      processDefinitionName: '',
      processVersion: 1,
      startDate: '',
      endDate: null,
      state: 'ACTIVE',
      incidentCount: 0,
      activeActivities: [],
      incidentActivities: [],
      completedActivities: [],
    };
  }

  const processId = raw.processId || raw.processDefinitionKey || '';
  const processKey = raw.processDefinitionKey || raw.processId || '';
  const processName =
    raw.processDefinitionName ||
    (processNameMap && processId ? processNameMap.get(processId) : null) ||
    processKey ||
    'Quy trình';

  let state: ProcessInstanceState = 'ACTIVE';
  const statusStr = String(raw.status || raw.state || '').toUpperCase().trim();
  if (statusStr === 'COMPLETED') {
    state = 'COMPLETED';
  } else if (statusStr === 'TERMINATED' || statusStr === 'CANCELED' || statusStr === 'CANCELLED') {
    state = 'CANCELED';
  } else if (statusStr === 'SUSPENDED' || statusStr === 'INCIDENT' || statusStr === 'FAILED') {
    state = 'INCIDENT';
  } else {
    state = 'ACTIVE';
  }

  let activeActivities: string[] = [];
  if (Array.isArray(raw.activeActivities)) {
    activeActivities = raw.activeActivities;
  } else if (raw.currentNodeId) {
    activeActivities = [raw.currentNodeId];
  }

  const incidentActivities: string[] = Array.isArray(raw.incidentActivities) ? raw.incidentActivities : [];
  const completedActivities: string[] = Array.isArray(raw.completedActivities) ? raw.completedActivities : [];

  const startDate = raw.startedAt || raw.startDate || raw.createdAt || '';
  const endDate = raw.completedAt || raw.endDate || null;

  return {
    id: String(raw.id || ''),
    processDefinitionKey: processKey,
    processDefinitionName: processName,
    processVersion: typeof raw.processVersion === 'number' ? raw.processVersion : 1,
    bpmnXml: raw.bpmnXml || null,
    startDate,
    endDate,
    state,
    incidentCount: typeof raw.incidentCount === 'number' ? raw.incidentCount : (state === 'INCIDENT' ? 1 : 0),
    activeActivities,
    incidentActivities,
    completedActivities,

    processId,
    status: raw.status || state,
    currentNodeId: raw.currentNodeId ?? null,
    startedBy: raw.startedBy || '',
    startedAt: raw.startedAt || startDate,
    completedAt: endDate,
    variables: raw.variables || {},
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
