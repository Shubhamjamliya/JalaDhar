const axios = require('axios');

/**
 * Geocode an address using Google Geocoding API
 * @param {Object} address - Address object with street, city, state, pincode
 * @returns {Promise<Object>} - Returns { lat, lng, formattedAddress, placeId } or null on error
 */
const geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('[Geocoding] Google Maps API key not configured');
      return null;
    }

    // Build address string from address object
    const addressParts = [];
    if (address.street) addressParts.push(address.street);
    if (address.city) addressParts.push(address.city);
    if (address.state) addressParts.push(address.state);
    if (address.pincode) addressParts.push(address.pincode);

    if (addressParts.length === 0) {
      console.warn('[Geocoding] No address components provided');
      return null;
    }

    const addressString = addressParts.join(', ');
    const encodedAddress = encodeURIComponent(addressString);

    // Call Google Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    const response = await axios.get(url, {
      timeout: 5000 // 5 second timeout
    });

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id || null,
        addressComponents: result.address_components || []
      };
    } else if (response.data.status === 'ZERO_RESULTS') {
      console.warn(`[Geocoding] No results found for address: ${addressString}`);
      return null;
    } else {
      console.error(`[Geocoding] API error: ${response.data.status}`, response.data.error_message || '');
      return null;
    }
  } catch (error) {
    // Handle network errors, timeouts, etc.
    if (error.code === 'ECONNABORTED') {
      console.error('[Geocoding] Request timeout');
    } else if (error.response) {
      // API returned error status
      console.error(`[Geocoding] API error: ${error.response.status}`, error.response.data);
    } else {
      console.error('[Geocoding] Network error:', error.message);
    }
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object>} - Returns address object or null on error
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('[Geocoding] Google Maps API key not configured');
      return null;
    }

    if (!lat || !lng) {
      console.warn('[Geocoding] Invalid coordinates provided');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await axios.get(url, {
      timeout: 5000
    });

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      return {
        formattedAddress: result.formatted_address,
        placeId: result.place_id || null,
        addressComponents: result.address_components || []
      };
    } else {
      console.warn(`[Geocoding] Reverse geocoding failed: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error('[Geocoding] Reverse geocoding error:', error.message);
    return null;
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode
};

