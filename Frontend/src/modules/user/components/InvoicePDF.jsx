import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0A84FF',
  },
  companyTagline: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginTop: 15,
    color: '#111',
  },
  invoiceMeta: {
    marginTop: 5,
    fontSize: 9,
    color: '#666',
  },
  statusBadge: {
    padding: '4 8',
    borderRadius: 20,
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  statusPaid: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1pt solid #d1fae5',
  },
  statusPartial: {
    backgroundColor: '#fff7ed',
    color: '#d97706',
    border: '1pt solid #ffedd5',
  },
  sellerInfo: {
    textAlign: 'right',
    fontSize: 8,
    color: '#666',
    lineHeight: 1.4,
  },
  billingSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderTop: '1pt solid #eee',
    borderBottom: '1pt solid #eee',
    marginBottom: 30,
  },
  billingColumn: {
    width: '45%',
  },
  columnTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111',
    marginBottom: 4,
  },
  partyDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2pt solid #111',
    paddingBottom: 5,
    marginBottom: 10,
  },
  headerDesc: { width: '75%', fontSize: 8, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase' },
  headerAmount: { width: '25%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottom: '1pt solid #eee',
  },
  rowDesc: { width: '75%' },
  rowTitle: { fontSize: 10, fontWeight: 700, color: '#111' },
  rowSubtitle: { fontSize: 8, color: '#999', marginTop: 2 },
  rowAmount: { width: '25%', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#111' },
  summaryContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  summaryBox: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { color: '#666', fontSize: 9 },
  summaryValue: { fontWeight: 700, color: '#111', fontSize: 9 },
  totalRow: {
    borderTop: '2pt solid #111',
    borderBottom: '2pt solid #111',
    marginVertical: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, fontWeight: 700, color: '#111' },
  totalAmount: { fontSize: 18, fontWeight: 700, color: '#0A84FF' },
  paymentHistory: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  historyTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  historyLabel: { fontSize: 9, color: '#666' },
  historyValue: { fontSize: 9, fontWeight: 700, color: '#059669' },
  balanceRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1pt solid #eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: { fontSize: 9, fontWeight: 700, color: '#111' },
  balanceValue: { fontSize: 9, fontWeight: 700, color: '#d97706' },
  footer: {
    marginTop: 50,
    textAlign: 'center',
  },
  thanks: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#444',
    marginBottom: 5,
  },
  disclaimer: {
    fontSize: 7,
    color: '#999',
  }
});

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const InvoicePDF = ({ booking }) => {
  if (!booking) return null;

  const { user, vendor, service, payment, createdAt } = booking;
  const invoiceDate = payment?.createdAt || createdAt;
  const isFullyPaid = payment?.remainingPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.companyName}>JalaDhar</Text>
            <Text style={styles.companyTagline}>Expert Water Solutions</Text>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMeta}>
              <Text>ID: JD-{booking._id.slice(-8).toUpperCase()}</Text>
              <Text>Date: {new Date(invoiceDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>
          <View>
            <View style={[styles.statusBadge, isFullyPaid ? styles.statusPaid : styles.statusPartial]}>
              <Text>{isFullyPaid ? 'Fully Paid' : 'Partially Paid'}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={{ fontWeight: 700, color: '#111', marginBottom: 2 }}>JalaDhar Tech Pvt Ltd</Text>
              <Text>123, Water Tower Complex,</Text>
              <Text>Near Borewell Circle, Civil Lines,</Text>
              <Text>Raipur, Chhattisgarh - 492001</Text>
              <Text style={{ marginTop: 4, color: '#0A84FF', fontWeight: 700 }}>GSTIN: 22AAAAA0000A1Z5</Text>
            </View>
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.billingSection}>
          <View style={styles.billingColumn}>
            <Text style={styles.columnTitle}>Billed To</Text>
            <Text style={styles.partyName}>{user?.name}</Text>
            <View style={styles.partyDetails}>
              <Text>{user?.phone}</Text>
              <Text>{user?.email}</Text>
              <Text style={{ marginTop: 5 }}>
                {(() => {
                  const a = booking.address;
                  return `${a.street || ''}, ${a.village || ''}, ${a.city || ''}, ${a.district || ''}, ${a.state || ''} - ${a.pincode || ''}`;
                })()}
              </Text>
            </View>
          </View>
          <View style={[styles.billingColumn, { textAlign: 'right' }]}>
            <Text style={styles.columnTitle}>Assigned Expert</Text>
            <Text style={styles.partyName}>{vendor?.name || 'Assigned Expert'}</Text>
            <View style={styles.partyDetails}>
              <Text>Vendor ID: V-{vendor?._id?.slice(-6).toUpperCase() || 'REF-N/A'}</Text>
              <Text>Service: {service?.name}</Text>
              <Text style={{ marginTop: 5 }}>
                Visit Date: {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerDesc}>Description</Text>
            <Text style={styles.headerAmount}>Amount</Text>
          </View>

          {/* Service Fee */}
          <View style={styles.tableRow}>
            <View style={styles.rowDesc}>
              <Text style={styles.rowTitle}>{service?.name}</Text>
              <Text style={styles.rowSubtitle}>Base professional service fee for water detection</Text>
            </View>
            <Text style={styles.rowAmount}>{formatCurrency(payment?.baseServiceFee)}</Text>
          </View>

          {/* Travel Charges */}
          <View style={styles.tableRow}>
            <View style={styles.rowDesc}>
              <Text style={styles.rowTitle}>Travel & Mobilization</Text>
              <Text style={styles.rowSubtitle}>Calculated for {payment?.distance?.toFixed(1)}km round trip</Text>
            </View>
            <Text style={styles.rowAmount}>{formatCurrency(payment?.travelCharges)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency((payment?.baseServiceFee || 0) + (payment?.travelCharges || 0))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (18%)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(payment?.gst)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>{formatCurrency(payment?.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.paymentHistory}>
          <Text style={styles.historyTitle}>Payment History</Text>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Advance Payment (40%)</Text>
            <Text style={styles.historyValue}>-{formatCurrency(payment?.advanceAmount)}</Text>
          </View>
          {isFullyPaid && (
            <View style={styles.historyRow}>
              <Text style={styles.historyLabel}>Remaining Payment (60%)</Text>
              <Text style={styles.historyValue}>-{formatCurrency(payment?.remainingAmount)}</Text>
            </View>
          )}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>BALANCE DUE</Text>
            <Text style={[styles.balanceValue, isFullyPaid && { color: '#999' }]}>
              {formatCurrency(isFullyPaid ? 0 : payment?.remainingAmount)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thanks}>Thank you for your business!</Text>
          <Text style={styles.disclaimer}>This is a computer generated invoice and does not require a physical signature.</Text>
          <Text style={[styles.disclaimer, { marginTop: 2 }]}>© {new Date().getFullYear()} JalaDhar Tech Pvt Ltd. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
