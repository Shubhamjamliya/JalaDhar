/**
 * Land Area Helper Utility for Acres & Guntas Calculation
 * Rule: 40 Guntas = 1 Acre
 * Decimal values represent Guntas:
 * - 3.6  => 3 Acres, 6 Guntas
 * - 2.39 => 2 Acres, 39 Guntas
 * - 2.40 => 3 Acres, 0 Guntas
 */

export const parseAcresGuntas = (input) => {
  if (input === null || input === undefined || input === '') {
    return { acres: 0, guntas: 0, totalGuntas: 0, formatted: '', decimalValue: 0 };
  }

  const strVal = String(input).trim();
  const numVal = parseFloat(strVal);

  if (isNaN(numVal) || numVal < 0) {
    return { acres: 0, guntas: 0, totalGuntas: 0, formatted: '', decimalValue: 0 };
  }

  let acres = 0;
  let guntas = 0;

  if (strVal.includes('.')) {
    const parts = strVal.split('.');
    acres = parseInt(parts[0], 10) || 0;
    const decPart = parts[1];
    guntas = parseInt(decPart, 10) || 0;
  } else {
    acres = parseInt(strVal, 10) || 0;
    guntas = 0;
  }

  // 40 Guntas = 1 Acre conversion
  if (guntas >= 40) {
    const extraAcres = Math.floor(guntas / 40);
    guntas = guntas % 40;
    acres += extraAcres;
  }

  const totalGuntas = acres * 40 + guntas;
  const normalizedStr = guntas === 0 ? `${acres}` : `${acres}.${guntas < 10 ? '0' + guntas : guntas}`;
  const decimalValue = parseFloat(normalizedStr);

  return {
    acres,
    guntas,
    totalGuntas,
    formatted: formatAcresGuntas(acres, guntas),
    decimalValue
  };
};

export const formatAcresGuntas = (acres, guntas) => {
  if (acres === 0 && guntas === 0) return '0 Acres';
  const acreText = acres > 0 ? `${acres} ${acres === 1 ? 'Acre' : 'Acres'}` : '';
  const guntaText = guntas > 0 ? `${guntas} ${guntas === 1 ? 'Gunta' : 'Guntas'}` : '';

  if (acreText && guntaText) return `${acreText} ${guntaText}`;
  return acreText || guntaText;
};

export const formatAcresGuntasDisplay = (input) => {
  if (input === null || input === undefined || input === '') return 'N/A';
  const parsed = parseAcresGuntas(input);
  return parsed.formatted || `${input} Acres`;
};

/**
 * Robust helper to check if category is Agriculture
 */
export const isAgriCategory = (category) => {
  if (!category) return false;
  const cat = String(category).toLowerCase().trim();
  return cat.includes('agri');
};
