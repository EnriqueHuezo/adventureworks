import { formatDate, formatDateTime, getTodayEnd, getTodayStart } from "./dates";
import { describe, expect, it } from "vitest";

describe('date utils', () => {
  it('formatDate formats date in dd/mm/yyyy format', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('14/06/2024');
  });
  it('formatDate handles single digit day and month', () => {
    const date = new Date('2024-02-05T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('04/02/2024');
  });
  it('formatDate handles invalid date', () => {
    const date = new Date('invalid-date');
    expect(() => formatDate(date)).toThrow(RangeError);
  });
  it('formatDate handles edge cases', () => {
    const date = new Date('2024-02-29T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('28/02/2024');
  });
  it('formatDate handles end of year', () => {
    const date = new Date('2023-12-31T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('30/12/2023');
  });
  it('formatDate handles start of year', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('31/12/2023');
  });
  it('formatDate handles different time zones', () => {
    const date = new Date('2024-06-15T12:00:00-06:00');
    const formatted = formatDate(date);
    expect(formatted).toBe('15/06/2024');
  });
  
  it('formatDateTime formats date and time correctly', () => {
    const date = new Date('2024-06-15T14:30:45Z');
    const formatted = formatDateTime(date);
    expect(formatted).toBe('15/06/2024, 08:30:45');
  });
  it('formatDateTime handles single digit day, month, hour, minute, second', () => {
    const date = new Date('2024-02-05T04:05:06Z');
    const formatted = formatDateTime(date);
    expect(formatted).toBe('04/02/2024, 22:05:06');
  });
  it('formatDateTime handles invalid date', () => {
    const date = new Date('invalid-date');
    expect(() => formatDateTime(date)).toThrow(RangeError);
  });
  it('formatDateTime handles edge cases', () => {
    const date = new Date('2024-02-29T23:59:59Z');
    const formatted = formatDateTime(date);
    expect(formatted).toBe('29/02/2024, 17:59:59');
  });
  it('formatDateTime handles end of year', () => {
    const date = new Date('2023-12-31T23:59:59Z');
    const formatted = formatDateTime(date);
    expect(formatted).toBe('31/12/2023, 17:59:59');
  });
  it('formatDateTime handles start of year', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const formatted = formatDateTime(date);
    expect(formatted).toBe('31/12/2023, 18:00:00');
  });
  it('formatDateTime handles different time zones', () => {
    const date = new Date('2024-06-15T14:30:45-06:00');
    const formatted = formatDateTime(date);
    expect(formatted).toBe('15/06/2024, 14:30:45');
  });

  it('getTodayStart returns start of today', () => {
    const start = getTodayStart();
    const now = new Date();
    expect(start.getDate()).toBe(now.getDate());
    expect(start.getMonth()).toBe(now.getMonth());
    expect(start.getFullYear()).toBe(now.getFullYear());
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });
  it('getTodayStart handles edge case of midnight', () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = getTodayStart();
    expect(start.getTime()).toBe(now.getTime());
  });
  
  it('getTodayEnd returns end of today', () => {
    const end = getTodayEnd();
    const now = new Date();
    expect(end.getDate()).toBe(now.getDate());
    expect(end.getMonth()).toBe(now.getMonth());
    expect(end.getFullYear()).toBe(now.getFullYear());
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });
  it('getTodayEnd handles edge case of just before midnight', () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const end = getTodayEnd();
    expect(end.getTime()).toBe(now.getTime());
  });
});