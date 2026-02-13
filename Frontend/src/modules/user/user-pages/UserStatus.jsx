import { useState, useEffect, Fragment, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
    IoRefreshOutline,

} from "react-icons/io5";
import { getUserBookings, uploadBorewellResult, getBookingDetails } from "../../../services/bookingApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import { usePullToRefresh } from "../../../hooks/usePullToRefresh";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function UserStatus() {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId: bookingIdFromParams } = useParams();
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [currentBooking, setCurrentBooking] = useState(null);
    const toast = useToast();
    const [showBorewellModal, setShowBorewellModal] = useState(false);
    const [borewellData, setBorewellData] = useState({
        status: "",
        images: []
    });
    const [uploadingBorewell, setUploadingBorewell] = useState(false);
    const loadCurrentBookingRef = useRef(null);
    const lastActionTimeRef = useRef(0); // Track when user performed an action
    const ACTION_COOLDOWN = 2000; // 2 seconds - ignore socket updates right after user action

    // Retry loading booking if it was just created (define before loadCurrentBooking uses it)
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
                            setCurrentBooking(booking);
                            setLoading(false);
                            return;
                        }
                    }

                    // If not found and not last retry, wait a bit
                    if (i < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (err) {
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
                toast.showWarning("Booking not found. It may still be processing.");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking. Please try refreshing the page.");
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentBooking = async () => {
        try {
            setLoading(true);

            // Get bookingId from URL params or location state
            const bookingId = bookingIdFromParams || location.state?.bookingId;

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
                    // Fallback to loadWithRetry
                    await loadWithRetry(bookingId);
                    return;
                }
            } else {
                // No bookingId provided - find the most recent active booking
                try {
                    const response = await getUserBookings({
                        status: undefined,
                        limit: 10
                    });

                    if (response.success) {
                        const bookings = response.data.bookings || [];
                        // Find the most recent active (non-terminal) booking
                        const activeBooking = bookings.find(b =>
                            !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(b.status)
                        ) || bookings[0]; // Fall back to most recent booking

                        if (activeBooking) {
                            setCurrentBooking(activeBooking);
                        }
                    }
                } catch (err) {
                    handleApiError(err, "Failed to load bookings");
                }
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking status");
        } finally {
            setLoading(false);
        }
    };

    // Store loadCurrentBooking in ref for socket listeners
    useEffect(() => {
        loadCurrentBookingRef.current = loadCurrentBooking;
    }, []);

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadCurrentBooking();
    }, [location.pathname, bookingIdFromParams]);

    // Reload booking when bookingId from URL params changes
    useEffect(() => {
        if (bookingIdFromParams) {
            loadCurrentBooking();
        }
    }, [bookingIdFromParams]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadCurrentBooking();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Listen to socket notifications for booking status updates (ONLY for external changes)
    useEffect(() => {
        if (!socket || !currentBooking) return;

        const bookingId = currentBooking.id || currentBooking._id;
        if (!bookingId) return;

        const handleNewNotification = (notification) => {
            // Ignore socket updates if user just performed an action (use React state instead)
            const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
            if (timeSinceLastAction < ACTION_COOLDOWN) {
                return; // Skip - user's own action will update via React state
            }

            // Check if notification is related to current booking
            const notificationBookingId = notification.metadata?.bookingId ||
                notification.relatedEntity?.entityId?.toString();

            if (notificationBookingId === bookingId?.toString() ||
                notificationBookingId === bookingId) {
                // Only refresh for external changes (not user's own actions)
                // These are changes from other users (vendor, admin, etc.)
                if (notification.type === 'BOOKING_STATUS_UPDATED' ||
                    notification.type === 'BOOKING_ACCEPTED' ||
                    notification.type === 'BOOKING_VISITED' ||
                    notification.type === 'REPORT_UPLOADED' ||
                    notification.type === 'ADMIN_APPROVED' ||
                    notification.type === 'PAYMENT_RELEASE') {
                    setTimeout(() => {
                        if (loadCurrentBookingRef.current) {
                            loadCurrentBookingRef.current();
                        }
                    }, 500);
                }
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, currentBooking]);

    // Pull-to-refresh functionality
    const { isRefreshing, pullDistance, containerRef, canRefresh } = usePullToRefresh(
        loadCurrentBooking,
        { threshold: 80, resistance: 2.5 }
    );

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
                label: "Add Borewell Drilling Status",
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
            toast.showError("Please select a result status (Success or Failed)");
            return;
        }

        if (!currentBooking) {
            toast.showError("Booking not found");
            return;
        }

        const bookingId = currentBooking.id || currentBooking._id;

        const loadingToast = toast.showLoading("Uploading borewell result...");
        try {
            setUploadingBorewell(true);
            // Mark that user performed an action (prevent socket from triggering duplicate update)
            lastActionTimeRef.current = Date.now();

            const response = await uploadBorewellResult(bookingId, {
                status: borewellData.status,
                images: borewellData.images.map((img) => img.file),
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Borewell result uploaded successfully!");
                setShowBorewellModal(false);
                setBorewellData({ status: "", images: [] });
                // Update state immediately via React (not waiting for socket)
                await loadCurrentBooking();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to upload borewell result");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to upload borewell result");
        } finally {
            setUploadingBorewell(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking status..." />;
    }

    // Show nice message if no booking found
    if (!currentBooking) {
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
                            onClick={() => navigate("/user/status")}
                            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-[12px] font-semibold hover:bg-gray-50 transition-colors shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-200"
                        >
                            <IoDocumentTextOutline className="text-xl" />
                            View Bookings
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    const steps = getStatusSteps();
    const vendor = currentBooking?.vendor;
    // Use userStatus for user view
    const status = currentBooking?.userStatus || currentBooking?.status;


    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 overflow-y-auto"
            style={{
                transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance, 100)}px)` : 'none',
                transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
            }}
        >
            {/* Pull-to-refresh indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-transparent pointer-events-none"
                    style={{
                        height: `${Math.min(pullDistance, 100)}px`,
                        transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`
                    }}
                >
                    <div className={`flex flex-col items-center gap-2 ${canRefresh || isRefreshing ? 'text-[#0A84FF]' : 'text-gray-400'}`}>
                        {isRefreshing ? (
                            <>
                                <div className="w-6 h-6 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <IoRefreshOutline
                                    className={`text-2xl transition-transform ${canRefresh ? 'rotate-180' : ''}`}
                                    style={{ transform: `rotate(${Math.min(pullDistance * 2, 180)}deg)` }}
                                />
                                <span className="text-sm font-medium">
                                    {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Back button removed - handled by UserNavbar */}

            {/* Booking Info Card */}
            {currentBooking && (
                <div className="mb-6 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-2 border-[#81D4FA]">
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
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 font-medium">No status information available</p>
                </div>
            ) : (
                <div className="relative pl-4">
                    {/* Vertical Connector Main Line */}
                    <div className="absolute left-[33px] top-8 bottom-8 w-0.5 bg-gray-200" />

                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isLast = index === steps.length - 1;
                        const isActive = step.active;
                        const isCompleted = step.completed;
                        const isUpcoming = !isActive && !isCompleted;

                        return (
                            <div key={step.id} className="relative mb-8 last:mb-0">
                                <div className="flex gap-6">
                                    {/* Timeline Marker */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${isCompleted
                                                ? "bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                                                : isActive
                                                    ? "bg-[#0A84FF] text-white shadow-[0_0_0_4px_rgba(10,132,255,0.2)] animate-pulse"
                                                    : "bg-white border-2 border-gray-200 text-gray-400"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <IoCheckmarkCircleOutline className="text-xl" />
                                            ) : (
                                                <StepIcon className="text-xl" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1">
                                        <div
                                            className={`rounded-2xl p-5 transition-all duration-300 ${isActive
                                                ? "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-l-4 border-[#0A84FF]"
                                                : isCompleted
                                                    ? "bg-white/60 border border-gray-100"
                                                    : "bg-gray-50/50 border border-gray-100 opacity-70"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`font-bold text-base ${isActive ? "text-[#0A84FF]" : isCompleted ? "text-gray-800" : "text-gray-500"
                                                    }`}>
                                                    {step.label}
                                                </h3>
                                                {isCompleted && (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Done
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Active
                                                    </span>
                                                )}
                                            </div>

                                            {step.date && (
                                                <p className="text-[11px] text-gray-400 font-medium mb-3 flex items-center gap-1">
                                                    <IoTimeOutline className="text-sm" />
                                                    {formatDate(step.date)}
                                                </p>
                                            )}

                                            <p className={`text-sm leading-relaxed ${isActive ? "text-gray-700" : "text-gray-500"
                                                }`}>
                                                {step.description}
                                            </p>

                                            {/* Specialized Content for Steps */}
                                            {step.id === "assigned" && vendor && (
                                                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="relative">
                                                        <img
                                                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                            src={vendor.profilePicture || "https://premium-profile-placeholder.com"}
                                                            onError={(e) => {
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name)}&background=0A84FF&color=fff`;
                                                            }}
                                                            alt={vendor.name}
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{vendor.name}</p>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-yellow-400 text-xs">★</span>
                                                            <span className="text-xs font-semibold text-gray-600">
                                                                {vendor.rating?.averageRating?.toFixed(1) || "New"}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 ml-1">Verified Expert</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="mt-4">


                                                {step.id === "payment" && isActive && (
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/payment`)}
                                                        className="w-full py-3 bg-[#0A84FF] text-white text-sm font-bold rounded-xl hover:bg-[#0070E0] transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <IoWalletOutline className="text-xl" />
                                                        Complete Payment ({formatAmount(currentBooking.payment?.remainingAmount || 0)})
                                                    </button>
                                                )}

                                                {step.id === "view-report" && isActive && (
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/report`)}
                                                        className="w-full py-3 bg-[#E7F0FB] text-[#0A84FF] text-sm font-bold rounded-xl hover:bg-[#D0E1F7] transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <IoDocumentTextOutline className="text-xl" />
                                                        View Full Report
                                                    </button>
                                                )}

                                                {step.id === "borewell-report" && isActive && (
                                                    <button
                                                        onClick={() => setShowBorewellModal(true)}
                                                        className="w-full py-3 bg-white text-[#0A84FF] border-2 border-[#0A84FF] text-sm font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <IoImageOutline className="text-xl" />
                                                        Upload Result Now
                                                    </button>
                                                )}

                                                {["view-report", "borewell-report", "admin-approved", "final-settlement", "completed"].includes(step.id) && (isCompleted || isActive) && (
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/invoice`)}
                                                        className="w-full mt-2 py-3 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <IoDownloadOutline className="text-xl" />
                                                        Download Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
