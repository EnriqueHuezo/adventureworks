export function leftPad(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}

export function generateNumeroControl(series: string, sequential: number): string {
  return `${series}-${leftPad(sequential, 8)}`;
}

/**
 * Genera el número de control DTE según formato del Ministerio de Hacienda de El Salvador
 * Formato: DTE-01-S022P001-000000000271089
 * @param branchCode - Código de la sucursal (ej: SUC001)
 * @param sequential - Número secuencial de la factura
 * @returns Número de control DTE formateado
 */
export function generateNumeroControlDTE(branchCode: string, sequential: number): string {
  // DTE: prefijo fijo
  // 01: ambiente (00=Prueba, 01=Producción)
  const ambiente = '01';
  
  // Formatear código de sucursal: S022P001 (Sucursal 022, Punto 001)
  // Extraer número de la sucursal del código (ej: SUC001 -> 001)
  const branchNumber = branchCode.replace(/\D/g, '').slice(-3).padStart(3, '0');
  const puntoEmision = '001'; // Punto de emisión fijo por ahora
  const codigoEstablecimiento = `S${leftPad(parseInt(branchNumber), 3)}P${puntoEmision}`;
  
  // Número secuencial de 15 dígitos
  const numeroSecuencial = leftPad(sequential, 15);
  
  return `DTE-${ambiente}-${codigoEstablecimiento}-${numeroSecuencial}`;
}

