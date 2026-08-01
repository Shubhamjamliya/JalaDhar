import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import logoImg from '../../../assets/Header-logoo.png';

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
    padding: 30,
    fontFamily: 'Open Sans',
    fontSize: 8.5,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1pt solid #e5e7eb',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '55%',
  },
  logoImage: {
    width: 145,
    height: 42,
    marginBottom: 4,
    objectFit: 'contain',
  },
  companyTagline: {
    fontSize: 7,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  taxTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginTop: 6,
    backgroundColor: '#eff6ff',
    padding: '3 6',
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  invoiceMeta: {
    marginTop: 6,
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  sellerSection: {
    width: '42%',
    textAlign: 'right',
  },
  statusBadge: {
    padding: '4 8',
    borderRadius: 12,
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    alignSelf: 'flex-end',
    marginBottom: 6,
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
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1pt solid #e2e8f0',
    marginBottom: 16,
  },
  billingColumn: {
    width: '48%',
  },
  columnTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  partyDetails: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.35,
  },
  table: {
    width: '100%',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A84FF',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  headerDesc: { width: '45%', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerSac: { width: '15%', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerQty: { width: '10%', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerUnitPrice: { width: '15%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerAmount: { width: '15%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottom: '1pt solid #f1f5f9',
    alignItems: 'center',
  },
  rowDesc: { width: '45%' },
  rowSac: { width: '15%', textAlign: 'center', fontSize: 8, color: '#374151' },
  rowQty: { width: '10%', textAlign: 'center', fontSize: 8, fontWeight: 700, color: '#111827' },
  rowUnitPrice: { width: '15%', textAlign: 'right', fontSize: 8, color: '#374151' },
  rowTitle: { fontSize: 8.5, fontWeight: 700, color: '#111827' },
  rowSubtitle: { fontSize: 7, color: '#6b7280', marginTop: 1.5 },
  rowAmount: { width: '15%', textAlign: 'right', fontSize: 8.5, fontWeight: 700, color: '#111827' },
  summaryContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    marginBottom: 16,
  },
  summaryBox: {
    width: '48%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  summaryLabel: { color: '#6b7280', fontSize: 8 },
  summaryValue: { fontWeight: 700, color: '#111827', fontSize: 8 },
  totalRow: {
    borderTop: '1.5pt solid #111827',
    borderBottom: '1.5pt solid #111827',
    marginVertical: 4,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 9.5, fontWeight: 700, color: '#111827' },
  totalAmount: { fontSize: 12.5, fontWeight: 700, color: '#0A84FF' },
  wordsRow: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#0A84FF',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 3,
  },
  paymentAuditBox: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1pt solid #e2e8f0',
    marginBottom: 16,
  },
  auditTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#0A84FF',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #cbd5e1',
    paddingBottom: 4,
    marginBottom: 4,
  },
  auditColStage: { width: '25%', fontSize: 7, fontWeight: 700, color: '#64748b' },
  auditColTxn: { width: '30%', fontSize: 7, fontWeight: 700, color: '#64748b' },
  auditColMethod: { width: '18%', fontSize: 7, fontWeight: 700, color: '#64748b' },
  auditColDate: { width: '15%', fontSize: 7, fontWeight: 700, color: '#64748b' },
  auditColAmt: { width: '12%', textAlign: 'right', fontSize: 7, fontWeight: 700, color: '#64748b' },
  auditDataRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    borderBottom: '0.5pt solid #f1f5f9',
    alignItems: 'center',
  },
  auditCellStage: { width: '25%', fontSize: 7.5, fontWeight: 700, color: '#1e293b' },
  auditCellTxn: { width: '30%', fontSize: 7, color: '#334155' },
  auditCellMethod: { width: '18%', fontSize: 7, color: '#475569' },
  auditCellDate: { width: '15%', fontSize: 7, color: '#475569' },
  auditCellAmtPaid: { width: '12%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#059669' },
  auditCellAmtPending: { width: '12%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#d97706' },
  balanceRow: {
    marginTop: 5,
    paddingTop: 4,
    borderTop: '1pt solid #cbd5e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: { fontSize: 8, fontWeight: 700, color: '#0f172a' },
  balanceValue: { fontSize: 8, fontWeight: 700, color: '#dc2626' },
  footer: {
    paddingTop: 10,
    borderTop: '1pt solid #f3f4f6',
    textAlign: 'center',
  },
  thanks: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 2,
  },
  disclaimer: {
    fontSize: 7,
    color: '#9ca3af',
    marginBottom: 2,
  },
  supportText: {
    fontSize: 7,
    color: '#0A84FF',
    marginTop: 2,
  }
});

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const numberToWordsINR = (amount) => {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return "Zero Rupees Only";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  };

  return (inWords(num).trim() + " Rupees Only");
};

const formatFullDateTime = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString("en-IN", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '—';
  }
};

const formatCleanAddress = (a) => {
  if (!a) return 'N/A';
  const parts = [
    a.street,
    a.landmark,
    a.village,
    a.city || a.mandal,
    a.district,
    a.state
  ].filter(p => p && typeof p === 'string' && p.trim() !== '' && p.trim() !== 'null' && p.trim() !== 'undefined');
  const mainStr = parts.join(', ');
  return a.pincode && a.pincode !== '000000' ? `${mainStr} - ${a.pincode}` : mainStr;
};

const InvoicePDF = ({ booking, billingInfo }) => {
  if (!booking) return null;

  const { user, vendor, service, payment, createdAt } = booking;
  const invoiceDate = payment?.createdAt || createdAt;
  const isFullyPaid = payment?.remainingPaid;

  const {
    BILLING_COMPANY_NAME = "Jaladhaara Hydrogeological Services Pvt. Ltd.",
    BILLING_ADDRESS = "123, Water Tower Complex, Near Borewell Circle, Civil Lines, Raipur, Chhattisgarh - 492001",
    BILLING_GSTIN = "22AAAAA0000A1Z5",
    BILLING_PAN = "AAACJ1234F",
    BILLING_PHONE = "+91 98765 43210",
    BILLING_EMAIL = "billing@jaladhar.com",
    BILLING_WEBSITE = "https://jaladhaaraapp.in",
    BILLING_SAC_CODE = "998341",
    BILLING_PLACE_OF_SUPPLY = "Chhattisgarh (State Code: 22)",
    BILLING_DECLARATION = "This is a computer-generated Tax Invoice and does not require a physical signature."
  } = billingInfo || {};

  const invoiceNo = `INV-${new Date(invoiceDate).toISOString().slice(0,10).replace(/-/g,'')}-${booking._id.slice(-6).toUpperCase()}`;
  const baseFee = payment?.baseServiceFee || service?.price || 0;
  const travelCharges = payment?.travelCharges || 0;
  const gstTotal = payment?.gst || (baseFee * 0.18);
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const grandTotal = payment?.totalAmount || (baseFee + gstTotal + travelCharges);

  const advanceTxnId = payment?.advanceRazorpayPaymentId || payment?.advanceTransactionId || `pay_ADV_${booking._id.slice(-6).toUpperCase()}`;
  const remainingTxnId = isFullyPaid
    ? (payment?.remainingRazorpayPaymentId || payment?.remainingTransactionId || `pay_REM_${booking._id.slice(-6).toUpperCase()}`)
    : 'Awaiting Payment';

  const advanceTime = formatFullDateTime(payment?.advancePaidAt || invoiceDate);
  const remainingTime = isFullyPaid ? formatFullDateTime(payment?.remainingPaidAt || new Date()) : 'Pending';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src={logoImg} style={styles.logoImage} />
            <Text style={styles.companyTagline}>Groundwater & Hydrogeological Services</Text>
            <Text style={styles.taxTitle}>TAX INVOICE / PAYMENT RECEIPT</Text>
            <View style={styles.invoiceMeta}>
              <Text>Invoice No: {invoiceNo}</Text>
              <Text>Order ID: ORD-{booking._id.slice(-8).toUpperCase()}</Text>
              <Text>Date: {formatFullDateTime(invoiceDate)}</Text>
              <Text>Place of Supply: {BILLING_PLACE_OF_SUPPLY}</Text>
            </View>
          </View>

          <View style={styles.sellerSection}>
            <View style={[styles.statusBadge, isFullyPaid ? styles.statusPaid : styles.statusPartial]}>
              <Text>{isFullyPaid ? 'Paid in Full' : 'Partially Paid (Advance Verified)'}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{BILLING_COMPANY_NAME}</Text>
              <Text>{BILLING_ADDRESS}</Text>
              <Text style={{ marginTop: 3, color: '#0A84FF', fontWeight: 700 }}>GSTIN: {BILLING_GSTIN}</Text>
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
              <Text style={{ marginTop: 3 }}>
                <Text style={{ fontWeight: 700 }}>Survey Address: </Text>
                {formatCleanAddress(booking.address)}
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
              <Text style={{ marginTop: 3 }}>
                Survey Date: {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} at {booking.scheduledTime || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table with SAC Code */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerDesc}>Item / Service Description</Text>
            <Text style={styles.headerSac}>SAC Code</Text>
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
            <Text style={styles.rowSac}>{BILLING_SAC_CODE}</Text>
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
              <Text style={styles.rowSac}>{BILLING_SAC_CODE}</Text>
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
            <Text style={styles.wordsRow}>
              Amount in Words: {numberToWordsINR(grandTotal)}
            </Text>
          </View>
        </View>

        {/* Payment Receipts & Transaction Audit Trail */}
        <View style={styles.paymentAuditBox}>
          <Text style={styles.auditTitle}>Payment Receipts & Transaction Audit Trail</Text>

          <View style={styles.auditHeaderRow}>
            <Text style={styles.auditColStage}>Payment Stage</Text>
            <Text style={styles.auditColTxn}>Transaction ID</Text>
            <Text style={styles.auditColMethod}>Method</Text>
            <Text style={styles.auditColDate}>Date & Time</Text>
            <Text style={styles.auditColAmt}>Amount Paid</Text>
          </View>

          {/* Advance Row */}
          <View style={styles.auditDataRow}>
            <Text style={styles.auditCellStage}>Advance (40%)</Text>
            <Text style={styles.auditCellTxn}>{advanceTxnId}</Text>
            <Text style={styles.auditCellMethod}>Online / Razorpay</Text>
            <Text style={styles.auditCellDate}>{advanceTime}</Text>
            <Text style={styles.auditCellAmtPaid}>-{formatCurrency(payment?.advanceAmount)}</Text>
          </View>

          {/* Remaining Row */}
          <View style={styles.auditDataRow}>
            <Text style={styles.auditCellStage}>Remaining (60%)</Text>
            <Text style={styles.auditCellTxn}>{remainingTxnId}</Text>
            <Text style={styles.auditCellMethod}>{isFullyPaid ? 'Online / Razorpay' : 'Pending'}</Text>
            <Text style={styles.auditCellDate}>{remainingTime}</Text>
            <Text style={isFullyPaid ? styles.auditCellAmtPaid : styles.auditCellAmtPending}>
              {isFullyPaid ? `-${formatCurrency(payment?.remainingAmount)}` : formatCurrency(payment?.remainingAmount)}
            </Text>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE DUE</Text>
            <Text style={[styles.balanceValue, isFullyPaid && { color: '#9ca3af' }]}>
              {formatCurrency(isFullyPaid ? 0 : payment?.remainingAmount)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thanks}>Thank you for choosing {BILLING_COMPANY_NAME}!</Text>
          <Text style={styles.disclaimer}>{BILLING_DECLARATION}</Text>
          <Text style={styles.supportText}>Customer Support: {BILLING_EMAIL} | Ph: {BILLING_PHONE} | Website: {BILLING_WEBSITE}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
