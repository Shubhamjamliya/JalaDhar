import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoCallOutline,
    IoLogoWhatsapp,
    IoNavigateOutline,
    IoRefreshOutline,
    IoKeyOutline,
    IoCarOutline,
    IoLocationOutline,
    IoShieldCheckmarkOutline,
    IoTimeOutline,
    IoRadioOutline,
    IoCopyOutline,
} from "react-icons/io5";
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import { getBookingDetails as getUserBookingDetails } from "../../../services/bookingApi";
import {
    getBookingDetails as getVendorBookingDetails,
    verifyStartOTP,
    resendSurveyOTP,
} from "../../../services/vendorApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useToast } from "../../../hooks/useToast";
import LoadingSpinner from "../components/LoadingSpinner";
import OTPInputModal from "../components/OTPInputModal";
import { clearCache } from "../../../utils/apiCache";

// Full-screen map container
const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const DEFAULT_DESTINATION = { lat: 22.7196, lng: 75.8577 };

export default function LiveTrackingPage({ role = "User" }) {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { socket } = useNotifications();
    const mapRef = useRef(null);

    const isExpert = role === "Vendor" || role === "Expert";

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [isLive, setIsLive] = useState(false); // true when live GPS is active or received

    const [destination, setDestination] = useState(DEFAULT_DESTINATION);
    const [expertLocation, setExpertLocation] = useState(null);

    const [etaMinutes, setEtaMinutes] = useState("--");
    const [distanceKm, setDistanceKm] = useState("--");
    const [startOtp, setStartOtp] = useState("");
    const [directionsResult, setDirectionsResult] = useState(null);

    // OTP Modal state for Expert
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resendingOTP, setResendingOTP] = useState(false);

    const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        id: "google-map-script",
        libraries: ["routes"],
    });

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // ─── Load Booking Data ───────────────────────────────────────────────────
    const loadBookingData = async () => {
        try {
            setLoading(true);
            const response = isExpert
                ? await getVendorBookingDetails(bookingId)
                : await getUserBookingDetails(bookingId);

            if (response.success && response.data?.booking) {
                const bData = response.data.booking;
                setBooking(bData);

                // Extract saved destination coordinates
                let destLat = null;
                let destLng = null;
                if (bData.address?.coordinates?.lat && bData.address?.coordinates?.lng) {
                    destLat = Number(bData.address.coordinates.lat);
                    destLng = Number(bData.address.coordinates.lng);
                } else if (bData.address?.location?.coordinates?.length === 2) {
                    destLng = Number(bData.address.location.coordinates[0]);
                    destLat = Number(bData.address.location.coordinates[1]);
                } else if (bData.address?.coordinates?.coordinates?.length === 2) {
                    destLng = Number(bData.address.coordinates.coordinates[0]);
                    destLat = Number(bData.address.coordinates.coordinates[1]);
                } else if (bData.location?.coordinates?.length === 2) {
                    destLng = Number(bData.location.coordinates[0]);
                    destLat = Number(bData.location.coordinates[1]);
                }

                if (destLat && destLng) {
                    const destObj = { lat: destLat, lng: destLng };
                    setDestination(destObj);

                    // Initial expert position: vendorLocation from booking or fallback near destination
                    let initialExpertLat = bData.vendorLocation?.lat || bData.vendor?.lastKnownLocation?.lat || bData.vendor?.location?.coordinates?.[1];
                    let initialExpertLng = bData.vendorLocation?.lng || bData.vendor?.lastKnownLocation?.lng || bData.vendor?.location?.coordinates?.[0];

                    if (!initialExpertLat || !initialExpertLng) {
                        initialExpertLat = destLat + 0.02;
                        initialExpertLng = destLng + 0.015;
                    }

                    const initLoc = { lat: Number(initialExpertLat), lng: Number(initialExpertLng) };
                    setExpertLocation(initLoc);
                }

                if (bData.otp?.startSurvey?.otpCode) setStartOtp(bData.otp.startSurvey.otpCode);
                else if (bData.startSurveyOTP) setStartOtp(bData.startSurveyOTP);
            } else {
                toast.showError(response.message || "Failed to load tracking details");
            }
        } catch (err) {
            console.error("[LiveTracking] Load error:", err);
            toast.showError("Failed to load live tracking details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookingData();
    }, [bookingId]);

    // ─── Fetch Road Route & ETA (Directions API or OSRM) ──────────────────────
    const fetchRoadRouteAndETA = useCallback(async (origin, dest) => {
        if (!origin?.lat || !dest?.lat) return;

        // 1. Google Maps DirectionsService
        if (window.google?.maps?.DirectionsService) {
            try {
                const svc = new window.google.maps.DirectionsService();
                const result = await new Promise((resolve, reject) => {
                    svc.route(
                        {
                            origin: { lat: origin.lat, lng: origin.lng },
                            destination: { lat: dest.lat, lng: dest.lng },
                            travelMode: window.google.maps.TravelMode.DRIVING,
                        },
                        (res, status) => {
                            if (status === "OK") resolve(res);
                            else reject(new Error(status));
                        }
                    );
                });

                setDirectionsResult(result);

                const leg = result?.routes?.[0]?.legs?.[0];
                if (leg) {
                    setDistanceKm((leg.distance.value / 1000).toFixed(1));
                    setEtaMinutes(Math.max(1, Math.round(leg.duration.value / 60)));
                    return;
                }
            } catch (e) {
                console.warn("[LiveTracking] Google Directions failed, trying OSRM:", e.message);
                setDirectionsResult(null);
            }
        }

        // 2. OSRM free fallback
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=false`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.routes?.[0]) {
                setDistanceKm((data.routes[0].distance / 1000).toFixed(1));
                setEtaMinutes(Math.max(1, Math.round(data.routes[0].duration / 60)));
            }
        } catch (e) {
            console.warn("[LiveTracking] OSRM failed:", e);
        }
    }, []);

    // Auto-recalculate route on expert location or destination change
    useEffect(() => {
        if (expertLocation?.lat && destination?.lat) {
            fetchRoadRouteAndETA(expertLocation, destination);
        }
    }, [expertLocation, destination, fetchRoadRouteAndETA]);

    // ─── Expert Role: Stream Own GPS via Socket & Auto-Center Map ─────────────
    useEffect(() => {
        if (!isExpert || !socket || !bookingId) return;
        if (!("geolocation" in navigator)) {
            console.warn("[LiveTracking] Geolocation not supported on this device");
            setIsLive(true);
            return;
        }

        const handleSuccess = (pos) => {
            const { latitude: lat, longitude: lng, speed, heading } = pos.coords;
            const newLoc = { lat, lng };
            setExpertLocation(newLoc);
            setIsLive(true);

            socket.emit("vendor_location_update", {
                bookingId,
                lat,
                lng,
                speed: speed ? Math.round(speed * 3.6) : 30,
                heading: heading || 0,
                userId: booking?.user?._id,
            });

            if (mapRef.current) {
                mapRef.current.panTo(newLoc);
            }
        };

        const handleError = (err) => {
            console.warn("[LiveTracking] Expert GPS error:", err.message);
            // In case of error (e.g. desktop), still flag as active so UI is not blocked
            setIsLive(true);
        };

        // 1. Immediate GPS reading
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 8000,
        });

        // 2. 5-second interval heartbeat
        const intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 5000,
            });
        }, 5000);

        // 3. Motion watcher
        const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 8000,
        });

        return () => {
            clearInterval(intervalId);
            navigator.geolocation.clearWatch(watchId);
        };
    }, [isExpert, socket, bookingId, booking]);

    // ─── User Role: Listen for Expert Location Updates via Socket ─────────────
    useEffect(() => {
        if (isExpert || !socket || !bookingId) return;

        socket.emit("join_booking_tracking", bookingId);

        const handleLocationUpdate = (data) => {
            if (data.bookingId !== bookingId && data.bookingId) return;
            if (!data.lat || !data.lng) return;

            console.log("[LiveTracking] 📍 Socket location update:", data);
            const newLoc = { lat: data.lat, lng: data.lng };
            setExpertLocation(newLoc);
            setIsLive(true);

            if (mapRef.current) {
                mapRef.current.panTo(newLoc);
            }

            fetchRoadRouteAndETA(newLoc, destination);
        };

        socket.on("expert_location_updated", handleLocationUpdate);
        return () => {
            socket.off("expert_location_updated", handleLocationUpdate);
        };
    }, [isExpert, socket, bookingId, destination, fetchRoadRouteAndETA]);

    // ─── Verify Start Survey OTP (Expert Action) ──────────────────────────────
    const handleVerifyStartOTP = async (otpCode) => {
        try {
            setVerifyingOTP(true);
            const res = await verifyStartOTP(bookingId, otpCode);
            if (res.success) {
                toast.showSuccess("Start Survey OTP verified! Survey officially started.");
                clearCache("vendor");
                clearCache("booking");
                setShowOTPModal(false);
                await loadBookingData();
                navigate(`/vendor/bookings/${bookingId}`);
            } else {
                toast.showError(res.message || "Invalid OTP code");
            }
        } catch (err) {
            console.error("[LiveTracking] OTP verify error:", err);
            toast.showError(err.response?.data?.message || err.message || "Failed to verify OTP");
        } finally {
            setVerifyingOTP(false);
        }
    };

    // ─── Resend Start OTP ─────────────────────────────────────────────────────
    const handleResendOTP = async () => {
        try {
            setResendingOTP(true);
            const res = await resendSurveyOTP(bookingId, "start");
            if (res.success) {
                toast.showSuccess("Start Survey OTP resent to customer via SMS & WhatsApp!");
            } else {
                toast.showError(res.message || "Failed to resend OTP");
            }
        } catch (err) {
            console.error("[LiveTracking] OTP resend error:", err);
            toast.showError(err.response?.data?.message || err.message || "Failed to resend OTP");
        } finally {
            setResendingOTP(false);
        }
    };

    const handleCopyOTP = () => {
        navigator.clipboard.writeText(startOtp);
        toast.showSuccess("OTP copied!");
    };

    const handleOpenMaps = () => {
        if (!destination?.lat || !destination?.lng) {
            toast.showError("Destination coordinates not found");
            return;
        }
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`,
            "_blank"
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
                <LoadingSpinner />
            </div>
        );
    }

    const expertName = booking?.vendor?.name || "Expert Hydrogeologist";
    const expertCategory = booking?.vendor?.designation || "Hydrogeologist";
    const expertPhone = booking?.vendor?.phone || booking?.vendor?.mobileNumber || "";
    const customerName = booking?.user?.name || "Customer";
    const customerPhone = booking?.user?.phone || booking?.user?.mobileNumber || "";

    const formattedAddress = [
        booking?.address?.street,
        booking?.village || booking?.address?.village,
        booking?.mandal || booking?.address?.mandal,
        booking?.district || booking?.address?.district,
        booking?.address?.city,
        booking?.address?.state,
        booking?.address?.pincode,
    ]
        .filter(Boolean)
        .join(", ") || "Pinned Survey Site Location";

    const isStartOtpVerified =
        booking?.otp?.startSurvey?.verified ||
        [
            "VISITED",
            "IN_PROGRESS",
            "REPORT_UPLOADED",
            "AWAITING_PAYMENT",
            "PAYMENT_SUCCESS",
            "PAID_FIRST",
            "BOREWELL_UPLOADED",
            "ADMIN_APPROVED",
            "FINAL_SETTLEMENT",
            "COMPLETED",
        ].includes((booking?.status || booking?.vendorStatus || booking?.userStatus || "").toUpperCase());

    const markerDestIcon = {
        url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='52' viewBox='0 0 44 52'>
              <circle cx='22' cy='22' r='20' fill='#10b981' stroke='white' stroke-width='3'/>
              <text x='50%' y='44%' dominant-baseline='middle' text-anchor='middle' font-size='18'>🏠</text>
              <polygon points='22,44 14,34 30,34' fill='#10b981'/>
            </svg>`
            ),
        scaledSize: { width: 44, height: 52 },
        anchor: { x: 22, y: 52 },
    };

    const markerExpertIcon = {
        url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'>
              <circle cx='24' cy='24' r='22' fill='#0A84FF' stroke='white' stroke-width='3'/>
              <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='22'>🚗</text>
            </svg>`
            ),
        scaledSize: { width: 48, height: 48 },
        anchor: { x: 24, y: 24 },
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-slate-100" style={{ zIndex: 40 }}>
            {/* ── Floating Header: Back Button + Live Status Badge + Refresh ── */}
            <div
                className="absolute z-50 flex items-center justify-between px-3 w-full"
                style={{ top: "72px" }}
            >
                {/* Left: Back button + Mode Pill */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (window.history.length > 2) {
                                navigate(-1);
                            } else {
                                navigate(isExpert ? "/vendor/bookings" : "/user/dashboard");
                            }
                        }}
                        className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                        title="Back"
                    >
                        <IoChevronBackOutline className="text-xl" />
                    </button>

                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-md text-xs font-black text-slate-800 border border-slate-200">
                        {isExpert ? "📍 Survey Site Navigation" : "🚗 Expert Live Tracking"}
                    </span>
                </div>

                {/* Right: Status Badge + Refresh */}
                <div className="flex items-center gap-2">
                    <span
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md border ${
                            isExpert
                                ? "bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20"
                                : isLive
                                ? "bg-emerald-500 text-white border-emerald-600 animate-pulse shadow-emerald-500/20"
                                : "bg-white text-blue-700 border-blue-200"
                        }`}
                    >
                        {isExpert ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                <span>GPS BROADCASTING</span>
                            </>
                        ) : isLive ? (
                            <>
                                <IoRadioOutline className="text-xs" />
                                <span>🔴 LIVE</span>
                            </>
                        ) : (
                            <>
                                <IoCarOutline className="text-xs text-blue-600" />
                                <span>EXPERT EN ROUTE</span>
                            </>
                        )}
                    </span>

                    <button
                        onClick={loadBookingData}
                        className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                        title="Refresh"
                    >
                        <IoRefreshOutline className="text-lg" />
                    </button>
                </div>
            </div>

            {/* ── Full-Screen Map (starts right from top-[64px]) ── */}
            <div className="absolute inset-0" style={{ top: "64px", bottom: 0 }}>
                {isGoogleMapsLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={expertLocation || destination}
                        zoom={expertLocation ? 14 : 13}
                        onLoad={onMapLoad}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            streetViewControl: false,
                            fullscreenControl: false,
                            mapTypeControl: false,
                            gestureHandling: "greedy",
                        }}
                    >
                        {/* Fixed Destination Pin (Survey Site) */}
                        <Marker
                            position={destination}
                            icon={markerDestIcon}
                            title={isExpert ? `Survey Site (${customerName})` : "Your Property"}
                        />

                        {/* Moving Expert Pin */}
                        {expertLocation && (
                            <Marker
                                position={expertLocation}
                                icon={markerExpertIcon}
                                title={isExpert ? "Your Live Location" : `Expert: ${expertName}`}
                            />
                        )}

                        {/* Road-based route */}
                        {directionsResult && expertLocation && (
                            <DirectionsRenderer
                                directions={directionsResult}
                                options={{
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeColor: "#0A84FF",
                                        strokeOpacity: 0.9,
                                        strokeWeight: 6,
                                    },
                                }}
                            />
                        )}
                    </GoogleMap>
                ) : (
                    /* ── Fallback Canvas ── */
                    <div className="w-full h-full bg-[#E8F4FD] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e144_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e144_1px,transparent_1px)] bg-[size:36px_36px]" />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <line
                                x1="28%"
                                y1="38%"
                                x2="72%"
                                y2="62%"
                                stroke="#0A84FF"
                                strokeWidth="6"
                                strokeDasharray="12,7"
                                opacity="0.75"
                            />
                        </svg>

                        {/* Expert Pin */}
                        <div className="absolute top-[38%] left-[28%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-white border-[3px] border-[#0A84FF] flex items-center justify-center shadow-xl shadow-blue-500/25 animate-pulse">
                                    <IoCarOutline className="text-2xl text-[#0A84FF]" />
                                </div>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>
                            <span className="mt-1.5 px-2.5 py-0.5 bg-white border border-blue-200 text-blue-900 font-black text-[10px] rounded-lg shadow-md">
                                {isExpert ? "🚗 Your Location" : "🚗 Expert"}
                            </span>
                        </div>

                        {/* Destination Pin */}
                        <div className="absolute top-[62%] left-[72%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-white border-[3px] border-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-bounce">
                                <IoLocationOutline className="text-2xl text-emerald-600" />
                            </div>
                            <span className="mt-1 px-2.5 py-0.5 bg-white border border-emerald-300 text-emerald-800 font-extrabold text-[10px] rounded-lg shadow-md max-w-[160px] truncate text-center">
                                {isExpert ? `📍 ${customerName}'s Site` : "🏠 Your Property"}
                            </span>
                        </div>

                        {/* Open in Maps FAB */}
                        <button
                            onClick={handleOpenMaps}
                            className="absolute right-3 bottom-[210px] z-30 px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-700 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                            <IoNavigateOutline className="text-base text-blue-600" />
                            Open Maps
                        </button>
                    </div>
                )}

                {/* Floating Open Maps FAB */}
                {isGoogleMapsLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                    <button
                        onClick={handleOpenMaps}
                        className="absolute right-3 bottom-[210px] z-40 w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-200 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all text-blue-600"
                        title="Navigate with Google Maps"
                    >
                        <IoNavigateOutline className="text-xl" />
                    </button>
                )}
            </div>

            {/* ── Bottom Sliding Panel ── */}
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] border-t border-slate-100 px-4 pt-2.5 pb-4 space-y-2.5 max-w-md mx-auto">
                {/* Drag Handle */}
                <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto" />

                {isExpert ? (
                    /* ══════════════════════════════════════════════════════════ */
                    /*                  EXPERT / VENDOR VIEW                      */
                    /* ══════════════════════════════════════════════════════════ */
                    <>
                        {/* Pinned Survey Site Address Card */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                    <IoLocationOutline className="text-xl" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Destination Survey Site
                                        </p>
                                        {booking?.village && (
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                                {booking.village}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                                        {formattedAddress}
                                    </p>
                                    {booking?.address?.landmark && (
                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                            Landmark: <span className="font-semibold text-slate-700">{booking.address.landmark}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Distance & ETA strip */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                <span className="text-slate-500 font-medium flex items-center gap-1">
                                    <IoTimeOutline className="text-slate-400 text-sm" /> Approx. Driving:
                                </span>
                                <div className="flex items-baseline gap-1.5 font-black text-slate-800">
                                    <span>
                                        {etaMinutes} {etaMinutes !== "--" ? "mins" : ""}
                                    </span>
                                    {distanceKm !== "--" && (
                                        <span className="text-[11px] font-semibold text-slate-500">
                                            ({distanceKm} km)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Customer Contact Row */}
                        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                    {customerName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                                        {customerName}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium truncate">
                                        Customer / Landowner
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {customerPhone && (
                                    <>
                                        <a
                                            href={`tel:${customerPhone}`}
                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all shadow-2xs active:scale-95"
                                            title="Call Customer"
                                        >
                                            <IoCallOutline className="text-base" />
                                        </a>
                                        <a
                                            href={`https://wa.me/91${customerPhone.replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all shadow-2xs active:scale-95"
                                            title="WhatsApp Customer"
                                        >
                                            <IoLogoWhatsapp className="text-base" />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Primary Actions: Google Maps Navigation + Start Survey OTP */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                onClick={handleOpenMaps}
                                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <IoNavigateOutline className="text-base" />
                                Google Maps 🧭
                            </button>

                            {!isStartOtpVerified ? (
                                <button
                                    onClick={() => setShowOTPModal(true)}
                                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer animate-pulse"
                                >
                                    <IoKeyOutline className="text-base" />
                                    Enter Start OTP 🔑
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                    className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <IoShieldCheckmarkOutline className="text-base" />
                                    Survey Details →
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    /* ══════════════════════════════════════════════════════════ */
                    /*                  CUSTOMER / USER VIEW                      */
                    /* ══════════════════════════════════════════════════════════ */
                    <>
                        {isStartOtpVerified ? (
                            <div className="bg-emerald-600 rounded-xl px-3.5 py-3 text-white flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    <IoShieldCheckmarkOutline className="text-2xl text-emerald-200 shrink-0" />
                                    <div>
                                        <p className="text-xs font-extrabold">Survey in Progress 📍</p>
                                        <p className="text-[11px] text-emerald-100 leading-snug">
                                            Expert has arrived on site & Start OTP is verified.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/user/booking/${bookingId}`)}
                                    className="px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-lg shadow-2xs hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer shrink-0 ml-2"
                                >
                                    View Booking
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* ETA & Status Banner */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-3.5 py-2.5 text-white flex items-center justify-between shadow-xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-xs">
                                            <IoTimeOutline className="text-lg text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">
                                                Estimated Arrival
                                            </p>
                                            <div className="flex items-baseline gap-1.5 leading-none mt-0.5">
                                                <span className="text-xl font-black">
                                                    {etaMinutes} {etaMinutes !== "--" ? "mins" : ""}
                                                </span>
                                                {distanceKm !== "--" && (
                                                    <span className="text-[11px] font-semibold text-blue-100/90">
                                                        ({distanceKm} km)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-lg border border-white/20 backdrop-blur-xs">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span className="text-xs font-bold text-white">En Route</span>
                                    </div>
                                </div>

                                {/* Start Survey OTP Pill */}
                                {startOtp && (
                                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <IoKeyOutline className="text-base text-amber-600" />
                                            <span className="text-xs font-bold text-amber-900">Start OTP:</span>
                                            <span className="text-sm font-black text-amber-950 tracking-wider font-mono">
                                                {startOtp}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleCopyOTP}
                                            className="px-2.5 py-1 bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                                        >
                                            <IoCopyOutline className="text-xs" /> Copy
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Expert Info & Contact Row */}
                        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                    {expertName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                                        {expertName}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium truncate">
                                        {expertCategory}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {expertPhone && (
                                    <>
                                        <a
                                            href={`tel:${expertPhone}`}
                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all shadow-2xs active:scale-95"
                                            title="Call Expert"
                                        >
                                            <IoCallOutline className="text-base" />
                                        </a>
                                        <a
                                            href={`https://wa.me/91${expertPhone.replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all shadow-2xs active:scale-95"
                                            title="WhatsApp Expert"
                                        >
                                            <IoLogoWhatsapp className="text-base" />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Footer Tagline */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                        {isExpert
                            ? "Auto-streaming live GPS to customer & dispatch"
                            : "Live GPS tracking by JalaDhar"}
                    </span>
                </div>
            </div>

            {/* Start Survey OTP Modal for Expert */}
            {isExpert && (
                <OTPInputModal
                    isOpen={showOTPModal}
                    onClose={() => setShowOTPModal(false)}
                    onSubmit={handleVerifyStartOTP}
                    onResend={handleResendOTP}
                    resending={resendingOTP}
                    title="Verify Start Survey OTP"
                    message={`Ask ${customerName} for the 6-digit Start Survey OTP sent to their mobile phone.`}
                    submitText="Verify & Begin Survey"
                    isLoading={verifyingOTP}
                />
            )}
        </div>
    );
}
