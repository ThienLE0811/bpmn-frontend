export const DEFAULT_DMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"
             xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
             xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
             id="Definitions_DefaultDMN"
             name="Decision Rules"
             namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="Decision_Default" name="Bảng Quyết định Mới">
    <decisionTable id="DecisionTable_Default" hitPolicy="FIRST">
      <input id="Input_1" label="Điều kiện đầu vào 1">
        <inputExpression id="InputExpression_1" typeRef="string">
          <text>inputVar1</text>
        </inputExpression>
      </input>
      <output id="Output_1" label="Kết quả đầu ra" name="outputVar" typeRef="string" />
      <rule id="DecisionRule_1">
        <inputEntry id="UnaryTests_1">
          <text>"Gia_tri_1"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1">
          <text>"Ket_qua_1"</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_Default">
      <dmndi:DMNShape id="DMNShape_Decision_Default" dmnElementRef="Decision_Default">
        <dc:Bounds height="80" width="180" x="160" y="100" />
      </dmndi:DMNShape>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</definitions>`;
