import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
    padding: 35,
    fontFamily: 'Open Sans',
    fontSize: 9,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '1pt solid #e5e7eb',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0A84FF',
    letterSpacing: 0.5,
  },
  companyTagline: {
    fontSize: 7,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  taxTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginTop: 10,
    backgroundColor: '#eff6ff',
    padding: '3 6',
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  invoiceMeta: {
    marginTop: 8,
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  statusBadge: {
    padding: '4 10',
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  statusPaid: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1pt solid #a7f3d0',
  },
  statusPartial: {
    backgroundColor: '#fff7ed',
    color: '#d97706',
    border: '1pt solid #fed7aa',
  },
  sellerInfo: {
    textAlign: 'right',
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  billingSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1pt solid #f3f4f6',
    marginBottom: 20,
  },
  billingColumn: {
    width: '48%',
  },
  columnTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 3,
  },
  partyDetails: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1.5pt solid #111827',
    paddingBottom: 6,
    marginBottom: 8,
  },
  headerDesc: { width: '50%', fontSize: 8, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase' },
  headerQty: { width: '10%', textCenter: 'center', fontSize: 8, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase', textAlign: 'center' },
  headerUnitPrice: { width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase' },
  headerAmount: { width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: '1pt solid #f3f4f6',
    alignItems: 'center',
  },
  rowDesc: { width: '50%' },
  rowQty: { width: '10%', textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#111827' },
  rowUnitPrice: { width: '20%', textAlign: 'right', fontSize: 9, color: '#374151' },
  rowTitle: { fontSize: 9, fontWeight: 700, color: '#111827' },
  rowSubtitle: { fontSize: 7.5, color: '#6b7280', marginTop: 2 },
  rowAmount: { width: '20%', textAlign: 'right', fontSize: 9, fontWeight: 700, color: '#111827' },
  summaryContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  summaryBox: {
    width: '45%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: { color: '#6b7280', fontSize: 8 },
  summaryValue: { fontWeight: 700, color: '#111827', fontSize: 8 },
  totalRow: {
    borderTop: '1.5pt solid #111827',
    borderBottom: '1.5pt solid #111827',
    marginVertical: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 10, fontWeight: 700, color: '#111827' },
  totalAmount: { fontSize: 14, fontWeight: 700, color: '#0A84FF' },
  paymentHistory: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1pt solid #f3f4f6',
    marginBottom: 25,
  },
  historyTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyLabel: { fontSize: 8, color: '#4b5563' },
  historyValue: { fontSize: 8, fontWeight: 700, color: '#059669' },
  balanceRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1pt solid #e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: { fontSize: 8, fontWeight: 700, color: '#111827' },
  balanceValue: { fontSize: 8, fontWeight: 700, color: '#dc2626' },
  footer: {
    paddingTop: 15,
    borderTop: '1pt solid #f3f4f6',
    textAlign: 'center',
  },
  thanks: {
    fontSize: 9,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 3,
  },
  disclaimer: {
    fontSize: 7,
    color: '#9ca3af',
    marginBottom: 2,
  },
  supportText: {
    fontSize: 7.5,
    color: '#0A84FF',
    marginTop: 4,
  }
});

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const InvoicePDF = ({ booking, billingInfo }) => {
  if (!booking) return null;

  const { user, vendor, service, payment, createdAt } = booking;
  const invoiceDate = payment?.createdAt || createdAt;
  const isFullyPaid = payment?.remainingPaid;

  const {
    BILLING_COMPANY_NAME = "Jaladhaara Hydrogeological Services Pvt. Ltd.",
    BILLING_ADDRESS = "Plot No. 42, Hitech City Main Road, Madhapur,\nHyderabad, Telangana - 500081, India",
    BILLING_GSTIN = "36AAACJ1234F1Z5",
    BILLING_PAN = "AAACJ1234F",
    BILLING_PHONE = "+91 91234 56789",
    BILLING_EMAIL = "support@jaladhaaraapp.in",
    BILLING_WEBSITE = "https://jaladhaaraapp.in"
  } = billingInfo || {};

  const invoiceNo = `INV-${new Date(invoiceDate).toISOString().slice(0,10).replace(/-/g,'')}-${booking._id.slice(-6).toUpperCase()}`;
  const baseFee = payment?.baseServiceFee || service?.price || 0;
  const travelCharges = payment?.travelCharges || 0;
  const gstTotal = payment?.gst || (baseFee * 0.18);
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const grandTotal = payment?.totalAmount || (baseFee + gstTotal + travelCharges);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.companyName}>JALADHAARA</Text>
            <Text style={styles.companyTagline}>Groundwater & Hydrogeological Services</Text>
            <Text style={styles.taxTitle}>TAX INVOICE / PAYMENT RECEIPT</Text>
            <View style={styles.invoiceMeta}>
              <Text>Invoice No: {invoiceNo}</Text>
              <Text>Order ID: ORD-{booking._id.slice(-8).toUpperCase()}</Text>
              <Text>Date: {new Date(invoiceDate).toLocaleString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
          <View>
            <View style={[styles.statusBadge, isFullyPaid ? styles.statusPaid : styles.statusPartial]}>
              <Text>{isFullyPaid ? 'Paid in Full' : 'Partially Paid (Advance Verified)'}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{BILLING_COMPANY_NAME}</Text>
              {BILLING_ADDRESS.split('\n').map((line, i) => (
                <Text key={i}>{line}</Text>
              ))}
              <Text style={{ marginTop: 4, color: '#0A84FF', fontWeight: 700 }}>GSTIN: {BILLING_GSTIN}</Text>
              <Text style={{ marginTop: 1, fontWeight: 700 }}>PAN: {BILLING_PAN}</Text>
              <Text style={{ marginTop: 1 }}>Ph: {BILLING_PHONE}</Text>
              <Text>Email: {BILLING_EMAIL}</Text>
            </View>
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.billingSection}>
          <View style={styles.billingColumn}>
            <Text style={styles.columnTitle}>Customer Details (Billed To)</Text>
            <Text style={styles.partyName}>{user?.name}</Text>
            <View style={styles.partyDetails}>
              <Text>Ph: {user?.phone}</Text>
              <Text>Email: {user?.email}</Text>
              <Text style={{ marginTop: 4 }}>
                <Text style={{ fontWeight: 700 }}>Survey Address: </Text>
                {(() => {
                  const a = booking.address || {};
                  return `${a.street || ''}, ${a.village || ''}, ${a.city || ''}, ${a.district || ''}, ${a.state || ''} - ${a.pincode || ''}`;
                })()}
              </Text>
            </View>
          </View>

          <View style={styles.billingColumn}>
            <Text style={styles.columnTitle}>Assigned Expert & Service Info</Text>
            <Text style={styles.partyName}>{vendor?.name || 'Assigned Expert'}</Text>
            <View style={styles.partyDetails}>
              <Text>Expert ID: EXP-{vendor?._id?.slice(-6).toUpperCase() || 'REF-N/A'}</Text>
              <Text>Service: {service?.name}</Text>
              <Text>Equipment: {service?.machineType || 'Resistivity / ADMT / PQWT'}</Text>
              <Text style={{ marginTop: 4 }}>
                Survey Date: {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} at {booking.scheduledTime || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerDesc}>Item / Service Description</Text>
            <Text style={styles.headerQty}>Qty</Text>
            <Text style={styles.headerUnitPrice}>Unit Price</Text>
            <Text style={styles.headerAmount}>Total (Rs.)</Text>
          </View>

          {/* Service Fee */}
          <View style={styles.tableRow}>
            <View style={styles.rowDesc}>
              <Text style={styles.rowTitle}>{service?.name}</Text>
              <Text style={styles.rowSubtitle}>Hydrogeological groundwater survey & report ({service?.machineType || 'Standard Machine'})</Text>
            </View>
            <Text style={styles.rowQty}>1</Text>
            <Text style={styles.rowUnitPrice}>{formatCurrency(baseFee)}</Text>
            <Text style={styles.rowAmount}>{formatCurrency(baseFee)}</Text>
          </View>

          {/* Travel Charges */}
          {travelCharges > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.rowDesc}>
                <Text style={styles.rowTitle}>Travel & Mobilization Charges</Text>
                <Text style={styles.rowSubtitle}>Calculated for {payment?.distance?.toFixed(1)} km round trip</Text>
              </View>
              <Text style={styles.rowQty}>1</Text>
              <Text style={styles.rowUnitPrice}>{formatCurrency(travelCharges)}</Text>
              <Text style={styles.rowAmount}>{formatCurrency(travelCharges)}</Text>
            </View>
          )}
        </View>

        {/* Tax & Bill Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Service Fee</Text>
              <Text style={styles.summaryValue}>{formatCurrency(baseFee)}</Text>
            </View>
            {travelCharges > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Travel Charges</Text>
                <Text style={styles.summaryValue}>{formatCurrency(travelCharges)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(baseFee + travelCharges)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CGST (9%)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(cgst)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SGST (9%)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(sgst)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total GST (18%)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(gstTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GRAND TOTAL</Text>
              <Text style={styles.totalAmount}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Receipts & History */}
        <View style={styles.paymentHistory}>
          <Text style={styles.historyTitle}>Payment Receipts & History</Text>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Advance Payment (40%)</Text>
            <Text style={styles.historyValue}>-{formatCurrency(payment?.advanceAmount)}</Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Remaining Payment (60%)</Text>
            <Text style={[styles.historyValue, !isFullyPaid && { color: '#d97706' }]}>
              {isFullyPaid ? `-${formatCurrency(payment?.remainingAmount)}` : formatCurrency(payment?.remainingAmount)}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>BALANCE DUE</Text>
            <Text style={[styles.balanceValue, isFullyPaid && { color: '#9ca3af' }]}>
              {formatCurrency(isFullyPaid ? 0 : payment?.remainingAmount)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thanks}>Thank you for choosing Jaladhaara!</Text>
          <Text style={styles.disclaimer}>This is a system-generated invoice and does not require a physical signature.</Text>
          <Text style={styles.supportText}>Customer Support: {BILLING_EMAIL} | Ph: {BILLING_PHONE} | Website: {BILLING_WEBSITE}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
