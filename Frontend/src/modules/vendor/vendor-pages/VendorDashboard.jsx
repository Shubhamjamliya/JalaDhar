import { useNavigate } from "react-router-dom";
import {
    IoBriefcaseOutline,
    IoWalletOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoTrendingUpOutline,
} from "react-icons/io5";

export default function VendorDashboard() {
    const navigate = useNavigate();
    const vendorName = "Vendor Name";
    const stats = {
        pendingRequests: 5,
        todayBookings: 3,
        services: 8,
        requests: 2,
    };

    const todayBookings = [
        {
            id: 1,
            userName: "Rajesh Kumar",
            userAvatar: null,
            serviceType: "Pit Cleaning",
            time: "10:30 AM",
            address: "123 Main Street, Sector 5",
            status: "confirmed",
        },
        {
            id: 2,
            userName: "Priya Sharma",
            userAvatar: null,
            serviceType: "Groundwater Survey",
            time: "2:00 PM",
            address: "456 Park Avenue, Gurgaon",
            status: "confirmed",
        },
        {
            id: 3,
            userName: "Amit Singh",
            userAvatar: null,
            serviceType: "Pit Cleaning",
            time: "4:30 PM",
            address: "789 Green Park, Delhi",
            status: "pending",
        },
    ];

    const earnings = {
        today: 7500,
        thisWeek: 25000,
        thisMonth: 85000,
        total: 125000,
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-[#0A84FF] to-[#005BBB] rounded-[12px] p-6 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    Welcome, {vendorName}!
                </h1>
                <p className="text-white/90 text-sm">
                    How can we help you today?
                </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-[#4A4A4A] text-xs mb-1">
                        Today Bookings
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                        {stats.todayBookings}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-[#4A4A4A] text-xs mb-1">
                        Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                        {stats.pendingRequests}
                    </p>
                </div>
            </div>

            {/* Section Heading */}
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                    Our Services
                </h2>
            </div>

            {/* 2x2 Grid Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Services Card */}
                <div
                    onClick={() => navigate("/vendor/services")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoBriefcaseOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Services
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                {stats.services} active
                            </p>
                        </div>
                    </div>
                </div>

                {/* Requests Card */}
                <div
                    onClick={() => navigate("/vendor/requests")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoDocumentTextOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Requests
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                {stats.requests} pending
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wallet Card */}
                <div
                    onClick={() => navigate("/vendor/wallet")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoWalletOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Wallet
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                View earnings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Update Card */}
                <div
                    onClick={() => navigate("/vendor/profile")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoPersonCircleOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Profile
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                Manage profile
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Bookings Section */}
            <div className="mt-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Today's Bookings
                    </h2>
                </div>

                <div className="space-y-3">
                    {todayBookings.length === 0 ? (
                        <div className="bg-white rounded-[12px] p-6 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-[#4A4A4A] text-sm">
                                No bookings for today
                            </p>
                        </div>
                    ) : (
                        todayBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    {/* User Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        {booking.userAvatar ? (
                                            <img
                                                src={booking.userAvatar}
                                                alt={booking.userName}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xl">👤</span>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-base font-bold text-gray-800">
                                                {booking.userName}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${
                                                    booking.status ===
                                                    "confirmed"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#0A84FF] mb-1">
                                            {booking.serviceType}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-[#4A4A4A] mb-1">
                                            <IoTimeOutline className="text-base" />
                                            <span>{booking.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
                                            <IoLocationOutline className="text-base" />
                                            <span className="truncate">
                                                {booking.address}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Earnings Section */}
            <div className="mt-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Earnings
                    </h2>
                </div>

                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    {/* Total Earnings */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-[#4A4A4A]">
                                Total Earnings
                            </p>
                            <IoTrendingUpOutline className="text-xl text-[#00C2A8]" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">
                            ₹{earnings.total.toLocaleString()}
                        </h3>
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-[#4A4A4A] mb-1">Today</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{earnings.today.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[#4A4A4A] mb-1">
                                This Week
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{earnings.thisWeek.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[#4A4A4A] mb-1">
                                This Month
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{earnings.thisMonth.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* View Wallet Button */}
                    <button
                        onClick={() => navigate("/vendor/wallet")}
                        className="w-full mt-4 bg-[#0A84FF] text-white font-semibold py-3 px-4 rounded-[12px] hover:bg-[#005BBB] transition-colors shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                    >
                        View Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
