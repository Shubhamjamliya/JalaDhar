import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  IoChevronBackOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoWaterOutline,
  IoConstructOutline,
  IoMapOutline
} from "react-icons/io5";
import { getBookingDetails as getUserBookingDetails } from "../../../services/bookingApi";
import { getBookingDetails as getVendorBookingDetails } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SurveyReportPDF from "../components/SurveyReportPDF";
import { formatAcresGuntasDisplay } from "../../../utils/landAreaHelper";

export default function UserSurveyReport() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [bookingId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const isVendor = location.pathname.startsWith('/vendor');
      const apiCall = isVendor ? getVendorBookingDetails : getUserBookingDetails;
      const response = await apiCall(bookingId);
      if (response.success) {
        const b = response.data.booking;

        // Security Check: If user is trying to view report without payment
        if (!isVendor && !b.payment?.remainingPaid) {
          toast.showWarning("Please complete the remaining payment to access the report.");
          navigate(`/user/booking/${bookingId}/payment`, { replace: true });
          return;
        }

        if (!b.report) {
          setError("Survey report has not been uploaded yet for this booking.");
        } else {
          setBooking(b);
        }
      } else {
        setError(response.message || "Failed to load report");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching report data..." />;
  if (error) return (
    <div className="p-6">
      <ErrorMessage message={error} />
      <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 text-blue-600 font-bold">
        <IoChevronBackOutline /> Back
      </button>
    </div>
  );

  const report = booking.report || {};
  const vendor = booking.vendor || {};

  const isWaterFound = report.waterFound === "true" || report.waterFound === true;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatAddress = (reportObj) => {
    const parts = [reportObj.village, reportObj.mandal, reportObj.district, reportObj.state];
    const validParts = parts.filter(p => p && p.trim() !== "" && p.trim().toLowerCase() !== "undefined");
    // Remove consecutive duplicates
    const uniqueParts = validParts.filter((item, pos, self) => self.indexOf(item) === pos);
    return uniqueParts.join(', ') || "N/A";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 pt-6">
      {/* Report Content Container */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-xl sm:rounded-2xl overflow-hidden mb-8 border border-gray-100 font-sans">
          
          {/* Official Document Header */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 sm:p-6 md:p-10 border-b border-blue-100/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
                  <IoWaterOutline className="text-blue-600 text-3xl md:text-4xl" />
                  Jaladhaara
                </h1>
                <p className="text-xs md:text-sm font-bold text-blue-600 uppercase tracking-widest mt-1.5 ml-1">Digital Survey Report</p>
              </div>
              <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-50 text-blue-800 font-bold text-xs md:text-sm mb-3">
                   Report ID: {booking._id.slice(-8).toUpperCase()}
                </div>
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                  <p className="text-xs md:text-sm text-gray-500 font-semibold">Issued: {formatDate(booking.createdAt)}</p>
                  {booking && (
                    <PDFDownloadLink
                      document={<SurveyReportPDF booking={booking} />}
                      fileName={`Survey_Report_${bookingId.slice(-6).toUpperCase()}.pdf`}
                      className="flex items-center gap-1.5 bg-[#0A84FF] text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-[#0070DF] transition-all active:scale-95 text-xs md:text-sm"
                    >
                      {({ loading }) => (
                        <>
                          <IoDownloadOutline className="text-base md:text-lg" />
                          <span>{loading ? "Wait..." : "Download PDF"}</span>
                        </>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-10">
            {/* Unified Result Banner */}
            <div className={`mb-8 md:mb-10 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-6 border shadow-sm ${isWaterFound ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100" : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-100"}`}>
               <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner ${isWaterFound ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                 {isWaterFound ? <IoCheckmarkCircleOutline className="text-3xl md:text-4xl" /> : <IoCloseCircleOutline className="text-3xl md:text-4xl" />}
               </div>
               <div className="text-center md:text-left flex-1">
                 <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 opacity-80 ${isWaterFound ? "text-emerald-700" : "text-red-700"}`}>Official Survey Outcome</p>
                 <h2 className={`text-xl md:text-3xl font-black ${isWaterFound ? "text-emerald-800" : "text-red-800"}`}>
                   {isWaterFound ? "WATER SOURCE DETECTED" : "NO WATER SOURCE DETECTED"}
                 </h2>
               </div>
            </div>

            {/* Grid Layout for details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
               
               {/* Left Column */}
               <div className="space-y-8">
                  {/* Client & Site */}
                  <section>
                    <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 pb-2 border-b border-gray-100">
                      <IoPersonOutline className="text-blue-500 text-xl" />
                      Client & Site Details
                    </h3>
                    <div className="space-y-4 bg-gray-50/50 p-4 sm:p-5 rounded-xl border border-gray-100/50">
                      <div>
                        <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Client Name</label>
                        <p className="font-bold text-gray-900 text-sm md:text-base">{report.customerName || booking.user?.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Site Address</label>
                        <p className="font-bold text-gray-900 text-sm md:text-base leading-snug">{formatAddress(report)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Survey No.</label>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{report.surveyNumber || "N/A"}</p>
                         </div>
                         <div>
                            <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Extent</label>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{formatAcresGuntasDisplay(report.extent)}</p>
                         </div>
                      </div>
                    </div>
                  </section>

                  {/* Geological Analysis */}
                  <section>
                    <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 pb-2 border-b border-gray-100">
                      <IoMapOutline className="text-blue-500 text-xl" />
                      Geological Profile
                    </h3>
                    <div className="space-y-4 bg-gray-50/50 p-4 sm:p-5 rounded-xl border border-gray-100/50">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Rock Formation</label>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{report.rockType || "Not Specified"}</p>
                         </div>
                         <div>
                            <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Surface Soil</label>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{report.soilType || "Not Specified"}</p>
                         </div>
                      </div>
                      <div>
                        <label className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Historical Context</label>
                        <p className="text-sm font-medium text-gray-700 italic bg-white p-3 rounded-xl border border-gray-100">
                          {report.existingBorewellDetails || "No existing borewell data provided."}
                        </p>
                      </div>
                    </div>
                  </section>
               </div>

               {/* Right Column */}
               <div className="space-y-8">
                  {/* Technical Recommendations */}
                  <section>
                    <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                      <IoConstructOutline className="text-blue-500 text-xl" />
                      Technical Recommendations
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl text-center">
                        <label className="text-[9px] md:text-[10px] text-blue-600 font-black uppercase tracking-widest block mb-1">Drill Point</label>
                        <div className="text-2xl md:text-3xl font-black text-blue-900">#{report.recommendedPointNumber || "1"}</div>
                      </div>
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-center">
                        <label className="text-[9px] md:text-[10px] text-emerald-600 font-black uppercase tracking-widest block mb-1">Estimated Yield</label>
                        <div className="text-2xl md:text-3xl font-black text-emerald-900">{report.expectedYield || "--"} <span className="text-sm font-bold text-emerald-600">in</span></div>
                      </div>
                      <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-2xl text-center">
                        <label className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">Expected Depth</label>
                        <div className="text-xl md:text-2xl font-black text-gray-900">{report.recommendedDepth || "--"} <span className="text-sm font-bold text-gray-500">ft</span></div>
                      </div>
                      <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-2xl text-center">
                        <label className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">Casing Depth</label>
                        <div className="text-xl md:text-2xl font-black text-gray-900">{report.recommendedCasingDepth || "--"} <span className="text-sm font-bold text-gray-500">ft</span></div>
                      </div>
                      <div className="col-span-2 p-4 bg-purple-50/30 border border-purple-100/50 rounded-2xl">
                        <label className="text-[9px] md:text-[10px] text-purple-600 font-black uppercase tracking-widest block mb-1">Target Fracture Depths</label>
                        <p className="font-black text-purple-900 text-base md:text-lg">{report.expectedFractureDepths || "To be determined during drilling"}</p>
                      </div>
                    </div>
                  </section>

                  {/* Observations */}
                  <section>
                    <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 pb-2 border-b border-gray-100">
                      <IoDocumentTextOutline className="text-blue-500 text-xl" />
                      Expert Observations
                    </h3>
                    <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-xl border border-gray-100 shadow-inner">
                      <p className="text-gray-700 leading-relaxed text-sm font-medium italic">
                        "{report.notes || "No additional specific observations noted for this location."}"
                      </p>
                    </div>
                  </section>
               </div>
            </div>

            {/* Signatures & Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-[10px] md:text-[11px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Certified Expert</p>
                <p className="text-xl md:text-2xl font-black text-gray-900">{vendor.name}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1">{vendor.experience} Years Experience • ID: {vendor._id?.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-center order-1 sm:order-2">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-blue-600/20 bg-blue-50/50 flex flex-col items-center justify-center mb-2 mx-auto relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600 opacity-5 rotate-45 transform scale-150"></div>
                  <IoCheckmarkCircleOutline className="text-3xl md:text-4xl text-blue-600 mb-0.5" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-blue-800">Verified</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-10 pt-6 text-[9px] md:text-[10px] text-gray-400 font-semibold text-center border-t border-gray-50 leading-relaxed max-w-2xl mx-auto">
              <p>Disclaimer: This survey report is based on technical readings and geological analysis at the time of the visit. Actual results may vary during drilling. Jaladhaara connects you with certified experts, but the physical outcome inherently depends on natural groundwater conditions.</p>
              <p className="mt-2 text-gray-500 font-bold">© {new Date().getFullYear()} Jaladhaara. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Evidence Photos Section */}
        {report.images && report.images.length > 0 && (
          <div className="mt-8 mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 px-2">Site Evidence Photos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {report.images.map((img, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-white shadow-md border-2 border-white">
                  <img
                    src={img.url || img}
                    alt={`Site Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
