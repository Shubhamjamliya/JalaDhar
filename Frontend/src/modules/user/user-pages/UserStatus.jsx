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
} from "react-icons/io5";
import { getUserBookings } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserStatus() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentBooking, setCurrentBooking] = useState(null);

    useEffect(() => {
        loadCurrentBooking();
    }, []);

    const loadCurrentBooking = async () => {
        try {
            setLoading(true);
            setError("");

            // Check if bookingId was passed from navigation
            const bookingId = location.state?.bookingId;
            console.log("Loading booking, bookingId:", bookingId);

            if (bookingId) {
                // If specific booking ID provided, try to get it directly
                // For now, we'll still use getUserBookings but with a retry mechanism
                await loadWithRetry(bookingId);
                return; // loadWithRetry handles setLoading(false)
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

        const status = currentBooking.status;
        const steps = [
            {
                id: "pending",
                label: "Pending",
                icon: IoHourglassOutline,
                active: ["PENDING", "ASSIGNED"].includes(status),
                completed: !["PENDING", "ASSIGNED"].includes(status),
                description: "Your service request has been received and is waiting for a vendor to be assigned.",
                date: currentBooking.createdAt,
            },
            {
                id: "assigned",
                label: "Vendor Assigned",
                icon: IoPersonOutline,
                active: status === "ASSIGNED",
                completed: ["ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED"].includes(status),
                description: "A vendor has been assigned to your booking.",
                date: currentBooking.assignedAt,
            },
            {
                id: "accepted",
                label: "Accepted",
                icon: IoCheckmarkCircleOutline,
                active: status === "ACCEPTED",
                completed: ["VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED"].includes(status),
                description: "Vendor has accepted your booking and will visit soon.",
                date: currentBooking.acceptedAt,
            },
            {
                id: "visited",
                label: "Visited",
                icon: IoConstructOutline,
                active: status === "VISITED",
                completed: ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED"].includes(status),
                description: "Vendor has visited your location and completed the service.",
                date: currentBooking.visitedAt,
            },
            {
                id: "report",
                label: "Report Ready",
                icon: IoDocumentTextOutline,
                active: status === "REPORT_UPLOADED",
                completed: ["AWAITING_PAYMENT", "COMPLETED"].includes(status),
                description: "Service report has been uploaded. Please pay remaining amount to view.",
                date: currentBooking.reportUploadedAt,
            },
            {
                id: "payment",
                label: "Payment Due",
                icon: IoTimeOutline,
                active: status === "AWAITING_PAYMENT",
                completed: status === "COMPLETED",
                description: "Please pay the remaining 60% to view the report and complete the booking.",
                date: currentBooking.paymentDueAt,
            },
            {
                id: "completed",
                label: "Completed",
                icon: IoCheckmarkCircleOutline,
                active: status === "COMPLETED",
                completed: status === "COMPLETED",
                description: "Booking completed successfully. You can download the invoice and report.",
                date: currentBooking.completedAt,
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

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

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
                                                ? "bg-linear-to-b from-[#0A84FF] to-[#00C2A8]"
                                                : isActive
                                                    ? "bg-linear-to-b from-[#0A84FF] to-gray-300"
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
                                    <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
