import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  IoDownloadOutline,
  IoPrintOutline,
  IoCheckmarkCircleOutline,
  IoChevronBackOutline,
  IoRibbonOutline,
  IoCallOutline,
  IoMailOutline,
  IoGlobeOutline,
  IoShieldCheckmarkOutline
} from "react-icons/io5";
import { getBookingDetails as getUserBookingDetails } from "../../../services/bookingApi";
import { getBookingDetails as getVendorBookingDetails } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { getPublicSettings } from "../../../services/settingsApi";
import { handleApiError } from "../../../utils/toastHelper";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";
import jaladhaaraLogo from "../../../assets/Header-logoo.png";
import QRCode from "qrcode";

export default function UserInvoice() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
    BILLING_SAC_CODE: "998341",
    BILLING_PLACE_OF_SUPPLY: "Chhattisgarh (State Code: 22)",
    BILLING_DECLARATION: "This is a computer-generated Tax Invoice and does not require a physical signature.",
    BILLING_TERMS_AND_CONDITIONS: JSON.stringify([
      "Terms & Conditions issued for groundwater survey services booked through Jaladhaara.",
      "Groundwater availability and borewell success depend on site-specific geological conditions & geophysical investigations and cannot be guaranteed.",
      "Please retain this invoice for future reference.",
      "Booking is confirmed upon receipt of the advance payment.",
      "Final payment is required to unlock the survey report.",
      "Travel charges are non-refundable once the expert begins the journey.",
      "Disputes must be raised within 10 days of the survey report submission."
    ])
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const invoiceRef = useRef();
  const isVendor = location.pathname.startsWith('/vendor');

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      setError("");

      const apiCall = isVendor ? getVendorBookingDetails : getUserBookingDetails;
      const [bookingRes, settingsRes] = await Promise.all([
        apiCall(bookingId),
        getPublicSettings('billing').catch(err => {
          console.error("Failed to load billing settings", err);
          return null;
        })
      ]);

      if (bookingRes.success) {
        setBooking(bookingRes.data.booking);
      } else {
        setError(bookingRes.message || "Failed to load invoice data");
      }

      if (settingsRes && settingsRes.success && settingsRes.data.settings) {
        const info = {};
        settingsRes.data.settings.forEach(s => {
          info[s.key] = s.value;
        });
        setBillingInfo(prev => ({ ...prev, ...info }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoice data");
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (booking) {
      const invDate = booking.payment?.createdAt || booking.createdAt;
      const invNo = `INV-${new Date(invDate).toISOString().slice(0, 10).replace(/-/g, '')}-${booking._id.slice(-6).toUpperCase()}`;
      const baseF = booking.payment?.baseServiceFee || (booking.service?.price || 0);
      const trav = booking.payment?.travelCharges || 0;
      const gstT = booking.payment?.gst || (baseF * 0.18);
      const total = booking.payment?.totalAmount || (baseF + gstT + trav);

      const qrPayload = `JALADHAARA TAX INVOICE\nInvoice: ${invNo}\nOrder ID: ORD-${booking._id.slice(-8).toUpperCase()}\nGSTIN: ${billingInfo.BILLING_GSTIN}\nAmount: ₹${total.toFixed(2)}\nStatus: ${booking.payment?.remainingPaid ? 'PAID IN FULL' : 'PARTIALLY PAID'}`;

      QRCode.toDataURL(qrPayload, { margin: 1, width: 220 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("Failed to generate QR Code", err));
    }
  }, [booking, billingInfo]);

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

  if (loading) return <LoadingSpinner message="Generating marketplace tax invoice..." />;

  if (error || !booking) return (
    <div className="p-6 max-w-4xl mx-auto">
      <ErrorMessage message={error || "Invoice not found"} />
      <button
        onClick={() => navigate(-1)}
        className="mt-4 flex items-center gap-2 text-blue-600 font-bold hover:underline transition-all"
      >
        <IoChevronBackOutline /> Go Back
      </button>
    </div>
  );

  const invoiceDate = booking.payment?.createdAt || booking.createdAt;
  const isFullyPaid = booking.payment?.remainingPaid;
  const formattedInvoiceNo = `INV-${new Date(invoiceDate).toISOString().slice(0, 10).replace(/-/g, '')}-${booking._id.slice(-6).toUpperCase()}`;

  const baseFee = booking.payment?.baseServiceFee || (booking.service?.price || 0);
  const gstTotal = booking.payment?.gst || (baseFee * 0.18);
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const travelCharges = booking.payment?.travelCharges || 0;
  const grandTotal = booking.payment?.totalAmount || (baseFee + gstTotal + travelCharges);

  const advanceTxnId = booking.payment?.advanceRazorpayPaymentId || booking.payment?.advanceTransactionId || `pay_ADV_${booking._id.slice(-6).toUpperCase()}`;
  const remainingTxnId = booking.payment?.remainingPaid
    ? (booking.payment?.remainingRazorpayPaymentId || booking.payment?.remainingTransactionId || `pay_REM_${booking._id.slice(-6).toUpperCase()}`)
    : 'Awaiting Payment';

  const advanceTime = formatFullDateTime(booking.payment?.advancePaidAt || invoiceDate);
  const remainingTime = isFullyPaid ? formatFullDateTime(booking.payment?.remainingPaidAt || new Date()) : 'Pending';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Controls - Sticky bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 mb-6 flex items-center justify-between shadow-sm print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-700 hover:text-[#0A84FF] transition-colors font-bold text-sm"
        >
          <IoChevronBackOutline className="text-lg" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 text-xs sm:text-sm"
            title="Print Invoice"
          >
            <IoPrintOutline className="text-lg" />
            <span className="hidden sm:inline ml-1.5">Print</span>
          </button>

          <PDFDownloadLink
            document={<InvoicePDF booking={booking} billingInfo={billingInfo} qrCodeUrl={qrCodeUrl} />}
            fileName={`${formattedInvoiceNo}.pdf`}
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
        {/* Marketplace Tax Invoice Card */}
        <div
          ref={invoiceRef}
          className="bg-white border-y sm:border border-gray-100/80 shadow-none sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-none sm:rounded-[24px] overflow-hidden px-3 py-5 sm:p-10 print:border-0 print:shadow-none print:p-0"
        >
          {/* Top Brand Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-6 border-b border-gray-100">
            {/* Left: Brand Logo & Invoice Metadata */}
            <div className="w-full md:w-auto">
              <div className="mb-4">
                <img
                  src={jaladhaaraLogo}
                  alt="Jaladhaara Logo"
                  className="h-11 sm:h-14 w-auto object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-blue-50 text-[#0A84FF] font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-lg mb-1">
                  Tax Invoice / Payment Receipt
                </span>
                <p className="text-xs sm:text-sm font-bold text-gray-800">
                  Invoice No: <span className="text-gray-900 font-black">{formattedInvoiceNo}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Order ID: <span className="text-gray-800 font-bold">ORD-{booking._id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Invoice Date & Time: <span className="text-gray-800 font-bold">{formatFullDateTime(invoiceDate)}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Place of Supply: <span className="text-gray-800 font-bold">{billingInfo.BILLING_PLACE_OF_SUPPLY || 'Chhattisgarh (22)'}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Reverse Charge Applicable: <span className="text-gray-800 font-bold">NO</span>
                </p>
              </div>
            </div>

            {/* Right: Payment Status Badge & Seller Info */}
            <div className="w-full md:w-auto text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3 ${isFullyPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                <IoCheckmarkCircleOutline className="text-base" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isFullyPaid ? 'Paid in Full' : 'Partially Paid (Advance Verified)'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <h3 className="text-sm font-black text-gray-900 uppercase">{billingInfo.BILLING_COMPANY_NAME}</h3>
                <p className="leading-relaxed text-gray-600 max-w-xs md:ml-auto whitespace-pre-line">
                  {billingInfo.BILLING_ADDRESS}
                </p>
                <p className="font-bold text-[#0A84FF] pt-1">GSTIN: {billingInfo.BILLING_GSTIN}</p>
                <p className="font-bold text-gray-700">PAN: {billingInfo.BILLING_PAN || "AAACJ1234F"}</p>
                <p className="text-gray-500">Ph: {billingInfo.BILLING_PHONE}</p>
                <p className="text-gray-500">Email: {billingInfo.BILLING_EMAIL}</p>
              </div>
            </div>
          </div>

          {/* Customer & Order Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-3.5 sm:p-6 bg-gray-50/80 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-2">
                Customer Details (Billed To)
              </p>
              <h4 className="text-base font-bold text-gray-900 mb-1">{booking.user?.name}</h4>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <p className="flex items-center gap-1.5"><IoCallOutline className="text-gray-400" /> {booking.user?.phone}</p>
                <p className="flex items-center gap-1.5"><IoMailOutline className="text-gray-400" /> {booking.user?.email}</p>
                <p className="mt-2.5 pt-2.5 border-t border-gray-200 text-gray-700 leading-relaxed font-normal">
                  <span className="font-bold text-gray-800">Survey Site Address:</span><br />
                  {(() => {
                    const a = booking.address || {};
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
                  })()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-2">
                Assigned Expert & Order Info
              </p>
              <h4 className="text-base font-bold text-gray-900 mb-1">{booking.vendor?.name || 'Assigned Expert'}</h4>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <p>Expert ID: <span className="font-bold text-gray-800">EXP-{booking.vendor?._id?.slice(-6).toUpperCase() || 'REF-N/A'}</span></p>
                <p>Service Selected: <span className="font-bold text-gray-800">{booking.service?.name}</span></p>
                <p>Machine / Equipment: <span className="font-bold text-gray-800">{booking.service?.machineType || 'Resistivity Meter / ADMT / PQWT'}</span></p>
                <p className="mt-2.5 pt-2.5 border-t border-gray-200 text-gray-700">
                  <span className="font-bold text-gray-800">Scheduled Survey Date:</span> {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} at {booking.scheduledTime || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Table with SAC Code */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-gray-900 text-[10px] font-black text-[#0A84FF] uppercase tracking-widest">
                  <th className="py-2.5 px-2">Item / Service Description</th>
                  <th className="py-2.5 px-2 text-center">SAC Code</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                <tr>
                  <td className="py-3 px-2">
                    <p className="font-bold text-gray-900">{booking.service?.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Hydrogeological groundwater survey, point location & detailed report ({booking.service?.machineType || 'Standard Machine'})
                    </p>
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-semibold text-gray-700 text-xs">{billingInfo.BILLING_SAC_CODE || '998341'}</td>
                  <td className="py-3 px-2 text-center font-bold text-gray-800">1</td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-800">{formatAmount(baseFee)}</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900">{formatAmount(baseFee)}</td>
                </tr>
                {travelCharges > 0 && (
                  <tr>
                    <td className="py-3 px-2">
                      <p className="font-bold text-gray-900">Travel & Mobilization Charges</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Round trip distance calculated for {booking.payment?.distance?.toFixed(1)} km
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-semibold text-gray-700 text-xs">998341</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-800">1</td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-800">{formatAmount(travelCharges)}</td>
                    <td className="py-3 px-2 text-right font-bold text-gray-900">{formatAmount(travelCharges)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax & Bill Summary */}
          <div className="flex justify-end pt-4 border-t border-gray-100 mb-8">
            <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Base Service Fee</span>
                <span className="text-gray-900 font-bold">{formatAmount(baseFee)}</span>
              </div>
              {travelCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Travel & Mobilization</span>
                  <span className="text-gray-900 font-bold">{formatAmount(travelCharges)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>Taxable Value</span>
                <span className="font-bold text-gray-800">{formatAmount(baseFee + travelCharges)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>CGST (9%)</span>
                <span className="font-bold text-gray-800">{formatAmount(cgst)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>SGST (9%)</span>
                <span className="font-bold text-gray-800">{formatAmount(sgst)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold border-t border-gray-200 pt-2">
                <span className="text-gray-700">Total GST (18%)</span>
                <span className="text-gray-900 font-bold">{formatAmount(gstTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-y-2 border-gray-900 mt-3">
                <span className="text-base sm:text-lg font-black text-gray-900">GRAND TOTAL</span>
                <span className="text-xl sm:text-2xl font-black text-[#0A84FF]">{formatAmount(grandTotal)}</span>
              </div>
              <div className="text-right text-[11px] sm:text-xs font-bold text-gray-700 pt-1 italic">
                Amount in Words: <span className="text-[#0A84FF] font-extrabold capitalize">{numberToWordsINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Audit Trail Table for BOTH Advance & Final Payments */}
          <div className="p-3.5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 mb-8">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h5 className="text-[11px] sm:text-xs font-black text-[#0A84FF] uppercase tracking-widest flex items-center gap-1.5">
                <IoShieldCheckmarkOutline className="text-base" />
                Payment Receipts & Transaction Audit Trail
              </h5>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide">GST Act Audit Compliant</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-2">Payment Stage</th>
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Method</th>
                    <th className="pb-2">Date & Time</th>
                    <th className="pb-2 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Advance Payment (40%)
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-700 text-xs">{advanceTxnId}</td>
                    <td className="py-2.5 text-slate-600 text-xs">Online / Razorpay</td>
                    <td className="py-2.5 text-slate-600 text-xs">{advanceTime}</td>
                    <td className="py-2.5 text-right font-black text-emerald-600 text-xs">
                      -{formatAmount(booking.payment?.advanceAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      Remaining Payment (60%)
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-700 text-xs">{remainingTxnId}</td>
                    <td className="py-2.5 text-slate-600 text-xs">{isFullyPaid ? 'Online / Razorpay' : 'Pending'}</td>
                    <td className="py-2.5 text-slate-600 text-xs">{remainingTime}</td>
                    <td className={`py-2.5 text-right font-black text-xs ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isFullyPaid ? `-${formatAmount(booking.payment?.remainingAmount)}` : formatAmount(booking.payment?.remainingAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-300">
              <span className="text-xs font-black uppercase text-slate-900">Total Balance Due</span>
              <span className={`text-sm sm:text-base font-black ${isFullyPaid ? 'text-slate-400' : 'text-red-600'}`}>
                {formatAmount(isFullyPaid ? 0 : booking.payment?.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="p-3.5 sm:p-6 bg-gray-50 rounded-2xl border border-gray-200/80 mb-8">
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-200">
              <IoRibbonOutline className="text-[#0A84FF] text-base" />
              Terms & Conditions
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-600 font-medium leading-relaxed">
              {(() => {
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
                if (billingInfo.BILLING_TERMS_AND_CONDITIONS) {
                  try {
                    const parsed = typeof billingInfo.BILLING_TERMS_AND_CONDITIONS === 'string'
                      ? JSON.parse(billingInfo.BILLING_TERMS_AND_CONDITIONS)
                      : billingInfo.BILLING_TERMS_AND_CONDITIONS;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      termsList = parsed;
                    }
                  } catch (e) {
                    console.error("Error parsing billing terms", e);
                  }
                }
                return termsList.map((term, i) => (
                  <li key={i} className="pl-1">
                    <span className="text-gray-700">{term}</span>
                  </li>
                ));
              })()}
            </ol>
          </div>

          {/* Dynamic GST Audit Verification QR Code Card */}
          {qrCodeUrl && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 sm:p-4 bg-slate-50 border border-slate-200/80 rounded-2xl mb-8">
              <img src={qrCodeUrl} alt="Tax Audit Verification QR Code" className="w-20 h-20 rounded-xl border border-slate-200 shadow-sm bg-white p-1" />
              <div className="text-center sm:text-left space-y-1">
                <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-[#0A84FF] text-[10px] font-black uppercase tracking-wider rounded-md">
                  Tax Audit Verification Code
                </span>
                <h6 className="text-xs font-black text-slate-800">Scannable GST & Razorpay Audit Signature</h6>
                <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                  Scan this QR code with any smartphone camera or Lens app to instantly verify invoice authenticity, order ID ({booking._id}), and Razorpay payment status.
                </p>
              </div>
            </div>
          )}

          {/* Marketplace Footer & Declaration */}
          <div className="pt-6 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <p className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                  <IoRibbonOutline className="text-[#0A84FF]" /> Thank you for choosing {billingInfo.BILLING_COMPANY_NAME}!
                </p>
                <p className="text-[11px] text-gray-400 mb-2">{billingInfo.BILLING_DECLARATION}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#0A84FF]">
                  <a href="https://jaladhaaraapp.in/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Refund Policy</a>
                  <span>•</span>
                  <a href="https://jaladhaaraapp.in/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
                </div>
              </div>
              <div className="md:text-right space-y-1 text-[11px]">
                <p className="font-bold text-gray-800">Customer Support & Inquiries</p>
                <p><IoMailOutline className="inline mr-1" /> {billingInfo.BILLING_EMAIL}</p>
                <p><IoCallOutline className="inline mr-1" /> {billingInfo.BILLING_PHONE}</p>
                <p><IoGlobeOutline className="inline mr-1" /> {billingInfo.BILLING_WEBSITE}</p>
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
