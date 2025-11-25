import { useState, useEffect, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoHourglassOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoCheckmarkCircleOutline,
    IoDocumentTextOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoChevronBackOutline,
    IoCloseOutline,
    IoImageOutline,
    IoCarOutline,
    IoWalletOutline,
} from "react-icons/io5";
import {
    getBookingDetails,
    acceptBooking,
    rejectBooking,
    markBookingAsVisited,
    requestTravelCharges,
} from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function VendorStatus() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [booking, setBooking] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showTravelChargesModal, setShowTravelChargesModal] = useState(false);
    const [travelChargesData, setTravelChargesData] = useState({
        amount: "",
        reason: "",
    });
    const [submittingTravelCharges, setSubmittingTravelCharges] = useState(false);

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                setBooking(response.data.booking);
            } else {
                setError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            console.error("Load booking details error:", err);
            setError(err.response?.data?.message || "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!window.confirm("Are you sure you want to accept this booking?")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");

            const response = await acceptBooking(bookingId);

            if (response.success) {
                setSuccess("Booking accepted successfully!");
                await loadBookingDetails();
            } else {
                setError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            console.error("Accept booking error:", err);
            setError(err.response?.data?.message || "Failed to accept booking");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        const rejectionReason = window.prompt(
            "Please provide a reason for rejection (minimum 10 characters):"
        );

        if (!rejectionReason || rejectionReason.trim().length < 10) {
            if (rejectionReason !== null) {
                setError("Rejection reason must be at least 10 characters long.");
            }
            return;
        }

        if (!window.confirm("Are you sure you want to reject this booking?")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");

            const response = await rejectBooking(bookingId, rejectionReason);

            if (response.success) {
                setSuccess("Booking rejected successfully.");
                await loadBookingDetails();
            } else {
                setError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            console.error("Reject booking error:", err);
            setError(err.response?.data?.message || "Failed to reject booking");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkVisited = async () => {
        if (!window.confirm("Have you visited the customer site? This will mark the booking as visited.")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");

            const response = await markBookingAsVisited(bookingId);

            if (response.success) {
                setSuccess("Booking marked as visited successfully!");
                await loadBookingDetails();
            } else {
                setError(response.message || "Failed to mark as visited");
            }
        } catch (err) {
            console.error("Mark visited error:", err);
            setError(err.response?.data?.message || "Failed to mark as visited");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestTravelCharges = async () => {
        if (!travelChargesData.amount || !travelChargesData.reason) {
            setError("Please provide both amount and reason for travel charges");
            return;
        }

        try {
            setSubmittingTravelCharges(true);
            setError("");
            setSuccess("");

            const response = await requestTravelCharges(bookingId, {
                amount: parseFloat(travelChargesData.amount),
                reason: travelChargesData.reason,
            });

            if (response.success) {
                setSuccess("Travel charges request submitted successfully!");
                setShowTravelChargesModal(false);
                setTravelChargesData({ amount: "", reason: "" });
                await loadBookingDetails();
            } else {
                setError(response.message || "Failed to request travel charges");
            }
        } catch (err) {
            console.error("Request travel charges error:", err);
            setError(err.response?.data?.message || "Failed to request travel charges");
        } finally {
            setSubmittingTravelCharges(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusSteps = () => {
        if (!booking) return [];

        // Use vendorStatus for vendor view
        const status = booking.vendorStatus || booking.status;

        // Define status progression for completed check
        const statusOrder = ["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAID_FIRST", "BOREWELL_UPLOADED", "APPROVED", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"];
        const currentStatusIndex = statusOrder.indexOf(status);
        const effectiveIndex = currentStatusIndex === -1 ? 0 : currentStatusIndex;

        const steps = [
            {
                id: "assigned",
                label: "Booking Assigned",
                icon: IoPersonOutline,
                active: status === "ASSIGNED",
                completed: effectiveIndex > 0 || !!booking.acceptedAt || !!booking.visitedAt || !!booking.reportUploadedAt,
                description: "Booking has been assigned to you. Please accept or reject.",
                date: booking.assignedAt,
            },
            {
                id: "accepted",
                label: "Booking Accepted",
                icon: IoCheckmarkCircleOutline,
                active: status === "ACCEPTED",
                completed: effectiveIndex > 1 || !!booking.visitedAt || !!booking.reportUploadedAt,
                description: "You have accepted the booking. You can request travel charges and mark as visited.",
                date: booking.acceptedAt,
            },
            {
                id: "visited",
                label: "Site Visited",
                icon: IoConstructOutline,
                active: status === "VISITED",
                completed: effectiveIndex > 2 || !!booking.reportUploadedAt,
                description: "You have visited the customer site. Please upload the service report.",
                date: booking.visitedAt,
            },
            {
                id: "report",
                label: "Report Uploaded",
                icon: IoDocumentTextOutline,
                active: status === "REPORT_UPLOADED",
                completed: effectiveIndex > 3 || !!booking.payment?.vendorSettlement?.settledAt,
                description: "Service report has been uploaded. Waiting for admin payment.",
                date: booking.reportUploadedAt,
            },
            {
                id: "payment",
                label: "Awaiting Payment (50% + Travel)",
                icon: IoTimeOutline,
                active: status === "REPORT_UPLOADED" || status === "AWAITING_PAYMENT",
                completed: effectiveIndex > 4 || booking.firstInstallment?.paid || status === "PAID_FIRST",
                description: "Waiting for admin to pay 50% + travel charges.",
                date: booking.reportUploadedAt,
            },
            {
                id: "paid-first",
                label: "First Installment Paid (50% + Travel)",
                icon: IoCheckmarkCircleOutline,
                active: status === "PAID_FIRST",
                completed: effectiveIndex > 5 || booking.borewellResult?.uploadedAt || status === "BOREWELL_UPLOADED",
                description: "Admin has paid 50% + travel charges. Waiting for user to upload borewell result.",
                date: booking.firstInstallment?.paidAt || booking.payment?.vendorSettlement?.settledAt,
            },
            {
                id: "borewell",
                label: "Borewell Result Uploaded",
                icon: IoImageOutline,
                active: status === "BOREWELL_UPLOADED" && !!booking.borewellResult?.uploadedAt,
                completed: effectiveIndex > 6 || status === "APPROVED" || status === "FINAL_SETTLEMENT_COMPLETE",
                description: booking.borewellResult?.uploadedAt
                    ? `User has uploaded borewell result. Waiting for admin to approve and process final settlement.`
                    : "Waiting for user to upload borewell result.",
                date: booking.borewellResult?.uploadedAt,
            },
            {
                id: "approved",
                label: "Admin Approved",
                icon: IoCheckmarkCircleOutline,
                active: status === "APPROVED",
                completed: effectiveIndex > 7 || status === "FINAL_SETTLEMENT_COMPLETE" || status === "COMPLETED",
                description: "Admin has approved the borewell result. Waiting for final settlement processing.",
                date: booking.borewellResult?.approvedAt,
            },
            {
                id: "settlement",
                label: "Final Settlement Complete",
                icon: IoWalletOutline,
                active: status === "FINAL_SETTLEMENT_COMPLETE",
                completed: status === "FINAL_SETTLEMENT_COMPLETE" || status === "COMPLETED",
                description: booking.payment?.vendorSettlement?.status === "COMPLETED"
                    ? "Admin has processed your final settlement. All payments completed."
                    : "Waiting for admin to process final settlement.",
                date: booking.payment?.vendorSettlement?.settledAt,
            },
            {
                id: "completed",
                label: "Completed",
                icon: IoCheckmarkCircleOutline,
                active: status === "COMPLETED",
                completed: status === "COMPLETED",
                description: "Booking process completed successfully. All settlements are done.",
                date: booking.completedAt || booking.payment?.vendorSettlement?.settledAt,
            },
        ];

        return steps;
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking status..." />;
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <button
                    onClick={() => navigate("/vendor/requests")}
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="font-semibold">Back to Bookings</span>
                </button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-8">
                    <p className="text-gray-600">Booking not found</p>
                    <button
                        onClick={() => navigate("/vendor/requests")}
                        className="mt-4 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                    >
                        Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    const steps = getStatusSteps();
    const user = booking?.user;
    // Use vendorStatus for vendor view
    const status = booking?.vendorStatus || booking?.status;

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />

            {/* Back Button */}
            <button
                onClick={() => navigate("/vendor/requests")}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#0A84FF] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="text-sm font-medium">Back to Bookings</span>
            </button>

            {/* Booking Info Card */}
            {booking && (
                <div className="mb-6 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {booking.service?.name || "Service"}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        {booking.scheduledDate && (
                            <div className="flex items-center gap-2">
                                <IoTimeOutline className="text-base" />
                                <span>
                                    {new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}{" "}
                                    at {booking.scheduledTime || "N/A"}
                                </span>
                            </div>
                        )}
                        {booking.address && (
                            <div className="flex items-center gap-2">
                                <IoLocationOutline className="text-base" />
                                <span>
                                    {booking.address.street}, {booking.address.city}
                                </span>
                            </div>
                        )}
                        {user && (
                            <div className="flex items-center gap-2">
                                <IoPersonOutline className="text-base" />
                                <span>Customer: {user.name || "N/A"}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Status Timeline */}
            {steps.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-gray-600">No status information available</p>
                </div>
            ) : (
                <div className="grid grid-cols-[auto_1fr] gap-x-4">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isLast = index === steps.length - 1;
                        const isActive = step.active;
                        const isCompleted = step.completed;

                        return (
                            <Fragment key={step.id}>
                                {/* Icon */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${isActive || isCompleted ? "text-[#0A84FF]" : "text-gray-400"
                                            }`}
                                    >
                                        <StepIcon className="text-3xl" />
                                    </div>
                                    {!isLast && (
                                        <div
                                            className={`w-0.5 grow ${isCompleted
                                                ? "bg-[#0A84FF]"
                                                : isActive
                                                    ? "bg-[#0A84FF]"
                                                    : "bg-gray-300"
                                                }`}
                                        ></div>
                                    )}
                                </div>

                                {/* Content */}
                                <div
                                    className={`mb-6 rounded-[12px] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${isActive || isCompleted ? "" : "text-gray-400"
                                        }`}
                                >
                                    <p className="text-base font-bold text-gray-800 mb-1">
                                        {step.label}
                                    </p>
                                    {step.date && (
                                        <p className="mb-2 text-sm text-gray-500">
                                            {formatDate(step.date)}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                                    {/* Action Buttons */}
                                    {/* Step 1: ASSIGNED - Accept/Reject */}
                                    {step.id === "assigned" && status === "ASSIGNED" && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="flex-1 h-12 bg-red-100 text-red-600 text-sm font-semibold rounded-[8px] hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? "Processing..." : "Reject"}
                                            </button>
                                            <button
                                                onClick={handleAccept}
                                                disabled={actionLoading}
                                                className="flex-1 h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? "Processing..." : "Accept"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 2: ACCEPTED - Request Travel Charges + Mark as Visited */}
                                    {step.id === "accepted" && status === "ACCEPTED" && (
                                        <div className="flex flex-col gap-2 mt-3">
                                            {/* Travel Charges Status */}
                                            {booking.travelChargesRequest?.status && (
                                                <div className="bg-gray-50 rounded-[8px] p-3 mb-2">
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                                        Travel Charges Request:
                                                    </p>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.travelChargesRequest.status === "APPROVED"
                                                            ? "bg-green-100 text-green-700"
                                                            : booking.travelChargesRequest.status === "REJECTED"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                    >
                                                        {booking.travelChargesRequest.status}
                                                    </span>
                                                    {booking.travelChargesRequest.amount && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Amount: {formatAmount(booking.travelChargesRequest.amount)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Request Travel Charges Button (if not requested or rejected) */}
                                            {(!booking.travelChargesRequest?.status ||
                                                booking.travelChargesRequest.status === "REJECTED") && (
                                                    <button
                                                        onClick={() => setShowTravelChargesModal(true)}
                                                        className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <IoCarOutline className="text-xl" />
                                                        Request Travel Charges
                                                    </button>
                                                )}

                                            {/* Mark as Visited Button */}
                                            <button
                                                onClick={handleMarkVisited}
                                                disabled={actionLoading}
                                                className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <IoConstructOutline className="text-xl" />
                                                {actionLoading ? "Processing..." : "Mark as Visited"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 3: VISITED - Upload Report */}
                                    {step.id === "visited" && status === "VISITED" && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}/upload-report`)}
                                            className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            Upload Report
                                        </button>
                                    )}

                                    {/* Step 4: REPORT_UPLOADED - View Report */}
                                    {step.id === "report" && status === "REPORT_UPLOADED" && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                            className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Report
                                        </button>
                                    )}

                                    {/* Step 5: AWAITING_PAYMENT - Request Payment from Admin */}
                                    {step.id === "payment" && status === "AWAITING_PAYMENT" && (
                                        <div className="mt-3">
                                            {booking.payment?.remainingPaid ? (
                                                <div className="bg-green-50 rounded-[8px] p-3">
                                                    <p className="text-sm font-semibold text-green-700">
                                                        Payment Received: {formatAmount(booking.payment?.remainingAmount || 0)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                                    className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <IoWalletOutline className="text-xl" />
                                                    View Payment Status
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Step: PAID_FIRST - View Details */}
                                    {step.id === "paid-first" && status === "PAID_FIRST" && !booking.borewellResult && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                            className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Details
                                        </button>
                                    )}

                                    {/* Step: APPROVED - View Details */}
                                    {step.id === "approved" && status === "APPROVED" && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                            className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Details
                                        </button>
                                    )}

                                    {/* Step: COMPLETED - View Details */}
                                    {step.id === "completed" && status === "COMPLETED" && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                            className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Details
                                        </button>
                                    )}

                                    {/* Step 7: Borewell Result - View Result */}
                                    {step.id === "borewell" && booking.borewellResult && (
                                        <div className="mt-3">
                                            <div className="bg-gray-50 rounded-[8px] p-3 mb-2">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                                    Borewell Result:
                                                </p>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.borewellResult.status === "SUCCESS"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {booking.borewellResult.status}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                                className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoImageOutline className="text-xl" />
                                                View Borewell Result
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 8: Settlement - View Settlement Details */}
                                    {step.id === "settlement" && booking.payment?.vendorSettlement && (
                                        <div className="mt-3">
                                            <div className="bg-gray-50 rounded-[8px] p-3 mb-2">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                                    Settlement Status:{" "}
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.payment.vendorSettlement.status === "COMPLETED"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                    >
                                                        {booking.payment.vendorSettlement.status}
                                                    </span>
                                                </p>
                                                {booking.payment.vendorSettlement.amount && (
                                                    <p className="text-sm font-bold text-gray-800 mt-2">
                                                        Amount: {formatAmount(booking.payment.vendorSettlement.amount)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                                className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoWalletOutline className="text-xl" />
                                                View Settlement Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            )}

            {/* Travel Charges Request Modal */}
            {showTravelChargesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !submittingTravelCharges && setShowTravelChargesModal(false)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
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
                                        value={travelChargesData.amount}
                                        onChange={(e) =>
                                            setTravelChargesData({
                                                ...travelChargesData,
                                                amount: e.target.value,
                                            })
                                        }
                                        disabled={submittingTravelCharges}
                                        className="w-full h-12 px-4 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:bg-gray-100"
                                        placeholder="Enter amount"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={travelChargesData.reason}
                                        onChange={(e) =>
                                            setTravelChargesData({
                                                ...travelChargesData,
                                                reason: e.target.value,
                                            })
                                        }
                                        disabled={submittingTravelCharges}
                                        className="w-full h-24 px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:bg-gray-100 resize-none"
                                        placeholder="Explain why you need travel charges"
                                    />
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
                                onClick={handleRequestTravelCharges}
                                disabled={submittingTravelCharges || !travelChargesData.amount || !travelChargesData.reason}
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
        </div>
    );
}
