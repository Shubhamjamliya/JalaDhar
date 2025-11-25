import { useState, useEffect, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoHourglassOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoCheckmarkCircleOutline,
    IoDocumentTextOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoSearchOutline,
    IoCloseOutline,
    IoImageOutline,
    IoCloseCircleOutline,
    IoWalletOutline,
} from "react-icons/io5";
import { getUserBookings, uploadBorewellResult, getBookingDetails } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function UserStatus() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentBooking, setCurrentBooking] = useState(null);
    const [showBorewellModal, setShowBorewellModal] = useState(false);
    const [borewellData, setBorewellData] = useState({
        status: "",
        images: []
    });
    const [uploadingBorewell, setUploadingBorewell] = useState(false);

    useEffect(() => {
        loadCurrentBooking();
    }, []);

    // Reload booking when bookingId changes (e.g., navigating from booking history)
    useEffect(() => {
        const bookingId = location.state?.bookingId;
        if (bookingId && currentBooking) {
            const currentId = currentBooking.id || currentBooking._id;
            if (currentId?.toString() !== bookingId?.toString()) {
                loadCurrentBooking();
            }
        }
    }, [location.state?.bookingId]);

    const loadCurrentBooking = async () => {
        try {
            setLoading(true);
            setError("");

            // Check if bookingId was passed from navigation
            const bookingId = location.state?.bookingId;
            console.log("Loading booking, bookingId:", bookingId);

            if (bookingId) {
                // If specific booking ID provided, try to get it directly using getBookingDetails
                try {
                    const response = await getBookingDetails(bookingId);
                    if (response.success) {
                        setCurrentBooking(response.data.booking);
                        setLoading(false);
                        return;
                    } else {
                        // Fallback to loadWithRetry if getBookingDetails fails
                        await loadWithRetry(bookingId);
                        return;
                    }
                } catch (err) {
                    console.error("Get booking details error:", err);
                    // Fallback to loadWithRetry
                    await loadWithRetry(bookingId);
                    return;
                }
            } else {
                // Get active bookings (not completed or cancelled)
                const response = await getUserBookings({
                    status: undefined, // Get all statuses
                    limit: 10 // Get more bookings to find the right one
                });

                console.log("Bookings response:", response);

                if (response.success) {
                    const bookings = response.data.bookings || [];
                    console.log("Found bookings:", bookings.length);
                    // Find the most recent active booking
                    const activeBooking = bookings.find(
                        (booking) =>
                            !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(booking.status)
                    ) || bookings[0]; // If no active, show most recent

                    if (activeBooking) {
                        console.log("Setting active booking:", activeBooking);
                        setCurrentBooking(activeBooking);
                    } else {
                        console.log("No active booking found");
                        // No error - just no active booking
                    }
                } else {
                    console.error("Failed to load bookings:", response.message);
                    setError(response.message || "Failed to load booking");
                }
            }
        } catch (err) {
            console.error("Load booking error:", err);
            setError("Failed to load booking status");
        } finally {
            setLoading(false);
        }
    };

    // Retry loading booking if it was just created
    const loadWithRetry = async (bookingId, retries = 3) => {
        try {
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await getUserBookings({
                        status: undefined,
                        limit: 10
                    });

                    if (response.success) {
                        const bookings = response.data.bookings || [];
                        // Find booking by ID (check both id and _id formats)
                        const booking = bookings.find(b => {
                            const bid = b.id || b._id;
                            return bid === bookingId || bid?.toString() === bookingId?.toString();
                        }) || bookings.find(b => !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(b.status))
                            || bookings[0];

                        if (booking) {
                            console.log("Found booking in retry:", booking);
                            setCurrentBooking(booking);
                            setLoading(false);
                            return;
                        } else {
                            console.log(`Retry ${i + 1}: Booking not found yet`);
                        }
                    }

                    // If not found and not last retry, wait a bit
                    if (i < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (err) {
                    console.error(`Retry ${i + 1} failed:`, err);
                    if (i === retries - 1) {
                        throw err;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // If still not found after retries, try to get any active booking
            const response = await getUserBookings({
                status: undefined,
                limit: 10
            });

            if (response.success) {
                const bookings = response.data.bookings || [];
                const activeBooking = bookings.find(b => !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(b.status)) || bookings[0];
                if (activeBooking) {
                    setCurrentBooking(activeBooking);
                }
            } else {
                setError("Booking not found. It may still be processing.");
            }
        } catch (err) {
            console.error("Load with retry error:", err);
            setError("Failed to load booking. Please try refreshing the page.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusSteps = () => {
        if (!currentBooking) return [];

        // Use userStatus for user view
        const status = currentBooking.userStatus || currentBooking.status;
        const remainingPaid = currentBooking.payment?.remainingPaid || false;
        const borewellUploaded = !!currentBooking.borewellResult?.uploadedAt;

        // Define status progression for completed check
        const statusOrder = ["PENDING", "ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"];
        const currentStatusIndex = statusOrder.indexOf(status);
        // If status not found, assume we're past all steps if we have payment or borewell
        const effectiveIndex = currentStatusIndex === -1 ? (remainingPaid || borewellUploaded ? 11 : 0) : currentStatusIndex;

        const steps = [
            {
                id: "pending",
                label: "Pending",
                icon: IoHourglassOutline,
                active: ["PENDING", "ASSIGNED"].includes(status),
                completed: effectiveIndex > 0 || remainingPaid || borewellUploaded || !!currentBooking.assignedAt,
                description: "Your service request has been received and is waiting for a vendor to be assigned.",
                date: currentBooking.createdAt,
            },
            {
                id: "assigned",
                label: "Vendor Assigned",
                icon: IoPersonOutline,
                active: status === "ASSIGNED",
                completed: effectiveIndex > 1 || remainingPaid || borewellUploaded || !!currentBooking.acceptedAt,
                description: "A vendor has been assigned to your booking.",
                date: currentBooking.assignedAt,
            },
            {
                id: "accepted",
                label: "Accepted",
                icon: IoCheckmarkCircleOutline,
                active: status === "ACCEPTED",
                completed: effectiveIndex > 2 || remainingPaid || borewellUploaded || !!currentBooking.visitedAt,
                description: "Vendor has accepted your booking and will visit soon.",
                date: currentBooking.acceptedAt,
            },
            {
                id: "visited",
                label: "Visited",
                icon: IoConstructOutline,
                active: status === "VISITED",
                completed: effectiveIndex > 3 || remainingPaid || borewellUploaded || !!currentBooking.reportUploadedAt,
                description: "Vendor has visited your location and completed the service.",
                date: currentBooking.visitedAt,
            },
            {
                id: "report",
                label: "Report Ready",
                icon: IoDocumentTextOutline,
                active: status === "REPORT_UPLOADED",
                completed: effectiveIndex > 4 || remainingPaid || borewellUploaded,
                description: "Service report has been uploaded. Please pay remaining amount to view.",
                date: currentBooking.reportUploadedAt,
            },
            {
                id: "payment",
                label: "Payment Due",
                icon: IoTimeOutline,
                active: ["AWAITING_PAYMENT", "REPORT_UPLOADED"].includes(status) && !remainingPaid,
                completed: remainingPaid || effectiveIndex > 5 || borewellUploaded,
                description: "Please pay the remaining 60% to view the report and complete the booking.",
                date: currentBooking.paymentDueAt || currentBooking.reportUploadedAt,
            },
            {
                id: "view-report",
                label: "Report Viewed",
                icon: IoDocumentTextOutline,
                active: status === "PAYMENT_SUCCESS" && remainingPaid && !borewellUploaded,
                completed: remainingPaid && (borewellUploaded || effectiveIndex > 6),
                description: "Your service report is ready. Click to view the complete report.",
                date: currentBooking.payment?.remainingPaidAt,
            },
            {
                id: "borewell-report",
                label: "Add Borewell Report",
                icon: IoImageOutline,
                active: status === "PAYMENT_SUCCESS" && remainingPaid && !borewellUploaded,
                completed: borewellUploaded || effectiveIndex > 7,
                description: "After digging the borewell, upload photos and mark the result as Success or Failed.",
                date: currentBooking.borewellResult?.uploadedAt,
            },
            {
                id: "admin-approved",
                label: "Admin Approved",
                icon: IoCheckmarkCircleOutline,
                active: status === "ADMIN_APPROVED",
                completed: ["FINAL_SETTLEMENT", "COMPLETED"].includes(status) || effectiveIndex > 8,
                description: "Admin has approved your borewell result. Final settlement is being processed.",
                date: currentBooking.borewellResult?.approvedAt,
            },
            {
                id: "final-settlement",
                label: "Final Settlement",
                icon: IoWalletOutline,
                active: status === "FINAL_SETTLEMENT",
                completed: status === "COMPLETED" || effectiveIndex > 9,
                description: "Admin is processing final settlement. You may receive a refund if the borewell failed.",
                date: currentBooking.payment?.vendorSettlement?.settledAt,
            },
            {
                id: "completed",
                label: "Completed",
                icon: IoCheckmarkCircleOutline,
                active: status === "COMPLETED",
                completed: status === "COMPLETED",
                description: "Booking process completed successfully. Thank you for using our service.",
                date: currentBooking.completedAt || currentBooking.payment?.vendorSettlement?.settledAt,
            },
        ];

        return steps;
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

    const handleBorewellImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setBorewellData({
            ...borewellData,
            images: [...borewellData.images, ...newImages],
        });
    };

    const handleRemoveBorewellImage = (index) => {
        const newImages = borewellData.images.filter((_, i) => i !== index);
        setBorewellData({ ...borewellData, images: newImages });
    };

    const handleSubmitBorewellResult = async () => {
        if (!borewellData.status) {
            setError("Please select a result status (Success or Failed)");
            return;
        }

        if (!currentBooking) {
            setError("Booking not found");
            return;
        }

        const bookingId = currentBooking.id || currentBooking._id;

        try {
            setUploadingBorewell(true);
            setError("");
            setSuccess("");

            const response = await uploadBorewellResult(bookingId, {
                status: borewellData.status,
                images: borewellData.images.map((img) => img.file),
            });

            if (response.success) {
                setSuccess("Borewell result uploaded successfully!");
                setShowBorewellModal(false);
                setBorewellData({ status: "", images: [] });
                await loadCurrentBooking();
            } else {
                setError(response.message || "Failed to upload borewell result");
            }
        } catch (err) {
            console.error("Upload borewell result error:", err);
            setError(err.response?.data?.message || "Failed to upload borewell result");
        } finally {
            setUploadingBorewell(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking status..." />;
    }

    // Show nice message if no booking found
    if (!currentBooking && !error) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    {/* Empty State Illustration */}
                    <div className="mb-6 w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <IoCalendarOutline className="text-5xl text-blue-500" />
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        No Active Booking
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-6 max-w-md">
                        You don't have any active bookings at the moment. Start by booking a service to track its status here.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate("/user/serviceprovider")}
                            className="flex items-center justify-center gap-2 bg-[#0A84FF] text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-[#005BBB] transition-colors shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                        >
                            <IoSearchOutline className="text-xl" />
                            Find a Vendor
                        </button>
                        <button
                            onClick={() => navigate("/user/history")}
                            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-[12px] font-semibold hover:bg-gray-50 transition-colors shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-200"
                        >
                            <IoDocumentTextOutline className="text-xl" />
                            View History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !currentBooking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate("/user/serviceprovider")}
                        className="bg-[#0A84FF] text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-[#005BBB] transition-colors"
                    >
                        Find a Vendor
                    </button>
                </div>
            </div>
        );
    }

    const steps = getStatusSteps();
    const vendor = currentBooking?.vendor;
    // Use userStatus for user view
    const status = currentBooking?.userStatus || currentBooking?.status;

    // Debug logging
    if (currentBooking) {
        console.log("UserStatus Debug:", {
            userStatus: currentBooking.userStatus,
            status: currentBooking.status,
            computedStatus: status,
            payment: currentBooking.payment,
            remainingPaid: currentBooking.payment?.remainingPaid,
            report: currentBooking.report ? "exists" : "missing",
            reportUploadedAt: currentBooking.reportUploadedAt
        });
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />

            {/* Refresh Button */}
            {currentBooking && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={loadCurrentBooking}
                        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <IoSearchOutline className="text-lg" />
                        Refresh
                    </button>
                </div>
            )}

            {/* Booking Info Card */}
            {currentBooking && (
                <div className="mb-6 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {currentBooking.service?.name || "Service"}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        {currentBooking.scheduledDate && (
                            <div className="flex items-center gap-2">
                                <IoTimeOutline className="text-base" />
                                <span>
                                    {new Date(currentBooking.scheduledDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}{" "}
                                    at {currentBooking.scheduledTime || "N/A"}
                                </span>
                            </div>
                        )}
                        {currentBooking.address && (
                            <div className="flex items-center gap-2">
                                <IoLocationOutline className="text-base" />
                                <span>
                                    {currentBooking.address.street}, {currentBooking.address.city}
                                </span>
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
                                    {step.id === "assigned" && vendor && (
                                        <div className="mb-3 flex items-center gap-3 rounded-[10px] border border-gray-200 p-3">
                                            <img
                                                className="h-12 w-12 rounded-full object-cover"
                                                src={
                                                    vendor.documents?.profilePicture?.url ||
                                                    "https://via.placeholder.com/48"
                                                }
                                                alt={vendor.name}
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {vendor.name}
                                                </p>
                                                {vendor.rating?.averageRating && (
                                                    <p className="text-sm text-gray-500">
                                                        ⭐ {vendor.rating.averageRating.toFixed(1)} Rating
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                                    {/* Action Buttons */}
                                    {step.id === "payment" &&
                                        (status === "AWAITING_PAYMENT" || status === "REPORT_UPLOADED" || !!currentBooking.reportUploadedAt) &&
                                        !currentBooking.payment?.remainingPaid && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const bookingId = currentBooking.id || currentBooking._id;
                                                        if (!bookingId) {
                                                            setError("Booking ID not found");
                                                            return;
                                                        }
                                                        // Refresh booking data before navigation
                                                        await loadCurrentBooking();
                                                        navigate(`/user/booking/${bookingId}/payment`);
                                                    } catch (err) {
                                                        console.error("Navigation error:", err);
                                                        setError("Failed to navigate to payment page. Please try again.");
                                                    }
                                                }}
                                                className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2 mt-3"
                                            >
                                                <IoTimeOutline className="text-xl" />
                                                Pay Remaining 60% ({formatAmount(currentBooking.payment?.remainingAmount || 0)})
                                            </button>
                                        )}

                                    {step.id === "view-report" && status === "PAYMENT_SUCCESS" && currentBooking.payment?.remainingPaid && (
                                        <button
                                            onClick={() => {
                                                const bookingId = currentBooking.id || currentBooking._id;
                                                navigate(`/user/booking/${bookingId}`);
                                            }}
                                            className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Report
                                        </button>
                                    )}

                                    {step.id === "borewell-report" &&
                                        status === "PAYMENT_SUCCESS" &&
                                        currentBooking.payment?.remainingPaid &&
                                        !currentBooking.borewellResult?.uploadedAt && (
                                            <button
                                                onClick={() => setShowBorewellModal(true)}
                                                className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2 mt-3"
                                            >
                                                <IoImageOutline className="text-xl" />
                                                Add Borewell Report
                                            </button>
                                        )}
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            )}

            {/* Borewell Result Upload Modal */}
            {showBorewellModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !uploadingBorewell && setShowBorewellModal(false)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Upload Borewell Result</h2>
                            <button
                                onClick={() => !uploadingBorewell && setShowBorewellModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                disabled={uploadingBorewell}
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Result Status <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "SUCCESS" })}
                                            disabled={uploadingBorewell}
                                            className={`flex-1 h-12 rounded-[8px] font-semibold transition-colors flex items-center justify-center gap-2 ${borewellData.status === "SUCCESS"
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IoCheckmarkCircleOutline className="text-xl" />
                                            Success
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "FAILED" })}
                                            disabled={uploadingBorewell}
                                            className={`flex-1 h-12 rounded-[8px] font-semibold transition-colors flex items-center justify-center gap-2 ${borewellData.status === "FAILED"
                                                ? "bg-red-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IoCloseCircleOutline className="text-xl" />
                                            Failed
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Upload Photos (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleBorewellImageUpload}
                                        disabled={uploadingBorewell}
                                        className="hidden"
                                        id="borewell-images"
                                    />
                                    <label
                                        htmlFor="borewell-images"
                                        className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-[8px] flex items-center justify-center cursor-pointer hover:border-[#0A84FF] transition-colors"
                                    >
                                        <div className="text-center">
                                            <IoImageOutline className="text-3xl text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Click to upload images</p>
                                            <p className="text-xs text-gray-500 mt-1">Max 10 images</p>
                                        </div>
                                    </label>
                                    {borewellData.images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {borewellData.images.map((img, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={img.preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-[8px]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBorewellImage(index)}
                                                        disabled={uploadingBorewell}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    >
                                                        <IoCloseOutline className="text-sm" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowBorewellModal(false)}
                                className="flex-1 h-10 bg-gray-200 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-300 transition-colors"
                                disabled={uploadingBorewell}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBorewellResult}
                                disabled={uploadingBorewell || !borewellData.status}
                                className="flex-1 h-10 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploadingBorewell ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload Result"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
