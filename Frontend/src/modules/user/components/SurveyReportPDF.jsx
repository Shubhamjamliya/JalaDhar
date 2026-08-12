import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-italic.ttf', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700italic.ttf', fontWeight: 700, fontStyle: 'italic' },
  ]
});

/**
 * A4 at 72dpi = 595 x 842pt
 * Padding: 30 top, 36 sides, 50 bottom (footer space)
 * Usable content area per page ≈ 523 x 762pt
 *
 * PAGE 1 budget:
 *  Header          ≈  58
 *  Banner          ≈  46
 *  Info strip      ≈  36   mb:10
 *  2-col section   ≈ 188   mb:12
 *  Tech metrics    ≈  95   mb:12
 *  Map + coords    ≈ 255   mb:10
 *  Category tags   ≈  36
 *  TOTAL           ≈ 758  ✓
 *
 * PAGE 2 budget:
 *  Drilling sec    ≈  90   mb:12
 *  Evidence imgs   ≈ 220   mb:12
 *  Expert verify   ≈ 162   mb:12
 *  Declaration     ≈ 168   mb: 8
 *  QA note         ≈  48
 *  TOTAL           ≈ 734  ✓ (28px natural gap)
 */
const S = StyleSheet.create({
  page: { padding: '30 36 50 36', fontFamily: 'Open Sans', fontSize: 9, color: '#1F2937', backgroundColor: '#FFFFFF' },

  // ── Header ──────────────────────────────────────────────
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2pt solid #0A192F', paddingBottom: 10, marginBottom: 12 },
  logoText: { fontSize: 22, color: '#0A192F', fontWeight: 700, letterSpacing: -0.5 },
  reportType: { fontSize: 7.5, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3, fontWeight: 700 },
  headerRight: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  metaBox: { textAlign: 'right', gap: 3 },
  metaLabel: { fontSize: 6.5, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 },
  metaValue: { fontSize: 8.5, color: '#111827', fontWeight: 700 },
  qrCode: { width: 52, height: 52 },

  // ── Outcome Banner ───────────────────────────────────────
  banner: { alignItems: 'center', justifyContent: 'center', padding: '11 14', borderRadius: 4, marginBottom: 10 },
  bannerSuccess: { backgroundColor: '#ECFDF5', border: '1pt solid #A7F3D0' },
  bannerFailure: { backgroundColor: '#FEF2F2', border: '1pt solid #FECACA' },
  bannerLabel: { fontSize: 7.5, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 3 },
  bannerText: { fontSize: 14, fontWeight: 700 },
  textSuccess: { color: '#065F46' },
  textFailure: { color: '#991B1B' },

  // ── Info strip (booking purpose + category) ──────────────
  infoStrip: { flexDirection: 'row', backgroundColor: '#F0F7FF', border: '1pt solid #BFDBFE', borderRadius: 4, padding: '8 12', marginBottom: 12, gap: 20 },
  infoChip: { flexDirection: 'column', gap: 2 },
  infoChipLbl: { fontSize: 6.5, color: '#1E40AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 },
  infoChipVal: { fontSize: 8.5, color: '#0A192F', fontWeight: 700 },

  // ── Section title ────────────────────────────────────────
  secTitle: { fontSize: 9, fontWeight: 700, color: '#0A192F', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1pt solid #0A192F', paddingBottom: 4, marginBottom: 7 },

  // ── 2-column layout ──────────────────────────────────────
  row2: { flexDirection: 'row', gap: 12, marginBottom: 13 },
  col: { flex: 1 },

  // ── Tables ───────────────────────────────────────────────
  table: { border: '1pt solid #E5E7EB', borderRadius: 3 },
  tr: { flexDirection: 'row', borderBottom: '1pt solid #E5E7EB', minHeight: 22, alignItems: 'center' },
  trLast: { borderBottom: 'none' },
  th: { width: '40%', backgroundColor: '#F9FAFB', padding: '5 8', borderRight: '1pt solid #E5E7EB' },
  td: { flex: 1, padding: '5 8' },
  lbl: { fontSize: 7, color: '#4B5563', textTransform: 'uppercase', fontWeight: 700 },
  val: { fontSize: 8.5, color: '#111827', fontWeight: 600 },
  valBlue: { fontSize: 8.5, color: '#0A84FF', fontWeight: 700 },

  // ── Quote ────────────────────────────────────────────────
  quoteBox: { backgroundColor: '#F9FAFB', borderLeft: '3pt solid #D1D5DB', padding: '7 10', marginTop: 6 },
  quoteText: { fontStyle: 'italic', fontSize: 7.5, color: '#374151', lineHeight: 1.5 },
  quoteLbl: { fontSize: 6.5, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 },

  // ── Tech metrics bar ─────────────────────────────────────
  metricsBar: { flexDirection: 'row', backgroundColor: '#0A192F', borderRadius: 5, padding: '12 10', marginBottom: 8, justifyContent: 'space-between' },
  metric: { flex: 1, alignItems: 'center', borderRight: '1pt solid #1E3A8A' },
  metricLast: { flex: 1, alignItems: 'center' },
  mLbl: { fontSize: 6.5, textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700, letterSpacing: 0.4, marginBottom: 4 },
  mVal: { fontSize: 16, fontWeight: 700, color: '#FFFFFF' },
  mUnit: { fontSize: 8, color: '#9CA3AF', fontWeight: 600 },
  fractureBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', border: '1pt solid #BFDBFE', borderRadius: 3, padding: '8 12', gap: 10, marginBottom: 13 },
  fLbl: { fontSize: 7, textTransform: 'uppercase', fontWeight: 700, color: '#1E40AF', width: '36%' },
  fVal: { fontSize: 9, fontWeight: 700, color: '#1E3A8A', flex: 1 },

  // ── Map ──────────────────────────────────────────────────
  mapFrame: { width: '100%', height: 185, objectFit: 'cover', borderRadius: 4, border: '1pt solid #E5E7EB' },
  mapCoords: { flexDirection: 'row', backgroundColor: '#F9FAFB', border: '1pt solid #E5E7EB', borderRadius: 3, padding: '5 10', marginTop: 5, justifyContent: 'center' },
  mapCoordsText: { fontSize: 7.5, color: '#4B5563', fontWeight: 600 },

  // ── Tags strip (land use / survey category) ──────────────
  tagsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tag: { backgroundColor: '#1E3A8A', borderRadius: 10, padding: '4 10' },
  tagText: { fontSize: 7, color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagGreen: { backgroundColor: '#065F46' },
  tagAmber: { backgroundColor: '#92400E' },

  // ── Footer ───────────────────────────────────────────────
  footer: { position: 'absolute', bottom: 16, left: 36, right: 36, borderTop: '1pt solid #E5E7EB', paddingTop: 6 },
  disclaimer: { fontSize: 5.5, color: '#9CA3AF', textAlign: 'justify', lineHeight: 1.5, marginBottom: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerBrand: { fontSize: 7.5, color: '#0A192F', fontWeight: 700 },
  pageNum: { fontSize: 7.5, color: '#6B7280', fontWeight: 600 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0A84FF', marginHorizontal: 4 },

  // ── PAGE 2 ───────────────────────────────────────────────

  // Alert / Drilling
  alertBox: { backgroundColor: '#FFFBEB', border: '1pt solid #FDE68A', borderLeft: '4pt solid #F59E0B', padding: '9 12', borderRadius: 3 },
  alertItem: { fontSize: 8, color: '#92400E', fontWeight: 600, marginBottom: 4, lineHeight: 1.4 },
  alertItemNote: { fontSize: 7.5, color: '#374151', fontWeight: 600, marginTop: 2, lineHeight: 1.4 },

  // Evidence images
  imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imgCard: { width: '31%', flexDirection: 'column' },
  imgFrame: { width: '100%', height: 118, objectFit: 'cover', borderRadius: 4, border: '1pt solid #E5E7EB', marginBottom: 3 },
  imgCaption: { fontSize: 7, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' },

  // Sig block
  sigGrid: { flexDirection: 'row', border: '1pt solid #E5E7EB', borderRadius: 4 },
  sigLeft: { width: '58%', padding: '10 14', borderRight: '1pt solid #E5E7EB', backgroundColor: '#F9FAFB' },
  sigRight: { flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center' },
  sigRow: { flexDirection: 'row', marginBottom: 4 },
  sigLbl: { width: '40%', fontSize: 7.5, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' },
  sigVal: { flex: 1, fontSize: 8.5, color: '#111827', fontWeight: 600 },
  sigLine: { borderBottom: '1pt solid #111827', width: '85%', height: 26, marginBottom: 4 },
  sigText: { fontFamily: 'Open Sans', fontStyle: 'italic', fontSize: 13, color: '#1E3A8A', textAlign: 'center', marginTop: -20, marginBottom: 8 },
  stamp: { backgroundColor: '#ECFDF5', border: '1pt solid #059669', color: '#047857', fontSize: 7, fontWeight: 700, padding: '4 9', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Declaration box
  declBox: { backgroundColor: '#F8FAFC', border: '1pt solid #E2E8F0', borderRadius: 4, padding: '10 14' },
  declTitle: { fontSize: 7.5, fontWeight: 700, color: '#0A192F', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  declItem: { flexDirection: 'row', marginBottom: 4 },
  declBullet: { width: 10, fontSize: 8, color: '#0A84FF', fontWeight: 700 },
  declText: { flex: 1, fontSize: 7, color: '#4B5563', lineHeight: 1.5 },

  // QA Note row
  qaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  qaCard: { flex: 1, backgroundColor: '#F0F7FF', border: '1pt solid #BFDBFE', borderRadius: 4, padding: '8 10' },
  qaCardAmber: { flex: 1, backgroundColor: '#FFFBEB', border: '1pt solid #FDE68A', borderRadius: 4, padding: '8 10' },
  qaCardGreen: { flex: 1, backgroundColor: '#ECFDF5', border: '1pt solid #A7F3D0', borderRadius: 4, padding: '8 10' },
  qaTitle: { fontSize: 7, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  qaTitleAmber: { fontSize: 7, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  qaTitleGreen: { fontSize: 7, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  qaText: { fontSize: 7, color: '#374151', lineHeight: 1.4 },

  // Helpers
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb12: { marginBottom: 12 },
  mb14: { marginBottom: 10 },
});

/* ─── Shared Footer ────────────────────────────────────── */
const PageFooter = () => (
  <View style={S.footer} fixed>
    <Text style={S.disclaimer}>
      Disclaimer: This report is based on geophysical survey data, geological interpretation, and field observations conducted on the survey date. Groundwater occurrence is a natural phenomenon and cannot be guaranteed. Actual drilling results may vary due to local geological conditions, drilling practices, seasonal groundwater fluctuations, and other subsurface factors. Jaladhaara acts only as a technology platform connecting customers with independent survey experts and is not responsible for drilling outcomes. This document is confidential and intended solely for the named client.
    </Text>
    <View style={S.footerRow}>
      <Text style={S.footerBrand}>Jaladhaara Digital Survey</Text>
      <Text style={S.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  </View>
);

/* ─── Component ─────────────────────────────────────────── */
const SurveyReportPDF = ({ booking }) => {
  if (!booking || !booking.report) return null;
  const { report, vendor, user } = booking;
  const isSuccess = report.waterFound === 'true' || report.waterFound === true;

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const fmtDT = (d) => d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

  /* ── Map URL ── */
  const mapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const getStaticMapUrl = (latVal, lngVal) => {
    if (latVal == null || lngVal == null) return null;
    let lat = parseFloat(latVal), lng = parseFloat(lngVal);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    if ((lat >= 68 && lat <= 97) && (lng >= 6 && lng <= 37)) { [lat, lng] = [lng, lat]; }
    if (lat > 37 || lat < 6)  lat = 17.385;
    if (lng > 97 || lng < 68) lng = 78.4867;
    if (mapApiKey) return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=600x280&maptype=hybrid&markers=color:red%7Clabel:B%7C${lat},${lng}&key=${mapApiKey}`;
    const zoom = 19;
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    if (isNaN(x) || isNaN(y)) return null;
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  };
  const staticMapUrl = getStaticMapUrl(report.surveyRecommendations?.latitude, report.surveyRecommendations?.longitude);
  const hasMap = !!staticMapUrl;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://jaladhaara.in/verify/${booking._id}`)}`;

  const fractureText = report.expectedFractureDepths
    ? report.expectedFractureDepths.split(/[\s,]+/).filter(Boolean).map(d => d.includes('ft') ? d : `${d} ft`).join(', ')
    : 'To be determined during drilling';

  const address = [
    booking.village || booking.address?.city,
    booking.mandal,
    booking.district,
    booking.address?.state,
    (booking.address?.pincode && booking.address.pincode !== '000000') ? booking.address.pincode : null
  ].filter(Boolean).join(', ');

  const purpose    = booking.purpose || report.purpose || 'Borewell Site Selection';
  const category   = booking.surveyCategory || report.surveyCategory || 'Geophysical Survey';
  const landUse    = report.landUse || booking.landUse || 'Agricultural / Residential';

  return (
    <Document>

      {/* ╔════════════════════════════════════════════════╗
          ║                    PAGE 1                      ║
          ╚════════════════════════════════════════════════╝ */}
      <Page size="A4" style={S.page}>

        {/* ── Header ─────────────────────────────────── */}
        <View style={S.header}>
          <View>
            <Text style={S.logoText}>Jaladhaara</Text>
            <Text style={S.reportType}>Official Survey Report</Text>
          </View>
          <View style={S.headerRight}>
            <View style={S.metaBox}>
              <Text style={S.metaLabel}>Report ID</Text>
              <Text style={S.metaValue}>{booking._id.slice(-8).toUpperCase()}</Text>
              <Text style={[S.metaLabel, { marginTop: 4 }]}>Survey Date</Text>
              <Text style={S.metaValue}>{fmt(booking.createdAt)}</Text>
            </View>
            <Image src={qrUrl} style={S.qrCode} />
          </View>
        </View>

        {/* ── Outcome Banner ─────────────────────────── */}
        <View style={[S.banner, isSuccess ? S.bannerSuccess : S.bannerFailure]}>
          <Text style={[S.bannerLabel, isSuccess ? S.textSuccess : S.textFailure]}>Official Survey Outcome</Text>
          <Text style={[S.bannerText, isSuccess ? S.textSuccess : S.textFailure]}>
            {isSuccess ? 'Recommended Borewell Location Identified' : 'No Suitable Groundwater Potential Identified'}
          </Text>
        </View>

        {/* ── Info Strip ─────────────────────────────── */}
        <View style={S.infoStrip}>
          <View style={S.infoChip}>
            <Text style={S.infoChipLbl}>Survey Purpose</Text>
            <Text style={S.infoChipVal}>{purpose}</Text>
          </View>
          <View style={S.infoChip}>
            <Text style={S.infoChipLbl}>Survey Category</Text>
            <Text style={S.infoChipVal}>{category}</Text>
          </View>
          <View style={S.infoChip}>
            <Text style={S.infoChipLbl}>Land Use</Text>
            <Text style={S.infoChipVal}>{landUse}</Text>
          </View>
          <View style={S.infoChip}>
            <Text style={S.infoChipLbl}>District</Text>
            <Text style={S.infoChipVal}>{booking.district || booking.address?.district || 'N/A'}</Text>
          </View>
        </View>

        {/* ── Row: Section 1 + Section 2 ─────────────── */}
        <View style={S.row2}>

          {/* Section 1 – Client & Site */}
          <View style={S.col}>
            <Text style={S.secTitle}>1. Client & Site Details</Text>
            <View style={S.table}>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Client Name</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.customerName || user?.name || 'N/A'}</Text></Text>
              </View>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Booking Ref.</Text></Text>
                <Text style={S.td}><Text style={S.val}>{booking._id.slice(-12).toUpperCase()}</Text></Text>
              </View>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Site Address</Text></Text>
                <Text style={S.td}><Text style={S.val}>{address || 'N/A'}</Text></Text>
              </View>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Survey No.</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.surveyNumber || 'N/A'}</Text></Text>
              </View>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Extent</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.extent || 'N/A'}</Text></Text>
              </View>
              <View style={[S.tr, S.trLast]}>
                <Text style={S.th}><Text style={S.lbl}>GPS Coordinates</Text></Text>
                <Text style={S.td}>
                  <Text style={S.valBlue}>
                    {report.surveyRecommendations?.latitude || '—'}, {report.surveyRecommendations?.longitude || '—'}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2 – Geological Profile */}
          <View style={S.col}>
            <Text style={S.secTitle}>2. Geological Profile</Text>
            <View style={S.table}>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Rock Formation</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.geologicalInfo?.rockType || '—'}</Text></Text>
              </View>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Surface Soil</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.geologicalInfo?.soilType || '—'}</Text></Text>
              </View>
              <View style={S.tr}>
                <Text style={S.th}><Text style={S.lbl}>Terrain Type</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.geologicalInfo?.terrainType || '—'}</Text></Text>
              </View>
              <View style={[S.tr, S.trLast]}>
                <Text style={S.th}><Text style={S.lbl}>Weathered Zone</Text></Text>
                <Text style={S.td}><Text style={S.val}>{report.geologicalInfo?.weatheredZone || '—'}</Text></Text>
              </View>
              <View style={[S.tr, S.trLast, { flexDirection: 'column', alignItems: 'flex-start', padding: '5 8', backgroundColor: '#F9FAFB' }]}>
                <Text style={[S.lbl, { marginBottom: 3 }]}>{report.existingBorewellDetails ? 'Nearby Borewell Observations' : 'Field Observations'}</Text>
                <Text style={[S.val, { fontSize: 7.5, color: '#4B5563', fontWeight: 400, lineHeight: 1.4 }]}>
                  {report.existingBorewellDetails
                    ? `"${report.existingBorewellDetails}"`
                    : 'No nearby borewell data recorded. Site analysis based on geophysical survey instruments and terrain assessment.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 3 – Technical Recommendations ──── */}
        <Text style={[S.secTitle, S.mb8]}>3. Technical Recommendations</Text>
        <View style={S.metricsBar}>
          <View style={S.metric}>
            <Text style={S.mLbl}>Rec. Point</Text>
            <Text style={S.mVal}>#{report.surveyRecommendations?.recommendedPointNumber || '1'}</Text>
          </View>
          <View style={S.metric}>
            <Text style={S.mLbl}>Exp. Yield</Text>
            <Text style={S.mVal}>{report.surveyRecommendations?.expectedYield || '--'}<Text style={S.mUnit}> in</Text></Text>
          </View>
          <View style={S.metric}>
            <Text style={S.mLbl}>Bore Depth</Text>
            <Text style={S.mVal}>{report.surveyRecommendations?.recommendedBoreDepth || '--'}<Text style={S.mUnit}> ft</Text></Text>
          </View>
          <View style={S.metricLast}>
            <Text style={S.mLbl}>Casing Length</Text>
            <Text style={S.mVal}>{report.surveyRecommendations?.recommendedCasingDepth || '--'}<Text style={S.mUnit}> ft</Text></Text>
          </View>
        </View>
        <View style={S.fractureBox}>
          <Text style={S.fLbl}>Expected Fracture Zones</Text>
          <Text style={S.fVal}>{fractureText}</Text>
        </View>

        {/* ── Section 4 – Survey Location Map ─────────── */}
        <View wrap={false}>
          <Text style={[S.secTitle, { marginBottom: 7 }]}>4. Survey Location Context</Text>
          {hasMap && <Image src={staticMapUrl} style={S.mapFrame} />}
          <View style={S.mapCoords}>
            <Text style={S.mapCoordsText}>
              Recommended Survey Point — Lat: {report.surveyRecommendations?.latitude || 'N/A'} | Lng: {report.surveyRecommendations?.longitude || 'N/A'}
            </Text>
          </View>
        </View>


        <PageFooter />
      </Page>

      {/* ╔════════════════════════════════════════════════╗
          ║                    PAGE 2                      ║
          ╚════════════════════════════════════════════════╝ */}
      <Page size="A4" style={S.page}>

        {/* ── Section 5 – Drilling Instructions ───────── */}
        <Text style={[S.secTitle, S.mb8]}>5. Drilling Instructions & Remarks</Text>
        <View style={[S.alertBox, S.mb14]}>
          <Text style={S.alertItem}>• Stop drilling after <Text style={{ fontWeight: 700 }}>{report.drillingInstructions?.stopDrillingDepth || '___'} ft</Text> if no fracture zone is encountered.</Text>
          {report.drillingInstructions?.flushBorewell && (
            <Text style={S.alertItem}>• Flush borewell thoroughly before yield testing — this step is mandatory for accurate flow measurement.</Text>
          )}
          {!report.drillingInstructions?.flushBorewell && (
            <Text style={S.alertItem}>• Ensure proper casing installation up to the recommended casing depth before proceeding with drilling.</Text>
          )}
          <Text style={S.alertItem}>• Use rotary percussion method for optimal penetration through identified rock formations.</Text>
          {report.notes ? (
            <Text style={S.alertItemNote}>• Expert Remarks: {report.notes}</Text>
          ) : (
            <Text style={S.alertItemNote}>• Expert Remarks: No additional remarks. Proceed as per standard drilling protocol for the identified geological conditions.</Text>
          )}
        </View>

        {/* ── Section 6 – Site Evidence ────────────────── */}
        {report.images && report.images.length > 0 && (
          <View style={S.mb14}>
            <Text style={[S.secTitle, S.mb8]}>6. Site Evidence</Text>
            <View style={S.imgGrid}>
              {report.images.map((img, i) => {
                const captions = ['Site Photograph', 'Marked Borewell Point', 'Survey Equipment', 'Terrain View', 'Rock Sample', 'Evidence'];
                return (
                  <View key={i} style={S.imgCard}>
                    <Image src={img.url || img} style={S.imgFrame} />

                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Section 7 – Expert Verification ─────────── */}
        <Text style={[S.secTitle, S.mb8]}>7. Expert Verification</Text>
        <View style={[S.sigGrid, S.mb14]}>
          <View style={S.sigLeft}>
            <View style={S.sigRow}><Text style={S.sigLbl}>Conducted By</Text><Text style={S.sigVal}>{vendor.name}</Text></View>
            <View style={S.sigRow}><Text style={S.sigLbl}>Designation</Text><Text style={S.sigVal}>{vendor.qualification || 'Expert Hydrogeologist'}</Text></View>
            <View style={S.sigRow}><Text style={S.sigLbl}>Experience</Text><Text style={S.sigVal}>{vendor.experience ? `${vendor.experience} Years in Groundwater Survey` : 'N/A'}</Text></View>
            <View style={S.sigRow}><Text style={S.sigLbl}>Expert ID</Text><Text style={S.sigVal}>{vendor._id?.slice(-8).toUpperCase()}</Text></View>
            <View style={S.sigRow}><Text style={S.sigLbl}>Survey Date</Text><Text style={S.sigVal}>{fmtDT(booking.createdAt)}</Text></View>
            <View style={[S.sigRow, { marginBottom: 0 }]}><Text style={S.sigLbl}>Report Issued</Text><Text style={S.sigVal}>{fmtDT(booking.updatedAt || booking.createdAt)}</Text></View>
          </View>
          <View style={S.sigRight}>
            <View style={S.sigLine}></View>
            <Text style={S.sigText}>{vendor.name}</Text>
            <Text style={S.stamp}>✓ Verified By Jaladhaara</Text>
          </View>
        </View>

        {/* ── Section 8 – Declaration ──────────────────── */}
        <Text style={[S.secTitle, S.mb8]}>8. Declaration & Scope</Text>
        <View style={[S.declBox, S.mb12]}>
          <Text style={S.declTitle}>Professional Declaration</Text>
          <View style={S.declItem}>
            <Text style={S.declBullet}>›</Text>
            <Text style={S.declText}>The survey expert certifies that this report is prepared based on field observations, geophysical instrumentation data, and professional geological analysis conducted at the survey site on the date mentioned.</Text>
          </View>
          <View style={S.declItem}>
            <Text style={S.declBullet}>›</Text>
            <Text style={S.declText}>This report is intended exclusively for the named client for the purpose of borewell site selection. Unauthorized reproduction, distribution, or alteration of this document is strictly prohibited.</Text>
          </View>
          <View style={S.declItem}>
            <Text style={S.declBullet}>›</Text>
            <Text style={S.declText}>Actual drilling outcomes, groundwater yield, and depth may vary due to seasonal fluctuations, geological heterogeneity, and drilling methodology. Jaladhaara and the survey expert shall not be held liable for variations from predicted values.</Text>
          </View>
          <View style={[S.declItem, { marginBottom: 0 }]}>
            <Text style={S.declBullet}>›</Text>
            <Text style={S.declText}>This document is digitally verified through Jaladhaara's platform. Scan the QR code on Page 1 to verify the authenticity of this report online at jaladhaara.in/verify.</Text>
          </View>
        </View>

        {/* ── QA / Advisory Cards ──────────────────────── */}
        <View style={S.qaRow}>
          <View style={S.qaCard}>
            <Text style={S.qaTitle}>Post-Drilling Advisory</Text>
            <Text style={S.qaText}>Conduct a water yield test after drilling. Log depth, discharge rate, and recovery time for future reference.</Text>
          </View>
          <View style={S.qaCardAmber}>
            <Text style={S.qaTitleAmber}>Seasonal Variation</Text>
            <Text style={S.qaText}>Groundwater levels may fluctuate seasonally. Re-testing is recommended if yield drops below expected levels post-monsoon.</Text>
          </View>
          <View style={S.qaCardGreen}>
            <Text style={S.qaTitleGreen}>Water Quality</Text>
            <Text style={S.qaText}>Always conduct a water quality test before use. A TDS, pH, and bacterial analysis is recommended before potable consumption.</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default SurveyReportPDF;
