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
    position: 'relative',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1pt solid #e5e7eb',
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subTitleId: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  logoImage: {
    width: 130,
    height: 38,
    objectFit: 'contain',
  },
  bannerTotalBox: {
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  bannerTotalLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bannerTotalAmount: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0A84FF',
  },
  locationRouteBox: {
    backgroundColor: '#ffffff',
    border: '1pt solid #e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  routeMetricItem: {
    textAlign: 'center',
  },
  metricVal: { fontSize: 9, fontWeight: 700, color: '#0f172a' },
  metricLbl: { fontSize: 6.5, color: '#64748b', textTransform: 'uppercase' },
  addressPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  dotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    marginRight: 6,
    marginTop: 2,
  },
  dotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
    marginRight: 6,
    marginTop: 2,
  },
  addressPointText: {
    fontSize: 7.8,
    color: '#334155',
    flex: 1,
    lineHeight: 1.3,
  },
  boxContainer: {
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  boxTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: '1pt solid #cbd5e1',
  },
  rowFlexBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  textLabel: { color: '#64748b', fontSize: 7.8 },
  textValue: { fontWeight: 700, color: '#0f172a', fontSize: 7.8 },
  qrBox: {
    width: 70,
    height: 70,
    alignSelf: 'flex-end',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A84FF',
    borderRadius: 4,
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    marginBottom: 5,
  },
  headerDesc: { width: '45%', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerSac: { width: '15%', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerQty: { width: '10%', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerUnitPrice: { width: '15%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerAmount: { width: '15%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: '1pt solid #f1f5f9',
    alignItems: 'center',
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  termNum: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#0A84FF',
    width: 14,
  },
  termText: {
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.35,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    paddingTop: 8,
    borderTop: '1pt solid #f3f4f6',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 2,
    fontWeight: 700,
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

const InvoicePDF = ({ booking, billingInfo, qrCodeUrl }) => {
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

  const defaultTerms = [
    "Terms & Conditions issued for groundwater survey services booked through Jaladhaara.",
    "Groundwater availability and borewell success depend on site-specific geological conditions & geophysical investigations and cannot be guaranteed.",
    "Please retain this invoice for future reference.",
    "Booking is confirmed upon receipt of the advance payment.",
    "Final payment is required to unlock the survey report.",
    "Travel charges are non-refundable once the expert begins the journey.",
    "Disputes must be raised within 10 days of the survey report submission."
  ];

  let termsList = defaultTerms;
  if (billingInfo?.BILLING_TERMS_AND_CONDITIONS) {
    try {
      const parsed = typeof billingInfo.BILLING_TERMS_AND_CONDITIONS === 'string'
        ? JSON.parse(billingInfo.BILLING_TERMS_AND_CONDITIONS)
        : billingInfo.BILLING_TERMS_AND_CONDITIONS;
      if (Array.isArray(parsed) && parsed.length > 0) {
        termsList = parsed;
      }
    } catch (e) {
      console.error("Error parsing terms in PDF", e);
    }
  }

  const finalQrCodeUrl = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`INV:${invoiceNo}|ORD:${booking._id}|TOTAL:${grandTotal}`)}`;

  return (
    <Document>
      {/* PAGE 1: PAYMENT & SERVICE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.mainTitle}>Payment Summary</Text>
            <Text style={styles.subTitleId}>Booking ID: ORD-{booking._id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.subTitleId}>Time of Booking: {formatFullDateTime(createdAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, backgroundColor: isFullyPaid ? '#ecfdf5' : '#fffbeb', border: `1pt solid ${isFullyPaid ? '#10b981' : '#f59e0b'}`, marginRight: 10 }}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: isFullyPaid ? '#047857' : '#b45309', textTransform: 'uppercase' }}>
                {isFullyPaid ? '✓ PAID IN FULL' : '⏳ ADVANCE PAID (40%)'}
              </Text>
            </View>
            <Image src={logoImg} style={styles.logoImage} />
          </View>
        </View>

        {/* Large Total Banner */}
        <View style={styles.bannerTotalBox}>
          <Text style={styles.bannerTotalLabel}>Total Paid / Payable</Text>
          <Text style={styles.bannerTotalAmount}>{formatCurrency(grandTotal)}</Text>
        </View>

        {/* Survey Location & Distance Route Metrics */}
        <View style={styles.locationRouteBox}>
          <View style={styles.routeHeader}>
            <View style={styles.routeMetricItem}>
              <Text style={styles.metricVal}>{payment?.distance?.toFixed(1) || '0.0'} kms</Text>
              <Text style={styles.metricLbl}>DISTANCE</Text>
            </View>
            <View style={styles.routeMetricItem}>
              <Text style={styles.metricVal}>{service?.machineType || 'ADMT / PQWT'}</Text>
              <Text style={styles.metricLbl}>EQUIPMENT</Text>
            </View>
            <View style={styles.routeMetricItem}>
              <Text style={styles.metricVal}>{service?.name}</Text>
              <Text style={styles.metricLbl}>SERVICE</Text>
            </View>
          </View>

          <View style={styles.addressPointRow}>
            <View style={styles.dotGreen} />
            <Text style={styles.addressPointText}>
              <Text style={{ fontWeight: 700 }}>Survey Location: </Text>
              {formatCleanAddress(booking.address)}
            </Text>
          </View>

          <View style={styles.addressPointRow}>
            <View style={styles.dotRed} />
            <Text style={styles.addressPointText}>
              <Text style={{ fontWeight: 700 }}>Assigned Expert: </Text>
              {vendor?.name || 'Assigned Expert'} (EXP-{vendor?._id?.slice(-6).toUpperCase() || 'N/A'})
            </Text>
          </View>
        </View>

        {/* Bill Summary Breakdown */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Bill Details & Report Status</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Base Service Fee</Text>
            <Text style={styles.textValue}>{formatCurrency(baseFee)}</Text>
          </View>
          {travelCharges > 0 && (
            <View style={styles.rowFlexBetween}>
              <Text style={styles.textLabel}>Travel & Mobilization Charges</Text>
              <Text style={styles.textValue}>{formatCurrency(travelCharges)}</Text>
            </View>
          )}
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Total GST (18%)</Text>
            <Text style={styles.textValue}>{formatCurrency(gstTotal)}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Survey Report Access</Text>
            <Text style={{ fontSize: 7.8, fontWeight: 700, color: isFullyPaid ? '#059669' : '#d97706' }}>
              {isFullyPaid ? 'Available in App' : `Awaiting Final Payment (Pay ${formatCurrency(payment?.remainingAmount)} to view)`}
            </Text>
          </View>
          <View style={[styles.rowFlexBetween, { borderTop: '1pt solid #cbd5e1', paddingTop: 4, marginTop: 4 }]}>
            <Text style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>Total Amount</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#0A84FF' }}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        {/* Payment Receipts & Audit Trail */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>You Paid Using (Audit Trail)</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Advance (40%) • Txn: {advanceTxnId}</Text>
            <Text style={{ fontWeight: 700, color: '#059669', fontSize: 7.8 }}>-{formatCurrency(payment?.advanceAmount)}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Remaining (60%) • Txn: {remainingTxnId}</Text>
            <Text style={{ fontWeight: 700, color: isFullyPaid ? '#059669' : '#d97706', fontSize: 7.8 }}>
              {isFullyPaid ? `-${formatCurrency(payment?.remainingAmount)}` : formatCurrency(payment?.remainingAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>This document is an electronic booking summary issued by Jaladhaara Groundwater Survey Platform.</Text>
          <Text style={styles.pageNumber}>Page 1 of 3</Text>
        </View>
      </Page>

      {/* PAGE 2: EXPERT SERVICE PROVIDER TAX INVOICE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.mainTitle}>Tax Invoice</Text>
            <Text style={styles.subTitleId}>Invoice No: {invoiceNo}</Text>
            <Text style={styles.subTitleId}>Invoice Date: {formatFullDateTime(invoiceDate)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, backgroundColor: isFullyPaid ? '#ecfdf5' : '#fffbeb', border: `1pt solid ${isFullyPaid ? '#10b981' : '#f59e0b'}`, marginRight: 10 }}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: isFullyPaid ? '#047857' : '#b45309', textTransform: 'uppercase' }}>
                {isFullyPaid ? '✓ PAID IN FULL' : '⏳ ADVANCE PAID (40%)'}
              </Text>
            </View>
            <Image src={logoImg} style={styles.logoImage} />
          </View>
        </View>

        {/* Expert & Customer Details Box */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Service Provider & Customer Info</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Hydrogeological Expert Name</Text>
            <Text style={styles.textValue}>{vendor?.name || 'Assigned Expert'}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Expert ID</Text>
            <Text style={styles.textValue}>EXP-{vendor?._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Tax Category / SAC Code</Text>
            <Text style={styles.textValue}>Geophysical Survey ({BILLING_SAC_CODE})</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Reverse Charge Applicable (RCM)</Text>
            <Text style={styles.textValue}>NO (0%)</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Place of Supply</Text>
            <Text style={styles.textValue}>{BILLING_PLACE_OF_SUPPLY}</Text>
          </View>
          <View style={[styles.rowFlexBetween, { borderTop: '1pt solid #e2e8f0', paddingTop: 4, marginTop: 4 }]}>
            <Text style={styles.textLabel}>Customer Name (Billed To)</Text>
            <Text style={styles.textValue}>{user?.name}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Customer Survey Address</Text>
            <Text style={[styles.textValue, { width: '55%', textAlign: 'right' }]}>{formatCleanAddress(booking.address)}</Text>
          </View>
        </View>

        {/* Itemized Tax Table */}
        <View style={{ marginBottom: 14 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerDesc}>Item / Service Description</Text>
            <Text style={styles.headerSac}>SAC Code</Text>
            <Text style={styles.headerQty}>Qty</Text>
            <Text style={styles.headerUnitPrice}>Unit Price</Text>
            <Text style={styles.headerAmount}>Total (Rs.)</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.rowDesc}>
              <Text style={{ fontSize: 8.5, fontWeight: 700, color: '#111827' }}>{service?.name}</Text>
              <Text style={{ fontSize: 7, color: '#6b7280', marginTop: 1 }}>Groundwater survey & report ({service?.machineType || 'Standard Machine'})</Text>
            </View>
            <Text style={{ width: '15%', textAlign: 'center', fontSize: 8 }}>{BILLING_SAC_CODE}</Text>
            <Text style={{ width: '10%', textAlign: 'center', fontSize: 8, fontWeight: 700 }}>1</Text>
            <Text style={{ width: '15%', textAlign: 'right', fontSize: 8 }}>{formatCurrency(baseFee)}</Text>
            <Text style={{ width: '15%', textAlign: 'right', fontSize: 8.5, fontWeight: 700 }}>{formatCurrency(baseFee)}</Text>
          </View>

          {travelCharges > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.rowDesc}>
                <Text style={{ fontSize: 8.5, fontWeight: 700, color: '#111827' }}>Travel & Mobilization Charges</Text>
                <Text style={{ fontSize: 7, color: '#6b7280', marginTop: 1 }}>Distance {payment?.distance?.toFixed(1)} km</Text>
              </View>
              <Text style={{ width: '15%', textAlign: 'center', fontSize: 8 }}>{BILLING_SAC_CODE}</Text>
              <Text style={{ width: '10%', textAlign: 'center', fontSize: 8, fontWeight: 700 }}>1</Text>
              <Text style={{ width: '15%', textAlign: 'right', fontSize: 8 }}>{formatCurrency(travelCharges)}</Text>
              <Text style={{ width: '15%', textAlign: 'right', fontSize: 8.5, fontWeight: 700 }}>{formatCurrency(travelCharges)}</Text>
            </View>
          )}
        </View>

        {/* Expert Fee Tax Summary */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Tax Details Breakdown</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Taxable Amount</Text>
            <Text style={styles.textValue}>{formatCurrency(baseFee + travelCharges)}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>CGST (9%)</Text>
            <Text style={styles.textValue}>{formatCurrency(cgst)}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>SGST (9%)</Text>
            <Text style={styles.textValue}>{formatCurrency(sgst)}</Text>
          </View>
          <View style={[styles.rowFlexBetween, { borderTop: '1.5pt solid #111827', paddingTop: 4, marginTop: 4 }]}>
            <Text style={{ fontSize: 9.5, fontWeight: 700, color: '#0f172a' }}>Final Expert Service Fee</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: '#0A84FF' }}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>This Tax Invoice is issued by Expert Hydrogeologist Service Provider through Jaladhaara E-Commerce Platform.</Text>
          <Text style={styles.pageNumber}>Page 2 of 3</Text>
        </View>
      </Page>

      {/* PAGE 3: PLATFORM CORPORATE TAX INVOICE & TERMS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.mainTitle}>Tax Invoice (Platform)</Text>
            <Text style={styles.subTitleId}>Invoice No: {invoiceNo}</Text>
          </View>
          <Image src={logoImg} style={styles.logoImage} />
        </View>

        {/* Corporate & QR Verification Block */}
        <View style={[styles.boxContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ width: '70%' }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{BILLING_COMPANY_NAME}</Text>
            <Text style={{ fontSize: 7.5, color: '#4b5563', lineHeight: 1.3 }}>{BILLING_ADDRESS}</Text>
            <Text style={{ fontSize: 7.8, fontWeight: 700, color: '#0A84FF', marginTop: 3 }}>GSTIN: {BILLING_GSTIN}</Text>
            <Text style={{ fontSize: 7.8, fontWeight: 700, color: '#334155' }}>PAN: {BILLING_PAN}</Text>
            <Text style={{ fontSize: 7.5, color: '#4b5563' }}>Support: {BILLING_EMAIL} | Ph: {BILLING_PHONE}</Text>
          </View>
          <Image src={finalQrCodeUrl} style={styles.qrBox} />
        </View>

        {/* Terms & Conditions Section */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Terms & Conditions</Text>
          {termsList.map((term, index) => (
            <View key={index} style={styles.termRow} wrap={false}>
              <Text style={styles.termNum}>{index + 1}.</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Amount in Words & Signatory */}
        <View style={styles.boxContainer}>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Grand Total Amount in Words</Text>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#0A84FF', fontStyle: 'italic' }}>{numberToWordsINR(grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{BILLING_DECLARATION}</Text>
          <Text style={{ fontSize: 8, fontWeight: 700, color: '#334155', marginTop: 2 }}>Thank you for choosing Jaladhaara Groundwater Survey!</Text>
          <Text style={styles.pageNumber}>Page 3 of 3</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
