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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1pt solid #e5e7eb',
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  mainTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subTitleId: {
    fontSize: 7.8,
    color: '#64748b',
    marginTop: 1.5,
  },
  logoImage: {
    width: 120,
    height: 35,
    objectFit: 'contain',
  },
  bannerTotalBox: {
    backgroundColor: '#ecfdf5',
    border: '1pt solid #a7f3d0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  bannerTotalLabel: {
    fontSize: 7.5,
    color: '#047857',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bannerTotalAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: '#059669',
  },
  boxContainer: {
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
    borderRadius: 8,
    padding: 9,
    marginBottom: 12,
  },
  boxTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 5,
    paddingBottom: 3,
    borderBottom: '1pt solid #cbd5e1',
  },
  rowFlexBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  textLabel: { color: '#64748b', fontSize: 7.5 },
  textValue: { fontWeight: 700, color: '#0f172a', fontSize: 7.5 },
  qrBox: {
    width: 65,
    height: 65,
    alignSelf: 'flex-end',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A84FF',
    borderRadius: 4,
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  headerDesc: { width: '48%', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerSac: { width: '16%', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerRate: { width: '16%', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  headerAmount: { width: '20%', textAlign: 'right', fontSize: 7.5, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    borderBottom: '1pt solid #f1f5f9',
    alignItems: 'center',
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

const VendorInvoicePDF = ({ booking, billingInfo, qrCodeUrl, loggedInVendor }) => {
  if (!booking) return null;

  const { user, service, payment, createdAt } = booking;
  // Resolve expert profile details with multiple robust fallbacks
  const activeVendor = (booking.vendor && typeof booking.vendor === 'object') ? booking.vendor : (loggedInVendor || {});

  const expertName = activeVendor.name || "Assigned Hydrogeologist Expert";
  const expertIdCode = activeVendor.vendorId || (activeVendor._id ? activeVendor._id.slice(-6).toUpperCase() : booking._id.slice(-6).toUpperCase());
  const expertPhone = activeVendor.phone || user?.phone || "N/A";
  const expertEmail = activeVendor.email || user?.email || "N/A";
  const expertGstin = activeVendor.gstin || "Unregistered / Exempted";
  const expertPan = activeVendor.pan || "N/A";

  const invoiceDate = payment?.createdAt || createdAt;

  const {
    BILLING_COMPANY_NAME = "Jaladhaara Hydrogeological Services Pvt. Ltd.",
    BILLING_ADDRESS = "123, Water Tower Complex, Near Borewell Circle, Civil Lines, Raipur, Chhattisgarh - 492001",
    BILLING_GSTIN = "22AAAAA0000A1Z5",
    BILLING_PAN = "AAACJ1234F",
    BILLING_PHONE = "+91 98765 43210",
    BILLING_EMAIL = "billing@jaladhar.com",
    BILLING_DECLARATION = "This is a computer-generated B2B Platform Fee Tax Invoice."
  } = billingInfo || {};

  const commInvoiceNo = `COMM-INV-${new Date(invoiceDate).toISOString().slice(0,10).replace(/-/g,'')}-${booking._id.slice(-6).toUpperCase()}`;

  // FINANCIAL COMPUTATION (100% Transparent Math)
  const baseFee = payment?.baseServiceFee || service?.price || 3500;
  const travelCharges = payment?.travelCharges || 0;
  const netServiceValue = baseFee + travelCharges;
  const customerGst = payment?.gst || (netServiceValue * 0.18);
  const grossTotal = payment?.totalAmount || (netServiceValue + customerGst);

  // Platform 10% Commission on Net Service Value
  const commBase = netServiceValue * 0.10;
  const commCgst = commBase * 0.09;
  const commSgst = commBase * 0.09;
  const totalCommFee = commBase + commCgst + commSgst; // 11.8% effective (10% + 18% GST)

  // Sec 194O Income Tax TDS (1% of Net Service Value)
  const tdsDeduction = netServiceValue * 0.01;

  // Net Amount Credited to Expert's Bank Account
  const netPayout = grossTotal - totalCommFee - tdsDeduction;

  const utrNo = `UTR-N${booking._id.slice(-10).toUpperCase()}`;
  const finalQrCodeUrl = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`COMM:${commInvoiceNo}|ORD:${booking._id}|PAYOUT:${netPayout}`)}`;

  return (
    <Document>
      {/* PAGE 1: NET PAYOUT & BOOKING SUMMARY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.mainTitle}>Platform Payout Summary</Text>
            <Text style={styles.subTitleId}>Order Ref: ORD-{booking._id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.subTitleId}>Settlement Date: {formatFullDateTime(invoiceDate)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#ecfdf5', border: '1pt solid #10b981', marginRight: 10 }}>
              <Text style={{ fontSize: 7, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                ✓ NET PAYOUT SETTLED
              </Text>
            </View>
            <Image src={logoImg} style={styles.logoImage} />
          </View>
        </View>

        {/* Large Net Payout Banner Box */}
        <View style={styles.bannerTotalBox}>
          <Text style={styles.bannerTotalLabel}>Net Amount Credited to Your Bank Account</Text>
          <Text style={styles.bannerTotalAmount}>{formatCurrency(netPayout)}</Text>
        </View>

        {/* B2B Parties Info */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Corporate Biller & Expert Recipient</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Platform Operator (Biller)</Text>
            <Text style={styles.textValue}>{BILLING_COMPANY_NAME}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Platform GSTIN / PAN</Text>
            <Text style={styles.textValue}>{BILLING_GSTIN} | {BILLING_PAN}</Text>
          </View>
          <View style={[styles.rowFlexBetween, { borderTop: '1pt solid #e2e8f0', paddingTop: 4, marginTop: 4 }]}>
            <Text style={styles.textLabel}>Assigned Expert (Recipient)</Text>
            <Text style={styles.textValue}>{expertName} (EXP-{expertIdCode})</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Expert Phone / Email</Text>
            <Text style={styles.textValue}>{expertPhone} | {expertEmail}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Expert GSTIN / PAN</Text>
            <Text style={styles.textValue}>{expertGstin} | {expertPan}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Customer Survey Site</Text>
            <Text style={[styles.textValue, { width: '55%', textAlign: 'right' }]}>{formatCleanAddress(booking.address)}</Text>
          </View>
        </View>

        {/* Transparent Financial Overview */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Earnings & Deductions Summary (100% Transparent Breakdown)</Text>
          
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>1. Expert Base Service Fee</Text>
            <Text style={styles.textValue}>{formatCurrency(baseFee)}</Text>
          </View>
          
          {travelCharges > 0 && (
            <View style={styles.rowFlexBetween}>
              <Text style={styles.textLabel}>   + Travel Mobilization Reimbursement</Text>
              <Text style={styles.textValue}>+{formatCurrency(travelCharges)}</Text>
            </View>
          )}

          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>2. Plus: Customer GST Collected by Platform (18%)</Text>
            <Text style={{ fontWeight: 700, color: '#0A84FF', fontSize: 7.5 }}>+{formatCurrency(customerGst)}</Text>
          </View>

          <View style={[styles.rowFlexBetween, { backgroundColor: '#f1f5f9', paddingHorizontal: 4, marginVertical: 3, borderRadius: 3 }]}>
            <Text style={{ fontSize: 7.8, fontWeight: 700, color: '#334155' }}>Gross Amount Collected from Customer</Text>
            <Text style={{ fontSize: 7.8, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(grossTotal)}</Text>
          </View>

          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Less: Platform Commission (10% of Service Fee {formatCurrency(netServiceValue)})</Text>
            <Text style={{ fontWeight: 700, color: '#dc2626', fontSize: 7.5 }}>-{formatCurrency(commBase)}</Text>
          </View>

          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Less: Platform GST (18% on Commission - CGST 9% + SGST 9%)</Text>
            <Text style={{ fontWeight: 700, color: '#dc2626', fontSize: 7.5 }}>-{formatCurrency(commCgst + commSgst)}</Text>
          </View>

          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Less: Income Tax TDS (1% of Service Fee under Sec 194O)</Text>
            <Text style={{ fontWeight: 700, color: '#dc2626', fontSize: 7.5 }}>-{formatCurrency(tdsDeduction)}</Text>
          </View>

          <View style={[styles.rowFlexBetween, { borderTop: '1pt solid #cbd5e1', paddingTop: 4, marginTop: 4 }]}>
            <Text style={{ fontSize: 8.5, fontWeight: 700, color: '#0f172a' }}>NET BANK PAYOUT CREDITED TO EXPERT</Text>
            <Text style={{ fontSize: 9.5, fontWeight: 700, color: '#059669' }}>{formatCurrency(netPayout)}</Text>
          </View>
        </View>

        {/* Bank Payout Audit Box */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Bank Payout Audit</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Bank Transfer UTR Reference</Text>
            <Text style={{ fontWeight: 700, color: '#0A84FF', fontSize: 7.5 }}>{utrNo}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Settlement Status</Text>
            <Text style={{ fontWeight: 700, color: '#059669', fontSize: 7.5 }}>Transferred to Linked Bank Account via Razorpay Route</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>This document is an electronic payout summary issued by Jaladhaara E-Commerce Platform.</Text>
          <Text style={styles.pageNumber}>Page 1 of 3</Text>
        </View>
      </Page>

      {/* PAGE 2: STATUTORY TAX INVOICE (PLATFORM COMMISSION) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.mainTitle}>Tax Invoice (Platform)</Text>
            <Text style={styles.subTitleId}>Invoice No: {commInvoiceNo}</Text>
            <Text style={styles.subTitleId}>Invoice Date: {formatFullDateTime(invoiceDate)}</Text>
          </View>
          <Image src={logoImg} style={styles.logoImage} />
        </View>

        {/* Service Provider & SAC Code Details */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Platform Fee Tax Details</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Service Description</Text>
            <Text style={styles.textValue}>E-Commerce Platform Facilitation & Lead Match</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>SAC Code</Text>
            <Text style={styles.textValue}>998311 (Platform Facilitation)</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Place of Supply</Text>
            <Text style={styles.textValue}>Chhattisgarh (State Code: 22)</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Reverse Charge (RCM)</Text>
            <Text style={styles.textValue}>NO (0%)</Text>
          </View>
        </View>

        {/* Itemized Commission Table */}
        <View style={{ marginBottom: 12 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerDesc}>Line Item / Fee Component</Text>
            <Text style={styles.headerSac}>SAC / Code</Text>
            <Text style={styles.headerRate}>Rate</Text>
            <Text style={styles.headerAmount}>Amount (Rs.)</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#111827' }}>Gross Customer Collection</Text>
              <Text style={{ fontSize: 6.8, color: '#6b7280', marginTop: 1 }}>Full survey fee + GST collected from customer</Text>
            </View>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>998341</Text>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>100%</Text>
            <Text style={{ width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#059669' }}>+{formatCurrency(grossTotal)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#111827' }}>Platform Facilitation Commission</Text>
              <Text style={{ fontSize: 6.8, color: '#6b7280', marginTop: 1 }}>10% of Net Service Value ({formatCurrency(netServiceValue)})</Text>
            </View>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>998311</Text>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>10.0%</Text>
            <Text style={{ width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(commBase)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#111827' }}>Platform CGST (9%)</Text>
              <Text style={{ fontSize: 6.8, color: '#6b7280', marginTop: 1 }}>Central Tax on Commission</Text>
            </View>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>998311</Text>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>9.0%</Text>
            <Text style={{ width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(commCgst)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#111827' }}>Platform SGST (9%)</Text>
              <Text style={{ fontSize: 6.8, color: '#6b7280', marginTop: 1 }}>State Tax on Commission</Text>
            </View>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>998311</Text>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>9.0%</Text>
            <Text style={{ width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(commSgst)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#111827' }}>TDS Withheld (Section 194O)</Text>
              <Text style={{ fontSize: 6.8, color: '#6b7280', marginTop: 1 }}>1% Income Tax withheld on Service Value ({formatCurrency(netServiceValue)})</Text>
            </View>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>194O</Text>
            <Text style={{ width: '16%', textAlign: 'center', fontSize: 7.5 }}>1.0%</Text>
            <Text style={{ width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(tdsDeduction)}</Text>
          </View>
        </View>

        {/* Final Net Payout Box */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Final Net Payout Summary</Text>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Gross Collection</Text>
            <Text style={styles.textValue}>{formatCurrency(grossTotal)}</Text>
          </View>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Total Deductions (Commission + GST + TDS)</Text>
            <Text style={{ fontSize: 7.8, fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(totalCommFee + tdsDeduction)}</Text>
          </View>
          <View style={[styles.rowFlexBetween, { borderTop: '1.5pt solid #111827', paddingTop: 4, marginTop: 4 }]}>
            <Text style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>Net Amount Settled to Bank Account</Text>
            <Text style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{formatCurrency(netPayout)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>This Tax Invoice is issued by Jaladhaara E-Commerce Operator for platform services provided to the Expert.</Text>
          <Text style={styles.pageNumber}>Page 2 of 3</Text>
        </View>
      </Page>

      {/* PAGE 3: STATUTORY TAX NOTICES & DIGITAL VERIFICATION */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.mainTitle}>Statutory Tax Notices</Text>
            <Text style={styles.subTitleId}>Invoice No: {commInvoiceNo}</Text>
          </View>
          <Image src={logoImg} style={styles.logoImage} />
        </View>

        {/* Corporate & QR Verification Block */}
        <View style={[styles.boxContainer, { flexDirection: 'row', justify: 'space-between', alignItems: 'center' }]}>
          <View style={{ width: '68%' }}>
            <Text style={{ fontSize: 9.5, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{BILLING_COMPANY_NAME}</Text>
            <Text style={{ fontSize: 7.2, color: '#4b5563', lineHeight: 1.3 }}>{BILLING_ADDRESS}</Text>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#0A84FF', marginTop: 3 }}>GSTIN: {BILLING_GSTIN}</Text>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: '#334155' }}>PAN: {BILLING_PAN}</Text>
            <Text style={{ fontSize: 7.2, color: '#4b5563' }}>Finance Email: {BILLING_EMAIL}</Text>
          </View>
          <Image src={finalQrCodeUrl} style={styles.qrBox} />
        </View>

        {/* Form 26AS & Income Tax Notice Box */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Section 194O Income Tax & GST Compliance Notice</Text>
          <Text style={{ fontSize: 7.5, color: '#334155', lineHeight: 1.35, marginBottom: 3 }}>
            1. Income Tax TDS of {formatCurrency(tdsDeduction)} deducted under Section 194O of the Income Tax Act, 1961 is calculated at 1% of the Net Service Value ({formatCurrency(netServiceValue)}) and will be deposited with the Income Tax Department on your behalf.
          </Text>
          <Text style={{ fontSize: 7.5, color: '#334155', lineHeight: 1.35, marginBottom: 3 }}>
            2. This tax credit will be automatically reflected in your Form 26AS / Annual Information Statement (AIS) and can be claimed during your annual Income Tax Return (ITR) filing.
          </Text>
          <Text style={{ fontSize: 7.5, color: '#334155', lineHeight: 1.35, marginBottom: 3 }}>
            3. Customer GST ({formatCurrency(customerGst)}) is collected and remitted/adjusted by Jaladhaara E-Commerce Operator in accordance with Section 9(5) / Section 52 of CGST Act, 2017.
          </Text>
          <Text style={{ fontSize: 7.5, color: '#334155', lineHeight: 1.35 }}>
            4. Tax Invoice issued under Rule 46 of CGST Rules, 2017. Eligible for Input Tax Credit (ITC) if GST registered.
          </Text>
        </View>

        {/* Platform Facilitation & Legal Terms Box */}
        <View style={styles.boxContainer}>
          <Text style={styles.boxTitle}>Platform Terms & Declarations</Text>
          {(() => {
            const defaultTerms = [
              "This invoice is issued by the Platform for facilitation services provided to the Expert.",
              "Platform fees and applicable statutory deductions are calculated as per applicable laws.",
              "Net payout is subject to successful settlement and platform policies.",
              "Any refund, dispute, or chargeback may be adjusted against future payouts.",
              "This is a computer-generated invoice and does not require a signature."
            ];
            let list = defaultTerms;
            const raw = billingInfo?.BILLING_EXPERT_TERMS;
            if (raw) {
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
                else if (typeof raw === 'string') list = raw.split('\n').filter(Boolean);
              } catch (e) {
                if (typeof raw === 'string') list = raw.split('\n').filter(Boolean);
              }
            }
            return list.map((item, idx) => (
              <Text key={idx} style={{ fontSize: 7.2, color: idx === list.length - 1 ? '#1e293b' : '#334155', fontWeight: idx === list.length - 1 ? 700 : 400, lineHeight: 1.35, marginBottom: 2 }}>
                • {item}
              </Text>
            ));
          })()}
        </View>

        {/* Net Amount in Words */}
        <View style={styles.boxContainer}>
          <View style={styles.rowFlexBetween}>
            <Text style={styles.textLabel}>Net Bank Settlement in Words</Text>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#059669', fontStyle: 'italic' }}>{numberToWordsINR(netPayout)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{BILLING_DECLARATION}</Text>
          <Text style={{ fontSize: 7.8, fontWeight: 700, color: '#334155', marginTop: 2 }}>Thank you for providing expert hydrogeological services on Jaladhaara!</Text>
          <Text style={styles.pageNumber}>Page 3 of 3</Text>
        </View>
      </Page>
    </Document>
  );
};

export default VendorInvoicePDF;
