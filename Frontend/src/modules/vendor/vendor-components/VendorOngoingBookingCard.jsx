import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoCallOutline,
    IoLogoWhatsapp,
    IoNavigateOutline,
    IoKeyOutline,
    IoCameraOutline,
    IoDocumentTextOutline,
    IoEyeOutline,
    IoPersonOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoAlertCircleOutline,
    IoCarOutline,
    IoConstructOutline,
    IoCopyOutline,
    IoChevronForwardOutline,
    IoCloseOutline
} from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import { useNotifications } from "../../../contexts/NotificationContext";
import { updateVisitSchedule, getPublicNotificationSettings } from "../../../services/vendorApi";
import WhatsAppTemplateModal from "../../shared/components/WhatsAppTemplateModal";

/**
 * Ongoing Survey Booking Card for Expert App
 *
 * Structured Sections:
 * 1. Booking & Customer (Booking ID, Customer Name, Mobile Number)
 * 2. Survey & Site (Survey Category, Survey Purpose, Property Address, Survey Date & Time)
 * 3. Current Status (Advance Paid, En Route, Arrived, Survey Started, Survey Ongoing, Survey Completed, Report Uploaded, Awaiting Final Payment)
 * 4. Quick Actions (Call, WhatsApp, Navigate, Verify Start OTP, Verify End OTP, Upload Site Photos, Upload Survey Report, View Status)
 * 5. Direct 1-Hour Time Slot Picker Modal & Guard for Start Journey
 */
export default function VendorOngoingBookingCard({
    booking,
    onMarkEnRoute,
    onVerifyStartOTP,
    onVerifyEndOTP,
    onUploadPhotos,
    onUploadReport,
    onViewStatus,
    whatsappAssistantEnabled = true,
    templatesConfig = null
}) {
    const navigate = useNavigate();
    const toast = useToast();
    const { socket } = useNotifications();
    const gpsWatchIdRef = useRef(null);

    const [localOverride, setLocalOverride] = useState(null);
    const [showTimePickerModal, setShowTimePickerModal] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(whatsappAssistantEnabled);
    const [activeTemplatesConfig, setActiveTemplatesConfig] = useState(templatesConfig);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("09:00 AM - 10:00 AM");
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [pendingStartJourney, setPendingStartJourney] = useState(false);

    // Sync with props
    useEffect(() => {
        setIsWhatsAppEnabled(whatsappAssistantEnabled);
    }, [whatsappAssistantEnabled]);

    useEffect(() => {
        setActiveTemplatesConfig(templatesConfig);
    }, [templatesConfig]);

    // Self-fetch settings on mount
    useEffect(() => {
        getPublicNotificationSettings()
            .then(res => {
                if (res.success && Array.isArray(res.data?.settings)) {
                    const assistantSetting = res.data.settings.find(s => s.key === 'ENABLE_VENDOR_WHATSAPP_ASSISTANT');
                    if (assistantSetting !== undefined) {
                        setIsWhatsAppEnabled(Boolean(assistantSetting.value));
                    }
                    const tmplSetting = res.data.settings.find(s => s.key === 'WHATSAPP_TEMPLATES_CONFIG');
                    if (tmplSetting?.value) {
                        setActiveTemplatesConfig(tmplSetting.value);
                    }
                }
            })
            .catch(() => {});
    }, []);

    // Reset local override whenever parent prop booking changes
    useEffect(() => {
        setLocalOverride(null);
    }, [booking?._id, booking?.scheduledDate, booking?.scheduledTime, booking?.rescheduleCount, booking?.status]);

    // Sockets and rooms rely on the internal MongoDB _id
    const currentBooking = localOverride ? { ...booking, ...localOverride } : (booking || {});
    const bookingId = currentBooking?._id;
    const status = (currentBooking?.status || currentBooking?.vendorStatus || "").toUpperCase();
    const isEnRoute = status === "EN_ROUTE";
    const userId = currentBooking?.user?._id;

    // ── GPS Streaming: Auto-broadcast live location when EN_ROUTE ──────────────
    useEffect(() => {
        if (!socket || !bookingId || !isEnRoute) {
            // Clear watcher if no longer en route
            if (gpsWatchIdRef.current !== null) {
                navigator.geolocation?.clearWatch(gpsWatchIdRef.current);
                gpsWatchIdRef.current = null;
            }
            return;
        }

        if (!("geolocation" in navigator)) {
            console.warn("[VendorCard] Geolocation not supported on this device");
            return;
        }

        console.log("[VendorCard] 📍 Starting live GPS stream for booking:", bookingId);

        // Join the booking tracking room as the sender too
        socket.emit("join_booking_tracking", bookingId);

        // Function to fetch and emit current position via Socket
        const emitCurrentLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude, speed, heading } = pos.coords;
                    const payload = {
                        bookingId,
                        lat: latitude,
                        lng: longitude,
                        speed: speed ? Math.round(speed * 3.6) : 30,
                        heading: heading || 0,
                        userId,
                    };
                    socket.emit("vendor_location_update", payload);
                    console.log(`[VendorCard] 🚗 Emitted 5s location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                },
                (err) => console.warn("[VendorCard] GPS error:", err.message),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        };

        // 1. Emit location immediately when journey starts
        emitCurrentLocation();

        // 2. Interval loop — emit location every 5 seconds guaranteed
        const intervalId = setInterval(emitCurrentLocation, 5000);

        // 3. Geolocation watch — emit immediately on motion changes
        gpsWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, speed, heading } = pos.coords;
                const payload = {
                    bookingId,
                    lat: latitude,
                    lng: longitude,
                    speed: speed ? Math.round(speed * 3.6) : 30,
                    heading: heading || 0,
                    userId,
                };
                socket.emit("vendor_location_update", payload);
            },
            (err) => console.warn("[VendorCard] Watch GPS error:", err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => {
            clearInterval(intervalId);
            if (gpsWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(gpsWatchIdRef.current);
                gpsWatchIdRef.current = null;
                console.log("[VendorCard] 🛑 GPS stream stopped");
            }
        };
    }, [socket, bookingId, isEnRoute, userId]);

    if (!currentBooking) return null;

    // Format Booking ID
    const rawId = currentBooking.bookingId || currentBooking._id;
    const formattedBookingId = rawId ? `ID: ${rawId.toString().slice(-8).toUpperCase()}` : "ID: N/A";

    // Customer Info
    const customerName = currentBooking.user?.name || "Customer";
    const customerPhone = currentBooking.user?.phone || currentBooking.user?.mobileNumber || currentBooking.phone || "";

    // Survey Details
    const surveyCategory = currentBooking.service?.category?.name || currentBooking.service?.name || "Hydrogeological Groundwater Survey";
    const surveyPurpose = currentBooking.service?.description || currentBooking.surveyPurpose || currentBooking.purpose || "Groundwater Source & Depth Identification";
    const propertyAddress = typeof currentBooking.address === "string"
        ? currentBooking.address
        : currentBooking.address?.fullAddress || `${currentBooking.address?.addressLine1 || ""}, ${currentBooking.address?.city || ""}`.replace(/^,\s*/, "") || "Address not provided";

    // Survey Date & Time
    const surveyDate = currentBooking.scheduledDate
        ? new Date(currentBooking.scheduledDate).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Scheduled";
    const surveyTime = currentBooking.scheduledTime || "Time slot not specified";
    const isTimeTBD = !currentBooking.scheduledTime || currentBooking.scheduledTime === "Time TBD by Expert" || currentBooking.scheduledTime === "TBD";

    // Status Resolution (status is already declared above for GPS streaming)
    const isStartOtpVerified = Boolean(currentBooking.otp?.startSurvey?.verified || currentBooking.startSurveyVerifiedAt || ["VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"].includes(status));
    const isEndOtpVerified = Boolean(currentBooking.otp?.endSurvey?.verified || currentBooking.endSurveyVerifiedAt || ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"].includes(status));
    const isReportUploaded = Boolean(currentBooking.visitReport || currentBooking.reportUploadedAt || currentBooking.report?.uploadedAt || (currentBooking.report && (currentBooking.report.waterFound !== undefined && currentBooking.report.waterFound !== null)) || ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"].includes(status));
    const isRemainingPaid = Boolean(currentBooking.payment?.remainingPaid || currentBooking.remainingPaid || status === "COMPLETED" || status === "PAYMENT_SUCCESS");

    // Status Pill Configuration
    const getStatusConfig = () => {
        if (currentBooking.report?.rejectedAt && !currentBooking.report?.approvedAt) {
            return { label: "Report Revision Required", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: <IoAlertCircleOutline /> };
        }
        if (status === "COMPLETED" || status === "FINAL_SETTLEMENT_COMPLETE" || status === "APPROVED" || status === "ADMIN_APPROVED") {
            return { label: "Completed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <IoCheckmarkCircleOutline /> };
        }
        if (isRemainingPaid || status === "PAYMENT_SUCCESS" || status === "PAID_FIRST") {
            return { label: "Payment Received", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <IoCheckmarkCircleOutline /> };
        }
        if (isReportUploaded || status === "AWAITING_PAYMENT" || status === "REPORT_UPLOADED") {
            return { label: "Report Uploaded • Awaiting Payment", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: <IoAlertCircleOutline /> };
        }
        if (isEndOtpVerified) {
            return { label: "Survey Completed • Upload Report", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: <IoCheckmarkCircleOutline /> };
        }
        if (isStartOtpVerified) {
            return { label: "Survey Started", bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <IoConstructOutline /> };
        }
        if (status === "EN_ROUTE") {
            return { label: "En Route", bg: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse", icon: <IoCarOutline /> };
        }
        return { label: "Advance Paid", bg: "bg-teal-50 text-teal-700 border-teal-200", icon: <IoCheckmarkCircleOutline /> };
    };

    const currentStatus = getStatusConfig();

    // Open Time Picker Modal from Card
    const handleOpenTimePicker = (e, autoStart = false) => {
        if (e) e.stopPropagation();
        setPendingStartJourney(autoStart);
        if (currentBooking?.scheduledTime && !isTimeTBD) {
            setSelectedTimeSlot(currentBooking.scheduledTime);
        } else {
            setSelectedTimeSlot("09:00 AM - 10:00 AM");
        }
        setShowTimePickerModal(true);
    };

    // Save Time Slot from Modal
    const handleSaveTimeSlot = async (e) => {
        if (e) e.stopPropagation();
        if (!selectedTimeSlot) {
            toast.showError("Please select a time slot");
            return;
        }

        const loadingToast = toast.showLoading("Saving arrival time...");
        try {
            setIsSavingSchedule(true);
            const res = await updateVisitSchedule(bookingId, {
                scheduledDate: currentBooking?.scheduledDate,
                scheduledTime: selectedTimeSlot
            });

            if (res.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(`Visit arrival time set to ${selectedTimeSlot}!`);
                const updatedBooking = {
                    ...currentBooking,
                    scheduledTime: selectedTimeSlot
                };
                setLocalOverride(updatedBooking);
                setShowTimePickerModal(false);

                if (pendingStartJourney) {
                    setPendingStartJourney(false);
                    if (onMarkEnRoute) onMarkEnRoute(updatedBooking);
                    else navigate(`/vendor/bookings/${bookingId}`);
                }
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(res.message || "Failed to update visit time");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            toast.showError(err.response?.data?.message || err.message || "Failed to update schedule");
        } finally {
            setIsSavingSchedule(false);
        }
    };

    // Handle Start Journey Click with Guard
    const handleStartJourneyClick = (e) => {
        e.stopPropagation();
        if (isTimeTBD) {
            toast.showWarning("Please set your arrival time slot before starting the journey.");
            handleOpenTimePicker(e, true);
            return;
        }
        if (onMarkEnRoute) onMarkEnRoute(currentBooking);
        else navigate(`/vendor/bookings/${bookingId}`);
    };

    // Live Tracking
    const handleNavigateMaps = (e) => {
        e.stopPropagation();
        navigate(`/vendor/booking/${currentBooking._id || currentBooking.bookingId}/tracking`);
    };

    return (
        <>
            <div
                onClick={() => onViewStatus ? onViewStatus(currentBooking._id) : navigate(`/vendor/bookings/${currentBooking._id}`)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 space-y-4 cursor-pointer group"
            >
                {/* ── 1. BOOKING & CUSTOMER SECTION ── */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-blue-50 text-[#0A84FF] font-extrabold text-[11px] rounded-md border border-blue-100 tracking-wide">
                                {formattedBookingId}
                            </span>
                            <span className={`px-2.5 py-0.5 font-bold text-[11px] rounded-md border flex items-center gap-1 ${currentStatus.bg}`}>
                                {currentStatus.icon}
                                {currentStatus.label}
                            </span>
                            {currentBooking?.rescheduleCount > 0 && (
                                <span className="px-2.5 py-0.5 font-bold text-[11px] rounded-md border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                    🗓️ Rescheduled
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0A84FF] flex items-center justify-center font-black text-sm shrink-0">
                                {customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#0A84FF] transition-colors leading-tight">
                                    {customerName}
                                </h3>
                                {customerPhone && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-0.5">
                                        <span>{maskPhone(customerPhone)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <IoChevronForwardOutline className="text-slate-400 group-hover:text-blue-600 transition-colors text-lg shrink-0 mt-2" />
                </div>

                {/* ── 2. SURVEY & SITE SECTION ── */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <IoConstructOutline className="text-[#0A84FF] text-sm" />
                            {surveyCategory}
                        </span>
                    </div>

                    <p className="text-slate-600 font-medium text-[11px] leading-relaxed line-clamp-2">
                        <strong className="text-slate-700">Purpose:</strong> {surveyPurpose}
                    </p>

                    <div className="flex items-start gap-1.5 text-slate-600 pt-1">
                        <IoLocationOutline className="text-emerald-600 text-sm shrink-0 mt-0.5" />
                        <span className="font-semibold text-[11px] leading-tight line-clamp-2">{propertyAddress}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-700 pt-1 border-t border-slate-200/60 text-[11px] flex-wrap">
                        <span className="flex items-center gap-1 font-bold">
                            <IoCalendarOutline className="text-blue-500" />
                            {surveyDate}
                        </span>
                        {isTimeTBD ? (
                            <button
                                type="button"
                                onClick={(e) => handleOpenTimePicker(e, false)}
                                className="flex items-center gap-1 font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg text-[10.5px] border border-amber-300 shadow-2xs transition-all cursor-pointer hover:scale-102"
                            >
                                <IoTimeOutline className="text-amber-700 text-xs" />
                                <span>Time TBD (Tap to Set)</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => handleOpenTimePicker(e, false)}
                                className="flex items-center gap-1 font-bold text-slate-700 hover:text-[#0A84FF] bg-white px-2 py-0.5 rounded-md border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                                title="Click to adjust time slot"
                            >
                                <IoTimeOutline className="text-amber-500" />
                                <span>{surveyTime}</span>
                            </button>
                        )}
                    </div>

                    {currentBooking?.rescheduleHistory && currentBooking.rescheduleHistory.length > 0 && (
                        <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200/70 text-[11px] text-amber-900 font-medium">
                            <span className="font-bold">Reschedule Reason:</span> {currentBooking.rescheduleHistory[currentBooking.rescheduleHistory.length - 1].reason || "Customer requested date change"}
                        </div>
                    )}
                </div>

                {/* ── 3. CURRENT STATUS PROGRESS STEP ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Active Status Timeline</span>
                        <span className="text-blue-600">{currentStatus.label}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                        <div className={`h-1.5 rounded-full ${['ACCEPTED', 'EN_ROUTE', 'VISITED', 'REPORT_UPLOADED', 'AWAITING_PAYMENT', 'COMPLETED'].includes(status) ? 'bg-blue-600' : 'bg-slate-200'}`} title="Advance Paid" />
                        <div className={`h-1.5 rounded-full ${['EN_ROUTE', 'VISITED', 'REPORT_UPLOADED', 'AWAITING_PAYMENT', 'COMPLETED'].includes(status) ? 'bg-blue-600' : 'bg-slate-200'}`} title="En Route" />
                        <div className={`h-1.5 rounded-full ${isStartOtpVerified ? 'bg-indigo-600' : 'bg-slate-200'}`} title="Survey Started" />
                        <div className={`h-1.5 rounded-full ${isEndOtpVerified ? 'bg-emerald-600' : 'bg-slate-200'}`} title="Survey Completed" />
                    </div>
                </div>

                {/* ── 4. QUICK ACTIONS SECTION ── */}
                <div className="pt-2 border-t border-slate-100 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Quick Actions
                    </span>

                    <div className={`grid ${isWhatsAppEnabled ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
                        {/* Call */}
                        <a
                            href={`tel:${customerPhone}`}
                            className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                        >
                            <IoCallOutline className="text-base text-blue-600" />
                            <span>Call</span>
                        </a>

                        {/* WhatsApp (Admin Configurable) */}
                        {isWhatsAppEnabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowWhatsAppModal(true);
                                }}
                                className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                            >
                                <IoLogoWhatsapp className="text-base text-emerald-600" />
                                <span>WhatsApp</span>
                            </button>
                        )}

                        {/* Navigate / Track Live */}
                        {status === "EN_ROUTE" ? (
                            <button
                                onClick={handleNavigateMaps}
                                className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                            >
                                <IoNavigateOutline className="text-base text-blue-600" />
                                <span>Track Live</span>
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const query = encodeURIComponent(propertyAddress);
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                                }}
                                className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                            >
                                <IoNavigateOutline className="text-base text-blue-600" />
                                <span>Navigate</span>
                            </button>
                        )}

                        {/* View Status */}
                        <button
                            onClick={() => onViewStatus ? onViewStatus(currentBooking._id) : navigate(`/vendor/bookings/${currentBooking._id}`)}
                            className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                        >
                            <IoEyeOutline className="text-base text-slate-600" />
                            <span>View Status</span>
                        </button>
                    </div>

                    {/* Contextual Action Row (Start Journey, OTP & Uploads) */}
                    <div className="flex w-full pt-1" onClick={(e) => e.stopPropagation()}>
                        {/* 1. If status is ACCEPTED -> Show Start Journey */}
                        {status === "ACCEPTED" ? (
                            <button
                                onClick={handleStartJourneyClick}
                                className={`w-full py-2.5 px-3 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isTimeTBD
                                        ? "bg-gradient-to-r from-amber-600 to-blue-600 hover:from-amber-700 hover:to-blue-700 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                <IoCarOutline className="text-base" />
                                <span>{isTimeTBD ? "Set Arrival Time & Start Journey" : "Start Journey"}</span>
                            </button>
                        ) : !isStartOtpVerified ? (
                            /* 2. If status is EN_ROUTE -> Show Verify Start OTP */
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onVerifyStartOTP) onVerifyStartOTP(currentBooking);
                                    else navigate(`/vendor/bookings/${currentBooking._id}`, { state: { openStartOTP: true } });
                                }}
                                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoKeyOutline className="text-base" />
                                <span>Verify Start OTP</span>
                            </button>
                        ) : !isEndOtpVerified ? (
                            /* Verify End OTP */
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onVerifyEndOTP) onVerifyEndOTP(currentBooking);
                                    else navigate(`/vendor/bookings/${currentBooking._id}`, { state: { openEndOTP: true } });
                                }}
                                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoKeyOutline className="text-base" />
                                <span>Verify End OTP</span>
                            </button>
                        ) : (currentBooking.report?.rejectedAt && !currentBooking.report?.approvedAt) ? (
                            /* Report Needs Revision */
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/vendor/bookings/${currentBooking._id}/upload-report`);
                                }}
                                className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoDocumentTextOutline className="text-base" />
                                <span>Edit & Re-Upload Report</span>
                            </button>
                        ) : isReportUploaded ? (
                            /* Report Already Uploaded -> View Survey Report */
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/vendor/bookings/${currentBooking._id}`);
                                }}
                                className="w-full py-2.5 px-3 bg-[#E7F0FB] hover:bg-[#D0E1F7] text-[#0A84FF] font-bold text-xs rounded-xl shadow-xs border border-[#D0E1F7] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoDocumentTextOutline className="text-base text-[#0A84FF]" />
                                <span>View Survey Report</span>
                            </button>
                        ) : (
                            /* Upload Survey Report */
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUploadReport) onUploadReport(currentBooking);
                                    else navigate(`/vendor/bookings/${currentBooking._id}/upload-report`);
                                }}
                                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoDocumentTextOutline className="text-base text-teal-400" />
                                <span>Upload Report</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── TIME SLOT PICKER MODAL (DIRECT FROM CARD) ── */}
            {showTimePickerModal && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 animate-in fade-in"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isSavingSchedule) setShowTimePickerModal(false);
                    }}
                >
                    <div
                        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <IoTimeOutline className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {pendingStartJourney ? "Set Arrival Time & Start Journey" : "Set Visit Time Slot"}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Confirm arrival time window for customer
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTimePickerModal(false)}
                                disabled={isSavingSchedule}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <IoCloseOutline className="text-lg" />
                            </button>
                        </div>

                        {/* Prominent Survey Date Card */}
                        <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/60 p-3 rounded-xl border border-blue-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                    <IoCalendarOutline className="text-base" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                                        Survey Date
                                    </span>
                                    <strong className="text-xs sm:text-sm font-black text-slate-900 block">
                                        {surveyDate}
                                    </strong>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Customer
                                </span>
                                <strong className="text-xs font-extrabold text-slate-800 block">
                                    {customerName}
                                </strong>
                            </div>
                        </div>

                        {/* Notice */}
                        {pendingStartJourney && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                                <IoAlertCircleOutline className="text-base text-amber-600 shrink-0" />
                                <span>Please select your expected arrival window so the customer is notified before your trip starts.</span>
                            </div>
                        )}

                        {/* Time Slot Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <IoTimeOutline className="text-[#0A84FF]" /> Select 1-Hour Arrival Slot
                                </span>
                                {selectedTimeSlot && (
                                    <span className="text-[11px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        {selectedTimeSlot}
                                    </span>
                                )}
                            </label>

                            <div className="max-h-52 overflow-y-auto space-y-3 pr-1 custom-scrollbar overscroll-contain">
                                {/* Morning */}
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        🌅 Morning Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "06:00 AM - 07:00 AM",
                                            "07:00 AM - 08:00 AM",
                                            "08:00 AM - 09:00 AM",
                                            "09:00 AM - 10:00 AM",
                                            "10:00 AM - 11:00 AM",
                                            "11:00 AM - 12:00 PM"
                                        ].map((slot) => {
                                            const isSelected = selectedTimeSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                                                    }`}
                                                >
                                                    <span>{slot}</span>
                                                    {isSelected && <span className="text-xs font-black">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Afternoon */}
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        ☀️ Afternoon Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "12:00 PM - 01:00 PM",
                                            "01:00 PM - 02:00 PM",
                                            "02:00 PM - 03:00 PM",
                                            "03:00 PM - 04:00 PM"
                                        ].map((slot) => {
                                            const isSelected = selectedTimeSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                                                    }`}
                                                >
                                                    <span>{slot}</span>
                                                    {isSelected && <span className="text-xs font-black">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Evening */}
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        🌆 Evening Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "04:00 PM - 05:00 PM",
                                            "05:00 PM - 06:00 PM",
                                            "06:00 PM - 07:00 PM"
                                        ].map((slot) => {
                                            const isSelected = selectedTimeSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                                                    }`}
                                                >
                                                    <span>{slot}</span>
                                                    {isSelected && <span className="text-xs font-black">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Note */}
                        {selectedTimeSlot && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-blue-900 flex items-center gap-2">
                                <span className="text-blue-600 text-sm font-black">✓</span>
                                <span>Customer will be notified: Visit at <strong>{selectedTimeSlot}</strong></span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowTimePickerModal(false)}
                                disabled={isSavingSchedule}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveTimeSlot}
                                disabled={isSavingSchedule || !selectedTimeSlot}
                                className="flex-1 py-2.5 bg-gradient-to-r from-[#0A84FF] to-blue-700 hover:from-[#0070DF] hover:to-blue-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                            >
                                {isSavingSchedule ? "Updating..." : (pendingStartJourney ? "Confirm & Start Trip" : "Confirm & Notify")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Quick Message Template Modal */}
            <WhatsAppTemplateModal
                isOpen={showWhatsAppModal}
                onClose={() => setShowWhatsAppModal(false)}
                booking={currentBooking}
                templatesConfig={activeTemplatesConfig}
            />
        </>
    );
}
