import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getBookingDetails } from "../../../services/vendorApi";
import { getPublicSettings } from "../../../services/settingsApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { handleApiError } from "../../../utils/toastHelper";
import {
  IoChevronBackOutline,
  IoPrintOutline,
  IoDownloadOutline,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoRibbonOutline,
  IoCheckmarkCircle,
  IoBriefcaseOutline,
  IoDocumentTextOutline
} from "react-icons/io5";
import { PDFDownloadLink } from "@react-pdf/renderer";
import VendorInvoicePDF from "../vendor-components/VendorInvoicePDF";
import jaladhaaraLogo from "../../../assets/Header-logoo.png";
import QRCode from "qrcode";

export default function VendorInvoice() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { vendor: loggedInVendor } = useVendorAuth();
  const [booking, setBooking] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [billingInfo, setBillingInfo] = useState({
    BILLING_COMPANY_NAME: "Jaladhaara Hydrogeological Services Pvt. Ltd.",
    BILLING_ADDRESS: "123, Water Tower Complex, Near Borewell Circle, Civil Lines, Raipur, Chhattisgarh - 492001",
    BILLING_GSTIN: "22AAAAA0000A1Z5",
    BILLING_PAN: "AAACJ1234F",
    BILLING_PHONE: "+91 98765 43210",
    BILLING_EMAIL: "billing@jaladhar.com",
    BILLING_WEBSITE: "https://jaladhaaraapp.in",
    BILLING_SAC_CODE: "998311",
    BILLING_PLACE_OF_SUPPLY: "Chhattisgarh (State Code: 22)",
    BILLING_DECLARATION: "This is a computer-generated B2B Platform Fee Tax Invoice."
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const invoiceRef = useRef();

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      setError("");

      const [bookingRes, settingsRes] = await Promise.all([
        getBookingDetails(bookingId),
        getPublicSettings('billing').catch(err => {
          console.error("Failed to load billing settings", err);
          return null;
        })
      ]);

      if (bookingRes.success) {
        setBooking(bookingRes.data.booking);
      } else {
        setError(bookingRes.message || "Failed to load commission invoice data");
      }

      if (settingsRes && settingsRes.success && settingsRes.data.settings) {
        const info = {};
        settingsRes.data.settings.forEach(s => {
          info[s.key] = s.value;
        });
        setBillingInfo(prev => ({ ...prev, ...info }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load commission invoice data");
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (booking) {
      const invDate = booking.payment?.createdAt || booking.createdAt;
      const commInvoiceNo = `COMM-INV-${new Date(invDate).toISOString().slice(0, 10).replace(/-/g, '')}-${booking._id.slice(-6).toUpperCase()}`;

      const vp = booking.payment?.vendorWalletPayments || {};
      const baseF = vp.base || booking.payment?.baseServiceFee || (booking.service?.price || 3500);
      const trav = booking.payment?.travelCharges || 0;
      const netServiceVal = baseF + trav;
      const custGst = vp.customerGST || booking.payment?.gst || (baseF * 0.18);
      const gross = vp.gross || booking.payment?.totalAmount || (netServiceVal + custGst);

      const commBase = vp.platformCommission || (baseF * 0.10);
      const commCgst = vp.gstOnCommission ? (vp.gstOnCommission / 2) : (commBase * 0.09);
      const commSgst = vp.gstOnCommission ? (vp.gstOnCommission / 2) : (commBase * 0.09);
      const totalComm = commBase + commCgst + commSgst;
      const tds = vp.tds || (baseF * 0.01);
      const netPayout = vp.totalVendorPayment || (gross - totalComm - tds);

      const activeVendor = (booking.vendor && typeof booking.vendor === 'object') ? booking.vendor : (loggedInVendor || {});
      const expertName = activeVendor.name || "Hydrogeologist Expert";

      const qrPayload = `JALADHAARA B2B COMMISSION INVOICE\nInvoice: ${commInvoiceNo}\nOrder ID: ORD-${booking._id.slice(-8).toUpperCase()}\nExpert: ${expertName}\nNet Payout: ₹${netPayout.toFixed(2)}\nStatus: SETTLED TO BANK`;

      QRCode.toDataURL(qrPayload, { margin: 1, width: 220 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("Failed to generate QR Code", err));
    }
  }, [booking, billingInfo, loggedInVendor]);

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-4">
        <LoadingSpinner message="Generating Expert Platform Commission Invoice..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h3 className="text-lg font-bold text-gray-800">Invoice Unavailable</h3>
          <p className="text-sm text-gray-500">{error || "Unable to retrieve platform commission data for this booking."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-[#0A84FF] text-white font-bold py-3 rounded-xl hover:bg-[#005BBB] transition-colors"
          >
            Back to Booking Details
          </button>
        </div>
      </div>
    );
  }

  // RESOLVE EXPERT DETAILS
  const activeVendor = (booking.vendor && typeof booking.vendor === 'object') ? booking.vendor : (loggedInVendor || {});
  const expertName = activeVendor.name || "Assigned Hydrogeologist Expert";
  const expertIdCode = activeVendor.vendorId || (activeVendor._id ? activeVendor._id.slice(-6).toUpperCase() : booking._id.slice(-6).toUpperCase());
  const expertPhone = activeVendor.phone || booking.user?.phone || "N/A";
  const expertEmail = activeVendor.email || booking.user?.email || "N/A";
  const expertGstin = activeVendor.gstin || "Unregistered / Exempted";
  const expertPan = activeVendor.pan || "N/A";

  const invDate = booking.payment?.createdAt || booking.createdAt;
  const commInvoiceNo = `COMM-INV-${new Date(invDate).toISOString().slice(0, 10).replace(/-/g, '')}-${booking._id.slice(-6).toUpperCase()}`;

  const baseFee = booking.payment?.baseServiceFee || (booking.service?.price || 3500);
  const travelCharges = booking.payment?.travelCharges || 0;
  const netServiceValue = baseFee + travelCharges;
  const customerGst = booking.payment?.gst || (netServiceValue * 0.18);
  const grossTotal = booking.payment?.totalAmount || (netServiceValue + customerGst);

  const commBase = netServiceValue * 0.10;
  const commCgst = commBase * 0.09;
  const commSgst = commBase * 0.09;
  const totalCommFee = commBase + commCgst + commSgst;
  const tdsDeduction = netServiceValue * 0.01;
  const netPayout = grossTotal - totalCommFee - tdsDeduction;

  const utrNo = `UTR-N${booking._id.slice(-10).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#F6F7F9] py-4 sm:py-8 px-2 sm:px-6">
      {/* Control Action Bar */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-xl font-bold text-xs sm:text-sm shadow-sm border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
        >
          <IoChevronBackOutline className="text-base" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-white text-gray-700 rounded-xl font-bold text-xs sm:text-sm shadow-sm border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
          >
            <IoPrintOutline className="text-lg" />
            <span className="hidden sm:inline ml-1.5">Print</span>
          </button>

          <PDFDownloadLink
            document={<VendorInvoicePDF booking={booking} billingInfo={billingInfo} qrCodeUrl={qrCodeUrl} loggedInVendor={loggedInVendor} />}
            fileName={`${commInvoiceNo}.pdf`}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0A84FF] text-white rounded-xl font-bold shadow-md hover:bg-[#005BBB] transition-all active:scale-95 text-xs sm:text-sm"
          >
            {({ loading }) => (
              <>
                <IoDownloadOutline className={`text-base ${loading ? 'animate-bounce' : ''}`} />
                <span>{loading ? "Preparing..." : "Download PDF"}</span>
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Main Card */}
        <div
          ref={invoiceRef}
          className="bg-white border-y sm:border border-gray-100/80 shadow-none sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-none sm:rounded-[24px] overflow-hidden px-3 py-5 sm:p-10 print:border-0 print:shadow-none print:p-0"
        >
          {/* Top Brand Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-6 border-b border-gray-100">
            <div>
              <div className="mb-4">
                <img
                  src={jaladhaaraLogo}
                  alt="Jaladhaara Logo"
                  className="h-11 sm:h-14 w-auto object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-lg mb-1 border border-emerald-200/60">
                  Platform Fee & Net Payout Tax Invoice
                </span>
                <p className="text-xs sm:text-sm font-bold text-gray-800">
                  Commission Invoice No: <span className="text-gray-900 font-black">{commInvoiceNo}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Order Ref ID: <span className="font-bold text-gray-800">ORD-{booking._id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Settlement Date & Time: <span className="font-bold text-gray-800">{formatFullDateTime(invDate)}</span>
                </p>
              </div>
            </div>

            {/* Top Net Payout Badge */}
            <div className="w-full md:w-auto bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 md:text-right">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-1">
                Net Bank Settlement Credited
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {formatAmount(netPayout)}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md mt-2">
                <IoCheckmarkCircle className="text-xs text-emerald-600" />
                <span>Bank Transfer Complete (UTR: {utrNo.slice(0, 16)}...)</span>
              </div>
            </div>
          </div>

          {/* B2B Corporate Biller & Expert Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-3.5 sm:p-6 bg-gray-50/80 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-2 flex items-center gap-1">
                <IoBriefcaseOutline className="text-xs" /> Platform Operator (Biller)
              </p>
              <h4 className="text-base font-bold text-gray-900 mb-1">{billingInfo.BILLING_COMPANY_NAME}</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium mb-3">{billingInfo.BILLING_ADDRESS}</p>
              <div className="space-y-1 text-xs text-gray-600 font-medium pt-2 border-t border-gray-200">
                <p><span className="font-bold text-gray-800">GSTIN:</span> <span className="font-mono">{billingInfo.BILLING_GSTIN}</span></p>
                <p><span className="font-bold text-gray-800">PAN:</span> <span className="font-mono">{billingInfo.BILLING_PAN}</span></p>
                <p><span className="font-bold text-gray-800">SAC Code:</span> <span className="font-mono">998311</span> (Platform Facilitation)</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-2 flex items-center gap-1">
                <IoDocumentTextOutline className="text-xs" /> Hydrogeologist Expert (Recipient)
              </p>
              <h4 className="text-base font-bold text-gray-900 mb-1">{expertName}</h4>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <p>Expert ID: <span className="font-bold text-gray-800">EXP-{expertIdCode}</span></p>
                <p>Phone / Email: <span className="font-bold text-gray-800">{expertPhone} | {expertEmail}</span></p>
                <p>GSTIN / PAN: <span className="font-bold text-gray-800">{expertGstin} | {expertPan}</span></p>
                <p className="mt-2.5 pt-2.5 border-t border-gray-200 text-gray-700">
                  <span className="font-bold text-gray-800">TDS Sec 194O Flag:</span> <span className="text-emerald-700 font-bold">1% Withheld for Form 26AS Credit</span>
                </p>
              </div>
            </div>
          </div>

          {/* 100% Transparent Financial Math Breakdown Box */}
          <div className="p-4 sm:p-5 bg-blue-50/40 rounded-2xl border border-blue-100 mb-8 space-y-2 text-xs">
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <IoShieldCheckmarkOutline className="text-[#0A84FF]" /> Transparent Payout Formula Breakdown
            </h5>
            <div className="flex justify-between items-center text-gray-700 font-medium">
              <span>1. Expert Base Service Fee</span>
              <span className="font-bold text-gray-900">{formatAmount(baseFee)}</span>
            </div>
            {travelCharges > 0 && (
              <div className="flex justify-between items-center text-gray-700 font-medium">
                <span>   + Travel Mobilization Reimbursement</span>
                <span className="font-bold text-gray-900">+{formatAmount(travelCharges)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-blue-700 font-medium">
              <span>2. Plus: Customer GST Collected by Platform (18%)</span>
              <span className="font-bold">+{formatAmount(customerGst)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg font-bold text-gray-900 my-1">
              <span>Gross Customer Payment Collected via Platform</span>
              <span>{formatAmount(grossTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600 font-medium">
              <span>Less: Platform Facilitation Fee (10% of Base Fee {formatAmount(netServiceValue)})</span>
              <span className="font-bold">-{formatAmount(commBase)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600 font-medium">
              <span>Less: Platform GST (18% on Commission - CGST 9% + SGST 9%)</span>
              <span className="font-bold">-{formatAmount(commCgst + commSgst)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600 font-medium">
              <span>Less: Income Tax TDS (1% of Service Fee under Sec 194O)</span>
              <span className="font-bold">-{formatAmount(tdsDeduction)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-emerald-300 font-black text-emerald-700 text-sm">
              <span>NET BANK SETTLEMENT AMOUNT CREDITED</span>
              <span>{formatAmount(netPayout)}</span>
            </div>
          </div>

          {/* Itemized Commission Table */}
          <div className="mb-8">
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">
              Statutory Itemized Tax Invoice Schedule
            </h5>
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead className="bg-[#0A84FF] text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Description / Fee Component</th>
                    <th className="py-3 px-3 text-center">SAC / Code</th>
                    <th className="py-3 px-3 text-center">Rate</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  <tr>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">Gross Customer Service Collection</p>
                      <p className="text-[11px] text-gray-500">Full survey fee + 18% Customer GST collected via Razorpay</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs">998341</td>
                    <td className="py-3 px-3 text-center font-bold">100%</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">+{formatAmount(grossTotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">Platform Facilitation Commission</p>
                      <p className="text-[11px] text-gray-500">10% Platform fee on Base Service Fee ({formatAmount(netServiceValue)})</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs">998311</td>
                    <td className="py-3 px-3 text-center font-bold">10.0%</td>
                    <td className="py-3 px-4 text-right font-black text-red-600 text-sm">-{formatAmount(commBase)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">Platform CGST (9%)</p>
                      <p className="text-[11px] text-gray-500">Central GST on platform facilitation fee</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs">998311</td>
                    <td className="py-3 px-3 text-center font-bold">9.0%</td>
                    <td className="py-3 px-4 text-right font-black text-red-600 text-sm">-{formatAmount(commCgst)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">Platform SGST (9%)</p>
                      <p className="text-[11px] text-gray-500">State GST on platform facilitation fee</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs">998311</td>
                    <td className="py-3 px-3 text-center font-bold">9.0%</td>
                    <td className="py-3 px-4 text-right font-black text-red-600 text-sm">-{formatAmount(commSgst)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">Income Tax TDS Deduction (Section 194O)</p>
                      <p className="text-[11px] text-gray-500">1% Statutory Income Tax withheld on Net Service Value ({formatAmount(netServiceValue)})</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs">194O</td>
                    <td className="py-3 px-3 text-center font-bold">1.0%</td>
                    <td className="py-3 px-4 text-right font-black text-red-600 text-sm">-{formatAmount(tdsDeduction)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-500 font-bold">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4 text-sm font-black text-emerald-950">
                      NET BANK SETTLEMENT AMOUNT (Transferred to Expert)
                    </td>
                    <td className="py-3.5 px-4 text-right text-base font-black text-emerald-600">
                      {formatAmount(netPayout)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 mb-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Net Settlement Amount in Words:</span>
            <span className="text-sm font-black text-emerald-700 italic">{numberToWordsINR(netPayout)}</span>
          </div>

          {/* Section 194O & E-Commerce GST Compliance Notice Box */}
          <div className="p-3.5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 mb-8">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <IoShieldCheckmarkOutline className="text-[#0A84FF] text-base" />
              Statutory Income Tax & E-Commerce Compliance Notice
            </h5>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
              <li>
                <span className="font-bold text-slate-800">Section 194O Income Tax TDS:</span> TDS of {formatAmount(tdsDeduction)} withheld under Sec 194O (1% of Service Fee {formatAmount(netServiceValue)}) will be deposited with the Income Tax Dept against your PAN.
              </li>
              <li>
                <span className="font-bold text-slate-800">Form 26AS / AIS Tax Credit:</span> This tax credit will automatically reflect in your Form 26AS and AIS statement for claiming full credit during annual ITR filing.
              </li>
              <li>
                <span className="font-bold text-slate-800">Customer GST Compliance:</span> Customer GST ({formatAmount(customerGst)}) is collected and remitted/adjusted by Jaladhaara E-Commerce Operator under Section 9(5) / Sec 52 of CGST Act.
              </li>
              <li>
                <span className="font-bold text-slate-800">Bank Transfer UTR:</span> Payout has been credited via NEFT/IMPS under UTR reference <span className="font-mono font-bold text-slate-900">{utrNo}</span>.
              </li>
            </ul>
          </div>

          {/* Dynamic QR Verification Card */}
          {qrCodeUrl && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl mb-8">
              <img src={qrCodeUrl} alt="Tax Audit Verification QR Code" className="w-20 h-20 rounded-xl border border-slate-200 shadow-sm bg-white p-1" />
              <div className="text-center sm:text-left space-y-1">
                <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-md">
                  Dynamic B2B Audit QR Code
                </span>
                <h6 className="text-xs font-black text-slate-800">Scannable Commission & Net Payout Verification</h6>
                <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                  Scan this QR code using any camera app to verify commission invoice authenticity, order reference ({booking._id}), and net bank settlement amount.
                </p>
              </div>
            </div>
          )}

          {/* Platform Terms & Legal Declaration */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 mb-8 text-xs text-gray-600 space-y-1.5 leading-relaxed">
            <h6 className="font-bold text-gray-800 uppercase text-[11px] tracking-wider mb-2 pb-1 border-b border-gray-200">
              Platform Terms & Legal Declarations
            </h6>
            {(() => {
              const defaultTerms = [
                "This invoice is issued by the Platform for facilitation services provided to the Expert.",
                "Platform fees and applicable statutory deductions are calculated as per applicable laws.",
                "Net payout is subject to successful settlement and platform policies.",
                "Any refund, dispute, or chargeback may be adjusted against future payouts.",
                "This is a computer-generated invoice and does not require a signature."
              ];
              let list = defaultTerms;
              if (billingInfo.BILLING_EXPERT_TERMS) {
                try {
                  const parsed = typeof billingInfo.BILLING_EXPERT_TERMS === 'string' ? JSON.parse(billingInfo.BILLING_EXPERT_TERMS) : billingInfo.BILLING_EXPERT_TERMS;
                  if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
                  else if (typeof billingInfo.BILLING_EXPERT_TERMS === 'string') list = billingInfo.BILLING_EXPERT_TERMS.split('\n').filter(Boolean);
                } catch (e) {
                  if (typeof billingInfo.BILLING_EXPERT_TERMS === 'string') list = billingInfo.BILLING_EXPERT_TERMS.split('\n').filter(Boolean);
                }
              }
              return list.map((item, idx) => (
                <p key={idx} className={idx === list.length - 1 ? "font-semibold text-gray-700 italic" : ""}>
                  {idx + 1}. {item}
                </p>
              ));
            })()}
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <p className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                  <IoRibbonOutline className="text-[#0A84FF]" /> Thank you for providing expert services on {billingInfo.BILLING_COMPANY_NAME}!
                </p>
                <p className="text-[11px] text-gray-400 mb-2">{billingInfo.BILLING_DECLARATION}</p>
              </div>
              <div className="md:text-right space-y-1 text-[11px]">
                <p className="font-bold text-gray-800">Platform Finance Support</p>
                <p><IoMailOutline className="inline mr-1" /> {billingInfo.BILLING_EMAIL}</p>
                <p><IoCallOutline className="inline mr-1" /> {billingInfo.BILLING_PHONE}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
                body {
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                .print\\:hidden {
                    display: none !important;
                }
                @page {
                    margin: 1.5cm;
                    size: A4;
                }
                .rounded-\\[20px\\], .rounded-\\[24px\\] {
                    border-radius: 0 !important;
                }
            }
          `}} />
      </div>
    </div>
  );
}
