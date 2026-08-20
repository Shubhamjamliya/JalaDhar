import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoCalendarOutline,
    IoLockClosedOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoDocumentTextOutline,
    IoImageOutline,
    IoDownloadOutline,
    IoCarOutline,
    IoAddCircleOutline,
    IoCloseOutline,
    IoNavigateOutline,
    IoAlertCircleOutline,
    IoMap,
    IoLogoGoogle,
    IoWaterOutline,
    IoLogoWhatsapp,
    IoCameraOutline
} from "react-icons/io5";
import { getBookingDetails, acceptBooking, rejectBooking, cancelBooking, reportUnableToComplete, markBookingAsVisited, markBookingAsEnRoute, requestTravelCharges, downloadInvoice, verifyStartOTP, verifyEndOTP, resendSurveyOTP, updateVisitSchedule } from "../../../services/vendorApi";
import { formatAcresGuntasDisplay } from "../../../utils/landAreaHelper";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import PageContainer from "../../shared/components/PageContainer";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import { maskPhone } from "../../../utils/phoneMasker";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal, { VENDOR_REJECTION_REASONS } from "../../shared/components/InputModal";
import OTPInputModal from "../../shared/components/OTPInputModal";

export default function VendorBookingDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId } = useParams();
    const { vendor } = useVendorAuth();
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const toast = useToast();
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
    const [showUpdateScheduleModal, setShowUpdateScheduleModal] = useState(false);
    const [editScheduleDate, setEditScheduleDate] = useState("");
    const [editScheduleTime, setEditScheduleTime] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const rejectionReasonRef = useRef("");
    const [showTravelChargesModal, setShowTravelChargesModal] = useState(false);
    const [showCancelInput, setShowCancelInput] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showEarlyJourneyConfirm, setShowEarlyJourneyConfirm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancellationReasonType, setCancellationReasonType] = useState("");
    const [cancellationRemarks, setCancellationRemarks] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const CANCELLATION_REASONS = [
        "Unable to Reach Customer",
        "Customer Requested Cancellation",
        "Site Access Denied",
        "Incorrect Booking Details",
        "Survey Location Too Far",
        "Safety or Security Concern",
        "Severe Weather Conditions",
        "Equipment Malfunction",
        "Medical Emergency",
        "Personal Emergency",
        "Scheduling Conflict",
        "Customer Unavailable at Site",
        "Duplicate Booking",
        "Payment/Booking Issue",
        "Other"
    ];

    const [travelChargesData, setTravelChargesData] = useState({
        amount: "",
        reason: ""
    });
    const [submittingTravelCharges, setSubmittingTravelCharges] = useState(false);

    // Unable to Complete Survey (On-site Infeasibility) States
    const [showUnableModal, setShowUnableModal] = useState(false);
    const [unableCategory, setUnableCategory] = useState("LAND_ACCESS_DENIED");
    const [unableDescription, setUnableDescription] = useState("");
    const [unableImages, setUnableImages] = useState([]);
    const [submittingUnable, setSubmittingUnable] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [showStartOTPModal, setShowStartOTPModal] = useState(false);
    const [showEndOTPModal, setShowEndOTPModal] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resendingOTP, setResendingOTP] = useState(false);

    const handleResendOTP = async (type) => {
        if (!bookingId) return;
        try {
            setResendingOTP(true);
            const response = await resendSurveyOTP(bookingId, type);
            if (response.success) {
                toast.showSuccess(response.message || "Survey OTP resent to customer successfully!");
            } else {
                toast.showError(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            handleApiError(err, "Failed to resend OTP");
        } finally {
            setResendingOTP(false);
        }
    };

    // Lock body and html scroll when modals are open
    useEffect(() => {
        if (showAcceptConfirm || showCancelInput || showTravelChargesModal || showMapPicker) {
            const origBody = document.body.style.overflow;
            const origHtml = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = origBody;
                document.documentElement.style.overflow = origHtml;
            };
        }
    }, [showAcceptConfirm, showCancelInput, showTravelChargesModal, showMapPicker]);

    // Reset stale booking data and handle auto-opening modals from navigation state
    useEffect(() => {
        setBooking(null);
        loadBookingDetails();
        if (location.state?.openStartOTP) {
            setShowStartOTPModal(true);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openEndOTP) {
            setShowEndOTPModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [bookingId, location.pathname, location.state]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadBookingDetails();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Listen for real-time notifications and status updates via Socket.IO
    useEffect(() => {
        if (!socket || !bookingId) return;

        // Join the booking tracking / updates room
        socket.emit('join_booking_tracking', bookingId);

        const handleBookingUpdate = (data) => {
            const incomingId = data?.bookingId || data?.booking?._id || data?.id || data?._id;
            if (!incomingId || incomingId === bookingId) {
                console.log('[VendorBookingDetails] Real-time booking update received via socket:', data);
                if (data?.booking) {
                    setBooking(prev => ({ ...prev, ...data.booking }));
                } else if (data?.scheduledDate || data?.scheduledTime) {
                    setBooking(prev => ({
                        ...prev,
                        scheduledDate: data.scheduledDate || prev?.scheduledDate,
                        scheduledTime: data.scheduledTime || prev?.scheduledTime,
                        rescheduleCount: data.rescheduleCount ?? prev?.rescheduleCount,
                        rescheduleHistory: data.rescheduleHistory || prev?.rescheduleHistory,
                        status: data.status || prev?.status
                    }));
                }
                loadBookingDetails(false);
            }
        };

        socket.on('booking_updated', handleBookingUpdate);
        socket.on('booking_status_updated', handleBookingUpdate);
        socket.on('BOOKING_RESCHEDULED', handleBookingUpdate);
        socket.on('booking_rescheduled', handleBookingUpdate);
        socket.on('new_notification', handleBookingUpdate);
        socket.on('newNotification', handleBookingUpdate);

        return () => {
            socket.off('booking_updated', handleBookingUpdate);
            socket.off('booking_status_updated', handleBookingUpdate);
            socket.off('BOOKING_RESCHEDULED', handleBookingUpdate);
            socket.off('booking_rescheduled', handleBookingUpdate);
            socket.off('new_notification', handleBookingUpdate);
            socket.off('newNotification', handleBookingUpdate);
        };
    }, [socket, bookingId]);

    // Auto-polling every 5 seconds so status changes reflect live without manual refresh
    useEffect(() => {
        if (!bookingId) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadBookingDetails(false);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [bookingId]);

    const loadBookingDetails = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await getBookingDetails(bookingId);

            if (response.success) {
                setBooking(response.data.booking);
            } else {
                toast.showError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking details");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const [acceptScheduleDate, setAcceptScheduleDate] = useState("");
    const [acceptScheduleTime, setAcceptScheduleTime] = useState("");

    const handleAccept = () => {
        const fixedDate = booking?.scheduledDate || booking?.scheduleDate
            ? new Date(booking.scheduledDate || booking.scheduleDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
        setAcceptScheduleDate(fixedDate);
        setAcceptScheduleTime(booking?.scheduledTime && booking?.scheduledTime !== "TBD" ? booking.scheduledTime : "09:00 AM - 10:00 AM");
        setShowAcceptConfirm(true);
    };

    const handleAcceptConfirm = async () => {
        if (!acceptScheduleTime) {
            toast.showError("Please select a visit time slot.");
            return;
        }
        setShowAcceptConfirm(false);
        const loadingToast = toast.showLoading("Accepting booking & scheduling visit...");
        try {
            setActionLoading(true);

            const response = await acceptBooking(bookingId, {
                scheduleDate: acceptScheduleDate,
                scheduleTime: acceptScheduleTime,
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking accepted successfully! Customer notified.");
                await loadBookingDetails(false);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to accept booking");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenUpdateSchedule = () => {
        const currentDate = booking?.scheduledDate || booking?.scheduleDate
            ? new Date(booking.scheduledDate || booking.scheduleDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
        setEditScheduleDate(currentDate);
        setEditScheduleTime(
            booking?.scheduledTime && booking?.scheduledTime !== "TBD" && booking?.scheduledTime !== "Time TBD by Expert"
                ? booking.scheduledTime
                : "09:00 AM - 10:00 AM"
        );
        setShowUpdateScheduleModal(true);
    };

    const handleSaveScheduleUpdate = async () => {
        if (!editScheduleTime) {
            toast.showError("Please select a visit time slot.");
            return;
        }
        setShowUpdateScheduleModal(false);
        const loadingToast = toast.showLoading("Updating survey visit time...");
        try {
            setActionLoading(true);
            const response = await updateVisitSchedule(bookingId, {
                scheduledDate: editScheduleDate,
                scheduledTime: editScheduleTime
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(`Visit time confirmed for ${editScheduleTime}! Customer notified.`);
                await loadBookingDetails(false);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to update visit schedule");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to update visit schedule");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = () => {
        rejectionReasonRef.current = "";
        setRejectionReason("");
        setShowRejectInput(true);
    };

    const handleRejectReasonSubmit = (reason) => {
        rejectionReasonRef.current = reason;
        setRejectionReason(reason);
        setShowRejectInput(false);
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        const finalReason = rejectionReasonRef.current || rejectionReason;
        if (!finalReason || finalReason.trim().length < 10) {
            toast.showError("Rejection reason must be at least 10 characters long.");
            return;
        }

        setShowRejectConfirm(false);
        const loadingToast = toast.showLoading("Rejecting booking...");
        try {
            setActionLoading(true);

            const response = await rejectBooking(bookingId, finalReason.trim());

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking rejected successfully. Full refund initiated for customer.");
                rejectionReasonRef.current = "";
                setRejectionReason("");
                await loadBookingDetails(false);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject booking");
        } finally {
            setActionLoading(false);
        }
    };

    const isFutureSurvey = (dateString) => {
        if (!dateString) return false;
        const surveyDate = new Date(dateString);
        surveyDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return surveyDate > today;
    };

    const handleMarkEnRoute = async () => {
        const isTimeTBD = !booking?.scheduledTime || booking?.scheduledTime === "Time TBD by Expert" || booking?.scheduledTime === "TBD";
        if (isTimeTBD) {
            toast.showWarning("Please set your arrival time slot before starting your journey.");
            handleOpenUpdateSchedule();
            return;
        }
        if (isFutureSurvey(booking?.scheduledDate)) {
            setShowEarlyJourneyConfirm(true);
            return;
        }
        await executeMarkEnRoute();
    };

    const executeMarkEnRoute = async () => {
        const loadingToast = toast.showLoading("Updating status to En Route...");
        try {
            setActionLoading(true);
            setBooking(prev => ({
                ...prev,
                status: "EN_ROUTE",
                vendorStatus: "EN_ROUTE",
                userStatus: "EN_ROUTE",
                enRouteAt: new Date()
            }));
            const response = await markBookingAsEnRoute(bookingId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Trip started! You are now marked En Route.");
                const updated = response.data?.booking;
                if (updated) {
                    setBooking(prev => ({ ...prev, ...updated, status: "EN_ROUTE", vendorStatus: "EN_ROUTE" }));
                }
                await loadBookingDetails(false);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to update status");
                await loadBookingDetails(false);
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to update status");
            await loadBookingDetails(false);
        } finally {
            setActionLoading(false);
        }
    };

    const parseSurveySiteInfo = (booking) => {
        if (!booking) return {};
        
        let category = booking.purpose || '';
        let extent = '';
        if (booking.purposeExtent) {
            extent = category === 'Agriculture' 
                ? formatAcresGuntasDisplay(booking.purposeExtent) 
                : `${booking.purposeExtent} Sq. Ft.`;
        } else {
            extent = booking.extent || '';
        }
        let surveyNo = booking.surveyNumber || booking.address?.surveyNumber || '';
        let landmark = booking.address?.landmark || booking.landmark || '';
        let remarks = '';

        let notes = booking.notes || '';

        if (notes) {
            const catMatch = notes.match(/Category:\s*([^.]+)/i);
            const surMatch = notes.match(/(?:Survey No|Plot No):\s*([^.]+)/i);
            const landMatch = notes.match(/Landmark:\s*([^.]+)/i);

            if (catMatch && !category) category = catMatch[1].trim();
            if (surMatch && !surveyNo) surveyNo = surMatch[1].trim();
            if (landMatch && !landmark) landmark = landMatch[1].trim();

            if (catMatch || surMatch || landMatch) {
                let cleaned = notes
                    .replace(/Category:[^.]*\.?/gi, '')
                    .replace(/(?:Survey No|Plot No):[^.]*\.?/gi, '')
                    .replace(/Landmark:[^.]*\.?/gi, '')
                    .replace(/Remarks:\s*/gi, '')
                    .trim();
                remarks = cleaned;
            } else {
                remarks = notes;
            }
        }

        return {
            category,
            extent,
            surveyNo,
            landmark,
            remarks,
            village: booking.village || booking.address?.city || '',
            mandal: booking.mandal || '',
            district: booking.district || '',
            state: booking.address?.state || '',
            pincode: booking.address?.pincode || '',
            coordinates: booking.address?.coordinates || null
        };
    };

    const handleVerifyStartOTP = async (otp) => {
        if (!otp || otp.length < 4) {
            toast.showError("Please enter a valid OTP");
            return;
        }

        const loadingToast = toast.showLoading("Verifying OTP...");
        try {
            setVerifyingOTP(true);
            const response = await verifyStartOTP(bookingId, otp);
            
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Start Survey OTP verified successfully!");
                setShowStartOTPModal(false);
                const updated = response.data?.booking;
                if (updated) {
                    setBooking(prev => ({
                        ...prev,
                        ...updated,
                        status: "VISITED",
                        vendorStatus: "VISITED",
                        userStatus: "VISITED",
                        otp: {
                            ...prev?.otp,
                            ...updated?.otp,
                            startSurvey: { ...prev?.otp?.startSurvey, ...updated?.otp?.startSurvey, verified: true }
                        },
                        startSurveyVerifiedAt: new Date()
                    }));
                }
                await loadBookingDetails(false);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Invalid OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to verify OTP");
        } finally {
            setVerifyingOTP(false);
        }
    };

    const handleVerifyEndOTP = async (otp) => {
        if (!otp || otp.length < 4) {
            toast.showError("Please enter a valid OTP");
            return;
        }

        const loadingToast = toast.showLoading("Verifying OTP...");
        try {
            setVerifyingOTP(true);
            const response = await verifyEndOTP(bookingId, otp);
            
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("End Survey OTP verified successfully!");
                setShowEndOTPModal(false);
                const updated = response.data?.booking;
                if (updated) {
                    setBooking(prev => ({
                        ...prev,
                        ...updated,
                        otp: {
                            ...prev?.otp,
                            ...updated?.otp,
                            endSurvey: { ...prev?.otp?.endSurvey, ...updated?.otp?.endSurvey, verified: true }
                        },
                        endSurveyVerifiedAt: new Date()
                    }));
                }
                await loadBookingDetails(false);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Invalid OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to verify OTP");
        } finally {
            setVerifyingOTP(false);
        }
    };
    const handleCancel = () => {
        setCancellationReason("");
        setShowCancelInput(true);
    };

    const handleCancelReasonSubmit = (reason) => {
        setCancellationReason(reason);
        setShowCancelInput(false);
        setShowCancelConfirm(true);
    };

    const handleCancelConfirm = async () => {
        setShowCancelConfirm(false);
        const loadingToast = toast.showLoading("Cancelling booking...");
        try {
            setActionLoading(true);

            const response = await cancelBooking(bookingId, cancellationReason, cancellationReasonType || 'OTHER');

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(response.message || "Booking cancelled successfully.");
                setCancellationReason("");
                setTimeout(() => {
                    navigate("/vendor/bookings");
                }, 1500);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to cancel booking");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnableImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImgs = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setUnableImages((prev) => [...prev, ...newImgs]);
    };

    const handleRemoveUnableImage = (index) => {
        setUnableImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitUnableToComplete = async () => {
        if (!unableCategory) {
            toast.showError("Please select an on-site condition category");
            return;
        }
        if (!unableDescription || unableDescription.trim().length < 15) {
            toast.showError("Please provide a detailed description (min 15 characters)");
            return;
        }
        const loadingToast = toast.showLoading("Submitting on-site infeasibility report...");
        try {
            setSubmittingUnable(true);
            const formData = new FormData();
            formData.append('reasonCategory', unableCategory);
            formData.append('reasonDescription', unableDescription.trim());
            if (unableImages && unableImages.length > 0) {
                unableImages.forEach((img) => formData.append('images', img.file));
            }

            const response = await reportUnableToComplete(bookingId, formData);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("On-site condition report submitted. Operations team will review and mediate.");
                setShowUnableModal(false);
                setUnableDescription("");
                setUnableImages([]);
                await fetchBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to submit report");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to submit on-site report");
        } finally {
            setSubmittingUnable(false);
        }
    };

    const handleSubmitTravelCharges = async () => {
        if (!travelChargesData.amount || parseFloat(travelChargesData.amount) <= 0) {
            toast.showError("Please enter a valid amount");
            return;
        }

        const loadingToast = toast.showLoading("Submitting travel charges request...");
        try {
            setSubmittingTravelCharges(true);

            const response = await requestTravelCharges(bookingId, {
                amount: parseFloat(travelChargesData.amount),
                reason: travelChargesData.reason || ""
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Travel charges request submitted successfully!");
                setShowTravelChargesModal(false);
                setTravelChargesData({ amount: "", reason: "" });
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to submit travel charges request");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to submit travel charges request");
        } finally {
            setSubmittingTravelCharges(false);
        }
    };

    const handleDownloadInvoice = () => {
        navigate(`/vendor/booking/${bookingId}/invoice`);
    };

    const openMapApp = (appName) => {
        if (!booking?.address) return;

        const { street, city, state, pincode, location } = booking.address;
        const [lng, lat] = location?.coordinates || [0, 0];
        const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(`${street || ""}, ${city || ""}, ${state || ""} ${pincode || ""}`.trim());
        const label = encodeURIComponent(booking.user?.name || 'Customer Site');

        let url = "";
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        switch (appName) {
            case 'google':
                url = isIOS
                    ? `comgooglemaps://?q=${query}&center=${query}`
                    : `geo:${query}?q=${query}(${label})`;
                break;
            case 'apple':
                url = `maps://?q=${label}&ll=${query}`;
                break;
            case 'waze':
                url = `waze://?ll=${query}&navigate=yes`;
                break;
            default:
                url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }

        // Attempt to open native app
        window.location.href = url;
        setShowMapPicker(false);

        // Safety timeout for web-only environments/desktops
        setTimeout(() => {
            if (document.visibilityState === 'visible') {
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
            }
        }, 1500);
    };

    const handleGetDirections = () => {
        if (!booking?.address) {
            toast.showError("Address not available");
            return;
        }
        setShowMapPicker(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { color: "bg-orange-100 text-orange-700", label: "Pending" },
            ASSIGNED: { color: "bg-orange-100 text-orange-700", label: "Pending" },
            ACCEPTED: { color: "bg-blue-100 text-blue-700", label: "Accepted" },
            EN_ROUTE: { color: "bg-sky-100 text-sky-700", label: "En Route" },
            VISITED: { color: "bg-indigo-100 text-indigo-700", label: "Survey Started" },
            REPORT_UPLOADED: { color: "bg-indigo-100 text-indigo-700", label: "Report Uploaded" },
            PAID_FIRST: { color: "bg-teal-100 text-teal-700", label: "1st Payment Release" },
            AWAITING_PAYMENT: { color: "bg-orange-100 text-orange-700", label: "Awaiting Payment" },
            PAYMENT_SUCCESS: { color: "bg-green-100 text-green-700", label: "Payment Success" },
            FINAL_SETTLEMENT: { color: "bg-teal-100 text-teal-700", label: "Final Settlement" },
            FINAL_SETTLEMENT_COMPLETE: { color: "bg-emerald-100 text-emerald-700", label: "Settlement Complete" },
            BOREWELL_UPLOADED: { color: "bg-cyan-100 text-cyan-700", label: "Borewell Uploaded" },
            ADMIN_APPROVED: { color: "bg-blue-100 text-blue-700", label: "Admin Approved" },
            APPROVED: { color: "bg-green-100 text-green-700", label: "Approved" },
            COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed" },
            REJECTED: { color: "bg-red-100 text-red-700", label: "Rejected" },
            CANCELLED: { color: "bg-gray-100 text-gray-700", label: "Cancelled" },
        };

        if (booking?.report?.rejectedAt && !booking?.report?.approvedAt) {
            return (
                <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    ⚠️ Report Revision Required
                </span>
            );
        }

        if (status === 'VISITED' && booking?.otp?.endSurvey?.verified) {
            return (
                <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                    Survey Completed • Upload Report
                </span>
            );
        }

        const config = statusConfig[status] || { color: "bg-slate-100 text-slate-700", label: status };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider ${config.color}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }


    if (!booking) {
        return (
            <PageContainer className="py-12">
                <div className="text-center py-8">
                    <p className="text-gray-600">Booking not found</p>
                    <button
                        onClick={() => navigate("/vendor/bookings")}
                        className="mt-4 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                    >
                        Back to Bookings
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer className="pb-24 max-w-4xl mx-auto">

            {/* Removed Back Button from here as it's now in VendorNavbar */}

            {/* Header */}
            <div className="mb-5 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col gap-1">
                            <span className="text-slate-500 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">Booking ID:</span>
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md select-all truncate">
                                {booking._id || booking.id}
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {getStatusBadge(booking.status)}
                    </div>
                </div>

                {/* Rescheduled / Reassigned Banner */}
                {((booking.isRescheduled || (booking.rescheduleHistory && booking.rescheduleHistory.length > 0) || (booking.rescheduleCount > 0)) && (booking.vendorStatus === "ASSIGNED" || booking.status === "ASSIGNED")) && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-[#0A84FF] shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🗓️</span>
                            <div>
                                <span className="font-extrabold text-blue-900">Customer Rescheduled & Reassigned:</span>
                                <span className="ml-1 text-slate-600 font-medium">Customer requested a date change and selected you as the expert.</span>
                            </div>
                        </div>
                        <span className="self-start sm:self-auto shrink-0 text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-black border border-emerald-200">
                            Advance Paid (₹0 Extra Fee)
                        </span>
                    </div>
                )}
            </div>

            {/* Visual Status Timeline */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h2 className="text-xl font-bold text-gray-800">Booking Status</h2>
                    <button
                        onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/status`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#E7F0FB] text-[#0A84FF] rounded-xl text-base font-bold hover:bg-[#D0E1F7] active:scale-95 transition-all shadow-sm border border-[#D0E1F7]"
                    >
                        <IoDocumentTextOutline className="text-xl" />
                        View Full Status Timeline
                    </button>
                </div>

                {/* Visual Step Timeline - Improved Scrollable Container */}
                <div className="relative">
                    <div className="flex items-start justify-between gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                        {(() => {
                            // Derive robust effectiveStatus across payment, report, and borewell milestones
                            // IMPORTANT: lateStatuses always win — prevents borewell check from capping
                            // the timeline at BOREWELL_UPLOADED when the booking has already progressed past it
                            const _statusOrder = ["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"];
                            // Pick the MORE ADVANCED of vendorStatus vs booking.status
                            // (they can diverge; badge reads booking.status, timeline used vendorStatus — now we unify)
                            const _vIdx = _statusOrder.indexOf(booking.vendorStatus);
                            const _sIdx = _statusOrder.indexOf(booking.status);
                            const rawStatus = (_vIdx >= _sIdx ? (booking.vendorStatus || booking.status) : booking.status) || booking.status;
                            const lateStatuses = ["APPROVED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED", "SUCCESS", "FAILED"];
                            const hasBorell = booking.borewellResult && booking.borewellResult.uploadedAt && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED');
                            const hasFullPayment = (booking.payment?.remainingPaid === true) || rawStatus === "PAYMENT_SUCCESS" || rawStatus === "PAID_FIRST";
                            const hasReport = !!(booking.reportUploadedAt || (booking.report && (booking.report.uploadedAt || booking.report.waterFound !== undefined)));

                            const isEndOtpVerified = !!booking.otp?.endSurvey?.verified;
                            const isEarlyStage = ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "AWAITING_ADVANCE"].includes(rawStatus) || (rawStatus === "VISITED" && !isEndOtpVerified);

                            const status = lateStatuses.includes(rawStatus) ? rawStatus
                                : (!isEarlyStage && hasBorell) ? "BOREWELL_UPLOADED"
                                : (!isEarlyStage && hasFullPayment) ? "PAYMENT_SUCCESS"
                                : (!isEarlyStage && hasReport) ? "REPORT_UPLOADED"
                                : (rawStatus === "VISITED" && isEndOtpVerified) ? "REPORT_UPLOADED"
                                : rawStatus;

                            const timelineSteps = [
                                { id: "assigned", label: "Assigned", icon: "📋", statuses: ["ASSIGNED"] },
                                { id: "accepted", label: "Accepted", icon: "✅", statuses: ["ACCEPTED"] },
                                { id: "en_route", label: "En Route", icon: "🚗", statuses: ["EN_ROUTE"] },
                                { id: "visited", label: "Survey Started", icon: "🛠️", statuses: ["VISITED"] },
                                { id: "report", label: "Report", icon: "📄", statuses: ["REPORT_UPLOADED"] },
                                { id: "payment", label: "Payment", icon: "💰", statuses: ["PAID_FIRST", "AWAITING_PAYMENT", "PAYMENT_SUCCESS"] },
                                { id: "borewell", label: "Borewell Result", icon: "🚰", statuses: ["BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED"] },
                                { id: "completed", label: "Completed", icon: "🎉", statuses: ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "FINAL_SETTLEMENT", "SUCCESS", "FAILED"] },
                            ];
                            
                            // Perfectly matches backend chronological flow
                            const statusOrder = [
                                "ASSIGNED", "ACCEPTED", "EN_ROUTE", "VISITED", 
                                "REPORT_UPLOADED", 
                                "PAID_FIRST", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", 
                                "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED",
                                "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED", "SUCCESS", "FAILED"
                            ];
                            const currentIndex = statusOrder.indexOf(status);

                            return timelineSteps.map((step, index) => {
                                const stepStatuses = step.id === "completed"
                                    ? ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "SUCCESS", "FAILED"]
                                    : step.statuses;

                                const stepStatusIndex = Math.max(...stepStatuses.map(s => statusOrder.indexOf(s)));
                                const isCompleted = currentIndex >= 0 && currentIndex > stepStatusIndex;
                                const isActive = step.statuses.includes(status) || (step.id === "completed" && ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "SUCCESS", "FAILED"].includes(status));
                                const isPending = !isCompleted && !isActive;

                                return (
                                    <div key={step.id} className="flex flex-col items-center min-w-[70px] relative first:pl-0 last:pr-0">
                                        {/* Connector Line */}
                                        {index < timelineSteps.length - 1 && (
                                            <div
                                                className={`absolute left-[50%] top-6 w-full h-[3px] z-0 ${isCompleted ? "bg-[#00C2A8]" : "bg-gray-100"
                                                    }`}
                                            />
                                        )}

                                        {/* Step Circle */}
                                        <div
                                            className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 shadow-sm ${isCompleted || isActive
                                                ? isActive ? "bg-[#0A84FF] text-white scale-110 shadow-lg shadow-blue-100" : "bg-[#00C2A8] text-white"
                                                : "bg-white border border-gray-100 text-gray-300"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <IoCheckmarkCircleOutline className="text-2xl" />
                                            ) : (
                                                <span className={`${isPending ? "opacity-40" : ""}`}>{step.icon}</span>
                                            )}
                                        </div>

                                        {/* Label */}
                                        <span
                                            className={`text-[11px] font-bold mt-3 text-center leading-tight tracking-tight transition-colors duration-300 ${isCompleted ? "text-[#00C2A8]" : isActive ? "text-[#0A84FF]" : "text-gray-400"
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    {/* Shadow indicators for scroll */}
                    <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-50 sm:hidden"></div>
                </div>

                {/* Detailed dates & transaction timestamps */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5 text-xs sm:text-sm">
                    {booking.createdAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Booking Created:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.createdAt)}</span>
                        </div>
                    )}
                    {booking.assignedAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Expert Assigned:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.assignedAt)}</span>
                        </div>
                    )}
                    {booking.acceptedAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Expert Accepted:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.acceptedAt)}</span>
                        </div>
                    )}
                    {booking.enRouteAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Journey Started:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.enRouteAt)}</span>
                        </div>
                    )}
                    {booking.visitedAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Site Visited:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.visitedAt)}</span>
                        </div>
                    )}
                    {(booking.endSurveyVerifiedAt || booking.otp?.endSurvey?.verifiedAt) && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Survey Completed:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.endSurveyVerifiedAt || booking.otp?.endSurvey?.verifiedAt)}</span>
                        </div>
                    )}
                    {(booking.reportUploadedAt || booking.report?.uploadedAt) && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Report Uploaded:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.reportUploadedAt || booking.report?.uploadedAt)}</span>
                        </div>
                    )}
                    {booking.payment?.advancePaidAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-600 font-semibold">Advance Payment (40%) Paid:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.payment.advancePaidAt)}</span>
                        </div>
                    )}
                    {booking.payment?.remainingPaidAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-600 font-semibold">Final Settlement (60%) Paid:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.payment.remainingPaidAt)}</span>
                        </div>
                    )}
                    {booking.borewellResult?.uploadedAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Borewell Result Uploaded:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.borewellResult.uploadedAt)}</span>
                        </div>
                    )}
                    {booking.completedAt && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Completed:</span>
                            <span className="text-gray-800 font-bold">{formatDate(booking.completedAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons - Required Action Card */}
            {booking.status === "ASSIGNED" && (
                <div className="bg-white rounded-[24px] p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.06)] mb-6 border border-blue-50/50">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#0A84FF] rounded-full"></span>
                        Required Action
                    </h2>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="w-full py-3.5 px-6 bg-[#FFF0F0] text-[#E53935] text-base font-bold rounded-[20px] hover:bg-red-100 transition-all active:scale-[0.98] disabled:opacity-50 text-center"
                        >
                            Reject Booking
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={actionLoading}
                            className="w-full py-4 px-6 bg-[#0A84FF] text-white text-base font-bold rounded-[20px] hover:bg-[#0070E0] transition-all active:scale-[0.98] shadow-lg shadow-blue-200/50 disabled:opacity-50 text-center"
                        >
                            {actionLoading ? "Accepting..." : "Accept Booking Now"}
                        </button>
                    </div>
                </div>
            )}

            {booking.status === "ACCEPTED" && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(10,132,255,0.08)] mb-6 border-2 border-blue-50 ring-4 ring-blue-50/30">
                    <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#0A84FF] rounded-full"></span>
                        Next Step
                    </h2>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleMarkEnRoute}
                            disabled={actionLoading}
                            className="w-full bg-[#0A84FF] text-white font-black py-4 rounded-2xl hover:bg-[#005BBB] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-100 disabled:opacity-50"
                        >
                            <IoCarOutline className="text-2xl" />
                            {actionLoading ? "Processing..." : "Start Journey"}
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="flex-1 bg-red-50 text-red-600 font-bold py-3.5 rounded-2xl border-2 border-red-50 hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <IoCloseCircleOutline className="text-xl" />
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowMapPicker(true)}
                                className="flex-[2] bg-white text-emerald-600 font-bold py-3.5 rounded-2xl border-2 border-emerald-50 hover:bg-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <IoNavigateOutline className="text-xl" />
                                Get Directions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {booking.status === "EN_ROUTE" && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(10,132,255,0.08)] mb-6 border-2 border-blue-50 ring-4 ring-blue-50/30">
                    <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                        Next Step
                    </h2>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setShowStartOTPModal(true)}
                            disabled={actionLoading}
                            className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 disabled:opacity-50"
                        >
                            <IoCheckmarkCircleOutline className="text-2xl" />
                            {actionLoading ? "Processing..." : "Start Survey"}
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMapPicker(true)}
                                className="flex-1 bg-white text-emerald-600 font-bold py-3.5 rounded-2xl border-2 border-emerald-50 hover:bg-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <IoNavigateOutline className="text-xl" />
                                Directions
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="bg-red-50 text-red-600 font-bold px-4 rounded-2xl border-2 border-red-50 hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center"
                            >
                                <IoCloseCircleOutline className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {booking.status === "VISITED" && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(10,132,255,0.08)] mb-6 border-2 border-blue-50 ring-4 ring-blue-50/30">
                    <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#0A84FF] rounded-full"></span>
                        Required Action
                    </h2>
                    <div className="flex flex-col gap-3">
                        {!booking.otp?.endSurvey?.verified ? (
                            <button
                                onClick={() => setShowEndOTPModal(true)}
                                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-emerald-200"
                            >
                                <IoCheckmarkCircleOutline className="text-2xl" />
                                End Survey
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(`/vendor/bookings/${bookingId}/upload-report`)}
                                className="w-full bg-[#0A84FF] text-white font-black py-4 rounded-2xl hover:bg-[#005BBB] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
                            >
                                <IoDocumentTextOutline className="text-2xl" />
                                Upload Technical Report
                            </button>
                        )}
                        {booking.status === "VISITED" ? (
                            <button
                                onClick={() => setShowUnableModal(true)}
                                className="w-full bg-amber-50 text-amber-800 font-bold py-3.5 rounded-2xl border-2 border-amber-200 hover:bg-amber-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <IoAlertCircleOutline className="text-xl text-amber-600" />
                                <span>Unable to Complete Survey (On-Site Infeasible)</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-2xl border-2 border-red-50 hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <IoCloseCircleOutline className="text-xl" />
                                <span>Cancel Booking</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Report Rejection / Revision Required Alert Banner */}
            {booking.report?.rejectedAt && !booking.report?.approvedAt && (
                <div className="bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-200 rounded-2xl p-5 mb-6 shadow-sm">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl text-xl flex-shrink-0">
                            ⚠️
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h3 className="text-sm font-black text-rose-900">
                                    Survey Report Needs Revision
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200/80 text-rose-800 px-2.5 py-0.5 rounded-full">
                                    Action Required
                                </span>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 border border-rose-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Admin Feedback / Reason:</p>
                                <p className="text-xs font-bold text-rose-950 leading-relaxed">
                                    {booking.report.rejectionReason || "Please review the technical parameters, clear images, and depth coordinates."}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(`/vendor/bookings/${booking._id || booking.id}/upload-report`)}
                                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <IoDocumentTextOutline className="text-base" />
                                <span>Edit & Re-Upload Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stage Action Guide Card: Report Uploaded & Awaiting Final Payment */}
            {!["ASSIGNED", "ACCEPTED", "VISITED", "AWAITING_ADVANCE", "CANCELLED", "REJECTED"].includes(booking.status) && (booking.reportUploadedAt || (booking.report && (booking.report.uploadedAt || booking.report.waterFound !== undefined))) && !booking.payment?.remainingPaid && booking.status !== "PAYMENT_SUCCESS" && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(10,132,255,0.08)] mb-6 border-2 border-blue-50 ring-4 ring-blue-50/30">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#0A84FF] rounded-full"></span>
                            Current Stage: Report Uploaded
                        </h2>
                        <span className="px-3 py-1 bg-blue-50 text-[#0A84FF] font-bold text-xs rounded-full border border-blue-100">
                            Awaiting Customer Payment
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                        Your Hydrogeological Survey Report has been uploaded successfully. <br />
                        <strong className="text-gray-800">Next Step:</strong> Customer is reviewing the report preview and making the final 60% settlement.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/report`)}
                            className="flex-1 bg-[#0A84FF] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#005BBB] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 text-xs sm:text-sm"
                        >
                            <IoDocumentTextOutline className="text-lg" />
                            <span>View Digital Survey Report</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Stage Action Guide Card: Full Payment Received (PAYMENT_SUCCESS) */}
            {!["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "AWAITING_ADVANCE", "CANCELLED", "REJECTED"].includes(booking.status) && (booking.payment?.remainingPaid === true || booking.status === "PAYMENT_SUCCESS" || booking.status === "PAID_FIRST") && (!booking.borewellResult || !booking.borewellResult?.uploadedAt) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(16,185,129,0.08)] mb-6 border-2 border-emerald-100 ring-4 ring-emerald-50/50">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            Current Stage: Full Payment Received
                        </h2>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                            100% Settled
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                        Customer has successfully completed the 60% final payment. <br />
                        <strong className="text-gray-800">Next Step:</strong> Customer will perform borewell drilling based on your survey report location points and upload the outcome.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                        <button
                            onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/report`)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 text-[#0A84FF] font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
                        >
                            <IoDocumentTextOutline className="text-lg" />
                            <span>View Survey Report</span>
                        </button>
                        <button
                            onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/invoice`)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                        >
                            <IoDownloadOutline className="text-lg" />
                            <span>Platform Tax Invoice</span>
                        </button>
                        {booking.user?.phone && (
                            <a
                                href={`https://wa.me/91${booking.user.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${booking.user.name}, I noticed your 60% settlement is complete for Hydrogeology Survey ORD-${booking._id?.slice(-8).toUpperCase()}. Let me know if you need assistance with borewell drilling points!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                            >
                                <IoLogoWhatsapp className="text-lg" />
                                <span>Chat on WhatsApp</span>
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Customer Information Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h2>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {booking.user?.profilePicture ? (
                                <img
                                    src={booking.user.profilePicture}
                                    alt={booking.user.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center text-white text-2xl font-bold shadow-sm border-2 border-white">
                                    {booking.user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {booking.user?.name || booking.customerName || "Customer"}
                                </h3>

                                {/* Real Email (only display if not a dummy internal system email) */}
                                {booking.user?.email && !booking.user.email.endsWith('@jaladhar.internal') && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                        <IoMailOutline className="text-base text-gray-400" />
                                        {booking.status === "ASSIGNED" ? (
                                            <span className="text-gray-400 font-medium italic">Email hidden until accepted</span>
                                        ) : (
                                            <a href={`mailto:${booking.user.email}`} className="hover:text-[#0A84FF] font-medium">
                                                {booking.user.email}
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Primary Mobile Number */}
                                {(booking.user?.phone || booking.phone) && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                                        <IoCallOutline className="text-base text-[#0A84FF]" />
                                        <a href={`tel:${booking.user?.phone || booking.phone}`} className="hover:text-[#0A84FF] font-bold text-gray-900">
                                            {maskPhone(booking.user?.phone || booking.phone)}
                                        </a>
                                    </div>
                                )}

                                {/* Alternate Mobile Number (Only if present) */}
                                {(booking.alternatePhone || booking.user?.alternatePhone) && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                                        <span className="font-semibold text-gray-500">Alt Phone:</span>
                                        <a href={`tel:${booking.alternatePhone || booking.user?.alternatePhone}`} className="hover:text-[#0A84FF] font-bold text-gray-800 flex items-center gap-1">
                                            <IoCallOutline className="text-xs text-emerald-600" />
                                            <span>{maskPhone(booking.alternatePhone || booking.user?.alternatePhone)}</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick 1-Tap Call & WhatsApp Action Buttons */}
                        {(booking.user?.phone || booking.phone) && booking.status !== "ASSIGNED" && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                <a
                                    href={`tel:${booking.user?.phone || booking.phone}`}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 text-[#0A84FF] font-bold text-xs rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
                                    title="Call Primary Number"
                                >
                                    <IoCallOutline className="text-base" />
                                    <span>Call</span>
                                </a>

                                {(booking.alternatePhone || booking.user?.alternatePhone) && (
                                    <a
                                        href={`tel:${booking.alternatePhone || booking.user?.alternatePhone}`}
                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl hover:bg-amber-100 transition-all border border-amber-200"
                                        title="Call Alternate Number"
                                    >
                                        <IoCallOutline className="text-base text-amber-600" />
                                        <span>Call Alt</span>
                                    </a>
                                )}

                                <a
                                    href={`https://wa.me/91${(booking.user?.phone || booking.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${booking.user?.name || 'Customer'}, I am your ${booking.vendor?.designation || 'Groundwater Professional'} from Jaladhaara regarding Booking ORD-${booking._id?.slice(-8).toUpperCase()}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                                >
                                    <IoLogoWhatsapp className="text-base text-emerald-500" />
                                    <span>WhatsApp</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Survey Information Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <IoDocumentTextOutline className="text-[#0A84FF] text-2xl" />
                        <span>Survey Information</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {/* Survey Category Header Banner */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Survey Category</p>
                            <p className="text-base font-extrabold text-gray-800 mt-0.5">
                                {booking.surveyCategory || booking.purpose || booking.service?.category || "Agriculture"}
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-white text-[#0A84FF] font-bold text-xs rounded-full border border-blue-200 shadow-sm">
                            {booking.service?.name || "Hydrogeology Survey"}
                        </span>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Land Area */}
                        <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Land Area</p>
                            <p className="text-sm font-bold text-gray-900">
                                {booking.purposeExtent 
                                    ? formatAcresGuntasDisplay(booking.purposeExtent) 
                                    : (booking.areaExtent ? `${booking.areaExtent} ${booking.areaUnit || 'Acres'}` : "Not specified")
                                }
                            </p>
                        </div>

                        {/* Survey No / Plot No */}
                        <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {booking.surveyCategory === 'Agriculture' || booking.purpose === 'Agriculture' ? 'Survey No.' : 'Survey No / Plot No'}
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                                {parseSurveySiteInfo(booking).surveyNo || booking.surveyNumber || booking.address?.surveyNumber || "Not specified"}
                            </p>
                        </div>

                        {/* Purpose of Survey */}
                        <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose of Survey</p>
                            <p className="text-sm font-bold text-gray-900">
                                {booking.purpose || "Groundwater Point Identification & Hydrogeological Survey"}
                            </p>
                        </div>

                        {/* Existing Borewells */}
                        <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Existing Borewells</p>
                            <p className="text-sm font-bold text-gray-900">
                                {booking.existingBorewellInfo || 
                                 (booking.reportData?.existingBorewell?.hasExisting || booking.existingBorewell?.depth 
                                    ? `Yes (Depth: ${booking.reportData?.existingBorewell?.depthInFeet || booking.existingBorewell?.depth || 'N/A'}ft)` 
                                    : "None / No Existing Borewell")
                                }
                            </p>
                        </div>

                        {/* Preferred Survey Date & Time */}
                        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                    <IoTimeOutline className="text-sm text-emerald-600" />
                                    <span>Scheduled Survey Date & Time</span>
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {booking.rescheduleCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0A84FF] text-[10px] font-extrabold border border-blue-200">
                                            Rescheduled
                                        </span>
                                    )}
                                    {!booking?.otp?.startSurvey?.verified && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking?.status) && (
                                        <button
                                            type="button"
                                            onClick={handleOpenUpdateSchedule}
                                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shadow-2xs flex items-center gap-1 cursor-pointer transition-all hover:scale-102"
                                        >
                                            <IoCalendarOutline className="text-xs text-emerald-600" />
                                            <span>{booking.scheduledTime === "Time TBD by Expert" || booking.scheduledTime === "TBD" ? "Set Visit Time" : "Change Time"}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm font-extrabold text-emerald-950">
                                {booking.scheduledDate
                                    ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "N/A"
                                } at <span className={booking.scheduledTime === "Time TBD by Expert" || booking.scheduledTime === "TBD" ? "text-amber-800 font-black bg-amber-100 px-2 py-0.5 rounded-md" : "text-emerald-950"}>{booking.scheduledTime || "TBD"}</span>
                            </p>
                            {booking.rescheduleHistory && booking.rescheduleHistory.length > 0 && (
                                <p className="text-[11px] text-slate-600 font-medium pt-1 border-t border-emerald-100/80">
                                    Note: {booking.rescheduleHistory[booking.rescheduleHistory.length - 1].reason || "Customer moved survey slot"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Survey Location Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <IoLocationOutline className="text-[#0A84FF] text-2xl" />
                        <span>Survey Location</span>
                    </h2>
                </div>

                <div className="space-y-3.5">
                    {/* Complete Address */}
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Complete Address</p>
                        <p className="text-sm font-bold text-gray-800 leading-snug">
                            {booking.address?.street || booking.address?.landmark || [booking.address?.city, booking.address?.state].filter(Boolean).join(", ") || "N/A"}
                        </p>
                    </div>

                    {/* Location Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-500">Village</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.village || booking.address?.village || booking.address?.city || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-500">Mandal / Taluk</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.mandal || booking.address?.mandal || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-500">District</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.district || booking.address?.district || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-500">State</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.state || booking.address?.state || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-500">PIN Code</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{booking.address?.pincode || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-500">GPS Coordinates</p>
                            <p className="text-xs font-bold text-emerald-700 mt-0.5 truncate">
                                {(booking.address?.coordinates?.lat || booking.address?.location?.coordinates?.[1]) && (booking.address?.coordinates?.lng || booking.address?.location?.coordinates?.[0])
                                    ? `${Number(booking.address?.coordinates?.lat || booking.address?.location?.coordinates?.[1]).toFixed(5)}, ${Number(booking.address?.coordinates?.lng || booking.address?.location?.coordinates?.[0]).toFixed(5)}`
                                    : "N/A"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Track Live Action Button */}
                    <button
                        onClick={() => navigate(`/vendor/booking/${bookingId}/tracking`)}
                        className="w-full mt-2 bg-[#0A84FF] hover:bg-blue-600 text-white font-bold py-3.5 px-6 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                    >
                        <IoNavigateOutline className="text-xl" />
                        <span>Track Live / Navigate</span>
                    </button>
                </div>
            </div>

            {/* Customer Requirements Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <IoDocumentTextOutline className="text-[#0A84FF] text-2xl" />
                        <span>Customer Requirements</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {/* Customer Notes */}
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100/80">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Customer Notes / Specific Instructions</p>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-line">
                            {booking.customerNotes || booking.notes || "No specific notes provided by customer."}
                        </p>
                    </div>

                    {/* Uploaded Photos */}
                    <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <IoImageOutline className="text-base text-[#0A84FF]" />
                            <span>Uploaded Site Photos</span>
                        </p>
                        {(booking.customerPhotos?.length > 0 || booking.images?.length > 0 || booking.sitePhotos?.length > 0) ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                                {(booking.customerPhotos || booking.images || booking.sitePhotos || []).map((photo, idx) => {
                                    const imgUrl = typeof photo === 'string' ? photo : (photo.url || photo.preview);
                                    if (!imgUrl) return null;
                                    return (
                                        <a
                                            key={idx}
                                            href={imgUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm block hover:ring-2 hover:ring-[#0A84FF] transition-all"
                                        >
                                            <img src={imgUrl} alt={`Customer Site Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                                <IoDownloadOutline className="text-base" /> View
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-gray-400 italic">No site photos uploaded by customer.</p>
                        )}
                    </div>

                    {/* Supporting Documents (if any) */}
                    <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <IoDocumentTextOutline className="text-base text-emerald-600" />
                            <span>Supporting Documents (if any)</span>
                        </p>
                        {(booking.supportingDocuments?.length > 0 || booking.userDocuments?.length > 0) ? (
                            <div className="space-y-2 pt-1">
                                {(booking.supportingDocuments || booking.userDocuments || []).map((doc, idx) => {
                                    const docUrl = typeof doc === 'string' ? doc : doc.url;
                                    const docName = typeof doc === 'string' ? `Document ${idx + 1}` : (doc.name || `Supporting Document ${idx + 1}`);
                                    if (!docUrl) return null;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 text-xs">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <IoDocumentTextOutline className="text-base text-[#0A84FF] shrink-0" />
                                                <span className="font-bold text-gray-800 truncate">{docName}</span>
                                            </div>
                                            <a
                                                href={docUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-50 text-[#0A84FF] font-bold rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0"
                                            >
                                                <IoDownloadOutline /> View Document
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-gray-400 italic">No supporting documents attached.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Information Card */}
            {booking.payment && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Charges Breakdown</h2>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.payment.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                            booking.payment.status === "PARTIAL" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-500"
                            }`}>
                            {booking.payment.status === "SUCCESS" ? "Full Payment Received" :
                                booking.payment.advancePaid ? "Advance Received" : "Payment Pending"}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Summary Line */}
                        <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Service Value</p>
                                <p className="text-2xl font-black text-gray-900">
                                    ₹{booking.payment.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Installment Breakdown */}
                        <div className="space-y-3 pt-2">
                            {/* Advance Payment (40%) */}
                            <div className={`p-4 rounded-xl border transition-all ${booking.payment.advancePaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.payment.advancePaid ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {booking.payment.advancePaid ? <IoCheckmarkCircleOutline className="text-xl" /> : <span className="text-xs font-bold">1st</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Advance Payment (40%)</p>
                                            <p className="text-[11px] text-gray-500">Collected before site visit</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${booking.payment.advancePaid ? 'text-emerald-700' : 'text-gray-600'}`}>
                                        ₹{booking.payment.advanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Final Payment (60%) */}
                            <div className={`p-4 rounded-xl border transition-all ${booking.payment.remainingPaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.payment.remainingPaid ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            {booking.payment.remainingPaid ? <IoCheckmarkCircleOutline className="text-xl" /> : <span className="text-xs font-bold">2nd</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Final Settlement (60%)</p>
                                            <p className="text-[11px] text-gray-500">Collected after report upload</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${booking.payment.remainingPaid ? 'text-emerald-700' : 'text-gray-600'}`}>
                                        ₹{booking.payment.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Charges Breakdown Detail */}
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 space-y-4 border border-gray-100 shadow-inner">
                            {/* Total Survey Fee */}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Total Survey Fee</span>
                                <span className="text-gray-900 font-bold">₹{booking.payment.baseServiceFee?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Travel Charges */}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">Travel Charges</span>
                                <span className="text-gray-900 font-bold">₹{booking.payment.travelCharges?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Platform Fee */}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">Platform Fee</span>
                                <span className="text-red-500 font-bold">- ₹{(booking.vendorWalletPayments?.platformFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* GST (if applicable) */}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">GST (if applicable)</span>
                                <span className="text-gray-900 font-bold">₹{booking.payment.gst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Advance Received */}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">Advance Received</span>
                                <span className={`font-bold ${booking.payment.advancePaid ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {booking.payment.advancePaid ? `₹${booking.payment.advanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Pending'}
                                </span>
                            </div>

                            {/* Balance Amount */}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">Balance Amount</span>
                                <span className={`font-bold ${booking.payment.remainingPaid ? 'text-emerald-600' : 'text-orange-500'}`}>
                                    {booking.payment.remainingPaid ? `Paid (₹${booking.payment.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })})` : `₹${booking.payment.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                </span>
                            </div>

                            {/* Expert Earnings */}
                            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                                <span className="text-base font-black text-gray-800">Expert Earnings</span>
                                <span className="text-xl font-black text-[#0A84FF]">
                                    ₹{((booking.vendorWalletPayments?.totalVendorPayment) || (booking.payment.baseServiceFee + booking.payment.travelCharges - (booking.vendorWalletPayments?.platformFee || 0)))?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Report Card (if uploaded) - Only show if status is REPORT_UPLOADED or later */}
            {booking.report && ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Visit Report</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Water Found</p>
                            <p className={`text-base font-semibold ${booking.report.waterFound ? "text-green-600" : "text-red-600"}`}>
                                {booking.report.waterFound ? "Yes" : "No"}
                            </p>
                        </div>
                        {booking.report.images && booking.report.images.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Report Images</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {booking.report.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.url}
                                            alt={`Report ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {booking.report.reportFile && (
                            <div>
                                <a
                                    href={booking.report.reportFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB]"
                                >
                                    <IoDownloadOutline className="text-xl" />
                                    <span>Download Report PDF</span>
                                </a>
                            </div>
                        )}

                        {/* Customer Feedback */}
                        {booking.report.feedback && typeof booking.report.feedback.isUseful === 'boolean' && (
                            <div className="pt-3 mt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-2">Customer Feedback</p>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${booking.report.feedback.isUseful ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <span className="text-lg">{booking.report.feedback.isUseful ? '👍' : '👎'}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">{booking.report.feedback.isUseful ? 'Helpful Report' : 'Not Helpful'}</span>
                                </div>
                            </div>
                        )}

                        {/* Link to Online Report View */}
                        <div className="pt-4 mt-2 border-t border-gray-100">
                            <button
                                onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/report`)}
                                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors"
                            >
                                <IoDocumentTextOutline className="text-xl" />
                                <span>View Digital Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Borewell Outcome Card (Uploaded by User) */}
            {booking.borewellResult && booking.borewellResult.uploadedAt && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 border-l-4 border-[#0A84FF]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${booking.borewellResult.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {booking.borewellResult.status === 'SUCCESS' ? <IoCheckmarkCircleOutline className="text-xl" /> : <IoCloseCircleOutline className="text-xl" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Borewell Outcome</h2>
                            <p className="text-sm text-gray-500">Uploaded by customer</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <p className={`text-lg font-bold ${booking.borewellResult.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                                {booking.borewellResult.status === 'SUCCESS' ? 'Water Found (Success)' : 'No Water (Failed)'}
                            </p>
                        </div>

                        {booking.borewellResult.uploadedAt && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Date Uploaded</p>
                                <p className="text-base text-gray-800 font-medium">{formatDate(booking.borewellResult.uploadedAt)}</p>
                            </div>
                        )}

                        {booking.borewellResult.images && booking.borewellResult.images.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Outcome Photos</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {booking.borewellResult.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.url || image}
                                            alt={`Borewell Outcome ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-xl border border-gray-100 cursor-pointer"
                                            onClick={() => window.open(image.url || image, '_blank')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* Travel Charges Request Section */}
            {["ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Travel Charges</h2>
                        {booking.travelChargesRequest?.status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.travelChargesRequest.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : booking.travelChargesRequest.status === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {booking.travelChargesRequest.status}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Current Applied Travel Charges */}
                        {booking.payment.travelCharges !== undefined && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Applied Travel Charges (To & Fro)</p>
                                        {booking.payment.distance !== null && booking.payment.distance !== undefined && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                Distance: {booking.payment.distance.toFixed(2)} km × 2 (Round Trip)
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-800">
                                        ₹{booking.payment.travelCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Request Status or Button */}
                        {booking.travelChargesRequest ? (
                            <div className="space-y-3 border-t border-gray-100 pt-3">
                                <p className="text-sm font-semibold text-gray-800">Request Details</p>

                                {booking.travelChargesRequest.reason && (
                                    <div>
                                        <span className="text-gray-600 text-sm">Reason:</span>
                                        <p className="text-gray-800 text-sm mt-1">{booking.travelChargesRequest.reason}</p>
                                    </div>
                                )}
                                {booking.travelChargesRequest.status === "REJECTED" && booking.travelChargesRequest.rejectionReason && (
                                    <div className="bg-red-50 border border-red-200 rounded-[8px] p-3">
                                        <p className="text-sm text-red-700">
                                            <strong>Rejection Reason:</strong> {booking.travelChargesRequest.rejectionReason}
                                        </p>
                                    </div>
                                )}
                                {booking.travelChargesRequest.requestedAt && (
                                    <div className="text-xs text-gray-500">
                                        Requested: {formatDate(booking.travelChargesRequest.requestedAt)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Request travel charges if you need reimbursement for travel expenses beyond the applied charges.
                                </p>
                                <button
                                    onClick={() => setShowTravelChargesModal(true)}
                                    className="w-full bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                                >
                                    <IoAddCircleOutline className="text-xl" />
                                    Request Additional Charges
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Travel Charges Request Modal */}
            {showTravelChargesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !submittingTravelCharges && setShowTravelChargesModal(false)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-md flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Request Travel Charges</h2>
                            <button
                                onClick={() => !submittingTravelCharges && setShowTravelChargesModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                disabled={submittingTravelCharges}
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={travelChargesData.amount}
                                        onChange={(e) => setTravelChargesData({ ...travelChargesData, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        disabled={submittingTravelCharges}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Reason (Optional)
                                    </label>
                                    <textarea
                                        value={travelChargesData.reason}
                                        onChange={(e) => setTravelChargesData({ ...travelChargesData, reason: e.target.value })}
                                        placeholder="Explain why you need travel charges..."
                                        rows="4"
                                        className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        disabled={submittingTravelCharges}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {travelChargesData.reason.length}/500 characters
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowTravelChargesModal(false)}
                                className="flex-1 h-10 bg-gray-200 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-300 transition-colors"
                                disabled={submittingTravelCharges}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitTravelCharges}
                                disabled={submittingTravelCharges || !travelChargesData.amount || parseFloat(travelChargesData.amount) <= 0}
                                className="flex-1 h-10 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submittingTravelCharges ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Request"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Accept Booking — Schedule Time Modal */}
            {showAcceptConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4 touch-none overscroll-contain"
                    onClick={() => setShowAcceptConfirm(false)}
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 overscroll-contain"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-100 rounded-2xl">
                                <IoCalendarOutline className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Set Visit Time Slot</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Select your arrival time slot for the survey</p>
                            </div>
                        </div>

                        {/* Read-Only Locked Date Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <IoCalendarOutline className="text-gray-400" /> Survey Date
                                </span>
                                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                    <IoLockClosedOutline className="text-[10px]" /> User Selected
                                </span>
                            </label>
                            <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 flex items-center justify-between cursor-not-allowed">
                                <span>
                                    {booking?.scheduledDate || booking?.scheduleDate
                                        ? new Date(booking.scheduledDate || booking.scheduleDate).toLocaleDateString("en-IN", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })
                                        : new Date().toLocaleDateString("en-IN", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })
                                    }
                                </span>
                                <IoLockClosedOutline className="text-gray-400" />
                            </div>
                        </div>

                        {/* Interactive Time Slot Selector Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <IoTimeOutline className="text-emerald-600 text-sm" /> Select Time Slot
                                </span>
                                {acceptScheduleTime && (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {acceptScheduleTime}
                                    </span>
                                )}
                            </label>

                            <div className="max-h-52 overflow-y-auto space-y-3 pr-1 custom-scrollbar overscroll-contain">
                                {/* Morning */}
                                <div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
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
                                            const isSelected = acceptScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setAcceptScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
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
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        ☀️ Afternoon Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "12:00 PM - 01:00 PM",
                                            "01:00 PM - 02:00 PM",
                                            "02:00 PM - 03:00 PM",
                                            "03:00 PM - 04:00 PM"
                                        ].map((slot) => {
                                            const isSelected = acceptScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setAcceptScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
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
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        🌆 Evening Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "04:00 PM - 05:00 PM",
                                            "05:00 PM - 06:00 PM",
                                            "06:00 PM - 07:00 PM"
                                        ].map((slot) => {
                                            const isSelected = acceptScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setAcceptScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
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

                        {/* Confirmation Banner */}
                        {acceptScheduleTime && (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-green-800 flex items-center gap-2">
                                <span className="text-green-600 text-sm">✓</span>
                                <span>Visit set for <strong>{acceptScheduleTime}</strong></span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setShowAcceptConfirm(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptConfirm}
                                disabled={actionLoading || !acceptScheduleTime}
                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                            >
                                {actionLoading ? "Accepting..." : "Confirm & Accept"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update / Set Visit Schedule Time Modal */}
            {showUpdateScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in zoom-in-95">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <IoTimeOutline className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Set Visit Time Slot</h3>
                                <p className="text-xs text-gray-500">
                                    {booking?.scheduledTime === "Time TBD by Expert" || booking?.scheduledTime === "TBD"
                                        ? "Set your arrival time window for this survey"
                                        : "Adjust your arrival time window for this survey"}
                                </p>
                            </div>
                        </div>

                        {/* Date Details */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="font-medium">Scheduled Date:</span>
                                <strong className="text-slate-900 font-bold">
                                    {editScheduleDate
                                        ? new Date(editScheduleDate).toLocaleDateString("en-IN", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })
                                        : "N/A"}
                                </strong>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="font-medium">Customer:</span>
                                <strong className="text-slate-900 font-bold">{booking?.user?.name || "Customer"}</strong>
                            </div>
                        </div>

                        {/* Time Slot Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <IoTimeOutline className="text-[#0A84FF] text-sm" /> Select Time Slot
                                </span>
                                {editScheduleTime && (
                                    <span className="text-[11px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        {editScheduleTime}
                                    </span>
                                )}
                            </label>

                            <div className="max-h-52 overflow-y-auto space-y-3 pr-1 custom-scrollbar overscroll-contain">
                                {/* Morning */}
                                <div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
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
                                            const isSelected = editScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setEditScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
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
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        ☀️ Afternoon Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "12:00 PM - 01:00 PM",
                                            "01:00 PM - 02:00 PM",
                                            "02:00 PM - 03:00 PM",
                                            "03:00 PM - 04:00 PM"
                                        ].map((slot) => {
                                            const isSelected = editScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setEditScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
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
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        🌆 Evening Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "04:00 PM - 05:00 PM",
                                            "05:00 PM - 06:00 PM",
                                            "06:00 PM - 07:00 PM"
                                        ].map((slot) => {
                                            const isSelected = editScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setEditScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
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
                        {editScheduleTime && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-blue-900 flex items-center gap-2">
                                <span className="text-blue-600 text-sm font-black">✓</span>
                                <span>Customer will be notified: Visit set for <strong>{editScheduleTime}</strong></span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowUpdateScheduleModal(false)}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveScheduleUpdate}
                                disabled={actionLoading || !editScheduleTime}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-colors cursor-pointer"
                            >
                                {actionLoading ? "Updating..." : "Confirm & Notify"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                }}
                onSubmit={handleRejectReasonSubmit}
                title="Decline / Reject Booking"
                message="Please select a reason for rejecting this survey booking:"
                options={VENDOR_REJECTION_REASONS}
                submitText="Continue"
                cancelText="Cancel"
            />

            {/* Reject Booking Confirmation Modal */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                onClose={() => {
                    setShowRejectConfirm(false);
                    setRejectionReason("");
                }}
                onConfirm={handleRejectConfirm}
                title="Confirm Rejection"
                message="Are you sure you want to reject this booking?"
                confirmText="Yes, Reject"
                cancelText="Cancel"
                confirmColor="danger"
            />


            {/* Download Invoices Center - Dual Marketplace Invoices */}
            {booking && !["CANCELLED", "REJECTED"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h2 className="text-xl font-bold text-gray-800">Tax Invoices Center</h2>
                        {booking.payment?.remainingPaid || ["PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED", "SUCCESS"].includes(booking.status) ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200 self-start sm:self-auto">
                                100% Settled & Invoiced
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200 self-start sm:self-auto">
                                Advance (40%) Paid • 60% Pending
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        {booking.payment?.remainingPaid || ["PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED", "SUCCESS"].includes(booking.status)
                            ? "View and download official tax invoices for platform commission settlement and customer booking receipts."
                            : "Full Tax Invoices & Platform Commission Settlement Invoices unlock once the customer completes the remaining 60% settlement."}
                    </p>

                    {(booking.payment?.remainingPaid || ["PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED", "SUCCESS"].includes(booking.status)) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/invoice`)}
                                className="bg-[#0A84FF] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#005BBB] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 text-xs sm:text-sm cursor-pointer"
                            >
                                <IoDownloadOutline className="text-lg" />
                                <span>Platform Commission Invoice</span>
                            </button>
                            <button
                                onClick={() => navigate(`/user/booking/${booking._id || booking.id}/invoice`)}
                                className="bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm border border-gray-200 cursor-pointer"
                            >
                                <IoDocumentTextOutline className="text-lg text-gray-600" />
                                <span>Customer Service Invoice</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                disabled
                                title="Unlocked after remaining 60% settlement"
                                className="bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm border border-gray-200 cursor-not-allowed opacity-75"
                            >
                                <IoDownloadOutline className="text-lg" />
                                <span>Platform Commission Invoice (Locked)</span>
                            </button>
                            <button
                                disabled
                                title="Unlocked after remaining 60% settlement"
                                className="bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm border border-gray-200 cursor-not-allowed opacity-75"
                            >
                                <IoDocumentTextOutline className="text-lg" />
                                <span>Customer Service Invoice (Locked)</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Raise Dispute Button - Available for all bookings */}
            {booking && !["CANCELLED", "REJECTED"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Need Help?</h2>
                    <button
                        onClick={() => navigate("/vendor/disputes/create", { state: { bookingId: bookingId } })}
                        className="w-full bg-orange-500 text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-orange-600 active:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(249,115,22,0.2)]"
                    >
                        <IoAlertCircleOutline className="text-xl" />
                        Raise Dispute
                    </button>
                </div>
            )}

            {/* Inline Quick Actions Bar */}
            {booking && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-around mt-4 shadow-sm">
                    <button
                        onClick={() => window.open(`tel:${booking.user?.phone || booking.phone}`)}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-[#0A84FF] transition-colors"
                    >
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#0A84FF]">
                            <IoCallOutline className="text-xl" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-800">Call</span>
                    </button>

                    <button
                        onClick={() => window.open(`https://wa.me/91${(booking.user?.phone || booking.phone || '').replace(/[^0-9]/g, '')}`, '_blank')}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-green-500 transition-colors"
                    >
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                            <IoLogoWhatsapp className="text-xl" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-800">WhatsApp</span>
                    </button>

                    <button
                        onClick={() => setShowMapPicker(true)}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-indigo-500 transition-colors"
                    >
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                            <IoNavigateOutline className="text-xl" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-800">Navigate</span>
                    </button>

                    <button
                        onClick={() => toast.showInfo("Upload photos feature coming soon")}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-purple-500 transition-colors"
                    >
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                            <IoCameraOutline className="text-xl" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-800">Photos</span>
                    </button>

                    <button
                        onClick={() => {
                            if (booking.status === "EN_ROUTE" || (booking.status === "VISITED" && !booking.otp?.endSurvey?.verified)) {
                                toast.showError("Please complete the survey and verify the End OTP first.");
                            } else {
                                navigate(`/vendor/bookings/${bookingId}/upload-report`);
                            }
                        }}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-orange-500 transition-colors"
                    >
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                            <IoDocumentTextOutline className="text-xl" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-800">Report</span>
                    </button>
                </div>
            )}

            {/* Map Application Picker Modal */}
            {showMapPicker && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => setShowMapPicker(false)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-t-[24px] sm:rounded-[24px] overflow-hidden animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Select Map App</h3>
                            <button onClick={() => setShowMapPicker(false)} className="p-2 bg-gray-50 rounded-full">
                                <IoCloseOutline className="text-2xl text-gray-400" />
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 gap-3">
                            <button
                                onClick={() => openMapApp('google')}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 group"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <IoLogoGoogle className="text-2xl text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Google Maps</p>
                                    <p className="text-xs text-blue-600">Recommended for Android & iOS</p>
                                </div>
                            </button>

                            {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
                                <button
                                    onClick={() => openMapApp('apple')}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                                >
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <IoMap className="text-2xl text-gray-800" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-800">Apple Maps</p>
                                        <p className="text-xs text-gray-500">Native iOS Navigation</p>
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={() => openMapApp('waze')}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 transition-all border border-sky-100"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <IoNavigateOutline className="text-2xl text-sky-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Waze</p>
                                    <p className="text-xs text-sky-600">Live Traffic Updates</p>
                                </div>
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50/50">
                            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                                Selecting an app will open your device's native navigation system. <br />
                                Make sure the app is installed on your phone.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Cancellation Modal */}
            {showCancelInput && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => {
                        setShowCancelInput(false);
                        setCancellationReasonType("");
                        setCancellationRemarks("");
                    }}
                >
                    <div 
                        className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <IoCloseCircleOutline className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Cancel Booking</h3>
                                    <p className="text-xs text-red-100 font-medium">Please select a reason for cancellation</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowCancelInput(false);
                                    setCancellationReasonType("");
                                    setCancellationRemarks("");
                                }}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
                            >
                                <IoCloseOutline className="text-xl" />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Same Day Cancellation Warning */}
                            {booking?.scheduledDate && (new Date(booking.scheduledDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) && (
                                <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                                    <IoAlertCircleOutline className="text-xl flex-shrink-0 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-extrabold">⚠️ Same-Day Cancellation Notice</p>
                                        <p className="mt-0.5 text-amber-800">
                                            Cancelling on the scheduled visit date impacts your Expert Reliability Score and is audited by Operations. The customer will be offered a priority replacement expert or a 100% full refund.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Cancellation Reason <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-[#0A84FF] focus:border-[#0A84FF] flex items-center justify-between p-3.5 font-semibold transition-all hover:bg-gray-100/70 cursor-pointer"
                                    >
                                        <span className={cancellationReasonType ? "text-gray-900" : "text-gray-400 font-normal"}>
                                            {cancellationReasonType || "Select a reason..."}
                                        </span>
                                        <IoChevronDownOutline className={`text-gray-400 text-lg transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                                            {CANCELLATION_REASONS.map((reason) => (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() => {
                                                        setCancellationReasonType(reason);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-all rounded-xl flex items-center justify-between mb-1 last:mb-0 cursor-pointer ${
                                                        cancellationReasonType === reason 
                                                            ? "bg-blue-50 text-[#0A84FF] shadow-sm ring-1 ring-blue-100" 
                                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                    }`}
                                                >
                                                    {reason}
                                                    {cancellationReasonType === reason && (
                                                        <IoCheckmarkCircleOutline className="text-xl text-[#0A84FF]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Remarks {cancellationReasonType === "Other" && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        value={cancellationRemarks}
                                        onChange={(e) => setCancellationRemarks(e.target.value)}
                                        rows="3"
                                        placeholder={cancellationReasonType === "Other" ? "Please specify detailed reason..." : "Additional details (optional)"}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-[#0A84FF] focus:border-[#0A84FF] block p-3.5 outline-none font-medium resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-[24px]">
                            <button
                                onClick={() => {
                                    setShowCancelInput(false);
                                    setCancellationReasonType("");
                                    setCancellationRemarks("");
                                }}
                                className="flex-1 px-4 py-3 bg-white text-gray-700 text-sm font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                Nevermind
                            </button>
                            <button
                                onClick={() => {
                                    if (!cancellationReasonType) {
                                        toast.showError("Please select a cancellation reason");
                                        return;
                                    }
                                    if (cancellationReasonType === "Other" && (!cancellationRemarks || cancellationRemarks.trim().length < 5)) {
                                        toast.showError("Please provide detailed remarks (min 5 characters)");
                                        return;
                                    }
                                    const finalReason = cancellationReasonType === "Other" 
                                        ? `Other: ${cancellationRemarks}` 
                                        : (cancellationRemarks ? `${cancellationReasonType} - ${cancellationRemarks}` : cancellationReasonType);
                                    
                                    handleCancelReasonSubmit(finalReason);
                                }}
                                className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 cursor-pointer"
                            >
                                Submit Reason
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unable to Complete Survey (On-Site Infeasible) Modal */}
            {showUnableModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => !submittingUnable && setShowUnableModal(false)}
                >
                    <div
                        className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <IoAlertCircleOutline className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Unable to Complete Survey</h3>
                                    <p className="text-xs text-amber-100 font-medium">On-Site Infeasibility & Proof Submission</p>
                                </div>
                            </div>
                            <button
                                onClick={() => !submittingUnable && setShowUnableModal(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
                                disabled={submittingUnable}
                            >
                                <IoCloseOutline className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                                ℹ️ <strong>Travel Protection:</strong> Since you arrived at the site, your travel allowance will be preserved upon admin review.
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Primary On-Site Obstruction <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={unableCategory}
                                    onChange={(e) => setUnableCategory(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:ring-[#0A84FF] focus:border-[#0A84FF]"
                                >
                                    <option value="LAND_ACCESS_DENIED">Land Access Denied / Locked Gates</option>
                                    <option value="EXTREME_WEATHER_FLOODING">Extreme Weather / Submerged Flooded Land</option>
                                    <option value="BOUNDARY_DISPUTE">Boundary / Land Ownership Conflict</option>
                                    <option value="CUSTOMER_ABSENT">Customer or Representative Absent</option>
                                    <option value="DANGEROUS_TERRAIN">Hazardous / Inaccessible Terrain</option>
                                    <option value="OTHER">Other Physical Constraint</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Detailed On-Site Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={unableDescription}
                                    onChange={(e) => setUnableDescription(e.target.value)}
                                    rows="3"
                                    placeholder="Describe why testing could not be conducted on site..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none font-medium resize-none focus:border-[#0A84FF]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Upload On-Site Geotagged Photos
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleUnableImageUpload}
                                    id="unable-photos-input"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="unable-photos-input"
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors bg-gray-50"
                                >
                                    <IoCameraOutline className="text-3xl text-gray-400 mb-1" />
                                    <span className="text-xs font-bold text-gray-600">Click to upload on-site evidence photos</span>
                                    <span className="text-[10px] text-gray-400">JPEG, PNG up to 10MB</span>
                                </label>

                                {unableImages.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        {unableImages.map((img, idx) => (
                                            <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                                                <img src={img.preview} alt="evidence" className="w-full h-20 object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUnableImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-sm"
                                                >
                                                    <IoCloseOutline className="text-xs" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex gap-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowUnableModal(false)}
                                disabled={submittingUnable}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitUnableToComplete}
                                disabled={submittingUnable}
                                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                                {submittingUnable ? "Submitting Report..." : "Submit On-Site Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancelConfirm}
                title="Confirm Cancellation"
                message={`Are you sure you want to cancel this booking? Reason: "${cancellationReason}"`}
                confirmText="Yes, Cancel Booking"
                cancelText="No, Keep It"
                confirmColor="danger"
            />

            <OTPInputModal
                isOpen={showStartOTPModal}
                onClose={() => setShowStartOTPModal(false)}
                onSubmit={handleVerifyStartOTP}
                onResend={() => handleResendOTP("start")}
                resending={resendingOTP}
                title="Start Survey OTP"
                message="Please ask the customer for the Start Survey OTP to begin the survey."
                submitText="Verify OTP"
                isLoading={verifyingOTP}
            />

            <OTPInputModal
                isOpen={showEndOTPModal}
                onClose={() => setShowEndOTPModal(false)}
                onSubmit={handleVerifyEndOTP}
                onResend={() => handleResendOTP("end")}
                resending={resendingOTP}
                title="End Survey OTP"
                message="Please ask the customer for the End Survey OTP to complete the survey."
                submitText="Verify OTP"
                isLoading={verifyingOTP}
            />

            {/* Early Journey Departure Confirmation Modal */}
            <ConfirmModal
                isOpen={showEarlyJourneyConfirm}
                onClose={() => setShowEarlyJourneyConfirm(false)}
                onConfirm={async () => {
                    setShowEarlyJourneyConfirm(false);
                    await executeMarkEnRoute();
                }}
                title="Early Departure Confirmation"
                message={`This groundwater survey is scheduled for ${
                    booking?.scheduledDate
                        ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        })
                        : "a future date"
                }${
                    booking?.scheduledTime ? ` (${booking.scheduledTime})` : ""
                }.\n\nStarting the journey now will notify the customer that you are on your way and activate live GPS tracking.\n\nAre you sure you want to start traveling now?`}
                confirmText="Yes, Start Journey"
                cancelText="Cancel"
                confirmColor="primary"
            />
        </PageContainer>
    );
}
