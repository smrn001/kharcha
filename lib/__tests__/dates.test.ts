import { describe, expect, it } from 'vitest';
import { NPT_OFFSET_MIN, splitTransactionDate } from '../dates';

describe('splitTransactionDate', () => {
  it('keeps UTC instants and derives the NPT date', () => {
    expect(splitTransactionDate('2026-09-18T10:00:00.000Z', NPT_OFFSET_MIN)).toEqual({
      localDate: '2026-09-18',
      occurredAt: '2026-09-18T10:00:00.000Z',
      tzOffsetMin: 345,
    });
  });

  it('rolls the local date past midnight NPT', () => {
    expect(splitTransactionDate('2026-09-18T19:00:00.000Z', NPT_OFFSET_MIN)).toEqual({
      localDate: '2026-09-19',
      occurredAt: '2026-09-18T19:00:00.000Z',
      tzOffsetMin: 345,
    });
  });

  it('treats date-only values as NPT wall time', () => {
    expect(splitTransactionDate('2026-09-15', NPT_OFFSET_MIN)).toEqual({
      localDate: '2026-09-15',
      occurredAt: '2026-09-14T18:15:00.000Z',
      tzOffsetMin: 345,
    });
  });

  it('rejects unparseable input', () => {
    expect(() => splitTransactionDate('not-a-date', NPT_OFFSET_MIN)).toThrow();
    expect(() => splitTransactionDate('', NPT_OFFSET_MIN)).toThrow();
  });
});
