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
    IoChevronForwardOutline
} from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import { useNotifications } from "../../../contexts/NotificationContext";

/**
 * Ongoing Survey Booking Card for Expert App
 *
 * Structured Sections:
 * 1. Booking & Customer (Booking ID, Customer Name, Mobile Number)
 * 2. Survey & Site (Survey Category, Survey Purpose, Property Address, Survey Date & Time)
 * 3. Current Status (Advance Paid, En Route, Arrived, Survey Started, Survey Ongoing, Survey Completed, Report Uploaded, Awaiting Final Payment)
 * 4. Quick Actions (Call, WhatsApp, Navigate, Verify Start OTP, Verify End OTP, Upload Site Photos, Upload Survey Report, View Status)
 */
export default function VendorOngoingBookingCard({
    booking,
    onMarkEnRoute,
    onVerifyStartOTP,
    onVerifyEndOTP,
    onUploadPhotos,
    onUploadReport,
    onViewStatus
}) {
    const navigate = useNavigate();
    const toast = useToast();
    const { socket } = useNotifications();
    const gpsWatchIdRef = useRef(null);

    // Sockets and rooms rely on the internal MongoDB _id
    const bookingId = booking?._id;
    const status = (booking?.status || booking?.vendorStatus || "").toUpperCase();
    const isEnRoute = status === "EN_ROUTE";
    const userId = booking?.user?._id;

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

        gpsWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, speed, heading } = pos.coords;
                const payload = {
                    bookingId,
                    lat: latitude,
                    lng: longitude,
                    speed: speed ? Math.round(speed * 3.6) : 0,
                    heading: heading || 0,
                    userId,
                };
                socket.emit("vendor_location_update", payload);
                console.log(`[VendorCard] 🚗 Emitted location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            },
            (err) => console.warn("[VendorCard] GPS error:", err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        return () => {
            if (gpsWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(gpsWatchIdRef.current);
                gpsWatchIdRef.current = null;
                console.log("[VendorCard] 🛑 GPS stream stopped");
            }
        };
    }, [socket, bookingId, isEnRoute, userId]);

    if (!booking) return null;

    // Format Booking ID
    const rawId = booking.bookingId || booking._id;
    const formattedBookingId = rawId ? `ID: ${rawId.toString().slice(-8).toUpperCase()}` : "ID: N/A";

    // Customer Info
    const customerName = booking.user?.name || "Customer";
    const customerPhone = booking.user?.phone || booking.user?.mobileNumber || booking.phone || "";

    // Survey Details
    const surveyCategory = booking.service?.category?.name || booking.service?.name || "Hydrogeological Groundwater Survey";
    const surveyPurpose = booking.service?.description || booking.surveyPurpose || booking.purpose || "Groundwater Source & Depth Identification";
    const propertyAddress = typeof booking.address === "string"
        ? booking.address
        : booking.address?.fullAddress || `${booking.address?.addressLine1 || ""}, ${booking.address?.city || ""}`.replace(/^,\s*/, "") || "Address not provided";

    // Survey Date & Time
    const surveyDate = booking.scheduledDate
        ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Scheduled";
    const surveyTime = booking.scheduledTime || "Time slot not specified";

    // Status Resolution (status is already declared above for GPS streaming)
    const isStartOtpVerified = Boolean(booking.otp?.startSurvey?.verified || booking.startSurveyVerifiedAt || ["VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "COMPLETED"].includes(status));
    const isEndOtpVerified = Boolean(booking.otp?.endSurvey?.verified || booking.endSurveyVerifiedAt || ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "COMPLETED"].includes(status));
    const isReportUploaded = Boolean(booking.visitReport || booking.reportUploadedAt || ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "COMPLETED"].includes(status));
    const isRemainingPaid = Boolean(booking.payment?.remainingPaid || booking.remainingPaid || status === "COMPLETED");

    // Status Pill Configuration
    const getStatusConfig = () => {
        if (isRemainingPaid || status === "COMPLETED") {
            return { label: "Survey Completed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <IoCheckmarkCircleOutline /> };
        }
        if (isReportUploaded || status === "AWAITING_PAYMENT" || status === "REPORT_UPLOADED") {
            return { label: "Awaiting Final Payment", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: <IoAlertCircleOutline /> };
        }
        if (isEndOtpVerified) {
            return { label: "Survey Completed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <IoCheckmarkCircleOutline /> };
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

    // Copy Phone Number
    const handleCopyPhone = (e) => {
        e.stopPropagation();
        if (customerPhone) {
            navigator.clipboard.writeText(customerPhone);
            toast.success("Phone number copied!");
        }
    };

    // Live Tracking
    const handleNavigateMaps = (e) => {
        e.stopPropagation();
        navigate(`/vendor/booking/${booking._id || booking.bookingId}/tracking`);
    };

    return (
        <div
            onClick={() => onViewStatus ? onViewStatus(booking._id) : navigate(`/vendor/bookings/${booking._id}`)}
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
                                    <span>+91 {customerPhone}</span>
                                    <button
                                        onClick={handleCopyPhone}
                                        title="Copy Phone Number"
                                        className="p-1 hover:text-blue-600 transition-colors cursor-pointer"
                                    >
                                        <IoCopyOutline className="text-xs" />
                                    </button>
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

                <div className="flex items-center gap-4 text-slate-700 pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="flex items-center gap-1 font-bold">
                        <IoCalendarOutline className="text-blue-500" />
                        {surveyDate}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                        <IoTimeOutline className="text-amber-500" />
                        {surveyTime}
                    </span>
                </div>
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

                <div className="grid grid-cols-4 gap-1.5">
                    {/* Call */}
                    <a
                        href={`tel:${customerPhone}`}
                        className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                    >
                        <IoCallOutline className="text-base text-blue-600" />
                        <span>Call</span>
                    </a>

                    {/* WhatsApp */}
                    <a
                        href={`https://wa.me/91${customerPhone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                    >
                        <IoLogoWhatsapp className="text-base text-emerald-600" />
                        <span>WhatsApp</span>
                    </a>

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
                        onClick={() => onViewStatus ? onViewStatus(booking._id) : navigate(`/vendor/bookings/${booking._id}`)}
                        className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/80 transition-all text-[11px] font-bold gap-1 cursor-pointer"
                    >
                        <IoEyeOutline className="text-base text-slate-600" />
                        <span>View Status</span>
                    </button>
                </div>

                {/* Contextual Action Row (Start Journey, OTP & Uploads) */}
                <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    {/* 1. If status is ACCEPTED -> Show Start Journey */}
                    {status === "ACCEPTED" ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onMarkEnRoute) onMarkEnRoute(booking);
                                else navigate(`/vendor/bookings/${booking._id}`);
                            }}
                            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <IoCarOutline className="text-base" />
                            <span>Start Journey</span>
                        </button>
                    ) : !isStartOtpVerified ? (
                        /* 2. If status is EN_ROUTE -> Show Verify Start OTP */
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onVerifyStartOTP) onVerifyStartOTP(booking);
                                else navigate(`/vendor/bookings/${booking._id}`, { state: { openStartOTP: true } });
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
                                if (onVerifyEndOTP) onVerifyEndOTP(booking);
                                else navigate(`/vendor/bookings/${booking._id}`, { state: { openEndOTP: true } });
                            }}
                            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <IoKeyOutline className="text-base" />
                            <span>Verify End OTP</span>
                        </button>
                    ) : (
                        /* Site Photos Upload */
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onUploadPhotos) onUploadPhotos(booking);
                                else navigate(`/vendor/bookings/${booking._id}`);
                            }}
                            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <IoCameraOutline className="text-base" />
                            <span>Upload Site Photos</span>
                        </button>
                    )}

                    {/* Upload Survey Report */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onUploadReport) onUploadReport(booking);
                            else navigate(`/vendor/bookings/${booking._id}/upload-report`);
                        }}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <IoDocumentTextOutline className="text-base text-teal-400" />
                        <span>Upload Report</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
