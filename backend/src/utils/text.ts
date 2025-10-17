const UNIDADES = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
];

const DECENAS = [
  '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
  'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
];

const ESPECIALES = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
];

const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
];

function convertirMenorMil(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  let resultado = '';
  const centena = Math.floor(n / 100);
  const resto = n % 100;

  if (centena > 0) {
    resultado = CENTENAS[centena];
  }

  if (resto >= 10 && resto < 20) {
    resultado += (resultado ? ' ' : '') + ESPECIALES[resto - 10];
  } else {
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;

    if (decena > 0) {
      resultado += (resultado ? ' ' : '') + DECENAS[decena];
    }

    if (unidad > 0) {
      if (decena > 0 && decena <= 2) {
        resultado += (decena === 2 ? ' ' : '') + 'Y ' + UNIDADES[unidad];
      } else {
        resultado += (resultado ? ' Y ' : '') + UNIDADES[unidad];
      }
    }
  }

  return resultado;
}

export function numeroALetras(n: number): string {
  if (n === 0) return 'CERO DÓLARES CON CERO CENTAVOS';

  const partes = n.toFixed(2).split('.');
  const entero = parseInt(partes[0]);
  const centavos = parseInt(partes[1]);

  let letras = '';

  if (entero === 0) {
    letras = 'CERO';
  } else {
    const millones = Math.floor(entero / 1000000);
    const miles = Math.floor((entero % 1000000) / 1000);
    const unidades = entero % 1000;

    if (millones > 0) {
      if (millones === 1) {
        letras = 'UN MILLÓN';
      } else {
        letras = convertirMenorMil(millones) + ' MILLONES';
      }
    }

    if (miles > 0) {
      if (letras) letras += ' ';
      if (miles === 1) {
        letras += 'MIL';
      } else {
        letras += convertirMenorMil(miles) + ' MIL';
      }
    }

    if (unidades > 0) {
      if (letras) letras += ' ';
      letras += convertirMenorMil(unidades);
    }
  }

  letras += ' DÓLARES';

  if (centavos === 0) {
    letras += ' CON CERO CENTAVOS';
  } else {
    letras += ` CON ${convertirMenorMil(centavos)} CENTAVOS`;
  }

  return letras;
}

