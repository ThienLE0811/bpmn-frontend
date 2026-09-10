import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  ProcessInstance,
  ProcessIncident,
  ProcessVariable,
  ActivityExecution,
  OperateMetrics,
  OperateFilterParams,
} from '@core/models/operate.model';

const SAMPLE_BPMN_ORDER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_OrderProcess"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_OrderFulfillment" name="Quy trình Xử lý Đơn hàng" isExecutable="true">
    <bpmn:startEvent id="Start_OrderReceived" name="Đơn hàng mới">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:serviceTask id="Task_ValidateInventory" name="Kiểm tra tồn kho">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:serviceTask id="Task_ProcessPayment" name="Thanh toán trực tuyến">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:userTask id="Task_PackShip" name="Đóng gói & Giao hàng">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="End_OrderCompleted" name="Hoàn thành giao">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_OrderReceived" targetRef="Task_ValidateInventory" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_ValidateInventory" targetRef="Task_ProcessPayment" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_ProcessPayment" targetRef="Task_PackShip" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_PackShip" targetRef="End_OrderCompleted" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Order">
    <bpmndi:BPMNPlane id="BPMNPlane_Order" bpmnElement="Process_OrderFulfillment">
      <bpmndi:BPMNShape id="Start_OrderReceived_di" bpmnElement="Start_OrderReceived">
        <dc:Bounds x="160" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_ValidateInventory_di" bpmnElement="Task_ValidateInventory">
        <dc:Bounds x="250" y="138" width="130" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_ProcessPayment_di" bpmnElement="Task_ProcessPayment">
        <dc:Bounds x="440" y="138" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_PackShip_di" bpmnElement="Task_PackShip">
        <dc:Bounds x="640" y="138" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OrderCompleted_di" bpmnElement="End_OrderCompleted">
        <dc:Bounds x="840" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="196" y="178" />
        <di:waypoint x="250" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="380" y="178" />
        <di:waypoint x="440" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="580" y="178" />
        <di:waypoint x="640" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="780" y="178" />
        <di:waypoint x="840" y="178" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const MOCK_INSTANCES: ProcessInstance[] = [
  {
    id: 'inst-982410',
    processDefinitionKey: 'Process_OrderFulfillment',
    processDefinitionName: 'Quy trình Xử lý Đơn hàng',
    processVersion: 2,
    bpmnXml: SAMPLE_BPMN_ORDER_XML,
    startDate: '2026-09-10T08:15:32.000Z',
    endDate: null,
    state: 'INCIDENT',
    incidentCount: 1,
    activeActivities: ['Task_ProcessPayment'],
    incidentActivities: ['Task_ProcessPayment'],
    completedActivities: ['Start_OrderReceived', 'Task_ValidateInventory'],
  },
  {
    id: 'inst-982409',
    processDefinitionKey: 'Process_OrderFulfillment',
    processDefinitionName: 'Quy trình Xử lý Đơn hàng',
    processVersion: 2,
    bpmnXml: SAMPLE_BPMN_ORDER_XML,
    startDate: '2026-09-10T07:50:11.000Z',
    endDate: null,
    state: 'ACTIVE',
    incidentCount: 0,
    activeActivities: ['Task_PackShip'],
    incidentActivities: [],
    completedActivities: ['Start_OrderReceived', 'Task_ValidateInventory', 'Task_ProcessPayment'],
  },
  {
    id: 'inst-982390',
    processDefinitionKey: 'Process_OrderFulfillment',
    processDefinitionName: 'Quy trình Xử lý Đơn hàng',
    processVersion: 1,
    bpmnXml: SAMPLE_BPMN_ORDER_XML,
    startDate: '2026-09-09T14:22:00.000Z',
    endDate: '2026-09-09T14:35:18.000Z',
    state: 'COMPLETED',
    incidentCount: 0,
    activeActivities: [],
    incidentActivities: [],
    completedActivities: ['Start_OrderReceived', 'Task_ValidateInventory', 'Task_ProcessPayment', 'Task_PackShip', 'End_OrderCompleted'],
  },
  {
    id: 'inst-982381',
    processDefinitionKey: 'Process_LoanApplication',
    processDefinitionName: 'Quy trình Phê duyệt Khoản vay',
    processVersion: 3,
    bpmnXml: null,
    startDate: '2026-09-09T10:11:45.000Z',
    endDate: null,
    state: 'ACTIVE',
    incidentCount: 0,
    activeActivities: ['Task_CreditScore'],
    incidentActivities: [],
    completedActivities: ['Start_LoanRequest', 'Task_VerifyIdentity'],
  },
  {
    id: 'inst-982355',
    processDefinitionKey: 'Process_LoanApplication',
    processDefinitionName: 'Quy trình Phê duyệt Khoản vay',
    processVersion: 3,
    bpmnXml: null,
    startDate: '2026-09-08T09:00:10.000Z',
    endDate: '2026-09-08T09:12:00.000Z',
    state: 'CANCELED',
    incidentCount: 0,
    activeActivities: [],
    incidentActivities: [],
    completedActivities: ['Start_LoanRequest'],
  },
];

const MOCK_INCIDENTS: Record<string, ProcessIncident[]> = {
  'inst-982410': [
    {
      id: 'inc-5001',
      processInstanceId: 'inst-982410',
      activityId: 'Task_ProcessPayment',
      activityName: 'Thanh toán trực tuyến',
      errorType: 'PaymentGatewayTimeoutException',
      errorMessage: 'Cổng thanh toán phản hồi 504 Gateway Timeout sau 3 lần thử lại kết nối.',
      creationTime: '2026-09-10T08:16:04.000Z',
      state: 'OPEN',
    },
  ],
};

const MOCK_VARIABLES: Record<string, ProcessVariable[]> = {
  'inst-982410': [
    { name: 'orderId', value: 'ORD-2026-98112', type: 'String', lastUpdated: '2026-09-10T08:15:32.000Z' },
    { name: 'totalAmount', value: 3450000, type: 'Long', lastUpdated: '2026-09-10T08:15:32.000Z' },
    { name: 'customerEmail', value: 'hoang.nam@example.com', type: 'String', lastUpdated: '2026-09-10T08:15:32.000Z' },
    { name: 'paymentMethod', value: 'VNPAY_QR', type: 'String', lastUpdated: '2026-09-10T08:15:35.000Z' },
    { name: 'inventoryReserved', value: true, type: 'Boolean', lastUpdated: '2026-09-10T08:15:40.000Z' },
  ],
  'inst-982409': [
    { name: 'orderId', value: 'ORD-2026-98111', type: 'String', lastUpdated: '2026-09-10T07:50:11.000Z' },
    { name: 'totalAmount', value: 1200000, type: 'Long', lastUpdated: '2026-09-10T07:50:11.000Z' },
    { name: 'paymentSuccess', value: true, type: 'Boolean', lastUpdated: '2026-09-10T07:51:00.000Z' },
  ],
};

const MOCK_AUDIT: Record<string, ActivityExecution[]> = {
  'inst-982410': [
    {
      id: 'act-1',
      activityId: 'Start_OrderReceived',
      activityName: 'Đơn hàng mới',
      activityType: 'StartEvent',
      state: 'COMPLETED',
      startTime: '2026-09-10T08:15:32.000Z',
      endTime: '2026-09-10T08:15:33.000Z',
      duration: '1s',
    },
    {
      id: 'act-2',
      activityId: 'Task_ValidateInventory',
      activityName: 'Kiểm tra tồn kho',
      activityType: 'ServiceTask',
      state: 'COMPLETED',
      startTime: '2026-09-10T08:15:33.000Z',
      endTime: '2026-09-10T08:15:40.000Z',
      duration: '7s',
    },
    {
      id: 'act-3',
      activityId: 'Task_ProcessPayment',
      activityName: 'Thanh toán trực tuyến',
      activityType: 'ServiceTask',
      state: 'FAILED',
      startTime: '2026-09-10T08:15:40.000Z',
      duration: 'Đang tạm dừng do sự cố',
    },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class OperateApiService {
  private readonly api = inject(ApiService);
  private readonly baseEndpoint = '/operate';

  private instancesStore = [...MOCK_INSTANCES];

  getMetrics(): Observable<OperateMetrics> {
    return this.api.get<OperateMetrics>(`${this.baseEndpoint}/metrics`).pipe(
      catchError(() => {
        const total = this.instancesStore.length;
        const active = this.instancesStore.filter((i) => i.state === 'ACTIVE').length;
        const incidents = this.instancesStore.filter((i) => i.state === 'INCIDENT').length;
        const completed = this.instancesStore.filter((i) => i.state === 'COMPLETED').length;
        const canceled = this.instancesStore.filter((i) => i.state === 'CANCELED').length;
        return of({
          totalInstances: total,
          activeInstances: active,
          completedInstances: completed,
          incidentInstances: incidents,
          canceledInstances: canceled,
        });
      }),
    );
  }

  getInstances(filters?: OperateFilterParams): Observable<ProcessInstance[]> {
    const cleanParams: Record<string, string | number> = {};
    if (filters) {
      if (filters.search) cleanParams['search'] = filters.search.trim();
      if (filters.state && filters.state !== 'ALL') cleanParams['state'] = filters.state;
      if (filters.processDefinitionKey) cleanParams['processDefinitionKey'] = filters.processDefinitionKey;
      if (filters.page) cleanParams['page'] = filters.page;
      if (filters.size) cleanParams['size'] = filters.size;
    }

    return this.api.get<ProcessInstance[]>(`${this.baseEndpoint}/process-instances`, cleanParams).pipe(
      catchError(() => {
        let result = [...this.instancesStore];
        if (filters?.state && filters.state !== 'ALL') {
          result = result.filter((item) => item.state === filters.state);
        }
        if (filters?.search && filters.search.trim()) {
          const s = filters.search.trim().toLowerCase();
          result = result.filter(
            (item) =>
              item.id.toLowerCase().includes(s) ||
              item.processDefinitionName.toLowerCase().includes(s) ||
              item.processDefinitionKey.toLowerCase().includes(s),
          );
        }
        return of(result);
      }),
    );
  }

  getInstanceDetail(id: string): Observable<ProcessInstance> {
    return this.api.get<ProcessInstance>(`${this.baseEndpoint}/process-instances/${id}`).pipe(
      catchError(() => {
        const item = this.instancesStore.find((i) => i.id === id);
        if (item) {
          return of(item);
        }
        return throwError(() => new Error(`Không tìm thấy phiên thực thi ID ${id}`));
      }),
    );
  }

  getIncidents(instanceId: string): Observable<ProcessIncident[]> {
    return this.api.get<ProcessIncident[]>(`${this.baseEndpoint}/process-instances/${instanceId}/incidents`).pipe(
      catchError(() => {
        return of(MOCK_INCIDENTS[instanceId] || []);
      }),
    );
  }

  getVariables(instanceId: string): Observable<ProcessVariable[]> {
    return this.api.get<ProcessVariable[]>(`${this.baseEndpoint}/process-instances/${instanceId}/variables`).pipe(
      catchError(() => {
        return of(MOCK_VARIABLES[instanceId] || []);
      }),
    );
  }

  getAuditTrail(instanceId: string): Observable<ActivityExecution[]> {
    return this.api.get<ActivityExecution[]>(`${this.baseEndpoint}/process-instances/${instanceId}/audit-trail`).pipe(
      catchError(() => {
        return of(MOCK_AUDIT[instanceId] || []);
      }),
    );
  }

  retryIncident(incidentId: string, instanceId?: string): Observable<void> {
    return this.api.post<void>(`${this.baseEndpoint}/incidents/${incidentId}/retry`, {}).pipe(
      catchError(() => {
        if (instanceId) {
          const found = this.instancesStore.find((i) => i.id === instanceId);
          if (found) {
            found.state = 'ACTIVE';
            found.incidentCount = 0;
            found.incidentActivities = [];
          }
          if (MOCK_INCIDENTS[instanceId]) {
            MOCK_INCIDENTS[instanceId] = MOCK_INCIDENTS[instanceId].filter((i) => i.id !== incidentId);
          }
        }
        return of(undefined);
      }),
    );
  }

  cancelInstance(instanceId: string): Observable<void> {
    return this.api.post<void>(`${this.baseEndpoint}/process-instances/${instanceId}/cancel`, {}).pipe(
      catchError(() => {
        const found = this.instancesStore.find((i) => i.id === instanceId);
        if (found) {
          found.state = 'CANCELED';
          found.endDate = new Date().toISOString();
          found.activeActivities = [];
          found.incidentActivities = [];
        }
        return of(undefined);
      }),
    );
  }
}
