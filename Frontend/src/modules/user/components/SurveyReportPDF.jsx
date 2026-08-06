import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Standard fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-italic.ttf', fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700italic.ttf', fontWeight: 700, fontStyle: 'italic' },
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Open Sans', fontSize: 10, color: '#333' },
  header: { borderBottom: '2pt solid #102353', paddingBottom: 10, marginBottom: 20, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleGroup: { flex: 1 },
  title: { fontSize: 24, color: '#102353', fontWeight: 700 },
  subtitle: { fontSize: 8, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  metaGroup: { textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  bookingId: { fontSize: 9, backgroundColor: '#eff6ff', color: '#102353', padding: '3 6', borderRadius: 4, fontWeight: 700 },
  date: { fontSize: 8, color: '#666' },
  qrCode: { width: 50, height: 50, marginTop: 5 },
  
  summaryRibbon: { padding: 15, borderRadius: 8, marginBottom: 20, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  summarySuccess: { backgroundColor: '#ecfdf5', border: '1pt solid #d1fae5' },
  summaryFailure: { backgroundColor: '#fef2f2', border: '1pt solid #fee2e2' },
  statusLabel: { fontSize: 7, textTransform: 'uppercase', fontWeight: 700, textAlign: 'center', marginBottom: 2 },
  statusText: { fontSize: 16, fontWeight: 700, textAlign: 'center' },
  textSuccess: { color: '#065f46' },
  textFailure: { color: '#991b1b' },

  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 700, borderBottom: '1pt solid #f3f4f6', paddingBottom: 5, marginBottom: 10, color: '#102353' },
  
  grid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F9FAFB', border: '1pt solid #f3f4f6', borderRadius: 8, padding: 10 },
  gridItem: { width: '50%', marginBottom: 10, paddingRight: 10 },
  gridItemFull: { width: '100%', marginBottom: 10 },
  label: { fontSize: 7, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 },
  value: { fontSize: 10, color: '#111827', fontWeight: 700 },

  observationBox: { backgroundColor: '#fff', border: '1pt solid #e5e7eb', padding: 8, borderRadius: 4, fontStyle: 'italic', fontSize: 9, color: '#374151', marginTop: 5 },

  recommendationGrid: { display: 'flex', flexDirection: 'row', gap: 5, marginBottom: 10 },
  recommendationItem: { flex: 1, backgroundColor: '#f9fafb', padding: 8, borderRadius: 6, textAlign: 'center', border: '1pt solid #f3f4f6' },
  recValue: { fontSize: 14, color: '#0A84FF', fontWeight: 700, marginTop: 2 },
  
  fractureBox: { backgroundColor: '#f5f3ff', padding: 10, borderRadius: 6, border: '1pt solid #ede9fe' },
  fractureItem: { fontSize: 11, fontWeight: 700, color: '#5b21b6', marginBottom: 3 },
  
  instructionBox: { backgroundColor: '#fff7ed', padding: 10, borderRadius: 6, border: '1pt solid #ffedd5' },
  instructionText: { fontSize: 10, fontWeight: 700, color: '#9a3412', marginBottom: 4 },
  
  expertSection: { marginTop: 20, backgroundColor: '#F8FAFC', border: '1pt solid #E2E8F0', borderRadius: 8, padding: 15, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  expertDetails: { flex: 1 },
  expertName: { fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 },
  expertMeta: { fontSize: 9, color: '#4b5563', marginBottom: 2 },
  signatureBox: { width: 120, display: 'flex', alignItems: 'center' },
  signatureText: { fontFamily: 'Open Sans', fontStyle: 'italic', fontSize: 18, color: '#1e3a8a', borderBottom: '1pt solid #bfdbfe', width: '100%', textAlign: 'center', paddingBottom: 5, marginBottom: 5 },
  verifiedBadge: { fontSize: 8, fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', padding: '2 6', borderRadius: 4 },

  actionSection: { marginTop: 15, backgroundColor: '#0A84FF', color: '#fff', padding: 15, borderRadius: 8 },
  actionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  actionItem: { fontSize: 9, marginBottom: 4 },

  disclaimer: { marginTop: 25, fontSize: 7, color: '#9ca3af', textAlign: 'justify', lineHeight: 1.4 },
  
  imageSection: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  imageWrapper: { width: '31%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  image: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, border: '1pt solid #e5e7eb' },
  imageLabel: { fontSize: 7, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 },
  
  mapImage: { width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, border: '1pt solid #e5e7eb' }
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

  const fractureDepths = report.expectedFractureDepths ? report.expectedFractureDepths.split(',').map(s => s.trim()) : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header 1 */}
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>Jaladhaara</Text>
            <Text style={styles.subtitle}>Digital Survey Report</Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={styles.bookingId}>Report ID: {booking._id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.date}>Issued: {formatDate(booking.createdAt)}</Text>
            <Text style={styles.date}>Status: Verified ✓</Text>
          </View>
          <View style={{ marginLeft: 15 }}>
            <Image src={qrUrl} style={styles.qrCode} />
          </View>
        </View>

        {/* 2. Survey Outcome */}
        <View style={[styles.summaryRibbon, isSuccess ? styles.summarySuccess : styles.summaryFailure]}>
          <View>
            <Text style={[styles.statusLabel, isSuccess ? styles.textSuccess : styles.textFailure]}>Official Survey Outcome</Text>
            <Text style={[styles.statusText, isSuccess ? styles.textSuccess : styles.textFailure]}>
              {isSuccess ? "Recommended Borewell Location Identified" : "No Suitable Groundwater Potential Identified"}
            </Text>
          </View>
        </View>

        {/* 3. Client & Site Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & Site Details</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Client Name</Text>
              <Text style={styles.value}>{report.customerName || user?.name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Booking ID</Text>
              <Text style={styles.value}>{booking._id.toUpperCase()}</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>Site Address</Text>
              <Text style={styles.value}>{[report.village, report.mandal, report.district, report.state].filter(Boolean).join(', ')}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Survey No.</Text>
              <Text style={styles.value}>{report.surveyNumber || "N/A"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Extent</Text>
              <Text style={styles.value}>{report.extent || "N/A"}</Text>
            </View>
            {report.surveyRecommendations?.latitude && (
              <View style={styles.gridItemFull}>
                <Text style={styles.label}>GPS Coordinates</Text>
                <Text style={[styles.value, { color: '#0A84FF' }]}>{report.surveyRecommendations.latitude}, {report.surveyRecommendations.longitude}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Geological Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geological Profile</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Rock Formation</Text>
              <Text style={styles.value}>{report.geologicalInfo?.rockType || "-"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Surface Soil</Text>
              <Text style={styles.value}>{report.geologicalInfo?.soilType || "-"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Terrain Type</Text>
              <Text style={styles.value}>{report.geologicalInfo?.terrainType || "-"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Weathered Zone (ft)</Text>
              <Text style={styles.value}>{report.geologicalInfo?.weatheredZone || "-"}</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>Nearby Borewell Observations</Text>
              <Text style={styles.observationBox}>"{report.existingBorewellDetails || "No existing borewell observations provided."}"</Text>
            </View>
          </View>
        </View>

        {/* 5. Technical Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Recommendations</Text>
          <View style={styles.recommendationGrid}>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Rec. Point No.</Text>
              <Text style={styles.recValue}>#{report.surveyRecommendations?.recommendedPointNumber || "1"}</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Expected Yield</Text>
              <Text style={styles.recValue}>{report.surveyRecommendations?.expectedYield || "--"} in</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Rec. Depth</Text>
              <Text style={styles.recValue}>{report.surveyRecommendations?.recommendedBoreDepth || "--"} ft</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Casing Length</Text>
              <Text style={styles.recValue}>{report.surveyRecommendations?.recommendedCasingDepth || "--"} ft</Text>
            </View>
          </View>
          
          <View style={styles.fractureBox}>
             <Text style={[styles.label, { color: '#6b21a8' }]}>Expected Water-Bearing Fracture Zones</Text>
             {fractureDepths.length > 0 ? fractureDepths.map((depth, idx) => (
                <Text key={idx} style={styles.fractureItem}>• {depth.includes('ft') ? depth : `${depth} ft`}</Text>
             )) : (
                <Text style={styles.fractureItem}>To be determined during drilling</Text>
             )}
          </View>
        </View>

        {/* 6. Drilling Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drilling Instructions</Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>• Stop drilling after {report.drillingInstructions?.stopDrillingDepth || "___"} ft if no fracture is encountered.</Text>
            {report.drillingInstructions?.flushBorewell && (
              <Text style={styles.instructionText}>• Flush borewell before yield testing (Recommended).</Text>
            )}
          </View>
        </View>

      </Page>
      
      <Page size="A4" style={styles.page}>
        
        {/* 7. Professional Remarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Remarks</Text>
          <Text style={styles.observationBox}>"{report.notes || "No additional specific remarks noted for this location."}"</Text>
        </View>

        {/* 10. Survey Location Map */}
        {report.surveyRecommendations?.latitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Survey Location Map</Text>
            <Image src={staticMapUrl} style={styles.mapImage} />
          </View>
        )}

        {/* 9. Site Evidence */}
        {report.images && report.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Site Evidence</Text>
            <View style={styles.imageSection}>
              {report.images.map((img, i) => {
                const label = i === 0 ? "Site Photograph" : i === 1 ? "Marked Borewell Point" : i === 2 ? "Survey Equipment" : `Evidence ${i+1}`;
                return (
                  <View key={i} style={styles.imageWrapper}>
                    <Image src={img.url || img} style={styles.image} />
                    <Text style={styles.imageLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 8. Expert Verification */}
        <View style={styles.expertSection}>
          <View style={styles.expertDetails}>
             <Text style={styles.label}>Survey Conducted By</Text>
             <Text style={styles.expertName}>{vendor.name}</Text>
             <Text style={styles.expertMeta}>Qualification: {vendor.qualification || "Hydrogeologist"}</Text>
             <Text style={styles.expertMeta}>Experience: {vendor.experience || "-"} Years</Text>
             <Text style={styles.expertMeta}>Expert ID: {vendor._id?.slice(-8).toUpperCase()}</Text>
             <Text style={styles.expertMeta}>Survey Date: {formatDate(booking.createdAt)}</Text>
          </View>
          <View style={styles.signatureBox}>
             <Text style={styles.signatureText}>{vendor.name}</Text>
             <Text style={styles.label}>Digital Signature</Text>
             <View style={{ marginTop: 5 }}><Text style={styles.verifiedBadge}>✓ Verified by Jaladhaara</Text></View>
          </View>
        </View>

        {/* 11. Customer Action Section */}
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Next Steps for Customer</Text>
          <Text style={styles.actionItem}>1. Share this report with your drilling contractor.</Text>
          <Text style={styles.actionItem}>2. Drill at the recommended point.</Text>
          <Text style={styles.actionItem}>3. Complete drilling as per the recommended depth.</Text>
          <Text style={styles.actionItem}>4. Update the drilling outcome in the Jaladhaara app.</Text>
        </View>

        {/* 13. Disclaimer */}
        <Text style={styles.disclaimer}>
          Disclaimer: This report is based on geophysical survey data, geological interpretation, and field observations conducted on the survey date. Groundwater occurrence is a natural phenomenon and cannot be guaranteed. Actual drilling results may vary due to local geological conditions, drilling practices, seasonal groundwater fluctuations, and other subsurface factors. Jaladhaara acts only as a technology platform connecting customers with independent survey experts and is not responsible for drilling outcomes.
        </Text>

      </Page>
    </Document>
  );
};

export default SurveyReportPDF;
