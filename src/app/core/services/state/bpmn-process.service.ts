import { Injectable, inject, signal } from '@angular/core';
import { BpmnProcess } from '@core/models/bpmn-process.model';
import { ApiErrorHandlerService } from '@shared/services';
import { BpmnApiService } from '../api/bpmn-api.service';

const INITIAL_PROCESSES: BpmnProcess[] = [
  {
    id: 'proc_101',
    processKey: 'BPMN-ORDER-01',
    name: 'Quy trình Xử lý Đơn hàng',
    description: 'Tiếp nhận đơn hàng, xác minh thanh toán, kiểm kê kho và giao hàng.',
    category: 'ORDER',
    version: 1,
    status: 'PUBLISHED',
    createdBy: 'System Admin',
    updatedBy: 'System Admin',
    createdAt: '2026-08-12 08:30',
    updatedAt: '2026-08-12 08:30',
    bpmnXml: `<?xml version="1.0" encoding="UTF-8"?>
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
</bpmn:definitions>`,
  },
  {
    id: 'proc_102',
    processKey: 'BPMN-HR-02',
    name: 'Quy trình Duyệt nghỉ phép',
    description: 'Nhân viên gửi yêu cầu nghỉ phép, Quản lý trực tiếp duyệt và Nhân sự ghi nhận.',
    category: 'HR',
    version: 1,
    status: 'PUBLISHED',
    createdBy: 'System Admin',
    updatedBy: 'System Admin',
    createdAt: '2026-08-11 14:15',
    updatedAt: '2026-08-11 14:15',
    bpmnXml: null,
  },
  {
    id: 'proc_103',
    processKey: 'BPMN-LOAN-03',
    name: 'Quy trình Tín dụng & Vay vốn',
    description: 'Thẩm định hồ sơ vay vốn cá nhân, duyệt hạn mức và giải ngân.',
    category: 'FINANCE',
    version: 1,
    status: 'DRAFT',
    createdBy: 'System Admin',
    updatedBy: null,
    createdAt: '2026-08-10 17:45',
    updatedAt: '2026-08-10 17:45',
    bpmnXml: null,
  },
];

@Injectable({
  providedIn: 'root',
})
export class BpmnProcessService {
  private readonly bpmnApi = inject(BpmnApiService);
  private readonly errorHandler = inject(ApiErrorHandlerService);
  private processesSignal = signal<BpmnProcess[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  constructor() {}

  get processes() {
    return this.processesSignal.asReadonly();
  }

  get isLoading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  loadProcesses(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.bpmnApi.getAll().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.processesSignal.set(data);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.warn('Không thể kết nối API (/bpmn-processes), fallback về dữ liệu mẫu:', err);
        const errorText = this.errorHandler.handleError(
          err,
          'Lỗi khi tải danh sách quy trình BPMN từ máy chủ.',
        );
        this.errorSignal.set(errorText);
        this.loadingSignal.set(false);
      },
    });
  }

  saveProcess(
    processData: Partial<BpmnProcess> & {
      name: string;
      bpmnXml?: string | null;
      xml?: string | null;
    },
  ): BpmnProcess {
    const list = this.processesSignal();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const xmlContent =
      processData.bpmnXml !== undefined
        ? processData.bpmnXml
        : processData.xml !== undefined
          ? processData.xml
          : null;

    if (processData.id) {
      // Update existing
      const existing = list.find((i) => i.id === processData.id);
      const updatedItem: BpmnProcess = {
        id: processData.id,
        processKey: processData.processKey || existing?.processKey || '',
        name: processData.name || existing?.name || '',
        description:
          processData.description !== undefined
            ? processData.description
            : existing?.description || '',
        category: processData.category || existing?.category || 'GENERAL',
        version:
          processData.version !== undefined ? Number(processData.version) : existing?.version || 1,
        status: processData.status || existing?.status || 'DRAFT',
        bpmnXml: xmlContent !== null ? xmlContent : existing?.bpmnXml || null,
        createdBy: existing?.createdBy || 'Admin',
        updatedBy: 'Admin',
        createdAt: existing?.createdAt || nowStr,
        updatedAt: nowStr,
      };

      // Gọi API cập nhật
      this.bpmnApi.update(processData.id, updatedItem).subscribe({
        next: (res) => {
          if (res) {
            this.processesSignal.set(
              this.processesSignal().map((i) => (i.id === res.id ? res : i)),
            );
          }
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi cập nhật quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      });

      const updated = list.map((item) => {
        if (item.id === processData.id) {
          return {
            ...item,
            ...updatedItem,
          };
        }
        return item;
      });
      this.processesSignal.set(updated);
      return updated.find((i) => i.id === processData.id)!;
    } else {
      // Create new
      const newId = 'proc_' + Date.now();
      const newKey =
        processData.processKey || 'BPMN-PROC-' + (list.length + 1).toString().padStart(2, '0');
      const newProc: BpmnProcess = {
        id: newId,
        processKey: newKey,
        name: processData.name || 'Quy trình mới',
        description: processData.description || 'Mô tả quy trình BPMN mới.',
        category: processData.category || 'GENERAL',
        version: processData.version !== undefined ? Number(processData.version) : 1,
        status: processData.status || 'DRAFT',
        bpmnXml: xmlContent,
        createdBy: 'Admin',
        updatedBy: null,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      // Gọi API tạo mới
      this.bpmnApi.create(newProc).subscribe({
        next: (res) => {
          if (res) {
            this.processesSignal.set(this.processesSignal().map((i) => (i.id === newId ? res : i)));
          }
        },
        error: (err) => {
          console.error('Lỗi khi tạo mới BPMN qua API:', err);
          const errorText = this.errorHandler.handleError(
            err,
            'Lỗi khi tạo mới quy trình BPMN qua API.',
          );
          this.errorSignal.set(errorText);
        },
      });

      this.processesSignal.set([newProc, ...list]);
      return newProc;
    }
  }

  deleteProcess(id: string): void {
    // Gọi API xóa
    this.bpmnApi.delete(id).subscribe({
      error: (err) => {
        console.error('Lỗi khi xóa BPMN qua API:', err);
        const errorText = this.errorHandler.handleError(err, 'Lỗi khi xóa quy trình BPMN qua API.');
        this.errorSignal.set(errorText);
      },
    });

    const filtered = this.processesSignal().filter((p) => p.id !== id);
    this.processesSignal.set(filtered);
  }
}
