import { Injectable, signal } from '@angular/core';
import { BpmnProcess } from '../models/bpmn-process.model';

const INITIAL_PROCESSES: BpmnProcess[] = [
  {
    id: 'proc_101',
    code: 'BPMN-ORDER-01',
    name: 'Quy trình Xử lý Đơn hàng',
    description: 'Tiếp nhận đơn hàng, xác minh thanh toán, kiểm kê kho và giao hàng.',
    version: 'v1.2.0',
    status: 'PUBLISHED',
    updatedAt: '2026-08-12 08:30',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Order"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Order" isExecutable="true">
    <bpmn:startEvent id="Start_Order" name="Khách đặt hàng">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Payment" name="Kiểm tra thanh toán">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Paid" name="Hợp lệ?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Pass</bpmn:outgoing>
      <bpmn:outgoing>Flow_Fail</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_Pack" name="Đóng gói & Khởi tạo giao hàng">
      <bpmn:incoming>Flow_Pass</bpmn:incoming>
      <bpmn:outgoing>Flow_End1</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_Success" name="Đơn hàng hoàn tất">
      <bpmn:incoming>Flow_End1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="End_Failed" name="Hủy đơn hàng">
      <bpmn:incoming>Flow_Fail</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_Order" targetRef="Task_Payment" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Payment" targetRef="Gateway_Paid" />
    <bpmn:sequenceFlow id="Flow_Pass" name="Có" sourceRef="Gateway_Paid" targetRef="Task_Pack" />
    <bpmn:sequenceFlow id="Flow_Fail" name="Không" sourceRef="Gateway_Paid" targetRef="End_Failed" />
    <bpmn:sequenceFlow id="Flow_End1" sourceRef="Task_Pack" targetRef="End_Success" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Order">
    <bpmndi:BPMNPlane id="BPMNPlane_Order" bpmnElement="Process_Order">
      <bpmndi:BPMNShape id="Start_Order_di" bpmnElement="Start_Order">
        <dc:Bounds x="180" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Payment_di" bpmnElement="Task_Payment">
        <dc:Bounds x="270" y="138" width="130" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Paid_di" bpmnElement="Gateway_Paid" isMarkerVisible="true">
        <dc:Bounds x="465" y="153" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Pack_di" bpmnElement="Task_Pack">
        <dc:Bounds x="580" y="100" width="160" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Success_di" bpmnElement="End_Success">
        <dc:Bounds x="802" y="122" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Failed_di" bpmnElement="End_Failed">
        <dc:Bounds x="582" y="242" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="178" />
        <di:waypoint x="270" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="400" y="178" />
        <di:waypoint x="465" y="178" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Pass_di" bpmnElement="Flow_Pass">
        <di:waypoint x="490" y="153" />
        <di:waypoint x="490" y="140" />
        <di:waypoint x="580" y="140" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Fail_di" bpmnElement="Flow_Fail">
        <di:waypoint x="490" y="203" />
        <di:waypoint x="490" y="260" />
        <di:waypoint x="582" y="260" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_End1_di" bpmnElement="Flow_End1">
        <di:waypoint x="740" y="140" />
        <di:waypoint x="802" y="140" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
  },
  {
    id: 'proc_102',
    code: 'BPMN-HR-02',
    name: 'Quy trình Duyệt nghỉ phép',
    description: 'Nhân viên gửi yêu cầu nghỉ phép, Quản lý trực tiếp duyệt và Nhân sự ghi nhận.',
    version: 'v1.0.1',
    status: 'PUBLISHED',
    updatedAt: '2026-08-11 14:15',
    xml: ''
  },
  {
    id: 'proc_103',
    code: 'BPMN-LOAN-03',
    name: 'Quy trình Tín dụng & Vay vốn',
    description: 'Thẩm định hồ sơ vay vốn cá nhân, duyệt hạn mức và giải ngân.',
    version: 'v0.9.0',
    status: 'DRAFT',
    updatedAt: '2026-08-10 17:45',
    xml: ''
  }
];

@Injectable({
  providedIn: 'root'
})
export class BpmnProcessService {
  private processesSignal = signal<BpmnProcess[]>(INITIAL_PROCESSES);

  get processes() {
    return this.processesSignal.asReadonly();
  }

  saveProcess(processData: Partial<BpmnProcess> & { name: string; xml: string }): BpmnProcess {
    const list = this.processesSignal();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (processData.id) {
      // Update existing
      const updated = list.map(item => {
        if (item.id === processData.id) {
          return {
            ...item,
            code: processData.code || item.code,
            name: processData.name || item.name,
            description: processData.description !== undefined ? processData.description : item.description,
            version: processData.version || item.version,
            status: processData.status || item.status,
            xml: processData.xml !== undefined ? processData.xml : item.xml,
            updatedAt: nowStr
          };
        }
        return item;
      });
      this.processesSignal.set(updated);
      return updated.find(i => i.id === processData.id)!;
    } else {
      // Create new
      const newId = 'proc_' + Date.now();
      const newCode = processData.code || ('BPMN-PROC-' + (list.length + 1).toString().padStart(2, '0'));
      const newProc: BpmnProcess = {
        id: newId,
        code: newCode,
        name: processData.name || 'Quy trình mới',
        description: processData.description || 'Mô tả quy trình BPMN mới.',
        version: processData.version || 'v1.0.0',
        status: processData.status || 'DRAFT',
        updatedAt: nowStr,
        xml: processData.xml
      };
      this.processesSignal.set([newProc, ...list]);
      return newProc;
    }
  }

  deleteProcess(id: string): void {
    const filtered = this.processesSignal().filter(p => p.id !== id);
    this.processesSignal.set(filtered);
  }
}
