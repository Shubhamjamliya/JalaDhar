import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {

  IoDownloadOutline,
  IoPrintOutline,
  IoCheckmarkCircleOutline,
  IoWaterOutline,
  IoChevronBackOutline,
  IoRibbonOutline,
  IoCallOutline,
  IoMailOutline,
  IoGlobeOutline
} from "react-icons/io5";
import { getBookingDetails as getUserBookingDetails } from "../../../services/bookingApi";
import { getBookingDetails as getVendorBookingDetails } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import { getPublicSettings } from "../../../services/settingsApi";
import { handleApiError } from "../../../utils/toastHelper";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";

export default function UserInvoice() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [billingInfo, setBillingInfo] = useState({
    BILLING_COMPANY_NAME: "Jaladhaara Hydrogeological Services Pvt. Ltd.",
    BILLING_ADDRESS: "Plot No. 42, Hitech City Main Road, Madhapur,\nHyderabad, Telangana - 500081, India",
    BILLING_GSTIN: "36AAACJ1234F1Z5",
    BILLING_PAN: "AAACJ1234F",
    BILLING_PHONE: "+91 91234 56789",
    BILLING_EMAIL: "support@jaladhaaraapp.in",
    BILLING_WEBSITE: "https://jaladhaaraapp.in"
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

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const transactionId = booking.payment?.advanceRazorpayPaymentId || booking.payment?.remainingRazorpayPaymentId || 'TXN-ONLINE-PAYMENT';

  const baseFee = booking.payment?.baseServiceFee || (booking.service?.price || 0);
  const gstTotal = booking.payment?.gst || (baseFee * 0.18);
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const travelCharges = booking.payment?.travelCharges || 0;
  const grandTotal = booking.payment?.totalAmount || (baseFee + gstTotal + travelCharges);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header Controls - Sticky */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 mb-8 flex items-center justify-between shadow-sm print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-[#0A84FF] transition-colors font-semibold"
        >
          <IoChevronBackOutline className="text-xl" />
          <span>Back</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 text-sm"
          >
            <IoPrintOutline className="text-lg" />
            <span className="hidden sm:inline">Print Invoice</span>
          </button>

          <PDFDownloadLink
            document={<InvoicePDF booking={booking} billingInfo={billingInfo} />}
            fileName={`${formattedInvoiceNo}.pdf`}
            className="flex items-center gap-2 px-6 py-2 bg-[#0A84FF] text-white rounded-xl font-bold shadow-md hover:bg-[#005BBB] transition-all active:scale-95 text-sm"
          >
            {({ loading }) => (
              <>
                <IoDownloadOutline className={`text-lg ${loading ? 'animate-bounce' : ''}`} />
                <span>{loading ? "Preparing PDF..." : "Download PDF"}</span>
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Marketplace Tax Invoice Container */}
        <div
          ref={invoiceRef}
          className="bg-white border border-gray-100 shadow-[0_12px_45px_rgba(0,0,0,0.05)] rounded-[24px] overflow-hidden p-6 sm:p-12 print:border-0 print:shadow-none print:p-0"
        >
          {/* Top Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10 pb-8 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-[#0A84FF] to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <IoWaterOutline className="text-3xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">JALADHAARA</h1>
                  <p className="text-[10px] font-extrabold text-[#0A84FF] uppercase tracking-widest">Groundwater & Hydrogeological Services</p>
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <span className="inline-block px-3 py-1 bg-blue-50 text-[#0A84FF] font-black text-xs uppercase tracking-wider rounded-md mb-2">
                  Tax Invoice / Payment Receipt
                </span>
                <p className="text-sm font-bold text-gray-700">
                  Invoice No: <span className="text-gray-900 font-black">{formattedInvoiceNo}</span>
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Order ID: <span className="text-gray-800 font-bold">ORD-{booking._id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Transaction Ref: <span className="text-gray-800 font-bold">{transactionId}</span>
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Date & Time: <span className="text-gray-800 font-bold">{new Date(invoiceDate).toLocaleString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${isFullyPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                <IoCheckmarkCircleOutline className="text-lg" />
                <span className="text-xs font-black uppercase tracking-widest">
                  {isFullyPaid ? 'Paid in Full' : 'Partially Paid (Advance Verified)'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <h3 className="text-sm font-black text-gray-900 uppercase">{billingInfo.BILLING_COMPANY_NAME}</h3>
                <p className="whitespace-pre-line leading-relaxed text-gray-600">
                  {billingInfo.BILLING_ADDRESS}
                </p>
                <p className="font-bold text-[#0A84FF] pt-1">GSTIN: {billingInfo.BILLING_GSTIN}</p>
                <p className="font-bold text-gray-700">PAN: {billingInfo.BILLING_PAN || "AAACJ1234F"}</p>
              </div>
            </div>
          </div>

          {/* Customer & Order Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 p-6 bg-gray-50/70 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-3 flex items-center gap-1">
                Customer Details (Billed To)
              </p>
              <h4 className="text-lg font-bold text-gray-900 mb-1">{booking.user?.name}</h4>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <p className="flex items-center gap-1.5"><IoCallOutline className="text-gray-400" /> {booking.user?.phone}</p>
                <p className="flex items-center gap-1.5"><IoMailOutline className="text-gray-400" /> {booking.user?.email}</p>
                <p className="mt-3 pt-3 border-t border-gray-200 text-gray-700 leading-relaxed font-normal">
                  <span className="font-bold text-gray-800">Survey Site Address:</span><br />
                  {(() => {
                    const a = booking.address || {};
                    return `${a.street || ''}, ${a.village || ''}, ${a.city || ''}, ${a.district || ''}, ${a.state || ''} - ${a.pincode || ''}`;
                  })()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-3 flex items-center gap-1">
                Assigned Expert & Order Info
              </p>
              <h4 className="text-lg font-bold text-gray-900 mb-1">{booking.vendor?.name || 'Assigned Expert'}</h4>
              <div className="space-y-1 text-xs text-gray-600 font-medium">
                <p>Expert ID: <span className="font-bold text-gray-800">EXP-{booking.vendor?._id?.slice(-6).toUpperCase() || 'REF-N/A'}</span></p>
                <p>Service Selected: <span className="font-bold text-gray-800">{booking.service?.name}</span></p>
                <p>Machine / Equipment: <span className="font-bold text-gray-800">{booking.service?.machineType || 'Resistivity Meter / ADMT / PQWT'}</span></p>
                <p className="mt-3 pt-3 border-t border-gray-200 text-gray-700">
                  <span className="font-bold text-gray-800">Scheduled Survey Date:</span> {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} at {booking.scheduledTime || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-10 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900 text-[10px] font-black text-[#0A84FF] uppercase tracking-widest">
                  <th className="py-3 px-2">Item / Service Description</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Base Price</th>
                  <th className="py-3 px-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-bold text-gray-900">{booking.service?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Hydrogeological groundwater survey, point location & detailed report ({booking.service?.machineType || 'Standard Machine'})
                    </p>
                  </td>
                  <td className="py-4 px-2 text-center font-bold text-gray-800">1</td>
                  <td className="py-4 px-2 text-right font-semibold text-gray-800">{formatAmount(baseFee)}</td>
                  <td className="py-4 px-2 text-right font-bold text-gray-900">{formatAmount(baseFee)}</td>
                </tr>
                {travelCharges > 0 && (
                  <tr>
                    <td className="py-4 px-2">
                      <p className="font-bold text-gray-900">Travel & Mobilization Charges</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Round trip distance calculated for {booking.payment?.distance?.toFixed(1)} km
                      </p>
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-gray-800">1</td>
                    <td className="py-4 px-2 text-right font-semibold text-gray-800">{formatAmount(travelCharges)}</td>
                    <td className="py-4 px-2 text-right font-bold text-gray-900">{formatAmount(travelCharges)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax & Bill Summary */}
          <div className="flex justify-end pt-6 border-t border-gray-100 mb-10">
            <div className="w-full sm:w-88 space-y-2.5 text-sm">
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
              <div className="flex justify-between text-xs text-gray-500 pt-1">
                <span>Taxable Amount</span>
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
              <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                <span className="text-gray-700">Total GST (18%)</span>
                <span className="text-gray-900 font-bold">{formatAmount(gstTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-y-2 border-gray-900 mt-4">
                <span className="text-lg font-black text-gray-900">GRAND TOTAL</span>
                <span className="text-2xl font-black text-[#0A84FF]">{formatAmount(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Receipts Breakdown */}
          <div className="p-6 bg-gray-50/80 rounded-2xl border border-gray-100 mb-10">
            <h5 className="text-[10px] font-black text-[#0A84FF] uppercase tracking-widest mb-4">Payment Receipts & Schedule</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div>
                  <p className="font-bold text-gray-800">Advance Payment (40%)</p>
                  <p className="text-[10px] text-gray-400">Ref: {booking.payment?.advanceRazorpayPaymentId || 'VERIFIED'}</p>
                </div>
                <span className="font-black text-emerald-600 text-sm">-{formatAmount(booking.payment?.advanceAmount)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div>
                  <p className="font-bold text-gray-800">Remaining Payment (60%)</p>
                  <p className="text-[10px] text-gray-400">Ref: {booking.payment?.remainingRazorpayPaymentId || (isFullyPaid ? 'PAID' : 'PENDING')}</p>
                </div>
                <span className={`font-black text-sm ${isFullyPaid ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {isFullyPaid ? `-${formatAmount(booking.payment?.remainingAmount)}` : formatAmount(booking.payment?.remainingAmount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200/80">
              <span className="text-xs font-black uppercase text-gray-900">Balance Amount Due</span>
              <span className={`text-base font-black ${isFullyPaid ? 'text-gray-400' : 'text-red-600'}`}>
                {formatAmount(isFullyPaid ? 0 : booking.payment?.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Marketplace Footer & Support Information */}
          <div className="pt-8 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div>
                <p className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                  <IoRibbonOutline className="text-[#0A84FF]" /> Thank you for choosing Jaladhaara!
                </p>
                <p className="text-[11px] text-gray-400 mb-2">This is a system-generated invoice and does not require a physical signature.</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-[#0A84FF]">
                  <a href="https://jaladhaaraapp.in/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Refund Policy</a>
                  <span>•</span>
                  <a href="https://jaladhaaraapp.in/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
                </div>
              </div>
              <div className="sm:text-right space-y-1 text-[11px]">
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
                .rounded-\\[24px\\] {
                    border-radius: 0 !important;
                }
            }
          `}} />
      </div>
    </div>
  );
}
