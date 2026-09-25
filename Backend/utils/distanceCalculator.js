/**
 * Distance & Travel Charges Calculator
 *
 * Travel Charge Policy:
 * The applicable slab is determined by the one-way road distance between the expert's
 * starting location and the survey site. The corresponding Travel Charge covers
 * two-way travel and applicable toll charges.
 *
 * Overnight accommodation is not included in the Travel Charge and will not be provided by Jaladhaara.
 */

const DEFAULT_TRAVEL_SLABS = [
  { minKm: 0, maxKm: 30, charge: 0 },
  { minKm: 31, maxKm: 50, charge: 1200 },
  { minKm: 51, maxKm: 75, charge: 1800 },
  { minKm: 76, maxKm: 100, charge: 2400 },
  { minKm: 101, maxKm: 150, charge: 3000 },
  { minKm: 151, maxKm: 200, charge: 4000 },
  { minKm: 201, maxKm: 250, charge: 5000 },
  { minKm: 251, maxKm: 300, charge: 6000 },
  { minKm: 301, maxKm: 350, charge: 7000 },
  { minKm: 351, maxKm: 400, charge: 8000 },
  { minKm: 401, maxKm: 500, charge: 10000 }
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Determine matching travel slab for a one-way road distance
 * Covers two-way travel and applicable toll charges.
 * @param {number} distance - One-way road distance in km
 * @param {Array|string} slabs - Configurable slabs array from settings
 * @returns {Object} - { slab, charge, minKm, maxKm }
 */
function getTravelSlab(distance, slabs = DEFAULT_TRAVEL_SLABS) {
  const d = Math.round(Number(distance) || 0);
  if (d <= 0) return { slab: '0–30 km', charge: 0, minKm: 0, maxKm: 30 };

  let activeSlabs = slabs;
  if (typeof activeSlabs === 'string') {
    try {
      activeSlabs = JSON.parse(activeSlabs);
    } catch (e) {
      activeSlabs = DEFAULT_TRAVEL_SLABS;
    }
  }
  if (!Array.isArray(activeSlabs) || activeSlabs.length === 0) {
    activeSlabs = DEFAULT_TRAVEL_SLABS;
  }

  const sorted = [...activeSlabs].sort((a, b) => Number(a.minKm) - Number(b.minKm));

  for (const s of sorted) {
    const min = Number(s.minKm);
    const max = Number(s.maxKm);
    if (min === 0 && d <= max) {
      return { slab: `${min}–${max} km`, charge: Number(s.charge), minKm: min, maxKm: max };
    }
    if (d >= min && d <= max) {
      return { slab: `${min}–${max} km`, charge: Number(s.charge), minKm: min, maxKm: max };
    }
    if (d > (min - 1) && d <= max) {
      return { slab: `${min}–${max} km`, charge: Number(s.charge), minKm: min, maxKm: max };
    }
  }

  // Beyond highest slab (e.g. > 500 km)
  const last = sorted[sorted.length - 1];
  if (d > Number(last.maxKm)) {
    return {
      slab: `>${last.maxKm} km`,
      charge: Number(last.charge),
      minKm: Number(last.maxKm),
      maxKm: 9999
    };
  }

  return { slab: '0–30 km', charge: 0, minKm: 0, maxKm: 30 };
}

/**
 * Calculate travel charges based on distance and configured slabs
 * The Travel Charge covers two-way travel and applicable toll charges.
 * Overnight accommodation is not included and will not be provided by Jaladhaara.
 * @param {number} distance - One-way road distance in km
 * @param {number} baseRadius - Base radius in km (legacy fallback)
 * @param {number} chargePerKm - Charge per km beyond base radius (legacy fallback)
 * @param {Array|null} slabs - Optional custom slab array from Settings
 * @returns {number} Two-way travel charges amount
 */
function calculateTravelCharges(distance, baseRadius = 30, chargePerKm = 10, slabs = null) {
  if (slabs === false) {
    // Explicit legacy linear mode
    if (distance <= baseRadius) return 0;
    const extraDistance = distance - baseRadius;
    return (chargePerKm * extraDistance) * 2;
  }

  const slabInfo = getTravelSlab(distance, slabs);
  return slabInfo.charge;
}

/**
 * Calculate GST
 * @param {number} amount - Amount before GST
 * @param {number} gstPercentage - GST percentage (default: 18)
 * @returns {number} GST amount
 */
function calculateGST(amount, gstPercentage = 18) {
  return amount * (gstPercentage / 100);
}

module.exports = {
  DEFAULT_TRAVEL_SLABS,
  calculateDistance,
  getTravelSlab,
  calculateTravelCharges,
  calculateGST
};
