import { TimerPreset, TimerSummary, TimerType } from '../bpmn-designer.models';

export const TIMER_TYPES: TimerType[] = ['timeDuration', 'timeDate', 'timeCycle'];

const ISO_DURATION_REGEX =
  /^P(?!$)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
const ISO_DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;
const ISO_CYCLE_REGEX = /^R(\d*)\/(?:([^/]+)\/)?(P[^/]+)$/;
const EXPRESSION_REGEX = /^[$#]\{.+\}$/;

export const TIMER_PRESETS: Record<TimerType, TimerPreset[]> = {
  timeDuration: [
    { label: '5 phút', value: 'PT5M' },
    { label: '30 phút', value: 'PT30M' },
    { label: '1 giờ', value: 'PT1H' },
    { label: '4 giờ', value: 'PT4H' },
    { label: '1 ngày', value: 'P1D' },
    { label: '3 ngày', value: 'P3D' },
    { label: '1 tuần', value: 'P1W' },
  ],
  timeDate: [],
  timeCycle: [
    { label: 'Mỗi giờ', value: 'R/PT1H' },
    { label: 'Mỗi ngày', value: 'R/P1D' },
    { label: '3 lần, cách 10 phút', value: 'R3/PT10M' },
    { label: '9h sáng hằng ngày (cron)', value: '0 0 9 * * ?' },
  ],
};

export function getTimerDefinition(bo: any): any {
  return bo?.eventDefinitions?.find((d: any) => d.$type === 'bpmn:TimerEventDefinition');
}

export function describeTimer(timerType?: TimerType | '', rawValue?: string): TimerSummary {
  const value = (rawValue || '').trim();
  if (!timerType) {
    return { valid: false, text: 'Chưa chọn kiểu hẹn giờ - engine sẽ từ chối deploy quy trình.' };
  }
  if (!value) {
    return { valid: false, text: 'Chưa nhập giá trị hẹn giờ.' };
  }
  if (EXPRESSION_REGEX.test(value)) {
    return { valid: true, text: 'Giá trị được tính từ biểu thức khi quy trình chạy.' };
  }

  if (timerType === 'timeDuration') {
    const duration = describeDuration(value);
    return duration
      ? { valid: true, text: `Kích hoạt sau ${duration}.` }
      : { valid: false, text: 'Sai định dạng ISO 8601 Duration (VD: PT30M, P1DT2H).' };
  }

  if (timerType === 'timeDate') {
    const date = new Date(value);
    return ISO_DATE_TIME_REGEX.test(value) && !isNaN(date.getTime())
      ? { valid: true, text: `Kích hoạt vào lúc ${date.toLocaleString('vi-VN')}.` }
      : { valid: false, text: 'Sai định dạng ISO 8601 Date (VD: 2026-12-31T17:00:00).' };
  }

  const cycle = ISO_CYCLE_REGEX.exec(value);
  if (cycle) {
    const [, repeat, start, period] = cycle;
    const interval = describeDuration(period);
    if (interval) {
      const times = repeat ? `Lặp ${repeat} lần` : 'Lặp vô hạn';
      const startText = start ? `, bắt đầu từ ${start}` : '';
      return { valid: true, text: `${times}, mỗi ${interval}${startText}.` };
    }
  }
  // Camunda also accepts Quartz cron expressions (6-7 fields) for timeCycle
  const cronFields = value.split(/\s+/).length;
  if (cronFields === 6 || cronFields === 7) {
    return { valid: true, text: 'Lịch chạy theo biểu thức cron.' };
  }
  return { valid: false, text: 'Sai định dạng chu kỳ (VD: R3/PT10M hoặc cron "0 0 9 * * ?").' };
}

function describeDuration(value: string): string | null {
  const match = ISO_DURATION_REGEX.exec(value);
  if (!match) return null;
  const units = ['năm', 'tháng', 'tuần', 'ngày', 'giờ', 'phút', 'giây'];
  const parts = match
    .slice(1)
    .map((amount, i) => (amount && Number(amount) > 0 ? `${amount} ${units[i]}` : null))
    .filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

/** Giá trị cho ô datetime-local - chỉ khi timerValue đang là ngày giờ ISO hợp lệ. */
export function toDateTimeLocal(value?: string): string {
  if (!value || !ISO_DATE_TIME_REGEX.test(value)) return '';
  return value.substring(0, 16);
}

/** datetime-local trả về dạng yyyy-MM-ddTHH:mm (thiếu giây) - bổ sung để thành ISO đầy đủ. */
export function fromDateTimeLocal(localValue: string): string {
  return localValue.length === 16 ? `${localValue}:00` : localValue;
}
