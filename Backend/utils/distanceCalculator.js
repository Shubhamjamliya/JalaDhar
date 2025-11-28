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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

/**
 * Calculate travel charges based on distance
 * @param {number} distance - Distance in km
 * @param {number} baseRadius - Base radius in km
 * @param {number} chargePerKm - Charge per km beyond base radius
 * @returns {number} Travel charges amount
 */
function calculateTravelCharges(distance, baseRadius, chargePerKm) {
  if (distance <= baseRadius) {
    return 0; // No travel charges within base radius
  }
  
  const extraDistance = distance - baseRadius;
  return chargePerKm * extraDistance;
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
  calculateDistance,
  calculateTravelCharges,
  calculateGST
};

