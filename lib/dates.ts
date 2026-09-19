const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Nepal Standard Time offset in minutes. */
export const NPT_OFFSET_MIN = 345;

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface SplitTransactionDate {
  /** AD calendar date as experienced in the given zone ('YYYY-MM-DD'). */
  localDate: string;
  /** Exact instant in UTC (ISO 8601). */
  occurredAt: string;
  tzOffsetMin: number;
}

/**
 * Split a stored/input date into the v2 pair. Values carrying an explicit
 * offset (or `Z`) denote an exact instant; values without one are wall time
 * in `offsetMin`. Throws on unparseable input.
 */
export function splitTransactionDate(input: string, offsetMin: number): SplitTransactionDate {
  const trimmed = input.trim();
  const parsed = Date.parse(trimmed);
  if (trimmed === '' || Number.isNaN(parsed)) {
    throw new Error(`Invalid date: ${input}`);
  }
  const hasOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const instant = hasOffset ? parsed : parsed - offsetMin * 60_000;
  const localDate = new Date(instant + offsetMin * 60_000).toISOString().slice(0, 10);
  if (!LOCAL_DATE_PATTERN.test(localDate)) {
    throw new Error(`Invalid date: ${input}`);
  }
  return { localDate, occurredAt: new Date(instant).toISOString(), tzOffsetMin: offsetMin };
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: Date, startDay = 1): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  const month = MONTHS[date.getMonth()];
  if (date.getFullYear() === today.getFullYear()) {
    return `${month} ${date.getDate()}`;
  }
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${ampm}`;
}

export function formatFullDate(isoDate: string): string {
  const date = new Date(isoDate);
  const month = MONTHS[date.getMonth()];
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateTime(isoDate: string): string {
  return `${formatFullDate(isoDate)}, ${formatTime(isoDate)}`;
}
