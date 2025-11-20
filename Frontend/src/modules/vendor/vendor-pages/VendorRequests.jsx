import { useState, useEffect } from "react";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoCloseOutline,
} from "react-icons/io5";
import { getNewBookings, acceptBooking, rejectBooking } from "../../../services/vendorApi";

export default function VendorRequests() {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedRequest) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [selectedRequest]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getNewBookings({ status: "PENDING" });
            
            if (response.success) {
                setRequests(response.data.bookings || []);
            } else {
                setError("Failed to load requests");
            }
        } catch (err) {
            console.error("Load requests error:", err);
            setError("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            const response = await acceptBooking(bookingId);
            
            if (response.success) {
                // Remove from requests list
                setRequests(requests.filter((req) => req._id !== bookingId));
                setSelectedRequest(null);
                // Reload to get updated list
                await loadRequests();
            } else {
                alert(response.message || "Failed to accept booking");
            }
        } catch (err) {
            console.error("Accept booking error:", err);
            alert("Failed to accept booking. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookingId) => {
        const rejectionReason = window.prompt(
            "Please provide a reason for rejection (minimum 10 characters):"
        );

        if (!rejectionReason || rejectionReason.trim().length < 10) {
            if (rejectionReason !== null) {
                alert("Rejection reason must be at least 10 characters long.");
            }
            return;
        }

        if (window.confirm("Are you sure you want to reject this request?")) {
            try {
                setActionLoading(bookingId);
                const response = await rejectBooking(bookingId, rejectionReason);
                
                if (response.success) {
                    // Remove from requests list
                    setRequests(requests.filter((req) => req._id !== bookingId));
                    setSelectedRequest(null);
                    // Reload to get updated list
                    await loadRequests();
                } else {
                    alert(response.message || "Failed to reject booking");
                }
            } catch (err) {
                console.error("Reject booking error:", err);
                alert("Failed to reject booking. Please try again.");
            } finally {
                setActionLoading(null);
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (timeString) => {
        return timeString || "N/A";
    };

    const formatAddress = (address) => {
        if (!address) return "N/A";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "N/A";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Service Requests
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    View and respond to service requests from users
                </p>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[#4A4A4A]">No requests available</p>
                        <p className="text-xs text-gray-500 mt-2">
                            New booking requests will appear here
                        </p>
                    </div>
                ) : (
                    requests.map((request) => (
                        <div
                            key={request._id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                {/* User Avatar */}
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                                    {request.user?.name ? (
                                        <span className="text-xl font-semibold text-gray-600">
                                            {request.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="text-2xl text-gray-400">
                                            👤
                                        </span>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 mb-1.5">
                                        {request.user?.name || "User"}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-2">
                                        <IoTimeOutline className="text-sm" />
                                        <span>
                                            {formatDate(request.scheduledDate)} at {formatTime(request.scheduledTime)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-[#0A84FF] mb-2">
                                        {request.service?.name || "Service"}
                                    </p>
                                    {request.service && (
                                        <p className="text-xs text-[#4A4A4A] mb-2">
                                            {request.service.machineType} • ₹{request.service.price?.toLocaleString()}
                                        </p>
                                    )}
                                    {request.notes && (
                                        <p className="text-sm text-[#4A4A4A] leading-relaxed mb-2">
                                            {request.notes}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-1">
                                        <IoLocationOutline className="text-sm" />
                                        <span className="truncate">
                                            {formatAddress(request.address)}
                                        </span>
                                    </div>
                                    {request.user?.phone && (
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A]">
                                            <IoCallOutline className="text-sm" />
                                            <a
                                                href={`tel:${request.user.phone}`}
                                                className="text-[#0A84FF] hover:underline"
                                            >
                                                {request.user.phone}
                                            </a>
                                        </div>
                                    )}
                                    {request.payment && (
                                        <p className="text-sm font-semibold text-gray-800 mt-2">
                                            Amount: ₹{request.payment.amount?.toLocaleString() || "0"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {request.status === "PENDING" && (
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAccept(request._id)}
                                        disabled={actionLoading === request._id}
                                        className="flex-1 min-w-[100px] bg-[#0A84FF] text-white font-semibold py-2.5 px-3 rounded-[10px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(10,132,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        <span className="text-sm">
                                            {actionLoading === request._id ? "Processing..." : "Accept"}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleReject(request._id)}
                                        disabled={actionLoading === request._id}
                                        className="flex-1 min-w-[100px] bg-red-500 text-white font-semibold py-2.5 px-3 rounded-[10px] hover:bg-red-600 active:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCloseCircleOutline className="text-lg" />
                                        <span className="text-sm">
                                            {actionLoading === request._id ? "Processing..." : "Reject"}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="flex-1 min-w-[100px] bg-[#E7F0FB] text-[#0A84FF] font-semibold py-2.5 px-3 rounded-[10px] hover:bg-[#D0E1F7] active:bg-[#B8D2F3] transition-colors text-sm"
                                    >
                                        View Details
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedRequest(null);
                        }
                    }}
                >
                    <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-[20px]">
                            <h2 className="text-xl font-bold text-gray-800">
                                Request Details
                            </h2>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* User Info */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                                    {selectedRequest.user?.name ? (
                                        <span className="text-2xl font-semibold text-gray-600">
                                            {selectedRequest.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="text-2xl text-gray-400">
                                            👤
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                                        {selectedRequest.user?.name || "User"}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-[#4A4A4A]">
                                        <IoTimeOutline className="text-base" />
                                        <span>
                                            {formatDate(selectedRequest.scheduledDate)} at {formatTime(selectedRequest.scheduledTime)}
                                        </span>
                                    </div>
                                    {selectedRequest.user?.email && (
                                        <p className="text-sm text-[#4A4A4A] mt-1">
                                            {selectedRequest.user.email}
                                        </p>
                                    )}
                                    {selectedRequest.user?.phone && (
                                        <a
                                            href={`tel:${selectedRequest.user.phone}`}
                                            className="text-sm text-[#0A84FF] hover:underline mt-1 block"
                                        >
                                            {selectedRequest.user.phone}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Service Type */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2">
                                    Service Type
                                </h4>
                                <p className="text-lg font-bold text-[#0A84FF]">
                                    {selectedRequest.service?.name || "Service"}
                                </p>
                                {selectedRequest.service && (
                                    <div className="mt-2 text-sm text-[#4A4A4A]">
                                        <p>Machine Type: {selectedRequest.service.machineType}</p>
                                        <p>Price: ₹{selectedRequest.service.price?.toLocaleString()}</p>
                                        {selectedRequest.service.duration && (
                                            <p>Duration: {selectedRequest.service.duration} minutes</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notes/Description */}
                            {selectedRequest.notes && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2">
                                        Notes
                                    </h4>
                                    <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                        {selectedRequest.notes}
                                    </p>
                                </div>
                            )}

                            {/* Address */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2 flex items-center gap-2">
                                    <IoLocationOutline className="text-base" />
                                    Address
                                </h4>
                                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                    {formatAddress(selectedRequest.address)}
                                </p>
                            </div>

                            {/* Payment */}
                            {selectedRequest.payment && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2">
                                        Payment
                                    </h4>
                                    <p className="text-lg font-bold text-gray-800">
                                        ₹{selectedRequest.payment.amount?.toLocaleString() || "0"}
                                    </p>
                                    <p className="text-xs text-[#4A4A4A] mt-1">
                                        Status: {selectedRequest.payment.status || "PENDING"}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedRequest.status === "PENDING" && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAccept(selectedRequest._id)}
                                        disabled={actionLoading === selectedRequest._id}
                                        className="flex-1 bg-[#0A84FF] text-white font-semibold py-3 px-4 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(10,132,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCheckmarkCircleOutline className="text-xl" />
                                        {actionLoading === selectedRequest._id ? "Processing..." : "Accept"}
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedRequest._id)}
                                        disabled={actionLoading === selectedRequest._id}
                                        className="flex-1 bg-red-500 text-white font-semibold py-3 px-4 rounded-[12px] hover:bg-red-600 active:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCloseCircleOutline className="text-xl" />
                                        {actionLoading === selectedRequest._id ? "Processing..." : "Reject"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
