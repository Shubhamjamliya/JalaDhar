/**
 * Live GPS Map Camera Geotag & Timestamp Watermark Engine
 * Produces authentic, modern dual-card split layout:
 * - Card 1 (Left): Independent 1:1 squarish satellite map widget
 * - Card 2 (Right): Independent floating dark info panel
 * - Reduced left/right and bottom gaps for an ultra-clean, compact footprint
 * - Both cards aligned to identical top and bottom baselines with matching rounded corners
 * - Large, readable typography with zero truncation.
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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
 * Format GPS Timestamp matching industry standard:
 * Example: "Friday, 18/09/2026 12:57 PM GMT +05:30"
 */
export const formatGpsTimestamp = (d = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;

  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
  const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
  const gmtStr = `GMT ${sign}${offsetHours}:${offsetMins}`;

  return `${dayName}, ${dd}/${mm}/${yyyy} ${timeStr} ${gmtStr}`;
};

/**
 * Format date for photo viewer header:
 * Returns { dateStr: "18 September, 2026", timeStr: "12:57 PM" }
 */
export const formatViewerHeaderDate = (d = new Date()) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dateStr = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;
  return { dateStr, timeStr };
};

/**
 * Reverse geocode coordinates using Google Geocoding API with fast timeout
 */
const reverseGeocode = async (lat, lng, apiKey) => {
  if (!apiKey || !lat || !lng) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const first = data.results[0];
      let city = '';
      let state = '';
      let country = 'India';

      first.address_components?.forEach((c) => {
        if (c.types.includes('locality')) city = c.long_name;
        if (!city && c.types.includes('administrative_area_level_3')) city = c.long_name;
        if (!city && c.types.includes('administrative_area_level_2')) city = c.long_name;
        if (c.types.includes('administrative_area_level_1')) state = c.long_name;
        if (c.types.includes('country')) {
          country = c.long_name;
        }
      });

      return {
        formattedAddress: first.formatted_address || '',
        city: city || 'Survey Site',
        state: state || '',
        country: country || 'India'
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding skipped or timed out:', err?.message || err);
  }
  return null;
};

/**
 * Load Google Static Hybrid Satellite Map image with matching square aspect ratio
 */
const loadStaticMapImage = (lat, lng, apiKey, size = 350) => {
  if (!apiKey || !lat || !lng) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 3000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    const reqSize = Math.min(640, Math.max(250, Math.round(size)));
    img.src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=${reqSize}x${reqSize}&scale=2&maptype=hybrid&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
  });
};

/**
 * Draw rounded rectangle path helper
 */
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
};

/**
 * Clean word-wrapping helper for Canvas text
 */
const wrapText = (ctx, text, maxWidth, maxLines = 2) => {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        let remaining = words.slice(i).join(' ');
        while (remaining.length > 0 && ctx.measureText(remaining + '...').width > maxWidth) {
          remaining = remaining.slice(0, -1);
        }
        lines.push(remaining ? `${remaining}...` : '...');
        currentLine = '';
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

/**
 * Draw vector fallback satellite map on canvas when static map is unavailable
 */
const drawFallbackMap = (ctx, x, y, width, height) => {
  ctx.save();
  // Satellite-dark terrain background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, width, height);

  // Simulated roads/satellite paths
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = Math.max(2, Math.round(width * 0.02));
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.4);
  ctx.lineTo(x + width, y + height * 0.45);
  ctx.moveTo(x + width * 0.5, y);
  ctx.lineTo(x + width * 0.45, y + height);
  ctx.stroke();

  // Green foliage patch simulation
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.arc(x + width * 0.25, y + height * 0.7, width * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Red Pin Marker in the center
  const pinCenterX = x + width / 2;
  const pinTipY = y + height / 2 + height * 0.08;
  const pinRadius = width * 0.09;
  const pinHeadY = pinTipY - width * 0.15;

  // Pin Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(pinCenterX + 2, pinTipY + 2, width * 0.08, width * 0.028, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pin Body
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(pinCenterX, pinHeadY, pinRadius, Math.PI * 0.8, Math.PI * 0.2, false);
  ctx.lineTo(pinCenterX, pinTipY);
  ctx.closePath();
  ctx.fill();

  // Pin Center Dot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(pinCenterX, pinHeadY, pinRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Google Logo at bottom left
  const logoSize = Math.max(10, Math.round(width * 0.11));
  ctx.font = `bold ${logoSize}px Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 3;
  ctx.fillText('Google', x + width * 0.08, y + height - height * 0.05);
  ctx.restore();
};

/**
 * Stamp image with squarish dual-card split GPS Map Camera overlay
 * 
 * Layout:
 * - Card 1 (Left): 1:1 squarish satellite map widget
 * - Card 2 (Right): Floating dark info panel
 * - Reduced left/right and bottom gaps for an ultra-clean, compact footprint
 * 
 * @param {File|Blob} file - Captured photo from camera
 * @param {Object} options
 * @param {string} [options.bookingId] - Booking reference
 * @param {string} [options.locationName] - Fallback village/mandal/district string
 * @param {Object} [options.coords] - Pre-fetched coordinates { lat, lng, accuracy }
 * @returns {Promise<{ file: File, coords: Object|null, timestamp: Date, addressInfo: Object|null }>}
 */
export const stampImageWithGeotag = async (file, options = {}) => {
  const {
    bookingId = '',
    locationName = '',
    coords: preCoords = null
  } = options;

  // 1. Fetch live coordinates
  const coords = preCoords || (await getDeviceLocation(6000));
  const captureTimestamp = new Date();

  // 2. Fetch Reverse Geocoding and Google Static Map in parallel
  let geoData = null;
  let mapImg = null;

  if (coords?.lat && coords?.lng && GOOGLE_API_KEY) {
    try {
      const [geoRes, mapRes] = await Promise.all([
        reverseGeocode(coords.lat, coords.lng, GOOGLE_API_KEY),
        loadStaticMapImage(coords.lat, coords.lng, GOOGLE_API_KEY, 350)
      ]);
      geoData = geoRes;
      mapImg = mapRes;
    } catch (fetchErr) {
      console.warn('Map/Geocode parallel fetch warning:', fetchErr);
    }
  }

  // 3. Fallbacks if geocode is unavailable
  const city = geoData?.city || (locationName ? locationName.split(',')[0].trim() : 'Survey Site');
  const state = geoData?.state || (locationName ? locationName.split(',').slice(-1)[0].trim() : '');
  const country = geoData?.country || 'India';
  const fullAddress =
    geoData?.formattedAddress ||
    (locationName
      ? `${locationName}, India`
      : coords
      ? `Near Lat ${coords.lat.toFixed(6)}°, Long ${coords.lng.toFixed(6)}°`
      : 'On-site Survey Location');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read photo file'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory'));

      img.onload = () => {
        try {
          // Normalize max dimension to 2048px for optimal performance and crispness
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
            resolve({ file, coords, timestamp: captureTimestamp, addressInfo: geoData });
            return;
          }

          // 1. Draw base camera photo
          ctx.drawImage(img, 0, 0, width, height);

          // 2. Compact Proportions with Decreased Margins:
          // - Total width: 91% of width (only ~4.5% gap from left and right edges)
          // - Bottom margin: 1.8% of height (~20px on 1114h, decreased bottom gap)
          // - Height: ~140px on 504px reference
          const baseWidth = 504;
          const scale = Math.max(0.75, width / baseWidth);

          const totalWidth = Math.round(width * 0.91);
          const startX = Math.round((width - totalWidth) / 2);
          const cardHeight = Math.round(140 * scale);
          const gap = Math.round(8 * scale); // tight 8px gap
          const cardMarginBottom = Math.round(height * 0.018); // ~20px gap from bottom
          const cardY = height - cardHeight - cardMarginBottom;
          const cardRadius = Math.round(10 * scale);

          // Card 1: Squarish 1:1 Satellite Map Widget
          const mapCardWidth = cardHeight; // True 1:1 square
          const mapCardX = startX;
          const mapCardY = cardY;
          const mapCardHeight = cardHeight;

          // Card 2: Right Information Card
          const textCardX = mapCardX + mapCardWidth + gap;
          const textCardWidth = totalWidth - mapCardWidth - gap;
          const textCardY = cardY;
          const textCardHeight = cardHeight;

          // 3. Draw Left Satellite Map Card (1:1 Squarish Floating Widget)
          ctx.save();
          // Drop Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = Math.round(8 * scale);
          ctx.shadowOffsetY = Math.round(2 * scale);

          drawRoundedRect(ctx, mapCardX, mapCardY, mapCardWidth, mapCardHeight, cardRadius);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.restore();

          // Clip and draw square satellite imagery inside Card 1
          ctx.save();
          drawRoundedRect(ctx, mapCardX, mapCardY, mapCardWidth, mapCardHeight, cardRadius);
          ctx.clip();

          if (mapImg) {
            ctx.drawImage(mapImg, mapCardX, mapCardY, mapCardWidth, mapCardHeight);
          } else {
            drawFallbackMap(ctx, mapCardX, mapCardY, mapCardWidth, mapCardHeight);
          }
          ctx.restore();

          // Card 1 Subtle Border
          ctx.save();
          drawRoundedRect(ctx, mapCardX, mapCardY, mapCardWidth, mapCardHeight, cardRadius);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          // 4. Draw Right Information Card (Standalone Floating Dark Panel)
          ctx.save();
          // Drop Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = Math.round(8 * scale);
          ctx.shadowOffsetY = Math.round(2 * scale);

          drawRoundedRect(ctx, textCardX, textCardY, textCardWidth, textCardHeight, cardRadius);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.76)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          // 5. Draw Content inside Right Information Card
          const textPaddingX = Math.round(12 * scale);
          const textPaddingY = Math.round(9 * scale);
          const contentX = textCardX + textPaddingX;
          const contentWidth = textCardWidth - textPaddingX * 2;

          const targetTitleSize = Math.round(18 * scale);   // 18px bold
          const addressSize = Math.round(12 * scale);       // 12px
          const addressLineHeight = Math.round(addressSize * 1.34);
          const coordSize = Math.round(12 * scale);         // 12px semibold
          const timeSize = Math.round(11 * scale);          // 11px

          ctx.save();
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          let currentY = textCardY + textPaddingY;

          // Line 1: Location Title (bold, never truncated)
          const titleLocation = `${city}${state ? ', ' + state : ''}, ${country} 🇮🇳`;
          let currentTitleSize = targetTitleSize;
          ctx.font = `700 ${currentTitleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          while (ctx.measureText(titleLocation).width > contentWidth && currentTitleSize > Math.round(14 * scale)) {
            currentTitleSize -= 0.5;
            ctx.font = `700 ${currentTitleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(titleLocation, contentX, currentY);

          currentY += currentTitleSize + Math.round(5 * scale);

          // Line 2: Full Address (word-wrapped to 2 lines)
          ctx.font = `400 ${addressSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = '#F1F5F9';
          const addressLines = wrapText(ctx, fullAddress, contentWidth, 2);
          addressLines.forEach((line) => {
            ctx.fillText(line, contentX, currentY);
            currentY += addressLineHeight;
          });

          currentY += Math.round(5 * scale);

          // Line 3: Lat / Long Coordinates
          ctx.font = `600 ${coordSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          const latText = coords ? `Lat ${coords.lat.toFixed(6)}° Long ${coords.lng.toFixed(6)}°` : 'Lat --.------° Long --.------°';
          ctx.fillText(latText, contentX, currentY);

          currentY += coordSize + Math.round(4 * scale);

          // Line 4: Date & Time
          ctx.font = `400 ${timeSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = '#CBD5E1';
          const timestampText = formatGpsTimestamp(captureTimestamp);
          ctx.fillText(timestampText, contentX, currentY);

          ctx.restore();

          // 6. Export High-Quality Stamped JPEG File
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ file, coords, timestamp: captureTimestamp, addressInfo: geoData });
                return;
              }

              const stampedFileName = file.name
                ? file.name.replace(/\.[^/.]+$/, '') + '-gpsmap.jpg'
                : `gpsmap-${Date.now()}.jpg`;

              const stampedFile = new File([blob], stampedFileName, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });

              stampedFile._geoCoords = coords;
              stampedFile._captureTime = captureTimestamp;
              stampedFile._addressInfo = geoData;
              stampedFile._formattedAddress = fullAddress;
              stampedFile._locationTitle = titleLocation;

              resolve({
                file: stampedFile,
                coords,
                timestamp: captureTimestamp,
                addressInfo: geoData
              });
            },
            'image/jpeg',
            0.94
          );
        } catch (stampErr) {
          console.error('Error stamping photo with squarish dual-card GPS overlay:', stampErr);
          resolve({ file, coords, timestamp: captureTimestamp, addressInfo: geoData });
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};
