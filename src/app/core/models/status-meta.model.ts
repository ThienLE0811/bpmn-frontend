/** Tông màu chung cho nhãn trạng thái (status pill) trên các trang danh sách. */
export type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface StatusPillMeta {
  label: string;
  tone: StatusTone;
}

/** Trạng thái của định nghĩa BPMN process / DMN decision. */
export function getDefinitionStatusMeta(status: string | null | undefined): StatusPillMeta {
  switch ((status || '').toUpperCase().trim()) {
    case 'PUBLISHED':
      return { label: 'Đã phát hành', tone: 'success' };
    case 'ARCHIVED':
      return { label: 'Lưu trữ', tone: 'neutral' };
    default:
      return { label: 'Bản nháp', tone: 'warning' };
  }
}
