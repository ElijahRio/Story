import { parseDateString } from './utils';

describe('parseDateString', () => {
  test('parses DD-MM-YYYY format', () => {
    const date = parseDateString('22-04-1980');
    expect(date.getUTCFullYear()).toBe(1980);
    expect(date.getUTCMonth()).toBe(3); // April is 3
    expect(date.getUTCDate()).toBe(22);
  });

  test('parses DD/MM/YYYY format', () => {
    const date = parseDateString('15/08/2012');
    expect(date.getUTCFullYear()).toBe(2012);
    expect(date.getUTCMonth()).toBe(7); // August is 7
    expect(date.getUTCDate()).toBe(15);
  });

  test('parses DD.MM.YYYY format', () => {
    const date = parseDateString('05.03.2026');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(2); // March is 2
    expect(date.getUTCDate()).toBe(5);
  });

  test('parses YYYY-MM-DD format', () => {
    const date = parseDateString('2026-11-12');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(10); // November is 10
    expect(date.getUTCDate()).toBe(12);
  });

  test('handles single digit components with separators', () => {
    const date = parseDateString('1-2-2023');
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(1); // February is 1
    expect(date.getUTCDate()).toBe(1);
  });

  test('falls back to native Date for other formats', () => {
    const date = parseDateString('2023/01/01');
    expect(date).not.toBeNull();
    // Native Date parsing of 2023/01/01 is local, but since we use UTC for parts,
    // we should be careful with this test.
    expect(date.getTime()).not.toBeNaN();
  });

  test('returns null for null/undefined/empty input', () => {
    expect(parseDateString(null)).toBeNull();
    expect(parseDateString(undefined)).toBeNull();
    expect(parseDateString('')).toBeNull();
  });

  test('returns null for invalid date strings', () => {
    expect(parseDateString('not-a-date')).toBeNull();
    expect(parseDateString('31-02-2023')).toBeNull(); // February 31st is invalid
  });

  test('handles non-string inputs using safeString', () => {
    expect(parseDateString({})).toBeNull();
  });

  test('parses date string with mixed separators (though unusual)', () => {
    const date = parseDateString('10-10/2020');
    expect(date).not.toBeNull();
    expect(date.getUTCFullYear()).toBe(2020);
  });
});
