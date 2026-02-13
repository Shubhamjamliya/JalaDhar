import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoWaterOutline,
  IoChevronBackOutline
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
    BILLING_COMPANY_NAME: "JalaDhar Tech Pvt Ltd",
    BILLING_ADDRESS: "123, Water Tower Complex,\nNear Borewell Circle, Civil Lines,\nRaipur, Chhattisgarh - 492001",
    BILLING_GSTIN: "22AAAAA0000A1Z5",
    BILLING_PHONE: "+91 98765 43210",
    BILLING_EMAIL: "billing@jaladhar.com"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();
  const invoiceRef = useRef();
  const isVendor = location.pathname.startsWith('/vendor');

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load booking and settings in parallel
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
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) return <LoadingSpinner message="Generating invoice view..." />;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Controls - Sticky like survey report */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 mb-8 flex items-center justify-between shadow-sm print:hidden">
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            <IoPrintOutline className="text-xl" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <PDFDownloadLink
            document={<InvoicePDF booking={booking} billingInfo={billingInfo} />}
            fileName={`Invoice-${bookingId.slice(-6).toUpperCase()}.pdf`}
            className="flex items-center gap-2 px-6 py-2 bg-[#0A84FF] text-white rounded-lg font-bold shadow-md hover:bg-[#005BBB] transition-all active:scale-95"
          >
            {({ loading }) => (
              <>
                <IoDownloadOutline className={`text-xl ${loading ? 'animate-bounce' : ''}`} />
                <span>{loading ? "Preparing..." : "Download PDF"}</span>
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Invoice Document Wrapper */}
        <div
          ref={invoiceRef}
          className="bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[12px] md:rounded-[32px] overflow-hidden p-6 sm:p-12 print:border-0 print:shadow-none print:p-0"
        >
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#0A84FF] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                  <IoWaterOutline className="text-3xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">JalaDhar</h1>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Expert Water Solutions</p>
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-gray-900 mb-2">INVOICE</h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
                  ID: <span className="text-gray-900">JD-{booking._id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
                  Date: <span className="text-gray-900">{new Date(invoiceDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${booking.payment?.remainingPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                <IoCheckmarkCircleOutline />
                <span className="text-xs font-black uppercase tracking-widest">
                  {booking.payment?.remainingPaid ? 'Fully Paid' : 'Partially Paid'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-900 uppercase">{billingInfo.BILLING_COMPANY_NAME}</h3>
                <p className="text-xs text-gray-500 whitespace-pre-line">
                  {billingInfo.BILLING_ADDRESS}
                </p>
                <p className="text-xs font-bold text-blue-600 mt-2">GSTIN: {billingInfo.BILLING_GSTIN}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-12 py-12 border-y border-gray-50">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Billed To</p>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{booking.user?.name}</h4>
              <div className="space-y-1 text-sm text-gray-600 font-medium">
                <p>{booking.user?.phone}</p>
                <p>{booking.user?.email}</p>
                <p className="mt-4 pt-4 border-t border-gray-50 text-[13px] leading-relaxed">
                  {(() => {
                    const a = booking.address;
                    return `${a.street || ''}, ${a.village || ''}, ${a.city || ''}, ${a.district || ''}, ${a.state || ''} - ${a.pincode || ''}`;
                  })()}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Assigned Expert</p>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{booking.vendor?.name || 'Assigned Expert'}</h4>
              <div className="space-y-1 text-sm text-gray-600 font-medium">
                <p>Vendor ID: V-{booking.vendor?._id?.slice(-6).toUpperCase() || 'REF-N/A'}</p>
                <p>Service: {booking.service?.name}</p>
                <p className="mt-4 pt-4 border-t border-gray-50">
                  Visit Date: {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="mb-12">
            <div className="w-full mb-6">
              <div className="flex font-black text-[10px] text-blue-600 uppercase tracking-widest pb-4 border-b-2 border-gray-900">
                <div className="flex-[3]">Description</div>
                <div className="flex-1 text-right">Amount</div>
              </div>

              <div className="py-4 space-y-4">
                <div className="flex items-center text-sm">
                  <div className="flex-[3]">
                    <p className="font-bold text-gray-800">{booking.service?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Base professional service fee for water detection</p>
                  </div>
                  <div className="flex-1 text-right font-bold text-gray-900">{formatAmount(booking.payment?.baseServiceFee)}</div>
                </div>

                <div className="flex items-center text-sm">
                  <div className="flex-[3]">
                    <p className="font-bold text-gray-800">Travel & Mobilization</p>
                    <p className="text-xs text-gray-500 mt-1">Calculated for {booking.payment?.distance?.toFixed(1)}km round trip</p>
                  </div>
                  <div className="flex-1 text-right font-bold text-gray-900">{formatAmount(booking.payment?.travelCharges)}</div>
                </div>
              </div>
            </div>

            {/* Summary Block */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
              <div className="w-full sm:w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-gray-900 font-bold">{formatAmount((booking.payment?.baseServiceFee || 0) + (booking.payment?.travelCharges || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">GST (18%)</span>
                  <span className="text-gray-900 font-bold">{formatAmount(booking.payment?.gst)}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-y-2 border-gray-900 mt-4">
                  <span className="text-lg font-black text-gray-900">TOTAL</span>
                  <span className="text-2xl font-black text-[#0A84FF]">{formatAmount(booking.payment?.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-20 pt-12 border-t border-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment History</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-[11px] font-bold text-gray-500">Advance (40%)</span>
                    <span className="text-xs font-black text-emerald-600">-{formatAmount(booking.payment?.advanceAmount)}</span>
                  </div>
                  {booking.payment?.remainingPaid && (
                    <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-[11px] font-bold text-gray-500">Remaining (60%)</span>
                      <span className="text-xs font-black text-emerald-600">-{formatAmount(booking.payment?.remainingAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-3 py-2 font-black">
                    <span className="text-[11px] text-gray-900 uppercase">Balance Due</span>
                    <span className={`text-sm ${booking.payment?.remainingPaid ? 'text-gray-400' : 'text-orange-600'}`}>
                      {formatAmount(booking.payment?.remainingPaid ? 0 : booking.payment?.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sm:text-right flex flex-col justify-end">
                <p className="text-sm font-bold text-gray-800 mb-1 tracking-tight italic">Thank you for your business!</p>
                <p className="text-[10px] text-gray-400 font-medium">This is a computer generated invoice and does not require a physical signature.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Specific CSS */}
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
                        margin: 2cm;
                        size: A4;
                    }
                    .rounded-[32px] {
                        border-radius: 0 !important;
                    }
                }
            `}} />
      </div>
    </div>
  );
}
