import { describe, expect, it, test } from "vitest";
import { numeroALetras } from "../../src/utils/text.js";

describe('text utils', () => {
  // ----------------------
  // Happy path tests
  // ----------------------
  test.each([
    [0, 'CERO DÓLARES CON CERO CENTAVOS'],
    [1, 'UNO DÓLARES CON CERO CENTAVOS'],
    [15, 'QUINCE DÓLARES CON CERO CENTAVOS'],
    [20, 'VEINTE DÓLARES CON CERO CENTAVOS'],
    [21, 'VEINTE Y UNO DÓLARES CON CERO CENTAVOS'],
    [22, 'VEINTE Y DOS DÓLARES CON CERO CENTAVOS'],
    [35, 'TREINTA Y CINCO DÓLARES CON CERO CENTAVOS'],
    [46, 'CUARENTA Y SEIS DÓLARES CON CERO CENTAVOS'],
    [105, 'CIENTO Y CINCO DÓLARES CON CERO CENTAVOS'],
    [569, 'QUINIENTOS SESENTA Y NUEVE DÓLARES CON CERO CENTAVOS'],
    [1000, 'MIL DÓLARES CON CERO CENTAVOS'],
    [1001, 'MIL UNO DÓLARES CON CERO CENTAVOS'],
    [1234567, 'UN MILLÓN DOSCIENTOS TREINTA Y CUATRO MIL QUINIENTOS SESENTA Y SIETE DÓLARES CON CERO CENTAVOS'],
    [0.25, 'CERO DÓLARES CON VEINTE Y CINCO CENTAVOS'],
    [1234.56, 'MIL DOSCIENTOS TREINTA Y CUATRO DÓLARES CON CINCUENTA Y SEIS CENTAVOS'],
  ])('numeroALetras(%s) returns "%s"', (input, expected) => {
    expect(numeroALetras(input)).toBe(expected);
  });

  // ----------------------
  // Edge cases
  // ----------------------
  test.each([
    [100, 'CIEN DÓLARES CON CERO CENTAVOS'],
    [1000000, 'UN MILLÓN DÓLARES CON CERO CENTAVOS'],
    [2000000, 'DOS MILLONES DÓLARES CON CERO CENTAVOS'],
    [1000001, 'UN MILLÓN UNO DÓLARES CON CERO CENTAVOS'],
    [1000100, 'UN MILLÓN CIEN DÓLARES CON CERO CENTAVOS'],
    [0.01, 'CERO DÓLARES CON UNO CENTAVOS'],
  ])('numeroALetras edge case %s returns "%s"', (input, expected) => {
    expect(numeroALetras(input)).toBe(expected);
  });

  // ----------------------
  // Expected failures
  // ----------------------
  test.fails.each([
    [-1, ''],           // negative numbers not supported
    [NaN, ''],          // invalid input
    [Infinity, ''],     // infinite number
    [null as any, ''],  // null
    [undefined as any, ''], // undefined
  ])('numeroALetras expected fail %s', (input, expected) => {
    expect(numeroALetras(input)).toBe(expected);
  });
});