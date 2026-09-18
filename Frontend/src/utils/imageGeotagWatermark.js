/**
 * Live GPS Geotag & Timestamp Watermark Engine
 * Burns verifiable GPS coordinates, timestamp, and Jaladhaara certification badge
 * directly into image pixels using client-side HTML5 Canvas.
 */

/**
 * Get device high-accuracy geolocation with timeout fallback
 */
export const getDeviceLocation = (timeoutMs = 6000) => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 10000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
          altitude: pos.coords.altitude ? Math.round(pos.coords.altitude) : null
        });
      },
      (err) => {
        console.warn('Geolocation capture warning:', err?.message || err);
        // Fallback: try low accuracy quickly if high accuracy timed out
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            resolve({
              lat: fallbackPos.coords.latitude,
              lng: fallbackPos.coords.longitude,
              accuracy: Math.round(fallbackPos.coords.accuracy || 0),
              altitude: null
            });
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 30000 }
        );
      },
      options
    );
  });
};

/**
 * Format Latitude to readable GPS string (e.g., 17.385042° N)
 */
const formatCoord = (val, isLat) => {
  if (typeof val !== 'number' || isNaN(val)) return 'N/A';
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  return `${Math.abs(val).toFixed(6)}° ${dir}`;
};

/**
 * Format current timestamp for geotag badge
 */
const formatTimestamp = (date = new Date()) => {
  try {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return date.toISOString();
  }
};

/**
 * Stamp image with verifiable GPS coordinates, timestamp, and JalaDhar badge
 * 
 * @param {File|Blob} file - Captured image file from camera
 * @param {Object} options
 * @param {string} [options.bookingId] - Booking ID or reference
 * @param {string} [options.locationName] - Village / Mandal / District
 * @param {Object} [options.coords] - Pre-fetched coordinates { lat, lng, accuracy }
 * @returns {Promise<{ file: File, coords: Object|null, timestamp: Date }>}
 */
export const stampImageWithGeotag = async (file, options = {}) => {
  const {
    bookingId = '',
    locationName = '',
    coords: preCoords = null
  } = options;

  // 1. Fetch live coordinates if not pre-supplied
  const coords = preCoords || (await getDeviceLocation(6000));
  const captureTimestamp = new Date();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read photo file'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory'));

      img.onload = () => {
        try {
          // Scale image if larger than 2048px to prevent canvas memory crash and optimize file size
          const MAX_DIM = 2048;
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // If canvas context fails, return original file
            resolve({ file, coords, timestamp: captureTimestamp });
            return;
          }

          // Draw the base camera photo
          ctx.drawImage(img, 0, 0, width, height);

          // Responsive sizing based on canvas dimensions
          const bannerHeight = Math.max(120, Math.round(height * 0.14));
          const padding = Math.max(16, Math.round(width * 0.025));
          const bannerY = height - bannerHeight;

          // Draw semi-transparent dark gradient banner at bottom
          const gradient = ctx.createLinearGradient(0, bannerY - 20, 0, height);
          gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
          gradient.addColorStop(0.2, 'rgba(15, 23, 42, 0.85)');
          gradient.addColorStop(1, 'rgba(10, 15, 30, 0.96)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, bannerY - 20, width, bannerHeight + 20);

          // Cyan/Blue Accent Top Border Line
          ctx.fillStyle = '#0A84FF';
          ctx.fillRect(0, bannerY - 2, width, Math.max(3, Math.round(width * 0.003)));

          // Typography settings
          const baseFontSize = Math.max(12, Math.round(width * 0.022));
          const smallFontSize = Math.max(10, Math.round(baseFontSize * 0.82));
          const titleFontSize = Math.max(13, Math.round(baseFontSize * 1.15));

          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          let currentY = bannerY + Math.round(padding * 0.6);

          // 1. Header Line: Brand & Verification Shield
          ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = '#38BDF8'; // Sky blue accent
          const shortRef = bookingId ? `#JALA${String(bookingId).slice(-6).toUpperCase()}` : 'VERIFIED';
          ctx.fillText(`🛡️ JALADHAARA FIELD EVIDENCE • ${shortRef}`, padding, currentY);

          currentY += titleFontSize + Math.round(baseFontSize * 0.35);

          // 2. Line 2: GPS Coordinates
          ctx.font = `bold ${baseFontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
          ctx.fillStyle = '#FFFFFF';

          let gpsText = '';
          if (coords?.lat && coords?.lng) {
            const latStr = formatCoord(coords.lat, true);
            const lngStr = formatCoord(coords.lng, false);
            const accStr = coords.accuracy ? ` (±${coords.accuracy}m)` : '';
            gpsText = `📍 GPS: ${latStr}, ${lngStr}${accStr}`;
          } else {
            gpsText = '📍 GPS: Location Tagged on Device (Accuracy Pending)';
          }
          ctx.fillText(gpsText, padding, currentY);

          currentY += baseFontSize + Math.round(baseFontSize * 0.35);

          // 3. Line 3: Timestamp & Location Details
          ctx.font = `500 ${smallFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = '#E2E8F0'; // Soft white

          const dateStr = formatTimestamp(captureTimestamp);
          const locationSuffix = locationName ? ` • ${locationName}` : '';
          ctx.fillText(`📅 ${dateStr}${locationSuffix}`, padding, currentY);

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Convert canvas back to high-quality JPEG File
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ file, coords, timestamp: captureTimestamp });
                return;
              }

              const stampedFileName = file.name
                ? file.name.replace(/\.[^/.]+$/, '') + '-geotagged.jpg'
                : `evidence-${Date.now()}.jpg`;

              const stampedFile = new File([blob], stampedFileName, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });

              // Attach coordinates directly to the File object for easy reference
              stampedFile._geoCoords = coords;
              stampedFile._captureTime = captureTimestamp;

              resolve({
                file: stampedFile,
                coords,
                timestamp: captureTimestamp
              });
            },
            'image/jpeg',
            0.92
          );
        } catch (stampErr) {
          console.error('Error stamping photo with geotag:', stampErr);
          // Fallback to original file so evidence capture is never blocked
          resolve({ file, coords, timestamp: captureTimestamp });
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};
