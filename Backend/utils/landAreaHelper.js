/**
 * Backend Land Area Helper Utility for Acres & Guntas Normalization
 * 40 Guntas = 1 Acre
 */

const normalizeAcresGuntas = (input) => {
  if (input === null || input === undefined || input === '') {
    return { acres: 0, guntas: 0, decimalValue: 0, formatted: '' };
  }

  const strVal = String(input).trim();
  const numVal = parseFloat(strVal);

  if (isNaN(numVal) || numVal < 0) {
    return { acres: 0, guntas: 0, decimalValue: 0, formatted: '' };
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

  if (guntas >= 40) {
    const extraAcres = Math.floor(guntas / 40);
    guntas = guntas % 40;
    acres += extraAcres;
  }

  const normalizedStr = guntas === 0 ? `${acres}` : `${acres}.${guntas < 10 ? '0' + guntas : guntas}`;
  const decimalValue = parseFloat(normalizedStr);

  const acreText = acres > 0 ? `${acres} ${acres === 1 ? 'Acre' : 'Acres'}` : '';
  const guntaText = guntas > 0 ? `${guntas} ${guntas === 1 ? 'Gunta' : 'Guntas'}` : '';
  const formatted = (acreText && guntaText) ? `${acreText} ${guntaText}` : (acreText || guntaText || '0 Acres');

  return {
    acres,
    guntas,
    decimalValue,
    formatted
  };
};

module.exports = {
  normalizeAcresGuntas
};
