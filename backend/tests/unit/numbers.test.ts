import { describe, test, expect } from "vitest";
import { 
  leftPad,
  generateNumeroControl, 
  generateNumeroControlDTE  
} from "../../src/utils/numbers";

describe('Number Utils', () => {

  // ----------------------
  // leftPad happy path
  // ----------------------
  test.each([
    [5, 2, '05'],
    [123, 5, '00123'],
    [0, 3, '000'],
    [42, 1, '42'],
    [-5, 3, '0-5'],      // negative number
    [5.5, 4, '05.5'],    // decimal number
    ['5', 3, '005'],     // string input
  ])('leftPad(%s, %s) returns %s', (value, width, expected) => {
    expect(leftPad(value, width)).toBe(expected);
  });

  // ----------------------
  // leftPad expected failures
  // ----------------------
  test.fails.each([
    [123, 2, '01'],      // width < number length
    [5, -1, '05'],       // negative width
    [42, 0, '042'],      // zero width
    [null, 2, '00'],     // invalid input
    [undefined, 2, '00'],
  ])('leftPad(%s, %s) expected fail %s', (value, width, expected) => {
    expect(leftPad(value, width)).toBe(expected);
  });

  // ----------------------
  // generateNumeroControl happy path
  // ----------------------
  test.each([
    ['FAC', 1, 'FAC-00000001'],
    ['ND', 123, 'ND-00000123'],
    ['NC', 0, 'NC-00000000'],
    ['INV', 98765432, 'INV-98765432'],
    ['ABC', 99999999, 'ABC-99999999'], // very large sequential
  ])('generateNumeroControl(%s, %s) returns %s', (series, sequential, expected) => {
    expect(generateNumeroControl(series, sequential)).toBe(expected);
  });

  // ----------------------
  // generateNumeroControl expected failures
  // ----------------------
  test.fails.each([
    ['FAC', -1, 'FAC-00000000'], // negative sequential
    ['ND', 123.5, 'ND-00000123'],// decimal sequential
  ])('generateNumeroControl(%s, %s) expected fail %s', (series, sequential, expected) => {
    expect(generateNumeroControl(series, sequential)).toBe(expected);
  });

  // ----------------------
  // generateNumeroControlDTE happy path
  // ----------------------
  test.each([
    ['SUC001', 'FAC', 1, 'DTE-01-S001P001-FAC-000000000000001'],
    ['SUC022', 'ND', 123, 'DTE-01-S022P001-ND-000000000000123'],
    ['SUC123', 'NC', 0, 'DTE-01-S123P001-NC-000000000000000'],
    ['SUC987', 'INV', 98765432, 'DTE-01-S987P001-INV-000000098765432'],
  ])('generateNumeroControlDTE(%s, %s, %s) returns %s', (branchCode, series, sequential, expected) => {
    expect(generateNumeroControlDTE(branchCode, series, sequential)).toBe(expected);
  });

  // ----------------------
  // generateNumeroControlDTE edge cases
  // ----------------------
  test.each([
    ['SUC1', 'FAC', 5, 'DTE-01-S001P001-FAC-000000000000005'],       // branch code short
    ['SUC0001', 'ND', 42, 'DTE-01-S001P001-ND-000000000000042'],     // branch code extra leading zeros
    ['SUC999', 'NC', 999999999999, 'DTE-01-S999P001-NC-000999999999999'], // very large sequential
    ['SUC010', 'FAC', -1, 'DTE-01-S010P001-FAC-0000000000000-1'],     // negative sequential
  ])('generateNumeroControlDTE edge case %s, %s, %s', (branchCode, series, sequential, expected) => {
    expect(generateNumeroControlDTE(branchCode, series, sequential)).toBe(expected);
  });
});
