import { useState } from "react";
import {
    IoSearchOutline,
    IoDownloadOutline,
    IoImageOutline,
    IoStarOutline,
    IoStar,
    IoCloseOutline,
} from "react-icons/io5";

export default function UserBookingHistory() {
    const [bookings, setBookings] = useState([
        {
            id: 1,
            serviceType: "Tank Cleaning",
            providerName: "Pristine Water Solutions",
            bookingDate: "2024-09-24",
            bookingTime: "10:00 AM",
            status: "completed",
            amount: 50,
            rating: 5,
            billUrl: "#",
            workProof: [
                "https://via.placeholder.com/300",
                "https://via.placeholder.com/300",
            ],
        },
        {
            id: 2,
            serviceType: "Water Purifier Installation",
            providerName: "Aqua Services",
            bookingDate: "2024-09-28",
            bookingTime: "02:00 PM",
            status: "upcoming",
            amount: 120,
            rating: null,
            billUrl: null,
            workProof: [],
        },
        {
            id: 3,
            serviceType: "Leakage Repair",
            providerName: "FlowFix Plumbing",
            bookingDate: "2024-09-15",
            bookingTime: "09:00 AM",
            status: "cancelled",
            amount: 75,
            rating: null,
            billUrl: null,
            workProof: [],
        },
    ]);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [showWorkProof, setShowWorkProof] = useState(null);

    const filters = ["All", "Upcoming", "Completed", "Cancelled"];

    const handleDownloadBill = (billUrl) => {
        if (billUrl) {
            alert("Downloading bill...");
        }
    };

    const handleViewWorkProof = (workProof) => {
        setShowWorkProof(workProof);
    };

    const handleRating = (bookingId, rating) => {
        setBookings(
            bookings.map((booking) =>
                booking.id === bookingId ? { ...booking, rating } : booking
            )
        );
        alert(`Rating ${rating} stars submitted!`);
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            booking.serviceType
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            booking.providerName
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

        const matchesFilter =
            activeFilter === "All" ||
            (activeFilter === "Completed" && booking.status === "completed") ||
            (activeFilter === "Upcoming" && booking.status === "upcoming") ||
            (activeFilter === "Cancelled" && booking.status === "cancelled");

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case "completed":
                return (
                    <div className="flex h-7 items-center justify-center rounded-full bg-green-100 px-3">
                        <p className="text-xs font-medium text-green-700">
                            Completed
                        </p>
                    </div>
                );
            case "upcoming":
                return (
                    <div className="flex h-7 items-center justify-center rounded-full bg-blue-100 px-3">
                        <p className="text-xs font-medium text-blue-700">
                            Upcoming
                        </p>
                    </div>
                );
            case "cancelled":
                return (
                    <div className="flex h-7 items-center justify-center rounded-full bg-red-100 px-3">
                        <p className="text-xs font-medium text-red-700">
                            Cancelled
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                {/* Search Bar */}
                <div className="py-3">
                    <label className="flex h-12 w-full flex-col">
                        <div className="flex h-full w-full flex-1 items-stretch rounded-[10px]">
                            <div className="flex items-center justify-center rounded-l-[10px] border-y border-l border-gray-200 bg-white pl-4">
                                <IoSearchOutline className="text-gray-600" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-[10px] border-y border-r border-gray-200 bg-white px-3 text-base font-normal leading-normal text-gray-800 placeholder:text-gray-400 focus:border-[#0A84FF] focus:outline-0 focus:ring-0"
                                placeholder="Search by vendor or service"
                            />
                        </div>
                    </label>
                </div>

                {/* Filters */}
                <div className="flex gap-3 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-colors ${
                                activeFilter === filter
                                    ? "bg-[#0A84FF] text-white"
                                    : "bg-white text-gray-800"
                            }`}
                        >
                            <p className="text-sm font-medium leading-normal">
                                {filter}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Booking Cards */}
                <div className="flex flex-col gap-4 py-4">
                    {filteredBookings.length === 0 ? (
                        <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-[#4A4A4A] text-sm">
                                No bookings found
                            </p>
                        </div>
                    ) : (
                        filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="flex flex-col items-stretch justify-start rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-col">
                                        <p className="text-base font-bold leading-tight tracking-tight text-gray-800">
                                            {booking.serviceType}
                                        </p>
                                        <p className="text-sm font-normal text-gray-500">
                                            {booking.providerName}
                                        </p>
                                    </div>
                                    {getStatusBadge(booking.status)}
                                </div>

                                {/* Divider */}
                                <div className="my-4 h-px w-full bg-gray-200"></div>

                                {/* Details */}
                                <div className="flex flex-col gap-2 text-sm text-gray-600">
                                    <p>
                                        <span className="font-medium">Date:</span>{" "}
                                        {new Date(booking.bookingDate).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                        , {booking.bookingTime}
                                    </p>
                                    <p>
                                        <span className="font-medium">Amount:</span> ₹
                                        {booking.amount}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                {booking.status === "completed" && (
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        {booking.workProof &&
                                            booking.workProof.length > 0 && (
                                                <button
                                                    onClick={() =>
                                                        handleViewWorkProof(
                                                            booking.workProof
                                                        )
                                                    }
                                                    className="flex h-10 w-full flex-1 items-center justify-center rounded-[10px] bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium hover:bg-[#D0E1F7] transition-colors"
                                                >
                                                    View Work Proof
                                                </button>
                                            )}
                                        {booking.billUrl && (
                                            <button
                                                onClick={() =>
                                                    handleDownloadBill(
                                                        booking.billUrl
                                                    )
                                                }
                                                className="flex h-10 w-full flex-1 items-center justify-center rounded-[10px] bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium hover:bg-[#D0E1F7] transition-colors"
                                            >
                                                Download Bill
                                            </button>
                                        )}
                                        {!booking.rating ? (
                                            <button
                                                onClick={() =>
                                                    handleRating(booking.id, 5)
                                                }
                                                className="flex h-10 w-full flex-1 items-center justify-center rounded-[10px] bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#005BBB] transition-colors"
                                            >
                                                Rate Vendor
                                            </button>
                                        ) : (
                                            <div className="flex h-10 w-full flex-1 items-center justify-center rounded-[10px] bg-gray-50 px-3">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`text-sm ${
                                                                i < booking.rating
                                                                    ? "text-yellow-500"
                                                                    : "text-gray-300"
                                                            }`}
                                                        >
                                                            <IoStar />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {booking.status === "upcoming" && (
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <button className="flex h-10 w-full items-center justify-center rounded-[10px] border border-red-500/50 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
                                            Cancel Booking
                                        </button>
                                    </div>
                                )}

                                {booking.status === "cancelled" && (
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <button className="flex h-10 w-full items-center justify-center rounded-[10px] bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#005BBB] transition-colors">
                                            Book Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Work Proof Modal */}
            {showWorkProof && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowWorkProof(null)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">
                                Work Proof
                            </h2>
                            <button
                                onClick={() => setShowWorkProof(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {showWorkProof.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Work proof ${index + 1}`}
                                        className="w-full h-64 object-cover rounded-[12px]"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
  }
  