import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { getBookingDetails } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SurveyReportPDF from "../components/SurveyReportPDF";

export default function UserSurveyReport() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
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
      const response = await getBookingDetails(bookingId);
      if (response.success) {
        if (!response.data.booking.report) {
          setError("Survey report has not been uploaded yet for this booking.");
        } else {
          setBooking(response.data.booking);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Controls */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 mb-6 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-semibold"
        >
          <IoChevronBackOutline className="text-xl" />
          <span>Back</span>
        </button>
        <div className="flex gap-3">
          {booking && (
            <PDFDownloadLink
              document={<SurveyReportPDF booking={booking} />}
              fileName={`Survey_Report_${bookingId.slice(-6).toUpperCase()}.pdf`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
            >
              {({ loading }) => (
                <>
                  <IoDownloadOutline className="text-xl" />
                  <span>{loading ? "Preparing..." : "Download PDF"}</span>
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Report Content Container */}
      <div className="max-w-4xl mx-auto px-4">
        <div
          className="bg-white shadow-[0_0_40px_rgba(0,0,0,0.05)] rounded-[4px] p-5 md:p-12 text-gray-800 font-serif leading-relaxed"
          style={{ minHeight: 'auto' }}
        >
          {/* Top Prominent Status */}
          <div className={`mb-8 p-6 rounded-xl text-center shadow-sm border-2 ${report.waterFound === "true" || report.waterFound === true ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"}`}>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              {report.waterFound === "true" || report.waterFound === true ? "✓ Water Found - Positive Result" : "✕ Water Not Found - Negative Result"}
            </h2>
            <p className="text-white/80 text-sm font-bold mt-1 uppercase tracking-widest">Official Survey Outcome</p>
          </div>
          {/* Report Header */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-blue-600 pb-6 mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-blue-800 tracking-tighter mb-1">Jaladhaara</h1>
              <p className="text-xs md:text-sm font-sans font-bold text-gray-400 uppercase tracking-widest">Ground Water Detection Report</p>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <div className="bg-blue-50 px-3 py-1 rounded text-blue-700 font-sans font-bold text-xs mb-2 inline-block">
                ID: {booking._id.toUpperCase()}
              </div>
              <p className="text-sm text-gray-500 font-sans">Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Summary Ribbon */}
          <div className={`mb-10 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${report.waterFound === "true" || report.waterFound === true ? "bg-emerald-50 border-2 border-emerald-100" : "bg-red-50 border-2 border-red-100"}`}>
            <div className="flex items-center gap-3 w-full">
              {report.waterFound === "true" || report.waterFound === true ? (
                <IoCheckmarkCircleOutline className="text-4xl text-emerald-500 shrink-0" />
              ) : (
                <IoCloseCircleOutline className="text-4xl text-red-500 shrink-0" />
              )}
              <div>
                <p className="text-xs uppercase font-sans font-black text-gray-400">Survival Status</p>
                <h2 className={`text-xl md:text-2xl font-black ${report.waterFound === "true" || report.waterFound === true ? "text-emerald-700" : "text-red-700"}`}>
                  {report.waterFound === "true" || report.waterFound === true ? "POTENTIAL SOURCE LOCATED" : "NO WATER SOURCE DETECTED"}
                </h2>
              </div>
            </div>
          </div>

          {/* 1. Customer & Location Info */}
          <section className="mb-10">
            <h3 className="section-title mb-4 flex items-center gap-2 text-lg md:text-xl font-bold border-b border-gray-100 pb-2">
              <IoPersonOutline className="text-blue-600" />
              Client & Site Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 font-sans">
              <div className="detail-item">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Client Name</label>
                <p className="font-bold text-gray-800 break-words">{report.customerName || booking.user?.name}</p>
              </div>
              <div className="detail-item">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Site Address</label>
                <p className="font-bold text-gray-800 break-words">
                  {report.village}, {report.mandal}, {report.district}, {report.state}
                </p>
              </div>
              <div className="detail-item">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Survey Number</label>
                <p className="font-bold text-gray-800 break-words">{report.surveyNumber || "N/A"}</p>
              </div>
              <div className="detail-item">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Land Extent</label>
                <p className="font-bold text-gray-800 break-words">{report.extent || "N/A"}</p>
              </div>
            </div>
          </section>

          {/* 2. Geological Analysis */}
          <section className="mb-10">
            <h3 className="section-title mb-4 flex items-center gap-2 text-lg md:text-xl font-bold border-b border-gray-100 pb-2">
              <IoMapOutline className="text-blue-600" />
              Geological Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 font-sans bg-gray-50 p-4 md:p-6 rounded-xl">
              <div className="detail-item">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Rock Formation</label>
                <p className="font-bold text-gray-800 break-words">{report.rockType || "Not Specified"}</p>
              </div>
              <div className="detail-item">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Surface Soil Type</label>
                <p className="font-bold text-gray-800 break-words">{report.soilType || "Not Specified"}</p>
              </div>
              <div className="detail-item col-span-1 md:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Historical Context (Existing Borewells)</label>
                <p className="text-sm text-gray-600 italic break-words">
                  {report.existingBorewellDetails || "No existing borewell data provided."}
                </p>
              </div>
            </div>
          </section>

          {/* 3. Survey Recommendations */}
          <section className="mb-10">
            <h3 className="section-title mb-4 flex items-center gap-2 text-lg md:text-xl font-bold border-b border-gray-100 pb-2">
              <IoConstructOutline className="text-blue-600" />
              Technical Recommendations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 font-sans">
              <div className="p-3 md:p-4 border border-gray-100 rounded-lg text-center bg-gray-50/50">
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Recommended Point</label>
                <div className="text-xl md:text-2xl font-black text-blue-600">#{report.recommendedPointNumber || "1"}</div>
              </div>
              <div className="p-3 md:p-4 border border-gray-100 rounded-lg text-center bg-gray-50/50">
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Expected Depth</label>
                <div className="text-xl md:text-2xl font-black text-blue-600">{report.recommendedDepth || "--"} ft</div>
              </div>
              <div className="p-3 md:p-4 border border-gray-100 rounded-lg text-center bg-gray-50/50 col-span-2 md:col-span-1">
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Casing Depth</label>
                <div className="text-xl md:text-2xl font-black text-blue-600">{report.recommendedCasingDepth || "--"} ft</div>
              </div>
              <div className="detail-item col-span-2 md:col-span-1">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Estimated Yield</label>
                <p className="font-bold text-gray-800 text-lg">{report.expectedYield || "--"} Inches</p>
              </div>
              <div className="detail-item col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black block">Target Fracture Depths</label>
                <p className="font-bold text-gray-800 break-words">{report.expectedFractureDepths || "Will be determined during drilling"}</p>
              </div>
            </div>
          </section>

          {/* 4. Notes & Observations */}
          <section className="mb-10 bg-blue-50/30 p-4 md:p-6 rounded-xl border border-blue-50 font-sans">
            <h3 className="text-sm uppercase font-black text-blue-800 mb-2">Expert Observations</h3>
            <p className="text-gray-700 leading-relaxed italic text-sm break-words">
              "{report.notes || "No additional specific observations noted for this location."}"
            </p>
          </section>

          {/* 5. Site Signatures */}
          <div className="mt-8 md:mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-end font-sans gap-8">
            <div className="w-full md:w-auto">
              <p className="text-[10px] text-gray-400 uppercase font-black">Reported by (Vendor)</p>
              <p className="text-lg md:text-xl font-black italic text-gray-800 underline decoration-blue-200">{vendor.name}</p>
              <p className="text-xs text-gray-500">{vendor.experience} Years Experience • Expert ID: {vendor._id?.slice(-8).toUpperCase()}</p>
            </div>
            <div className="text-center w-full md:w-auto flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center mb-1">
                <span className="text-[10px] text-gray-300 font-bold uppercase">Seal Here</span>
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">JalaDhar Verified</p>
            </div>
          </div>

          {/* Disclaimer Footnote */}
          <div className="mt-8 md:mt-12 pt-8 text-[9px] text-gray-400 font-sans text-center border-t border-gray-50">
            <p>Disclaimer: This survey report is based on technical readings and geological analysis at the time of visit. Actual results may vary during drilling. Jaladhaara connects you with experts but the physical outcome depends on natural water table conditions.</p>
            <p className="mt-1">© {new Date().getFullYear()} Jaladhaara Water Resources Management. All rights reserved.</p>
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
