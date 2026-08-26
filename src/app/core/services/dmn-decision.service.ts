import { Injectable, signal } from '@angular/core';
import { DmnDecision } from '../models/dmn-decision.model';

const INITIAL_DECISIONS: DmnDecision[] = [
  {
    id: 'dmn_101',
    code: 'DMN-DISCOUNT-01',
    name: 'Bảng tính Chiết khấu Khách hàng',
    description: 'Quy tắc xác định tỷ lệ chiết khấu (%) và ưu đãi miễn phí vận chuyển theo hạng thành viên và giá trị đơn hàng.',
    version: 'v1.1.0',
    status: 'PUBLISHED',
    updatedAt: '2026-08-15 10:30',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"
             xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
             xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
             id="Definitions_DiscountRules"
             name="Customer Discount Rules"
             namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="Decision_Discount" name="Bảng tính Chiết khấu Khách hàng">
    <decisionTable id="DecisionTable_Discount" hitPolicy="FIRST">
      <input id="Input_CustomerType" label="Hạng thành viên">
        <inputExpression id="InputExpression_CustomerType" typeRef="string">
          <text>customerType</text>
        </inputExpression>
        <inputValues id="UnaryTests_CustomerType">
          <text>"Platinum","Gold","Silver","Bronze"</text>
        </inputValues>
      </input>
      <input id="Input_OrderTotal" label="Giá trị đơn hàng (VNĐ)">
        <inputExpression id="InputExpression_OrderTotal" typeRef="number">
          <text>orderTotal</text>
        </inputExpression>
      </input>
      <output id="Output_Discount" label="Tỷ lệ chiết khấu (%)" name="discount" typeRef="number" />
      <output id="Output_FreeShipping" label="Miễn phí giao hàng" name="freeShipping" typeRef="boolean" />
      <rule id="Rule_1">
        <inputEntry id="UnaryTests_Rule1_1">
          <text>"Platinum"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_Rule1_2">
          <text>&gt;= 10000000</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_Rule1_1">
          <text>20</text>
        </outputEntry>
        <outputEntry id="LiteralExpression_Rule1_2">
          <text>true</text>
        </outputEntry>
      </rule>
      <rule id="Rule_2">
        <inputEntry id="UnaryTests_Rule2_1">
          <text>"Platinum"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_Rule2_2">
          <text>&lt; 10000000</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_Rule2_1">
          <text>15</text>
        </outputEntry>
        <outputEntry id="LiteralExpression_Rule2_2">
          <text>true</text>
        </outputEntry>
      </rule>
      <rule id="Rule_3">
        <inputEntry id="UnaryTests_Rule3_1">
          <text>"Gold"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_Rule3_2">
          <text>&gt;= 5000000</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_Rule3_1">
          <text>10</text>
        </outputEntry>
        <outputEntry id="LiteralExpression_Rule3_2">
          <text>true</text>
        </outputEntry>
      </rule>
      <rule id="Rule_4">
        <inputEntry id="UnaryTests_Rule4_1">
          <text>"Silver"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_Rule4_2">
          <text>&gt;= 2000000</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_Rule4_1">
          <text>5</text>
        </outputEntry>
        <outputEntry id="LiteralExpression_Rule4_2">
          <text>false</text>
        </outputEntry>
      </rule>
      <rule id="Rule_5">
        <inputEntry id="UnaryTests_Rule5_1">
          <text>-</text>
        </inputEntry>
        <inputEntry id="UnaryTests_Rule5_2">
          <text>-</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_Rule5_1">
          <text>0</text>
        </outputEntry>
        <outputEntry id="LiteralExpression_Rule5_2">
          <text>false</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_Discount">
      <dmndi:DMNShape id="DMNShape_Decision_Discount" dmnElementRef="Decision_Discount">
        <dc:Bounds height="80" width="180" x="160" y="100" />
      </dmndi:DMNShape>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</definitions>`
  },
  {
    id: 'dmn_102',
    code: 'DMN-LOAN-02',
    name: 'Quy tắc Thẩm định Hồ sơ Vay vốn',
    description: 'Quy tắc đánh giá điểm tín dụng CIC và mức thu nhập hàng tháng để ra quyết định duyệt hoặc từ chối gói vay tín chấp.',
    version: 'v1.0.0',
    status: 'PUBLISHED',
    updatedAt: '2026-08-14 14:20',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"
             xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
             xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
             id="Definitions_LoanRules"
             name="Loan Approval Rules"
             namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="Decision_LoanApproval" name="Thẩm định Hồ sơ Vay vốn">
    <decisionTable id="DecisionTable_LoanApproval" hitPolicy="FIRST">
      <input id="Input_CreditScore" label="Điểm tín dụng (CIC)">
        <inputExpression id="InputExpression_CreditScore" typeRef="number">
          <text>creditScore</text>
        </inputExpression>
      </input>
      <input id="Input_MonthlyIncome" label="Thu nhập hàng tháng (Triệu VNĐ)">
        <inputExpression id="InputExpression_MonthlyIncome" typeRef="number">
          <text>monthlyIncome</text>
        </inputExpression>
      </input>
      <output id="Output_DecisionResult" label="Kết quả duyệt" name="result" typeRef="string" />
      <output id="Output_MaxLimit" label="Hạn mức tối đa (Triệu VNĐ)" name="maxLimit" typeRef="number" />
      <rule id="Rule_Loan_1">
        <inputEntry id="UnaryTests_Loan_1_1"><text>&gt;= 700</text></inputEntry>
        <inputEntry id="UnaryTests_Loan_1_2"><text>&gt;= 30</text></inputEntry>
        <outputEntry id="Literal_Loan_1_1"><text>"APPROVED_HIGH"</text></outputEntry>
        <outputEntry id="Literal_Loan_1_2"><text>500</text></outputEntry>
      </rule>
      <rule id="Rule_Loan_2">
        <inputEntry id="UnaryTests_Loan_2_1"><text>&gt;= 600</text></inputEntry>
        <inputEntry id="UnaryTests_Loan_2_2"><text>&gt;= 15</text></inputEntry>
        <outputEntry id="Literal_Loan_2_1"><text>"APPROVED_STANDARD"</text></outputEntry>
        <outputEntry id="Literal_Loan_2_2"><text>200</text></outputEntry>
      </rule>
      <rule id="Rule_Loan_3">
        <inputEntry id="UnaryTests_Loan_3_1"><text>&lt; 500</text></inputEntry>
        <inputEntry id="UnaryTests_Loan_3_2"><text>-</text></inputEntry>
        <outputEntry id="Literal_Loan_3_1"><text>"REJECTED"</text></outputEntry>
        <outputEntry id="Literal_Loan_3_2"><text>0</text></outputEntry>
      </rule>
      <rule id="Rule_Loan_4">
        <inputEntry id="UnaryTests_Loan_4_1"><text>-</text></inputEntry>
        <inputEntry id="UnaryTests_Loan_4_2"><text>-</text></inputEntry>
        <outputEntry id="Literal_Loan_4_1"><text>"MANUAL_REVIEW"</text></outputEntry>
        <outputEntry id="Literal_Loan_4_2"><text>50</text></outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_LoanApproval">
      <dmndi:DMNShape id="DMNShape_Decision_LoanApproval" dmnElementRef="Decision_LoanApproval">
        <dc:Bounds height="80" width="180" x="160" y="100" />
      </dmndi:DMNShape>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</definitions>`
  },
  {
    id: 'dmn_103',
    code: 'DMN-ROUTING-03',
    name: 'Bảng Phân luồng Xử lý Yêu cầu',
    description: 'Quy tắc định tuyến ticket hỗ trợ kỹ thuật và phân bổ chuyên viên xử lý.',
    version: 'v0.9.0',
    status: 'DRAFT',
    updatedAt: '2026-08-10 16:45',
    xml: ''
  }
];

@Injectable({
  providedIn: 'root'
})
export class DmnDecisionService {
  private decisionsSignal = signal<DmnDecision[]>(INITIAL_DECISIONS);

  get decisions() {
    return this.decisionsSignal.asReadonly();
  }

  saveDecision(decisionData: Partial<DmnDecision> & { name: string; xml: string }): DmnDecision {
    const list = this.decisionsSignal();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (decisionData.id) {
      // Update existing
      const updated = list.map(item => {
        if (item.id === decisionData.id) {
          return {
            ...item,
            code: decisionData.code || item.code,
            name: decisionData.name || item.name,
            description: decisionData.description !== undefined ? decisionData.description : item.description,
            version: decisionData.version || item.version,
            status: decisionData.status || item.status,
            xml: decisionData.xml !== undefined ? decisionData.xml : item.xml,
            updatedAt: nowStr
          };
        }
        return item;
      });
      this.decisionsSignal.set(updated);
      return updated.find(i => i.id === decisionData.id)!;
    } else {
      // Create new
      const newId = 'dmn_' + Date.now();
      const newCode = decisionData.code || ('DMN-DEC-' + (list.length + 1).toString().padStart(2, '0'));
      const newDmn: DmnDecision = {
        id: newId,
        code: newCode,
        name: decisionData.name || 'Bảng quyết định mới',
        description: decisionData.description || 'Mô tả bảng quyết định DMN mới.',
        version: decisionData.version || 'v1.0.0',
        status: decisionData.status || 'DRAFT',
        updatedAt: nowStr,
        xml: decisionData.xml
      };
      this.decisionsSignal.set([newDmn, ...list]);
      return newDmn;
    }
  }

  deleteDecision(id: string): void {
    const filtered = this.decisionsSignal().filter(d => d.id !== id);
    this.decisionsSignal.set(filtered);
  }
}
