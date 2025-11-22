/**
 * Reusable Booking Card Component
 */
import { IoTimeOutline, IoLocationOutline, IoCallOutline } from "react-icons/io5";

export default function BookingCard({ 
    booking, 
    user, 
    service, 
    status, 
    showActions = false, 
    actions = [],
    className = "" 
}) {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
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

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "PENDING" },
            ACCEPTED: { bg: "bg-blue-100", text: "text-blue-700", label: "ACCEPTED" },
            VISITED: { bg: "bg-purple-100", text: "text-purple-700", label: "VISITED" },
            COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "COMPLETED" },
            REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "REJECTED" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <span className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className={`bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all ${className}`}>
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {user?.name ? (
                        <span className="text-lg font-semibold text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <span className="text-xl">👤</span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="text-base font-bold text-gray-800">
                            {user?.name || "User"}
                        </h3>
                        {status && getStatusBadge(status)}
                    </div>
                    <p className="text-sm font-semibold text-[#0A84FF] mb-1">
                        {service?.name || "Service"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#4A4A4A] mb-1">
                        <IoTimeOutline className="text-base" />
                        <span>
                            {formatDate(booking?.scheduledDate)} at {formatTime(booking?.scheduledTime)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
                        <IoLocationOutline className="text-base" />
                        <span className="truncate">
                            {formatAddress(booking?.address)}
                        </span>
                    </div>
                    {user?.phone && (
                        <div className="flex items-center gap-2 text-xs text-[#4A4A4A] mt-1">
                            <IoCallOutline className="text-sm" />
                            <a
                                href={`tel:${user.phone}`}
                                className="text-[#0A84FF] hover:underline"
                            >
                                {user.phone}
                            </a>
                        </div>
                    )}
                    {booking?.payment && (
                        <p className="text-xs text-[#4A4A4A] mt-1">
                            Amount: ₹{booking.payment.amount?.toLocaleString() || "0"}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            {showActions && actions.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            disabled={action.loading}
                            className={`w-full font-semibold py-2.5 px-4 rounded-[10px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${action.className || "bg-[#0A84FF] text-white hover:bg-[#005BBB]"}`}
                        >
                            {action.icon && <action.icon className="text-lg" />}
                            {action.loading ? "Processing..." : action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

