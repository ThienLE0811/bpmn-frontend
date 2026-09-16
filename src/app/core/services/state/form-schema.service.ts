import { Injectable, signal } from '@angular/core';
import { FormDefinition, FormFieldDefinition } from '@core/models/form-schema.model';

const PREDEFINED_FORMS: FormDefinition[] = [
  {
    id: 'form_order_fulfillment',
    name: 'Biểu mẫu Đóng gói & Giao vận',
    category: 'Logistics / Kho vận',
    description: 'Xác nhận thông tin đóng gói, kiểm tra chất lượng và bàn giao vận đơn',
    fields: [
      {
        key: 'trackingCode',
        label: 'Mã vận đơn (Tracking Code)',
        type: 'text',
        required: true,
        placeholder: 'VD: VNPOST-2026-9824',
        defaultValue: 'VNPOST-98241',
        colSpan: 12,
        helpText: 'Mã số tra cứu đơn hàng từ bưu cục hoặc nhà vận chuyển',
      },
      {
        key: 'carrier',
        label: 'Đơn vị vận chuyển',
        type: 'select',
        required: true,
        defaultValue: 'VNPOST',
        colSpan: 12,
        options: [
          { label: 'VNPost Bưu điện Việt Nam', value: 'VNPOST' },
          { label: 'Viettel Post', value: 'VIETTELPOST' },
          { label: 'Giao Hàng Tiết Kiệm (GHTK)', value: 'GHTK' },
          { label: 'Giao Hàng Nhanh (GHN)', value: 'GHN' },
          { label: 'Shopee Xpress', value: 'SPX' },
        ],
      },
      {
        key: 'packageWeight',
        label: 'Khối lượng kiện hàng (Gram)',
        type: 'number',
        required: true,
        defaultValue: 650,
        min: 50,
        step: 50,
        colSpan: 12,
      },
      {
        key: 'shippingFee',
        label: 'Cước phí vận chuyển (VNĐ)',
        type: 'currency',
        defaultValue: 35000,
        min: 0,
        step: 5000,
        colSpan: 12,
      },
      {
        key: 'isQualityChecked',
        label: 'Kiểm định chất lượng đóng gói đạt chuẩn xuất kho',
        type: 'boolean',
        defaultValue: true,
        colSpan: 24,
        helpText: 'Đã niêm phong tem vỡ và chống sốc sản phẩm',
      },
      {
        key: 'deliveryNotes',
        label: 'Ghi chú giao hàng',
        type: 'textarea',
        placeholder: 'Giao giờ hành chính, gọi điện trước khi phát hàng...',
        defaultValue: 'Hàng dễ vỡ, vui lòng bảo quản cẩn thận khi vận chuyển.',
        colSpan: 24,
      },
    ],
  },
  {
    id: 'form_loan_approval',
    name: 'Biểu mẫu Thẩm định & Phê duyệt Khoản vay',
    category: 'Tài chính / Ngân hàng',
    description: 'Thẩm định hồ sơ tín dụng, xét duyệt hạn mức và quyết định giải ngân',
    fields: [
      {
        key: 'approved',
        label: 'Quyết định phê duyệt hồ sơ vay vốn',
        type: 'boolean',
        defaultValue: true,
        colSpan: 24,
        helpText: 'Bật để đồng ý giải ngân, tắt để từ chối hồ sơ',
      },
      {
        key: 'approvedAmount',
        label: 'Hạn mức tín dụng phê duyệt (VNĐ)',
        type: 'currency',
        required: true,
        defaultValue: 250000000,
        min: 10000000,
        step: 5000000,
        colSpan: 12,
      },
      {
        key: 'interestRate',
        label: 'Lãi suất áp dụng (%/năm)',
        type: 'number',
        required: true,
        defaultValue: 8.5,
        min: 1,
        max: 35,
        step: 0.1,
        colSpan: 12,
      },
      {
        key: 'loanTermMonths',
        label: 'Kỳ hạn cho vay (Tháng)',
        type: 'select',
        required: true,
        defaultValue: 36,
        colSpan: 12,
        options: [
          { label: '12 tháng (1 năm)', value: 12 },
          { label: '24 tháng (2 năm)', value: 24 },
          { label: '36 tháng (3 năm)', value: 36 },
          { label: '48 tháng (4 năm)', value: 48 },
          { label: '60 tháng (5 năm)', value: 60 },
        ],
      },
      {
        key: 'collateralVerified',
        label: 'Tài sản bảo đảm đã được công chứng định giá hợp lệ',
        type: 'boolean',
        defaultValue: true,
        colSpan: 12,
      },
      {
        key: 'comment',
        label: 'Ý kiến thẩm định & Lý do phê duyệt',
        type: 'textarea',
        required: true,
        defaultValue: 'Khách hàng có lịch sử CIC nhóm 1 tốt, thu nhập ổn định, hồ sơ đáp ứng đủ điều kiện giải ngân.',
        placeholder: 'Ghi rõ căn cứ duyệt hoặc nguyên nhân từ chối nếu không đạt...',
        colSpan: 24,
      },
    ],
  },
  {
    id: 'form_leave_request',
    name: 'Biểu mẫu Phê duyệt Nghỉ phép',
    category: 'Hành chính / Nhân sự',
    description: 'Xét duyệt đơn xin nghỉ phép của nhân sự',
    fields: [
      {
        key: 'approved',
        label: 'Chấp thuận đơn xin nghỉ phép',
        type: 'boolean',
        defaultValue: true,
        colSpan: 24,
      },
      {
        key: 'leaveType',
        label: 'Loại hình nghỉ phép',
        type: 'select',
        defaultValue: 'ANNUAL',
        colSpan: 12,
        options: [
          { label: 'Nghỉ phép năm có lương', value: 'ANNUAL' },
          { label: 'Nghỉ ốm đau / Chế độ BHXH', value: 'SICK' },
          { label: 'Nghỉ việc riêng hưởng lương (Cưới, tang)', value: 'SPECIAL' },
          { label: 'Nghỉ không hưởng lương', value: 'UNPAID' },
        ],
      },
      {
        key: 'totalDays',
        label: 'Số ngày nghỉ phê duyệt',
        type: 'number',
        defaultValue: 2,
        min: 0.5,
        step: 0.5,
        colSpan: 12,
      },
      {
        key: 'comment',
        label: 'Ý kiến người quản lý trực tiếp',
        type: 'textarea',
        defaultValue: 'Đã sắp xếp người hỗ trợ công việc thay thế trong thời gian nghỉ, đồng ý phê duyệt.',
        colSpan: 24,
      },
    ],
  },
  {
    id: 'form_start_order',
    name: 'Khởi tạo Đơn hàng (Start Order)',
    category: 'Bán hàng',
    description: 'Nhập thông tin đơn hàng mới để kích hoạt quy trình xử lý đơn',
    fields: [
      {
        key: 'orderId',
        label: 'Mã đơn hàng (Order Code)',
        type: 'text',
        required: true,
        defaultValue: 'ORD-2026-',
        colSpan: 12,
      },
      {
        key: 'customer',
        label: 'Tên khách hàng / Tổ chức',
        type: 'text',
        required: true,
        defaultValue: 'Công ty Cổ phần Công nghệ Toàn Cầu',
        colSpan: 12,
      },
      {
        key: 'amount',
        label: 'Tổng giá trị đơn hàng (VNĐ)',
        type: 'currency',
        required: true,
        defaultValue: 15500000,
        step: 100000,
        colSpan: 12,
      },
      {
        key: 'paymentMethod',
        label: 'Phương thức thanh toán',
        type: 'select',
        defaultValue: 'VNPAY_QR',
        colSpan: 12,
        options: [
          { label: 'Chuyển khoản VNPAY_QR', value: 'VNPAY_QR' },
          { label: 'Thẻ tín dụng Quốc tế (Visa/Master)', value: 'CREDIT_CARD' },
          { label: 'Thu hộ tiền mặt (COD)', value: 'COD' },
          { label: 'Hóa đơn công nợ 30 ngày', value: 'INVOICE_30D' },
        ],
      },
      {
        key: 'itemsCount',
        label: 'Số lượng chủng loại mặt hàng',
        type: 'number',
        defaultValue: 3,
        min: 1,
        colSpan: 12,
      },
      {
        key: 'isVip',
        label: 'Áp dụng chính sách Khách hàng VIP',
        type: 'boolean',
        defaultValue: true,
        colSpan: 12,
      },
      {
        key: 'notes',
        label: 'Ghi chú đơn hàng',
        type: 'textarea',
        defaultValue: 'Khách hàng yêu cầu xuất hóa đơn điện tử GTGT qua email.',
        colSpan: 24,
      },
    ],
  },
  {
    id: 'form_start_loan',
    name: 'Khởi tạo Hồ sơ Vay vốn (Start Loan)',
    category: 'Tín dụng',
    description: 'Đăng ký hồ sơ vay tiêu dùng hoặc kinh doanh',
    fields: [
      {
        key: 'applicantName',
        label: 'Họ và tên khách hàng vay',
        type: 'text',
        required: true,
        defaultValue: 'Nguyễn Văn Hùng',
        colSpan: 12,
      },
      {
        key: 'loanAmount',
        label: 'Số tiền đề nghị vay (VNĐ)',
        type: 'currency',
        required: true,
        defaultValue: 250000000,
        min: 10000000,
        step: 10000000,
        colSpan: 12,
      },
      {
        key: 'termMonths',
        label: 'Thời hạn vay mong muốn (Tháng)',
        type: 'select',
        defaultValue: 36,
        colSpan: 12,
        options: [
          { label: '12 tháng', value: 12 },
          { label: '24 tháng', value: 24 },
          { label: '36 tháng', value: 36 },
          { label: '48 tháng', value: 48 },
          { label: '60 tháng', value: 60 },
        ],
      },
      {
        key: 'creditScore',
        label: 'Điểm tín dụng nội bộ ước tính',
        type: 'number',
        defaultValue: 720,
        min: 300,
        max: 850,
        colSpan: 12,
      },
      {
        key: 'purpose',
        label: 'Mục đích sử dụng vốn vay',
        type: 'text',
        defaultValue: 'Vay tiêu dùng mua xe ô tô cá nhân',
        colSpan: 24,
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class FormSchemaService {
  private readonly formsRegistry = signal<FormDefinition[]>(PREDEFINED_FORMS);

  /**
   * Lấy toàn bộ danh sách biểu mẫu có sẵn trong hệ thống
   */
  getRegisteredForms(): FormDefinition[] {
    return this.formsRegistry();
  }

  /**
   * Tìm form theo mã formKey hoặc id
   */
  getFormById(idOrKey: string): FormDefinition | null {
    if (!idOrKey) return null;
    const cleanKey = idOrKey.trim().toLowerCase();
    const found = this.formsRegistry().find(
      (f) => f.id.toLowerCase() === cleanKey || f.id.toLowerCase().includes(cleanKey)
    );
    return found || null;
  }

  /**
   * Tìm biểu mẫu thích hợp cho một Task dựa trên formKey, nodeId hoặc processKey
   */
  getFormForTask(
    nodeId?: string,
    formKey?: string,
    processId?: string,
    existingVariables?: Record<string, unknown>
  ): FormDefinition {
    // 1. Kiểm tra trực tiếp formKey nếu có
    if (formKey) {
      const byKey = this.getFormById(formKey);
      if (byKey) return byKey;
    }

    // 2. Tra cứu theo Node ID chuẩn
    if (nodeId) {
      const nId = nodeId.toLowerCase();
      if (nId.includes('pack') || nId.includes('ship') || nId.includes('order')) {
        return this.getFormById('form_order_fulfillment')!;
      }
      if (nId.includes('loan') || nId.includes('credit') || nId.includes('review') || nId.includes('application')) {
        return this.getFormById('form_loan_approval')!;
      }
      if (nId.includes('leave') || nId.includes('vacation')) {
        return this.getFormById('form_leave_request')!;
      }
    }

    // 3. Tra cứu theo Process ID
    if (processId) {
      const pId = processId.toLowerCase();
      if (pId.includes('order')) {
        return this.getFormById('form_order_fulfillment')!;
      }
      if (pId.includes('loan')) {
        return this.getFormById('form_loan_approval')!;
      }
      if (pId.includes('leave')) {
        return this.getFormById('form_leave_request')!;
      }
    }

    // 4. Nếu có existing variables, tự động suy diễn biểu mẫu thông minh
    if (existingVariables && Object.keys(existingVariables).length > 0) {
      return this.inferSchemaFromVariables(
        existingVariables,
        `Biểu mẫu Xử lý (${nodeId || 'Công việc'})`
      );
    }

    // 5. Fallback form mặc định cho Task
    return {
      id: 'form_default_task',
      name: 'Biểu mẫu Hoàn thành Công việc',
      description: 'Xác nhận xử lý tác vụ nghiệp vụ và ghi chú ý kiến phê duyệt',
      fields: [
        {
          key: 'approved',
          label: 'Phê duyệt / Đạt yêu cầu xử lý',
          type: 'boolean',
          defaultValue: true,
          colSpan: 24,
        },
        {
          key: 'comment',
          label: 'Ghi chú & Ý kiến xử lý',
          type: 'textarea',
          defaultValue: 'Đã hoàn tất xử lý tác vụ theo đúng quy định.',
          placeholder: 'Nhập nội dung nhận xét hoặc kết quả xử lý...',
          colSpan: 24,
        },
      ],
    };
  }

  /**
   * Tìm biểu mẫu khởi chạy tương ứng với một Quy trình
   */
  getFormForProcessStart(processId: string, formKey?: string): FormDefinition {
    if (formKey) {
      const byKey = this.getFormById(formKey);
      if (byKey) return byKey;
    }

    const pId = (processId || '').toLowerCase();
    if (pId.includes('order')) {
      return this.getFormById('form_start_order')!;
    }
    if (pId.includes('loan')) {
      return this.getFormById('form_start_loan')!;
    }
    if (pId.includes('leave')) {
      return this.getFormById('form_leave_request')!;
    }

    // Fallback form cho Start Case
    return {
      id: `form_start_${processId || 'generic'}`,
      name: `Khởi tạo quy trình ${processId || ''}`,
      description: 'Nhập các tham số ban đầu để kích hoạt phiên thực thi',
      fields: [
        {
          key: 'caseTitle',
          label: 'Tiêu đề hồ sơ vụ việc',
          type: 'text',
          required: true,
          defaultValue: `Hồ sơ ${processId} - ${new Date().toLocaleDateString('vi-VN')}`,
          colSpan: 24,
        },
        {
          key: 'priority',
          label: 'Mức độ ưu tiên',
          type: 'select',
          defaultValue: 'NORMAL',
          colSpan: 12,
          options: [
            { label: 'Thấp (Low)', value: 'LOW' },
            { label: 'Bình thường (Normal)', value: 'NORMAL' },
            { label: 'Cao (High)', value: 'HIGH' },
            { label: 'Khẩn cấp (Urgent)', value: 'URGENT' },
          ],
        },
        {
          key: 'estimatedBudget',
          label: 'Ngân sách ước tính (VNĐ)',
          type: 'currency',
          defaultValue: 10000000,
          colSpan: 12,
        },
        {
          key: 'note',
          label: 'Mục đích & Ghi chú khởi tạo',
          type: 'textarea',
          defaultValue: 'Khởi chạy quy trình từ cổng thông tin người dùng.',
          colSpan: 24,
        },
      ],
    };
  }

  /**
   * Tự động suy diễn Form Schema từ một đối tượng Variables tùy ý
   */
  inferSchemaFromVariables(
    variables: Record<string, unknown>,
    title = 'Biểu mẫu Tự động Suy diễn'
  ): FormDefinition {
    const fields: FormFieldDefinition[] = [];

    for (const [rawKey, val] of Object.entries(variables)) {
      const key = rawKey.trim();
      const label = this.prettifyKeyName(key);

      if (typeof val === 'boolean') {
        fields.push({
          key,
          label,
          type: 'boolean',
          defaultValue: val,
          colSpan: 24,
        });
      } else if (typeof val === 'number') {
        const lowerKey = key.toLowerCase();
        const isMoney =
          lowerKey.includes('amount') ||
          lowerKey.includes('price') ||
          lowerKey.includes('fee') ||
          lowerKey.includes('cost') ||
          lowerKey.includes('budget') ||
          lowerKey.includes('salary');

        fields.push({
          key,
          label,
          type: isMoney ? 'currency' : 'number',
          defaultValue: val,
          colSpan: 12,
        });
      } else if (typeof val === 'string') {
        const lowerKey = key.toLowerCase();
        const isLongText =
          val.length > 50 ||
          lowerKey.includes('comment') ||
          lowerKey.includes('note') ||
          lowerKey.includes('desc') ||
          lowerKey.includes('reason');

        fields.push({
          key,
          label,
          type: isLongText ? 'textarea' : 'text',
          defaultValue: val,
          colSpan: isLongText ? 24 : 12,
        });
      } else {
        fields.push({
          key,
          label,
          type: 'text',
          defaultValue: String(val ?? ''),
          colSpan: 24,
        });
      }
    }

    return {
      id: `inferred_form_${Date.now()}`,
      name: title,
      description: 'Các trường được nhận diện tự động từ dữ liệu biến của phiên làm việc',
      fields,
    };
  }

  /**
   * Trích xuất giá trị mặc định từ Schema kết hợp giá trị hiện có
   */
  extractFormValues(
    schema: FormDefinition,
    existingValues?: Record<string, unknown>
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};

    for (const field of schema.fields) {
      if (existingValues && existingValues[field.key] !== undefined) {
        values[field.key] = existingValues[field.key];
      } else if (field.defaultValue !== undefined) {
        values[field.key] = field.defaultValue;
      } else {
        values[field.key] = field.type === 'boolean' ? false : field.type === 'number' || field.type === 'currency' ? 0 : '';
      }
    }

    // Giữ thêm các biến hiện có nếu không nằm trong schema
    if (existingValues) {
      for (const [k, v] of Object.entries(existingValues)) {
        if (values[k] === undefined) {
          values[k] = v;
        }
      }
    }

    return values;
  }

  /**
   * Chuyển đổi tên biến camelCase hoặc snake_case thành nhãn tiếng Việt/tiêu chuẩn
   */
  private prettifyKeyName(key: string): string {
    const dictionary: Record<string, string> = {
      approved: 'Kết quả phê duyệt',
      comment: 'Ý kiến nhận xét / Ghi chú',
      note: 'Ghi chú',
      notes: 'Ghi chú bổ sung',
      amount: 'Tổng số tiền / Giá trị',
      approvedAmount: 'Hạn mức phê duyệt (VNĐ)',
      interestRate: 'Lãi suất (%/năm)',
      loanAmount: 'Số tiền vay đề nghị (VNĐ)',
      applicantName: 'Tên người nộp đơn',
      customer: 'Tên khách hàng / Đối tác',
      orderId: 'Mã đơn hàng',
      paymentMethod: 'Phương thức thanh toán',
      trackingCode: 'Mã vận đơn',
      carrier: 'Đơn vị vận chuyển',
      isVip: 'Khách hàng VIP',
      itemsCount: 'Số lượng mặt hàng',
      termMonths: 'Kỳ hạn (Tháng)',
      creditScore: 'Điểm tín dụng',
      totalDays: 'Số ngày nghỉ',
      leaveType: 'Loại nghỉ phép',
      startDate: 'Ngày bắt đầu',
      endDate: 'Ngày kết thúc',
    };

    if (dictionary[key]) {
      return dictionary[key];
    }

    // Tự động phân tách camelCase: "customerName" -> "Customer Name"
    const result = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}
