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
import { getBookingDetails as getUserBookingDetails, submitReportFeedback } from "../../../services/bookingApi";
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
  
  // Feedback state
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null); // true for thumbs up, false for thumbs down

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
          // Initialize feedback state if already submitted
          if (b.report.feedback && typeof b.report.feedback.isUseful === 'boolean') {
            setFeedbackState(b.report.feedback.isUseful);
          }
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

  const getGoogleMapCoords = (latVal, lngVal) => {
    if (latVal === undefined || lngVal === undefined || latVal === null || lngVal === null) return null;
    let numLat = parseFloat(latVal);
    let numLng = parseFloat(lngVal);
    if (isNaN(numLat) || isNaN(numLng) || (numLat === 0 && numLng === 0)) return null;

    // Detect swapped coordinates where Lat is Lng (e.g. lat: 78.48, lng: 17.38)
    if ((numLat >= 68 && numLat <= 97) && (numLng >= 6 && numLng <= 37)) {
      const temp = numLat;
      numLat = numLng;
      numLng = temp;
    }

    // Sanitize out-of-bounds ocean coordinates (e.g. lat: 121, lng: 12) to India survey region
    if (numLat > 37 || numLat < 6) {
      numLat = 17.3850;
    }
    if (numLng > 97 || numLng < 68) {
      numLng = 78.4867;
    }

    return { lat: numLat, lng: numLng };
  };

  const mapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const getStaticMapUrl = (latVal, lngVal) => {
    if (latVal === undefined || lngVal === undefined || latVal === null || lngVal === null) return null;
    let numLat = parseFloat(latVal);
    let numLng = parseFloat(lngVal);
    if (isNaN(numLat) || isNaN(numLng) || (numLat === 0 && numLng === 0)) return null;

    // Auto-correct swapped coordinates if latitude > 90 (e.g. lat: 121, lng: 12 -> lat: 12, lng: 121)
    if (Math.abs(numLat) > 90 && Math.abs(numLng) <= 90) {
      const temp = numLat;
      numLat = numLng;
      numLng = temp;
    }

    // Clamp coordinates to valid Web Mercator bounds [-85.05112878, 85.05112878]
    if (Math.abs(numLat) > 85.05112878) {
      numLat = numLat > 0 ? 85.05112878 : -85.05112878;
    }
    if (Math.abs(numLng) > 180) {
      numLng = ((numLng + 180) % 360) - 180;
    }

    if (mapApiKey) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${numLat},${numLng}&zoom=14&size=600x300&maptype=hybrid&markers=color:red%7Clabel:B%7C${numLat},${numLng}&key=${mapApiKey}`;
    }

    // ESRI World Imagery Tile (CORS-enabled with Access-Control-Allow-Origin: *)
    const zoom = 14;
    const latRad = (numLat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((numLng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);

    if (isNaN(x) || isNaN(y)) return null;
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  };

  const staticMapUrl = getStaticMapUrl(report.surveyRecommendations?.latitude, report.surveyRecommendations?.longitude);

  const fractureDepths = report.expectedFractureDepths ? report.expectedFractureDepths.split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : [];
  
  const handleFeedback = async (isUseful) => {
    if (feedbackState === isUseful || location.pathname.startsWith('/vendor')) return; // Prevent duplicate clicks or vendor clicking
    
    // Optimistic UI Update for instant animation
    const previousState = feedbackState;
    setFeedbackState(isUseful);
    setIsSubmittingFeedback(true);
    
    try {
      await submitReportFeedback(bookingId, isUseful);
      toast.showSuccess("Thank you for your feedback!");
    } catch (err) {
      // Revert if failed
      setFeedbackState(previousState);
      toast.showError("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full px-2 sm:px-0">
        
        {/* Main Card */}
        <div className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[24px] overflow-hidden border border-gray-100 font-sans mb-8">
          
          {/* Header */}
          <div className="p-5 sm:p-8 bg-gradient-to-b from-blue-50/50 to-white border-b border-gray-100/80">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#102353]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.69L19.5 13.94C21.1 16.34 20.35 19.54 17.86 20.97C15.37 22.4 12.06 22.15 9.87 20.35C8.01 18.82 7.15 16.42 7.7 14.15L12 2.69Z" stroke="#0A84FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.5 14C15.5 14 13.5 17 12 17C10.5 17 10.5 15.5 10.5 15.5" stroke="#0A84FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h1 className="text-[28px] font-extrabold tracking-tight">Jaladhaara</h1>
                  </div>
                  <p className="text-[11px] font-bold text-[#0A84FF] uppercase tracking-widest mt-0.5">Digital Survey Report</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center border border-gray-200 bg-white/80 backdrop-blur-xs rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-[#102353]">
                    Report ID: {booking._id.slice(-8).toUpperCase()}
                  </div>
                  {booking && (
                    <PDFDownloadLink
                      document={<SurveyReportPDF booking={booking} />}
                      fileName={`Survey_Report_${bookingId.slice(-8).toUpperCase()}.pdf`}
                      className="flex items-center gap-2 bg-[#0A84FF] text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-[#0070DF] transition-all active:scale-95 text-xs sm:text-sm whitespace-nowrap"
                    >
                      {({ loading }) => (
                        <>
                          <IoDownloadOutline className="text-base sm:text-lg" />
                          <span>{loading ? "Preparing..." : "Download PDF"}</span>
                        </>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-gray-500 pt-3 border-t border-gray-100">
                <span>Issued: {formatDate(booking.createdAt)}</span>
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                  <IoCheckmarkCircleOutline className="text-sm" /> Verified Report
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-8 space-y-10">
            
            {/* Outcome Banner */}
            <div className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 border ${isWaterFound ? "bg-[#ECFDF5] border-[#D1FAE5]" : "bg-[#FEF2F2] border-[#FEE2E2]"}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${isWaterFound ? "bg-white border-[#10B981] text-[#10B981]" : "bg-white border-[#EF4444] text-[#EF4444]"}`}>
                {isWaterFound ? <IoCheckmarkCircleOutline className="text-3xl" /> : <IoCloseCircleOutline className="text-3xl" />}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isWaterFound ? "text-[#047857]" : "text-[#B91C1C]"}`}>Official Survey Outcome</p>
                <h2 className={`text-xl font-black ${isWaterFound ? "text-[#065F46]" : "text-[#991B1B]"}`}>
                  {isWaterFound ? "Recommended Borewell Location Identified" : "No Suitable Groundwater Potential Identified"}
                </h2>
              </div>
            </div>

            {/* Client & Site Details */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#102353] mb-4 pb-2 border-b border-gray-100">
                <IoPersonOutline className="text-[#0A84FF]" /> Client & Site Details
              </h3>
              <div className="bg-[#F9FAFB] p-5 sm:p-6 rounded-2xl border border-gray-100 grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="col-span-2 sm:col-span-1 flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Client Name</label>
                  <p className="font-bold text-gray-900 mt-auto">{report.customerName || booking.user?.name}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Booking ID</label>
                  <p className="font-bold text-gray-900 mt-auto">{booking._id.toUpperCase()}</p>
                </div>
                <div className="col-span-2 flex flex-col pt-2 border-t border-gray-200/60">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Site Address</label>
                  <p className="font-bold text-gray-900 mt-auto">{formatAddress(report)}</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Survey No.</label>
                  <p className="font-bold text-gray-900 mt-auto">{report.surveyNumber || "N/A"}</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Extent</label>
                  <p className="font-bold text-gray-900 mt-auto">{formatAcresGuntasDisplay(report.extent)}</p>
                </div>
                {report.surveyRecommendations?.latitude && (
                  <div className="col-span-2 flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">GPS Coordinates</label>
                    <p className="font-bold text-[#0A84FF] mt-auto">{report.surveyRecommendations.latitude}, {report.surveyRecommendations.longitude}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Geological Profile */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#102353] mb-4 pb-2 border-b border-gray-100">
                <IoMapOutline className="text-[#0A84FF]" /> Geological Profile
              </h3>
              <div className="bg-[#F9FAFB] p-5 sm:p-6 rounded-2xl border border-gray-100 grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Rock Formation</label>
                  <p className="font-bold text-gray-900 mt-auto">{report.geologicalInfo?.rockType || "-"}</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Surface Soil</label>
                  <p className="font-bold text-gray-900 mt-auto">{report.geologicalInfo?.soilType || "-"}</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Terrain Type</label>
                  <p className="font-bold text-gray-900 mt-auto">{report.geologicalInfo?.terrainType || "-"}</p>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Weathered Zone (ft)</label>
                  <p className="font-bold text-gray-900 mt-auto">{report.geologicalInfo?.weatheredZone || "-"}</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-gray-200/60 flex flex-col">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-3">Nearby Borewell Observations</label>
                  <p className="text-sm font-medium text-gray-700 italic bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    "{report.existingBorewellDetails || "No existing borewell observations provided."}"
                  </p>
                </div>
              </div>
            </section>

            {/* Technical Recommendations */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#102353] mb-4 pb-2 border-b border-gray-100">
                <IoConstructOutline className="text-[#0A84FF]" /> Technical Recommendations
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-2xl text-center flex flex-col justify-center shadow-sm">
                  <label className="text-[10px] text-blue-600 font-black uppercase tracking-widest block mb-2">Rec. Point No.</label>
                  <div className="text-3xl font-black text-blue-900">#{report.surveyRecommendations?.recommendedPointNumber || "1"}</div>
                </div>
                <div className="p-5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center flex flex-col justify-center shadow-sm">
                  <label className="text-[10px] text-emerald-600 font-black uppercase tracking-widest block mb-2">Expected Yield</label>
                  <div className="text-3xl font-black text-emerald-900">{report.surveyRecommendations?.expectedYield || "--"} <span className="text-base font-bold text-emerald-600">in</span></div>
                </div>
                <div className="p-5 bg-[#F9FAFB] border border-gray-100 rounded-2xl text-center flex flex-col justify-center shadow-sm">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Rec. Borewell Depth</label>
                  <div className="text-2xl font-black text-gray-900">{report.surveyRecommendations?.recommendedBoreDepth || "--"} <span className="text-base font-bold text-gray-500">ft</span></div>
                </div>
                <div className="p-5 bg-[#F9FAFB] border border-gray-100 rounded-2xl text-center flex flex-col justify-center shadow-sm">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Rec. Casing Length</label>
                  <div className="text-2xl font-black text-gray-900">{report.surveyRecommendations?.recommendedCasingDepth || "--"} <span className="text-base font-bold text-gray-500">ft</span></div>
                </div>
                
                <div className="col-span-2 p-5 bg-purple-50/40 border border-purple-100 rounded-2xl mt-1">
                  <label className="text-[10px] text-purple-600 font-black uppercase tracking-widest block mb-3">Expected Water-Bearing Fracture Zones</label>
                  {fractureDepths.length > 0 ? (
                    <div className="space-y-2">
                      {fractureDepths.map((depth, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-purple-50">
                          <IoWaterOutline className="text-purple-400" />
                          <span className="font-extrabold text-purple-900">{depth.includes('ft') ? depth : `${depth} ft`}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-bold text-purple-900">To be determined during drilling</p>
                  )}
                </div>
              </div>
            </section>

            {/* Drilling Instructions */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#102353] mb-4 pb-2 border-b border-gray-100">
                <IoDocumentTextOutline className="text-orange-500" /> Drilling Instructions
              </h3>
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-1.5 rounded-full mt-0.5"><IoCloseCircleOutline className="text-orange-600 text-sm" /></div>
                  <p className="font-semibold text-gray-800 text-sm">
                    Stop drilling after <span className="font-bold text-orange-600 px-1">{report.drillingInstructions?.stopDrillingDepth || "___"} ft</span> if no fracture is encountered.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-1.5 rounded-full mt-0.5"><IoCheckmarkCircleOutline className="text-orange-600 text-sm" /></div>
                  <p className="font-semibold text-gray-800 text-sm">
                    Flush borewell before yield testing{report.drillingInstructions?.flushBorewell ? " (Recommended)" : ""}.
                  </p>
                </div>
              </div>
            </section>

            {/* Professional Remarks */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#102353] mb-4 pb-2 border-b border-gray-100">
                <IoDocumentTextOutline className="text-[#0A84FF]" /> Professional Remarks
              </h3>
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-gray-100 shadow-inner">
                <p className="text-gray-700 leading-relaxed text-sm font-medium italic">
                  "{report.notes || "No additional specific remarks noted for this location."}"
                </p>
              </div>
            </section>

            {/* Google Map View Section */}
            {(() => {
              const coords = getStaticMapUrl ? getGoogleMapCoords(report.surveyRecommendations?.latitude, report.surveyRecommendations?.longitude) : null;
              if (!coords) return null;
              const embedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=18&output=embed`;

              return (
                <section className="mt-8">
                  <h3 className="flex items-center gap-2 text-lg sm:text-xl font-black text-[#102353] mb-4 pb-2 border-b border-slate-100 tracking-tight">
                    <IoLocationOutline className="text-[#0A84FF] text-2xl" />
                    <span>Survey Location Map</span>
                  </h3>
                  <div className="rounded-[24px] overflow-hidden border border-slate-200/90 bg-slate-100 relative h-64 sm:h-80 shadow-md group">
                    <iframe
                      title="Google Map Survey Location"
                      src={embedUrl}
                      className="w-full h-full border-0 rounded-[24px]"
                      loading="lazy"
                      allowFullScreen
                    />
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-md flex items-center gap-2 z-10 pointer-events-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                      <span className="text-xs font-extrabold text-slate-800 tracking-tight">📍 Recommended Borewell Point</span>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Site Evidence */}
            {report.images && report.images.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#102353] mb-4 pb-2 border-b border-gray-100">
                  <IoDocumentTextOutline className="text-[#0A84FF]" /> Site Evidence
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.images.map((img, i) => {
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                          <img src={img.url || img} alt={`Site Evidence ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" crossOrigin="anonymous" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Expert Verification */}
            <section className="mt-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-5">
                <IoCheckmarkCircleOutline className="text-9xl text-blue-600" />
              </div>
              
              <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Survey Conducted By</h3>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div>
                  <p className="text-2xl font-black text-gray-900 mb-1">{vendor.name}</p>
                  <p className="text-sm font-semibold text-gray-600 mb-0.5">Qualification: {vendor.qualification || "Hydrogeologist"}</p>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Experience: {vendor.experience || "-"} Years</p>
                  <p className="text-[11px] font-bold text-gray-400">Expert ID: {vendor._id?.slice(-8).toUpperCase()}</p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">Survey Date: {formatDate(booking.createdAt)}</p>
                </div>
                
                <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                  <div className="w-32 h-12 border-b-2 border-blue-600/30 flex items-end justify-center pb-1">
                    <span className="font-['Caveat'] text-2xl text-blue-900 italic transform -rotate-2">{vendor.name}</span>
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Digital Signature</p>
                  <div className="flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                    <IoCheckmarkCircleOutline className="text-sm" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Verified by Jaladhaara</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Customer Action Section */}
        <div className="bg-[#0A84FF] text-white rounded-[24px] p-8 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <IoConstructOutline className="text-8xl" />
          </div>
          <h3 className="text-xl font-extrabold mb-4">Next Steps for Customer</h3>
          <ul className="space-y-3 font-medium text-sm md:text-base relative z-10">
            <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</div> Share this report with your drilling contractor.</li>
            <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div> Drill at the recommended point.</li>
            <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div> Complete drilling as per the recommended depth.</li>
            <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">4</div> Update the drilling outcome in the Jaladhaara app.</li>
          </ul>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 mb-8 text-center">
          <h3 className="text-lg font-extrabold text-gray-900 mb-2">Rate Expert</h3>
          <p className="text-sm font-medium text-gray-500 mb-6">Was this report useful?</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => handleFeedback(true)}
              disabled={isSubmittingFeedback || location.pathname.startsWith('/vendor')}
              className={`flex flex-col items-center gap-2 group p-2 rounded-xl border-2 transition-all ${feedbackState === true ? 'border-[#0A84FF] bg-blue-50/30' : 'border-transparent'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${feedbackState === true ? 'bg-white shadow-sm' : 'bg-gray-50 border-2 border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:scale-110'}`}>
                👍
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${feedbackState === true ? 'text-[#0A84FF]' : 'text-gray-400 group-hover:text-emerald-600'}`}>Yes</span>
            </button>
            <button 
              onClick={() => handleFeedback(false)}
              disabled={isSubmittingFeedback || location.pathname.startsWith('/vendor')}
              className={`flex flex-col items-center gap-2 group p-2 rounded-xl border-2 transition-all ${feedbackState === false ? 'border-[#0A84FF] bg-blue-50/30' : 'border-transparent'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${feedbackState === false ? 'bg-white shadow-sm' : 'bg-gray-50 border-2 border-gray-100 group-hover:bg-red-50 group-hover:border-red-200 group-hover:scale-110'}`}>
                👎
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${feedbackState === false ? 'text-[#0A84FF]' : 'text-gray-400 group-hover:text-red-600'}`}>No</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center px-4 mb-8">
          <p className="text-[10px] leading-relaxed text-gray-400 font-medium">
            Disclaimer: This report is based on geophysical survey data, geological interpretation, and field observations conducted on the survey date. Groundwater occurrence is a natural phenomenon and cannot be guaranteed. Actual drilling results may vary due to local geological conditions, drilling practices, seasonal groundwater fluctuations, and other subsurface factors. Jaladhaara acts only as a technology platform connecting customers with independent survey experts and is not responsible for drilling outcomes.
          </p>
        </div>

      </div>
    </div>
  );
}
