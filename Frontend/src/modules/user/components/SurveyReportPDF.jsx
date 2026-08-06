import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Standard fonts
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

const styles = StyleSheet.create({
  page: { padding: '40 40 60 40', fontFamily: 'Open Sans', fontSize: 10, color: '#333', backgroundColor: '#FFFFFF' },
  
  // Header
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2pt solid #0A192F', paddingBottom: 15, marginBottom: 20 },
  headerLeft: { flex: 1 },
  logoText: { fontSize: 24, color: '#0A192F', fontWeight: 700, letterSpacing: -0.5 },
  reportType: { fontSize: 9, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4, fontWeight: 700 },
  headerRight: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 15 },
  metaBox: { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 },
  metaLabel: { fontSize: 7, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 },
  metaValue: { fontSize: 9, color: '#111827', fontWeight: 700 },
  qrCode: { width: 50, height: 50 },

  // Outcome Banner
  banner: { width: '100%', padding: 12, borderRadius: 4, marginBottom: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  bannerSuccess: { backgroundColor: '#ECFDF5', border: '1pt solid #A7F3D0' },
  bannerFailure: { backgroundColor: '#FEF2F2', border: '1pt solid #FECACA' },
  bannerLabel: { fontSize: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 4 },
  bannerText: { fontSize: 16, fontWeight: 700 },
  textSuccess: { color: '#065F46' },
  textFailure: { color: '#991B1B' },

  // Sections
  section: { marginBottom: 25 },
  sectionHeader: { display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: '1pt solid #0A192F', paddingBottom: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#0A192F', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Tables
  table: { width: '100%', border: '1pt solid #E5E7EB', borderRadius: 4 },
  tableRow: { display: 'flex', flexDirection: 'row', borderBottom: '1pt solid #E5E7EB', minHeight: 24, alignItems: 'center' },
  tableRowLast: { borderBottom: 'none' },
  tableColLabel: { width: '35%', backgroundColor: '#F9FAFB', padding: '6 10', borderRight: '1pt solid #E5E7EB' },
  tableColValue: { width: '65%', padding: '6 10' },
  tableColLabelSplit: { width: '25%', backgroundColor: '#F9FAFB', padding: '6 10', borderRight: '1pt solid #E5E7EB' },
  tableColValueSplit: { width: '25%', padding: '6 10', borderRight: '1pt solid #E5E7EB' },
  tableColValueSplitLast: { width: '25%', padding: '6 10' },
  label: { fontSize: 8, color: '#4B5563', textTransform: 'uppercase', fontWeight: 700 },
  value: { fontSize: 9, color: '#111827', fontWeight: 600 },
  valueHighlight: { fontSize: 9, color: '#0A84FF', fontWeight: 700 },

  // Quotes / Observations
  quoteBox: { backgroundColor: '#F9FAFB', borderLeft: '3pt solid #D1D5DB', padding: 10, marginTop: 5 },
  quoteText: { fontStyle: 'italic', fontSize: 9, color: '#374151', lineHeight: 1.4 },

  // Technical Recommendations
  techMetricsRow: { display: 'flex', flexDirection: 'row', backgroundColor: '#0A192F', borderRadius: 6, color: '#FFFFFF', padding: 12, marginBottom: 10, justifyContent: 'space-between' },
  techMetric: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1pt solid #1E3A8A' },
  techMetricLast: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  techLabel: { fontSize: 7, textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 },
  techValue: { fontSize: 16, fontWeight: 700, color: '#FFFFFF' },
  techUnit: { fontSize: 9, color: '#9CA3AF', fontWeight: 600 },
  
  fractureZone: { display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', border: '1pt solid #BFDBFE', borderRadius: 4, padding: '8 12', gap: 10 },
  fractureLabel: { fontSize: 8, textTransform: 'uppercase', fontWeight: 700, color: '#1E40AF', width: '35%' },
  fractureValues: { fontSize: 10, fontWeight: 700, color: '#1E3A8A', width: '65%' },

  // Drilling Instructions
  alertBox: { backgroundColor: '#FFFBEB', border: '1pt solid #FDE68A', borderLeft: '4pt solid #F59E0B', padding: 12, borderRadius: 4 },
  alertItem: { fontSize: 9, color: '#92400E', fontWeight: 600, marginBottom: 4, lineHeight: 1.4 },

  // Images
  imageGrid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageCard: { width: '31%', display: 'flex', flexDirection: 'column' },
  imageFrame: { width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, border: '1pt solid #E5E7EB', marginBottom: 4 },
  imageCaption: { fontSize: 7, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' },
  
  mapFrame: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 4, border: '1pt solid #E5E7EB' },

  // Signature Block
  signatureGrid: { display: 'flex', flexDirection: 'row', border: '1pt solid #E5E7EB', borderRadius: 4 },
  sigLeft: { width: '60%', padding: 15, borderRight: '1pt solid #E5E7EB', backgroundColor: '#F9FAFB' },
  sigRight: { width: '40%', padding: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  sigRow: { display: 'flex', flexDirection: 'row', marginBottom: 4 },
  sigLabel: { width: '40%', fontSize: 8, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' },
  sigVal: { width: '60%', fontSize: 9, color: '#111827', fontWeight: 600 },
  sigLine: { borderBottom: '1pt solid #111827', width: '80%', height: 30, marginBottom: 5 },
  sigText: { fontFamily: 'Open Sans', fontStyle: 'italic', fontSize: 14, color: '#1E3A8A', textAlign: 'center', marginTop: -20, marginBottom: 10 },
  stamp: { backgroundColor: '#ECFDF5', border: '1pt solid #059669', color: '#047857', fontSize: 7, fontWeight: 700, padding: '3 8', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Footer
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, display: 'flex', flexDirection: 'column', borderTop: '1pt solid #E5E7EB', paddingTop: 10 },
  disclaimer: { fontSize: 6, color: '#9CA3AF', textAlign: 'justify', lineHeight: 1.4, marginBottom: 5 },
  footerBottom: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  footerBrand: { fontSize: 8, color: '#0A192F', fontWeight: 700 },
  pageNumber: { fontSize: 8, color: '#6B7280', fontWeight: 600 }
});

const SurveyReportPDF = ({ booking }) => {
  if (!booking || !booking.report) return null;

  const { report, vendor, user } = booking;
  const isSuccess = report.waterFound === "true" || report.waterFound === true;
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const mapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const staticMapUrl = mapApiKey && report.surveyRecommendations?.latitude && report.surveyRecommendations?.longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${report.surveyRecommendations.latitude},${report.surveyRecommendations.longitude}&zoom=15&size=600x300&maptype=satellite&markers=color:red%7Clabel:B%7C${report.surveyRecommendations.latitude},${report.surveyRecommendations.longitude}&key=${mapApiKey}`
    : `https://static-maps.yandex.ru/1.x/?ll=${report.surveyRecommendations?.longitude || 0},${report.surveyRecommendations?.latitude || 0}&size=600,300&z=15&l=sat,skl&pt=${report.surveyRecommendations?.longitude || 0},${report.surveyRecommendations?.latitude || 0},pm2rdl`;
    
  const qrData = `https://jaladhaara.in/verify/${booking._id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const fractureDepths = report.expectedFractureDepths ? report.expectedFractureDepths.split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : [];
  const fractureText = fractureDepths.length > 0 
    ? fractureDepths.map(d => d.includes('ft') ? d : `${d} ft`).join(', ')
    : 'To be determined during drilling';

  const address = [report.village, report.mandal, report.district, report.state].filter(Boolean).join(', ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>Jaladhaara</Text>
            <Text style={styles.reportType}>Official Survey Report</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Report ID</Text>
              <Text style={styles.metaValue}>{booking._id.slice(-8).toUpperCase()}</Text>
              <Text style={[styles.metaLabel, { marginTop: 4 }]}>Date Issued</Text>
              <Text style={styles.metaValue}>{formatDate(booking.createdAt)}</Text>
            </View>
            <Image src={qrUrl} style={styles.qrCode} />
          </View>
        </View>

        {/* Outcome Banner */}
        <View style={[styles.banner, isSuccess ? styles.bannerSuccess : styles.bannerFailure]}>
          <Text style={[styles.bannerLabel, isSuccess ? styles.textSuccess : styles.textFailure]}>Official Survey Outcome</Text>
          <Text style={[styles.bannerText, isSuccess ? styles.textSuccess : styles.textFailure]}>
            {isSuccess ? "Recommended Borewell Location Identified" : "No Suitable Groundwater Potential Identified"}
          </Text>
        </View>

        {/* Client & Site Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Client & Site Details</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLabel}><Text style={styles.label}>Client Name</Text></Text>
              <Text style={styles.tableColValue}><Text style={styles.value}>{report.customerName || user?.name}</Text></Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLabel}><Text style={styles.label}>Booking Ref.</Text></Text>
              <Text style={styles.tableColValue}><Text style={styles.value}>{booking._id.toUpperCase()}</Text></Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLabel}><Text style={styles.label}>Site Address</Text></Text>
              <Text style={styles.tableColValue}><Text style={styles.value}>{address || "N/A"}</Text></Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLabelSplit}><Text style={styles.label}>Survey No.</Text></Text>
              <Text style={styles.tableColValueSplit}><Text style={styles.value}>{report.surveyNumber || "N/A"}</Text></Text>
              <Text style={styles.tableColLabelSplit}><Text style={styles.label}>Extent</Text></Text>
              <Text style={styles.tableColValueSplitLast}><Text style={styles.value}>{report.extent || "N/A"}</Text></Text>
            </View>
            {report.surveyRecommendations?.latitude && (
              <View style={[styles.tableRow, styles.tableRowLast]}>
                <Text style={styles.tableColLabel}><Text style={styles.label}>GPS Coordinates</Text></Text>
                <Text style={styles.tableColValue}><Text style={styles.valueHighlight}>{report.surveyRecommendations.latitude}, {report.surveyRecommendations.longitude}</Text></Text>
              </View>
            )}
          </View>
        </View>

        {/* Geological Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Geological Profile</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLabelSplit}><Text style={styles.label}>Rock Formation</Text></Text>
              <Text style={styles.tableColValueSplit}><Text style={styles.value}>{report.geologicalInfo?.rockType || "-"}</Text></Text>
              <Text style={styles.tableColLabelSplit}><Text style={styles.label}>Surface Soil</Text></Text>
              <Text style={styles.tableColValueSplitLast}><Text style={styles.value}>{report.geologicalInfo?.soilType || "-"}</Text></Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowLast]}>
              <Text style={styles.tableColLabelSplit}><Text style={styles.label}>Terrain Type</Text></Text>
              <Text style={styles.tableColValueSplit}><Text style={styles.value}>{report.geologicalInfo?.terrainType || "-"}</Text></Text>
              <Text style={styles.tableColLabelSplit}><Text style={styles.label}>Weathered Zone</Text></Text>
              <Text style={styles.tableColValueSplitLast}><Text style={styles.value}>{report.geologicalInfo?.weatheredZone || "-"}</Text></Text>
            </View>
          </View>
          {report.existingBorewellDetails && (
            <View style={styles.quoteBox}>
              <Text style={styles.label}>Nearby Borewell Observations</Text>
              <Text style={styles.quoteText}>"{report.existingBorewellDetails}"</Text>
            </View>
          )}
        </View>

        {/* Technical Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Technical Recommendations</Text>
          </View>
          <View style={styles.techMetricsRow}>
            <View style={styles.techMetric}>
              <Text style={styles.techLabel}>Rec. Point</Text>
              <Text style={styles.techValue}>#{report.surveyRecommendations?.recommendedPointNumber || "1"}</Text>
            </View>
            <View style={styles.techMetric}>
              <Text style={styles.techLabel}>Exp. Yield</Text>
              <Text style={styles.techValue}>{report.surveyRecommendations?.expectedYield || "--"} <Text style={styles.techUnit}>in</Text></Text>
            </View>
            <View style={styles.techMetric}>
              <Text style={styles.techLabel}>Bore Depth</Text>
              <Text style={styles.techValue}>{report.surveyRecommendations?.recommendedBoreDepth || "--"} <Text style={styles.techUnit}>ft</Text></Text>
            </View>
            <View style={styles.techMetricLast}>
              <Text style={styles.techLabel}>Casing Len.</Text>
              <Text style={styles.techValue}>{report.surveyRecommendations?.recommendedCasingDepth || "--"} <Text style={styles.techUnit}>ft</Text></Text>
            </View>
          </View>
          
          <View style={styles.fractureZone}>
             <Text style={styles.fractureLabel}>Exp. Fracture Zones</Text>
             <Text style={styles.fractureValues}>{fractureText}</Text>
          </View>
        </View>

        {/* Drilling Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Drilling Instructions & Remarks</Text>
          </View>
          <View style={styles.alertBox}>
            <Text style={styles.alertItem}>• Stop drilling after {report.drillingInstructions?.stopDrillingDepth || "___"} ft if no fracture is encountered.</Text>
            {report.drillingInstructions?.flushBorewell && (
              <Text style={styles.alertItem}>• Flush borewell thoroughly before yield testing (Recommended).</Text>
            )}
            {report.notes && (
              <Text style={[styles.alertItem, { marginTop: 4, color: '#374151' }]}>• Remarks: {report.notes}</Text>
            )}
          </View>
        </View>

        {/* Footer (Rendered on every page automatically) */}
        <View style={styles.footer} fixed>
          <Text style={styles.disclaimer}>
            Disclaimer: This report is based on geophysical survey data, geological interpretation, and field observations conducted on the survey date. Groundwater occurrence is a natural phenomenon and cannot be guaranteed. Actual drilling results may vary due to local geological conditions, drilling practices, seasonal groundwater fluctuations, and other subsurface factors. Jaladhaara acts only as a technology platform connecting customers with independent survey experts and is not responsible for drilling outcomes.
          </Text>
          <View style={styles.footerBottom}>
            <Text style={styles.footerBrand}>Jaladhaara Digital Survey</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} />
          </View>
        </View>



        {/* Site Evidence Map */}
        {report.surveyRecommendations?.latitude && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>5. Survey Location Context</Text>
            </View>
            <Image src={staticMapUrl} style={styles.mapFrame} />
          </View>
        )}

        {/* Site Evidence Images */}
        {report.images && report.images.length > 0 && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>6. Site Evidence</Text>
            </View>
            <View style={styles.imageGrid}>
              {report.images.map((img, i) => {
                const label = i === 0 ? "Site Photograph" : i === 1 ? "Marked Borewell Point" : i === 2 ? "Survey Equipment" : `Evidence ${i+1}`;
                return (
                  <View key={i} style={styles.imageCard}>
                    <Image src={img.url || img} style={styles.imageFrame} />
                    <Text style={styles.imageCaption}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Expert Verification */}
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>7. Expert Verification</Text>
          </View>
          <View style={styles.signatureGrid}>
            <View style={styles.sigLeft}>
               <View style={styles.sigRow}><Text style={styles.sigLabel}>Conducted By</Text><Text style={styles.sigVal}>{vendor.name}</Text></View>
               <View style={styles.sigRow}><Text style={styles.sigLabel}>Qualification</Text><Text style={styles.sigVal}>{vendor.qualification || "Hydrogeologist"}</Text></View>
               <View style={styles.sigRow}><Text style={styles.sigLabel}>Experience</Text><Text style={styles.sigVal}>{vendor.experience || "-"} Years</Text></View>
               <View style={styles.sigRow}><Text style={styles.sigLabel}>Expert ID</Text><Text style={styles.sigVal}>{vendor._id?.slice(-8).toUpperCase()}</Text></View>
               <View style={styles.sigRow}><Text style={styles.sigLabel}>Survey Date</Text><Text style={styles.sigVal}>{formatDate(booking.createdAt)}</Text></View>
            </View>
            <View style={styles.sigRight}>
               <View style={styles.sigLine}></View>
               <Text style={styles.sigText}>{vendor.name}</Text>
               <Text style={styles.stamp}>✓ Verified By Jaladhaara</Text>
            </View>
          </View>
        </View>

        {/* Footer (Rendered on every page automatically) */}
        <View style={styles.footer} fixed>
          <Text style={styles.disclaimer}>
            Disclaimer: This report is based on geophysical survey data, geological interpretation, and field observations conducted on the survey date. Groundwater occurrence is a natural phenomenon and cannot be guaranteed. Actual drilling results may vary due to local geological conditions, drilling practices, seasonal groundwater fluctuations, and other subsurface factors. Jaladhaara acts only as a technology platform connecting customers with independent survey experts and is not responsible for drilling outcomes.
          </Text>
          <View style={styles.footerBottom}>
            <Text style={styles.footerBrand}>Jaladhaara Digital Survey</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} />
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default SurveyReportPDF;
