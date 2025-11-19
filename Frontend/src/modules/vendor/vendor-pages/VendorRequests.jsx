import { useState, useEffect } from "react";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoCloseOutline,
} from "react-icons/io5";

export default function VendorRequests() {
    const [selectedRequest, setSelectedRequest] = useState(null);

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
    const [requests, setRequests] = useState([
        {
            id: 1,
            userName: "Rajesh Kumar",
            userAvatar: null,
            bookingTime: "2024-01-15 10:30 AM",
            bookingDate: "2024-01-15",
            serviceType: "Pit Cleaning",
            summary: "Need pit cleaning service for residential property",
            description:
                "I need professional pit cleaning service for my residential property. The pit is approximately 10 feet deep and hasn't been cleaned in 3 years.",
            address: "123 Main Street, Sector 5, New Delhi - 110001",
            contact: "+91 9876543210",
            photos: [],
            status: "pending",
        },
        {
            id: 2,
            userName: "Priya Sharma",
            userAvatar: null,
            bookingTime: "2024-01-15 2:00 PM",
            bookingDate: "2024-01-15",
            serviceType: "Groundwater Survey",
            summary: "Groundwater survey required for new construction",
            description:
                "We need a comprehensive groundwater survey for our new construction project. The site is 500 sq meters.",
            address: "456 Park Avenue, Gurgaon - 122001",
            contact: "+91 9876543211",
            photos: [],
            status: "pending",
        },
    ]);

    const handleAccept = (id) => {
        const acceptedRequest = requests.find((req) => req.id === id);
        if (acceptedRequest) {
            const bookingId = `BK-${Date.now()}`;
            const bookingData = {
                ...acceptedRequest,
                status: "confirmed",
                acceptedAt: new Date().toISOString(),
                bookingId: bookingId,
            };

            // Add to bookings in localStorage
            const existingBookings =
                JSON.parse(localStorage.getItem("vendorBookings")) || [];
            existingBookings.push(bookingData);
            localStorage.setItem(
                "vendorBookings",
                JSON.stringify(existingBookings)
            );

            // Add to status with "pending" status
            const statusData = {
                ...acceptedRequest,
                status: "pending",
                acceptedAt: new Date().toISOString(),
                bookingId: bookingId,
            };
            const existingStatus =
                JSON.parse(localStorage.getItem("vendorStatus")) || [];
            existingStatus.push(statusData);
            localStorage.setItem(
                "vendorStatus",
                JSON.stringify(existingStatus)
            );

            // Remove from requests list
            setRequests(requests.filter((req) => req.id !== id));
            setSelectedRequest(null);
        }
    };

    const handleReject = (id) => {
        if (window.confirm("Are you sure you want to reject this request?")) {
            setRequests(
                requests.map((req) =>
                    req.id === id ? { ...req, status: "rejected" } : req
                )
            );
            setSelectedRequest(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
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
                    </div>
                ) : (
                    requests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                {/* User Avatar */}
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                                    {request.userAvatar ? (
                                        <img
                                            src={request.userAvatar}
                                            alt={request.userName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl text-gray-400">
                                            👤
                                        </span>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 mb-1.5">
                                        {request.userName}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-2">
                                        <IoTimeOutline className="text-sm" />
                                        <span>{request.bookingTime}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-[#0A84FF] mb-2">
                                        {request.serviceType}
                                    </p>
                                    <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                        {request.summary}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            {request.status === "pending" && (
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAccept(request.id)}
                                        className="flex-1 min-w-[100px] bg-[#0A84FF] text-white font-semibold py-2.5 px-3 rounded-[10px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(10,132,255,0.2)]"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        <span className="text-sm">Accept</span>
                                    </button>
                                    <button
                                        onClick={() => handleReject(request.id)}
                                        className="flex-1 min-w-[100px] bg-red-500 text-white font-semibold py-2.5 px-3 rounded-[10px] hover:bg-red-600 active:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(239,68,68,0.2)]"
                                    >
                                        <IoCloseCircleOutline className="text-lg" />
                                        <span className="text-sm">Reject</span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedRequest(request)
                                        }
                                        className="flex-1 min-w-[100px] bg-[#E7F0FB] text-[#0A84FF] font-semibold py-2.5 px-3 rounded-[10px] hover:bg-[#D0E1F7] active:bg-[#B8D2F3] transition-colors text-sm"
                                    >
                                        View Details
                                    </button>
                                </div>
                            )}

                            {request.status === "accepted" && (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 rounded-[10px]">
                                        <IoCheckmarkCircleOutline className="text-green-600 text-lg" />
                                        <p className="text-sm font-semibold text-green-700">
                                            Accepted
                                        </p>
                                    </div>
                                </div>
                            )}

                            {request.status === "rejected" && (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 rounded-[10px]">
                                        <IoCloseCircleOutline className="text-red-600 text-lg" />
                                        <p className="text-sm font-semibold text-red-700">
                                            Rejected
                                        </p>
                                    </div>
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
                                    {selectedRequest.userAvatar ? (
                                        <img
                                            src={selectedRequest.userAvatar}
                                            alt={selectedRequest.userName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl text-gray-400">
                                            👤
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                                        {selectedRequest.userName}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-[#4A4A4A]">
                                        <IoTimeOutline className="text-base" />
                                        <span>
                                            {selectedRequest.bookingTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Type */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2">
                                    Service Type
                                </h4>
                                <p className="text-lg font-bold text-[#0A84FF]">
                                    {selectedRequest.serviceType}
                                </p>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2">
                                    Description
                                </h4>
                                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                    {selectedRequest.description}
                                </p>
                            </div>

                            {/* Photos */}
                            {selectedRequest.photos &&
                                selectedRequest.photos.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2">
                                            Photos
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedRequest.photos.map(
                                                (photo, index) => (
                                                    <img
                                                        key={index}
                                                        src={photo}
                                                        alt={`Photo ${
                                                            index + 1
                                                        }`}
                                                        className="w-full h-24 object-cover rounded-[12px]"
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Address */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2 flex items-center gap-2">
                                    <IoLocationOutline className="text-base" />
                                    Address
                                </h4>
                                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                    {selectedRequest.address}
                                </p>
                            </div>

                            {/* Contact */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-[#4A4A4A] mb-2 flex items-center gap-2">
                                    <IoCallOutline className="text-base" />
                                    Contact
                                </h4>
                                <a
                                    href={`tel:${selectedRequest.contact}`}
                                    className="text-sm text-[#0A84FF] hover:underline font-medium"
                                >
                                    {selectedRequest.contact}
                                </a>
                            </div>

                            {/* Actions */}
                            {selectedRequest.status === "pending" && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() =>
                                            handleAccept(selectedRequest.id)
                                        }
                                        className="flex-1 bg-[#0A84FF] text-white font-semibold py-3 px-4 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(10,132,255,0.2)]"
                                    >
                                        <IoCheckmarkCircleOutline className="text-xl" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleReject(selectedRequest.id)
                                        }
                                        className="flex-1 bg-red-500 text-white font-semibold py-3 px-4 rounded-[12px] hover:bg-red-600 active:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(239,68,68,0.2)]"
                                    >
                                        <IoCloseCircleOutline className="text-xl" />
                                        Reject
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
