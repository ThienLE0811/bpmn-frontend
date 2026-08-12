# BPMN Process Designer Frontend (`bpmn-frontend`)

Ứng dụng Web Quản lý và Thiết kế Quy trình Doanh nghiệp (BPMN 2.0) được xây dựng trên nền tảng **Angular 22** kết hợp thư viện **bpmn-js** và giao diện **NG-ZORRO (Ant Design)**.

---

## 🚀 Tính năng chính

- 📋 **Quản lý danh sách quy trình (BPMN List)**:
  - Hiển thị danh sách quy trình dưới dạng thẻ (cards) giao diện hiện đại.
  - Tìm kiếm quy trình nhanh chóng theo tên, mã quy trình (code) hoặc mô tả.
  - Lọc và theo dõi trạng thái quy trình (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
  - Quản lý thao tác Tạo mới, Chỉnh sửa, và Xóa quy trình.

- 🎨 **Bộ thiết kế quy trình (BPMN Designer / Modeler)**:
  - Tích hợp trực tiếp engine [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) cho phép vẽ và chỉnh sửa quy trình chuẩn BPMN 2.0 trực quan.
  - Hỗ trợ đầy đủ các thành phần BPMN: *Start Event, End Event, Task, User Task, Gateway (Exclusive/Parallel), Sequence Flow,...*
  - **Bảng thuộc tính (Properties Panel)**: Xem và cập nhật tên (label) cũng như thuộc tính của phần tử được chọn theo thời gian thực.
  - **Điều khiển thu phóng & Lịch sử**: Zoom in, Zoom out, Fit Viewport (vừa màn hình), Undo / Redo thao tác.
  - **Nhập / Xuất dữ liệu**:
    - Nhập file BPMN từ máy tính (`.bpmn`, `.xml`).
    - Xuất quy trình ra định dạng mã nguồn `BPMN 2.0 XML`.
    - Xuất quy trình dưới dạng hình ảnh đồ họa vector `SVG`.

---

## 🛠️ Công nghệ sử dụng

- **Core Framework**: [Angular 22](https://angular.dev/) (Standalone Components, Reactive Signals API)
- **BPMN Engine**: [bpmn-js 18](https://bpmn.io/toolkit/bpmn-js/) & `diagram-js`
- **UI Library**: [NG-ZORRO](https://ng.ant.design/) (Ant Design components for Angular)
- **Styling**: SCSS / CSS Custom Variables
- **Build & Test**: Angular CLI 22, TypeScript 6.0, [Vitest](https://vitest.dev/)

---

## 📁 Cấu trúc dự án

```text
src/
├── app/
│   ├── core/                           # Chứa models và dịch vụ toàn cục
│   │   ├── models/
│   │   │   └── bpmn-process.model.ts   # Model định nghĩa dữ liệu quy trình
│   │   └── services/
│   │       └── bpmn-process.service.ts # Service quản lý trạng thái bằng Angular Signals
│   ├── features/                       # Các tính năng giao diện chính
│   │   ├── bpmn-designer/              # Modeler thiết kế quy trình BPMN (bpmn-js)
│   │   │   ├── bpmn-designer.component.ts
│   │   │   ├── bpmn-designer.component.html
│   │   │   └── bpmn-designer.component.scss
│   │   └── bpmn-list/                  # Danh sách và quản lý các quy trình
│   │       ├── bpmn-list.component.ts
│   │       ├── bpmn-list.component.html
│   │       └── bpmn-list.component.scss
│   ├── layout/                         # Giao diện khung (Sidebar, Header, Content)
│   │   ├── main-layout.component.ts
│   │   ├── main-layout.component.html
│   │   └── main-layout.component.scss
│   ├── app.routes.ts                   # Định tuyến (Routing)
│   └── app.config.ts                   # Cấu hình Providers & Application Config
├── styles.scss                         # Style chung & Tùy chỉnh NG-ZORRO / BPMN
└── main.ts                             # Điểm khởi chạy ứng dụng
```

---

## 💻 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu môi trường

- **Node.js**: `v18.x` hoặc `v20.x` trở lên
- **npm**: `v10.x` trở lên

### 2. Cài đặt các phụ thuộc (Dependencies)

Mở terminal tại thư mục dự án và chạy:

```bash
npm install
```

### 3. Chạy môi trường Phát triển (Development Server)

Khởi chạy server phát triển local:

```bash
npm start
# hoặc
ng serve -o --port 4200
```

Ứng dụng sẽ tự động mở tại địa chỉ `http://localhost:4200/`. Giao diện sẽ tự động tải lại (hot reload) khi thay đổi mã nguồn.

### 4. Đóng gói Sản phẩm (Production Build)

Tạo bản build cho môi trường Production:

```bash
npm run build
```

Các file đã đóng gói sẽ nằm trong thư mục `dist/bpmn-frontend`.

### 5. Chạy Unit Tests

Thực thi kiểm thử đơn vị bằng Vitest:

```bash
npm test
```

---

## 📄 Giấy phép (License)

Dự án phát triển nội bộ cho hệ thống BPMN Workflow.

