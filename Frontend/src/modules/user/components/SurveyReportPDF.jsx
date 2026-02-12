import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Standard fonts
// Standard fonts with explicit weights and styles
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
  page: {
    padding: 40,
    fontFamily: 'Open Sans',
    fontSize: 10,
    color: '#333',
  },
  header: {
    borderBottom: '2pt solid #1A80E5',
    paddingBottom: 10,
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 24,
    color: '#1A80E5',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 8,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  meta: {
    textAlign: 'right',
  },
  bookingId: {
    fontSize: 8,
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '2 4',
    borderRadius: 2,
    marginBottom: 4,
  },
  date: {
    fontSize: 8,
    color: '#666',
  },
  summaryRibbon: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  summarySuccess: {
    backgroundColor: '#ecfdf5',
    border: '1pt solid #d1fae5',
  },
  summaryFailure: {
    backgroundColor: '#fef2f2',
    border: '1pt solid #fee2e2',
  },
  statusLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#666',
    fontWeight: 700,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 700,
  },
  textSuccess: { color: '#047857' },
  textFailure: { color: '#b91c1c' },

  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    borderBottom: '1pt solid #f3f4f6',
    paddingBottom: 5,
    marginBottom: 10,
    color: '#1A80E5',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 10,
    paddingRight: 10,
  },
  label: {
    fontSize: 7,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 700,
  },

  analysisBox: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },

  recommendationGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  recommendationItem: {
    width: '30%',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    border: '1pt solid #f3f4f6',
  },
  recValue: {
    fontSize: 16,
    color: '#1A80E5',
    fontWeight: 700,
  },

  observationBox: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 5,
    fontStyle: 'italic',
    fontSize: 9,
    color: '#4b5563',
  },

  footer: {
    marginTop: 30,
    borderTop: '1pt solid #f3f4f6',
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: 150,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: 700,
    fontStyle: 'italic',
    color: '#1f2937',
  },
  signatureMeta: {
    fontSize: 7,
    color: '#666',
  },
  disclaimer: {
    marginTop: 30,
    fontSize: 6,
    color: '#999',
    textAlign: 'center',
  },
  imageSection: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  image: {
    width: '30%',
    aspectRatio: 1.5,
    borderRadius: 5,
  }
});

const SurveyReportPDF = ({ booking }) => {
  if (!booking || !booking.report) return null;

  const { report, vendor, user } = booking;
  const isSuccess = report.waterFound === "true" || report.waterFound === true;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Prominent Status */}
        <View style={{
          backgroundColor: isSuccess ? '#10b981' : '#ef4444',
          padding: 10,
          borderRadius: 5,
          marginBottom: 15,
          textAlign: 'center'
        }}>
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            {isSuccess ? "✓ Water Found - Positive Result" : "✕ Water Not Found - Negative Result"}
          </Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Jaladhaara</Text>
            <Text style={styles.subtitle}>Ground Water Detection Report</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.bookingId}>ID: {booking._id.toUpperCase()}</Text>
            <Text style={styles.date}>Date: {new Date(booking.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Summary Ribbon */}
        <View style={[styles.summaryRibbon, isSuccess ? styles.summarySuccess : styles.summaryFailure]}>
          <View>
            <Text style={styles.statusLabel}>Survival Status</Text>
            <Text style={[styles.statusText, isSuccess ? styles.textSuccess : styles.textFailure]}>
              {isSuccess ? "POTENTIAL SOURCE LOCATED" : "NO WATER SOURCE DETECTED"}
            </Text>
          </View>
        </View>

        {/* Site Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & Site Information</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Client Name</Text>
              <Text style={styles.value}>{report.customerName || user?.name}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Site Address</Text>
              <Text style={styles.value}>{report.village}, {report.mandal}, {report.district}, {report.state}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Survey Number</Text>
              <Text style={styles.value}>{report.surveyNumber || "N/A"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Land Extent</Text>
              <Text style={styles.value}>{report.extent || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Geological Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geological Analysis</Text>
          <View style={styles.analysisBox}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Rock Formation</Text>
                <Text style={styles.value}>{report.rockType || "Not Specified"}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Surface Soil Type</Text>
                <Text style={styles.value}>{report.soilType || "Not Specified"}</Text>
              </View>
            </View>
            <View style={{ marginTop: 5 }}>
              <Text style={styles.label}>Historical Context</Text>
              <Text style={{ fontSize: 8 }}>{report.existingBorewellDetails || "No existing borewell data provided."}</Text>
            </View>
          </View>
        </View>

        {/* Technical Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Recommendations</Text>
          <View style={styles.recommendationGrid}>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Rec. Point</Text>
              <Text style={styles.recValue}>#{report.recommendedPointNumber || "1"}</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Expected Depth</Text>
              <Text style={styles.recValue}>{report.recommendedDepth || "--"} ft</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.label}>Casing Depth</Text>
              <Text style={styles.recValue}>{report.recommendedCasingDepth || "--"} ft</Text>
            </View>
          </View>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Estimated Yield</Text>
              <Text style={styles.value}>{report.expectedYield || "--"} Inches</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Target Fracture Depths</Text>
              <Text style={styles.value}>{report.expectedFractureDepths || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Expert Observations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expert Observations</Text>
          <View style={styles.observationBox}>
            <Text>"{report.notes || "No additional specific observations noted for this location."}"</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signatureLine}>
            <Text style={styles.label}>Reported by (Vendor)</Text>
            <Text style={styles.signatureName}>{vendor?.name}</Text>
            <Text style={styles.signatureMeta}>{vendor?.experience} Years Experience • Expert ID: {vendor?._id?.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={{ textAlign: 'center' }}>
            <View style={{ width: 40, height: 40, border: '1pt dashed #ccc', marginBottom: 2, alignSelf: 'center' }} />
            <Text style={styles.label}>JalaDhar Verified</Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text>Disclaimer: This survey report is based on technical readings and geological analysis at the time of visit. Actual results may vary during drilling.</Text>
          <Text>© {new Date().getFullYear()} Jaladhaara Water Resources Management. All rights reserved.</Text>
        </View>
      </Page>

      {/* Images Page if exists */}
      {report.images && report.images.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Site Evidence Photos</Text>
          <View style={styles.imageSection}>
            {report.images.map((img, i) => (
              <Image
                key={i}
                src={img.url || img}
                style={styles.image}
              />
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
};

export default SurveyReportPDF;
