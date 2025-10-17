import { Decimal } from 'decimal.js';

export function formatMoney(amount: number | string | Decimal): string {
  const num = typeof amount === 'number' ? amount : 
              typeof amount === 'string' ? parseFloat(amount) :
              amount.toNumber();
  
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function roundMoney(amount: number | string | Decimal): Decimal {
  return new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);
}

export function calculateSubtotal(qty: number, unitPrice: Decimal, discount: Decimal = new Decimal(0)): Decimal {
  const subtotal = new Decimal(qty).times(unitPrice).minus(discount);
  return Decimal.max(subtotal, 0);
}

export function calculateIVA(subtotal: Decimal): Decimal {
  return roundMoney(subtotal.times(0.13));
}

export function calculateRetencionRenta(subtotal: Decimal): Decimal {
  return roundMoney(subtotal.times(0.10));
}

export function calculateRetencionIVA(iva: Decimal): Decimal {
  return roundMoney(iva.times(0.01));
}

export function calculateTotal(
  subtotal: Decimal,
  iva: Decimal,
  retencionRenta: Decimal,
  retencionIva: Decimal
): Decimal {
  return roundMoney(subtotal.plus(iva).minus(retencionRenta).minus(retencionIva));
}

