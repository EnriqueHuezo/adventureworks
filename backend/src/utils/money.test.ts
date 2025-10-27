import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  roundMoney,
  calculateSubtotal,
  calculateIVA,
  calculateTotal,
  formatMoney,
  calculateRetencionRenta,
  calculateRetencionIVA
} from './money';

describe('money utils', () => {
  it('roundMoney rounds to 2 decimals', () => {
    expect(roundMoney(1.234).eq(new Decimal(1.23))).toBe(true);
    expect(roundMoney('1.236').eq(new Decimal(1.24))).toBe(true);
  });

  it('calculateSubtotal multiplies qty * unitPrice and subtracts discount (not negative)', () => {
    const unitPrice = new Decimal(5);
    const discount = new Decimal(1);
    const sub = calculateSubtotal(2, unitPrice, discount);
    expect(sub.eq(new Decimal(9))).toBe(true); // (2*5)-1 = 9
  });
  it('calculateSubtotal does not return negative values', () => {
    const unitPrice = new Decimal(5);
    const discount = new Decimal(20);
    const sub = calculateSubtotal(2, unitPrice, discount); // 10 - 20 = -10 -> clamp to 0
    expect(sub.eq(new Decimal(0))).toBe(true);
  });

  it('calculateIVA returns 13% rounded', () => {
    const subtotal = new Decimal(100);
    const iva = calculateIVA(subtotal);
    expect(iva.eq(new Decimal(13))).toBe(true);
  });

  it('calculateTotal sums and subtracts retentions correctly', () => {
    const subtotal = new Decimal(100);
    const iva = new Decimal(13);
    const retencionRenta = new Decimal(10);
    const retencionIva = new Decimal(0.13);
    const total = calculateTotal(subtotal, iva, retencionRenta, retencionIva);
    // 100 + 13 - 10 - 0.13 = 102.87
    expect(total.eq(new Decimal('102.87'))).toBe(true);
  });

  it('formatMoney formats correctly in es-SV locale', () => {
    const amount = new Decimal(1234.5);
    const formatted = formatMoney(amount);
    expect(formatted).toMatch(/^\D*1,234\.50$/);
  });
  it('formatMoney can format a string in es-SV locale', () => {
    const amount = '1234.5';
    const formatted = formatMoney(amount);
    expect(formatted).toMatch(/^\D*1,234\.50$/);
  });
  it('formatMoney can format a number in es-SV locale', () => {
    const amount = 1234.5;
    const formatted = formatMoney(amount);
    expect(formatted).toMatch(/^\D*1,234\.50$/);
  });

  it('calculateRetencionRenta returns 10% rounded', () => {
    const amount = new Decimal(1234.5);
    const retencion = calculateRetencionRenta(amount);
    expect(retencion.eq(new Decimal(123.45))).toBe(true);
  });
  
  it('calculateRetencionIVA returns 1% rounded', () => {
    const amount = new Decimal(1234.5);
    const retencion = calculateRetencionIVA(amount);
    expect(retencion.eq(new Decimal(12.34))).toBe(true);
  });
});