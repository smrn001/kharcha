import { describe, expect, it } from 'vitest';
import {
  buildComparison,
  buildMovers,
  buildTrend,
  computeRangeKeys,
  previousPeriodLabel,
  type AnalyticsPeriod,
} from '../analytics';
import type { AnalyticsSummary, CategorySpending } from '../db/analytics-queries';

const summary = (income: number, expense: number): AnalyticsSummary => ({
  income,
  expense,
  saved: income - expense,
});

const cat = (
  categoryId: string,
  amount: number,
  percentage = 0
): CategorySpending => ({
  categoryId,
  name: categoryId,
  icon: undefined,
  slug: undefined,
  amount,
  percentage,
});

describe('previousPeriodLabel', () => {
  it('labels each period', () => {
    expect(previousPeriodLabel('week')).toBe('Last week');
    expect(previousPeriodLabel('month')).toBe('Last month');
    expect(previousPeriodLabel('year')).toBe('Last year');
  });
});

describe('buildComparison', () => {
  it('computes diff and percentage change', () => {
    const result = buildComparison(summary(20000, 10000), summary(10000, 5000), 'month', 'now', 'prev');
    expect(result.income).toEqual({ diff: 10000, pct: 100 });
    expect(result.expense).toEqual({ diff: 5000, pct: 100 });
    expect(result.saved).toEqual({ diff: 5000, pct: 100 });
    expect(result.previousLabel).toBe('Last month');
    expect(result.currentRangeLabel).toBe('now');
    expect(result.previousRangeLabel).toBe('prev');
  });

  it('reports pct 0 when both sides are zero (not null)', () => {
    const result = buildComparison(summary(0, 0), summary(0, 0), 'month', 'a', 'b');
    expect(result.income.pct).toBe(0);
    expect(result.expense.pct).toBe(0);
  });

  it('reports pct null when previous was zero and current is not', () => {
    const result = buildComparison(summary(5000, 0), summary(0, 0), 'month', 'a', 'b');
    expect(result.income).toEqual({ diff: 5000, pct: null });
  });

  it('handles a decrease as a negative percentage', () => {
    const result = buildComparison(summary(5000, 0), summary(10000, 0), 'month', 'a', 'b');
    expect(result.income).toEqual({ diff: -5000, pct: -50 });
  });

  it('measures improvement from a negative previous against its magnitude', () => {
    // saved went from -2000 (overspent) to 0 (breakeven): a 100% improvement,
    // not 200% — the percentage divides by the absolute previous value.
    const result = buildComparison(summary(0, 0), summary(0, 2000), 'month', 'a', 'b');
    expect(result.saved.diff).toBe(2000);
    expect(result.saved.pct).toBe(100);
  });
});

describe('buildMovers', () => {
  it('diffs matched categories', () => {
    const movers = buildMovers([cat('a', 3000)], [cat('a', 1000)]);
    expect(movers).toHaveLength(1);
    expect(movers[0]).toMatchObject({ categoryId: 'a', current: 3000, previous: 1000, diff: 2000 });
  });

  it('includes categories that only exist in the previous period as decreases', () => {
    const movers = buildMovers([], [cat('gone', 5000)]);
    expect(movers).toHaveLength(1);
    expect(movers[0]).toMatchObject({ categoryId: 'gone', current: 0, previous: 5000, diff: -5000 });
  });

  it('drops categories with no spending on either side', () => {
    expect(buildMovers([cat('a', 0)], [])).toEqual([]);
  });

  it('sorts by absolute change, largest first, and caps at 3', () => {
    const movers = buildMovers(
      [cat('small', 100), cat('big', 9000), cat('mid', 5000), cat('other', 4000)],
      []
    );
    expect(movers).toHaveLength(3);
    expect(movers[0].categoryId).toBe('big');
    expect(movers[1].categoryId).toBe('mid');
    expect(movers[2].categoryId).toBe('other');
  });
});

describe('computeRangeKeys', () => {
  const keysFor = (period: AnalyticsPeriod, startOfWeekDay = 1) =>
    computeRangeKeys(period, startOfWeekDay);

  it('spans the current month from the 1st to today', () => {
    const keys = keysFor('month');
    const today = new Date();
    expect(keys.fromKey).toBe(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    );
    expect(keys.toKey).toBe(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`
    );
  });

  it('produces a full previous month, one before the current one', () => {
    const keys = keysFor('month');
    const prev = new Date(keys.from.getFullYear(), keys.from.getMonth() - 1, 1);
    expect(keys.prevFromKey).toBe(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`
    );
    const lastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
    expect(keys.prevToKey).toBe(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(
        lastDay
      ).padStart(2, '0')}`
    );
  });

  it('honours the configured first day of week', () => {
    const monday = keysFor('week', 1);
    const sunday = keysFor('week', 0);
    expect(monday.fromKey).not.toBe(sunday.fromKey);
    expect(new Date(`${monday.fromKey}T00:00:00`).getDay()).toBe(1);
    expect(new Date(`${sunday.fromKey}T00:00:00`).getDay()).toBe(0);
  });

  it('spans the previous year for the year period', () => {
    const keys = keysFor('year');
    const year = new Date(keys.from.getFullYear(), 0, 1).getFullYear() - 1;
    expect(keys.prevFromKey).toBe(`${year}-01-01`);
    expect(keys.prevToKey).toBe(`${year}-12-31`);
  });

  it('renders a human range label', () => {
    expect(keysFor('month').currentLabel).toMatch(/–/);
  });
});

describe('buildTrend', () => {
  it('emits one point per day across the range for a week', () => {
    const from = new Date(2026, 0, 5);
    const to = new Date(2026, 0, 11);
    const trend = buildTrend([], from, to, 'week');
    expect(trend).toHaveLength(7);
    expect(trend[0].label).toBe('Mon');
    expect(trend[6].label).toBe('Sun');
  });

  it('zero-fills days with no data and keeps recorded values', () => {
    const from = new Date(2026, 0, 5);
    const to = new Date(2026, 0, 6);
    const trend = buildTrend(
      [{ date: '2026-01-05', income: 1000, expense: 250 }],
      from,
      to,
      'week'
    );
    expect(trend[0]).toEqual({ label: 'Mon', income: 1000, expense: 250 });
    expect(trend[1]).toEqual({ label: 'Tue', income: 0, expense: 0 });
  });

  it('aggregates to exactly 12 monthly points for a year', () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 11, 31);
    const trend = buildTrend(
      [
        { date: '2026-01-10', income: 100, expense: 10 },
        { date: '2026-01-20', income: 50, expense: 5 },
        { date: '2026-03-04', income: 7, expense: 1 },
      ],
      from,
      to,
      'year'
    );
    expect(trend).toHaveLength(12);
    expect(trend[0]).toEqual({ label: 'Jan', income: 150, expense: 15 });
    expect(trend[1]).toEqual({ label: 'Feb', income: 0, expense: 0 });
    expect(trend[2]).toEqual({ label: 'Mar', income: 7, expense: 1 });
  });

  it('uses the day number for a month period', () => {
    const trend = buildTrend([], new Date(2026, 0, 1), new Date(2026, 0, 3), 'month');
    expect(trend.map((p) => p.label)).toEqual(['1', '2', '3']);
  });
});
