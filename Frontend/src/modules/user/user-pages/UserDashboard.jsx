import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoCalendarOutline,
    IoSearchOutline,
    IoPersonCircleOutline,
    IoStar,
    IoStarOutline,
    IoCloseOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
} from "react-icons/io5";

export default function UserDashboard() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("Akshat");
    const [userAvatar, setUserAvatar] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [requestStatuses, setRequestStatuses] = useState([]);

    useEffect(() => {
        // Load user profile from localStorage
        const savedProfile =
            JSON.parse(localStorage.getItem("userProfile")) || {};
        if (savedProfile.fullName) {
            setUserName(savedProfile.fullName);
        }
        if (savedProfile.profileImage) {
            setUserAvatar(savedProfile.profileImage);
        }

        // Load request statuses from localStorage
        const savedRequests =
            JSON.parse(localStorage.getItem("userRequests")) || [];
        setRequestStatuses(savedRequests);
    }, []);

    useEffect(() => {
        // Prevent body scroll when modal is open
        if (showStatusModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showStatusModal]);

    const handleRequestStatusClick = () => {
        setShowStatusModal(true);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending":
                return {
                    label: "Pending",
                    color: "bg-yellow-100 text-yellow-700",
                    icon: IoTimeOutline,
                };
            case "success":
            case "accepted":
                return {
                    label: "Accepted",
                    color: "bg-green-100 text-green-700",
                    icon: IoCheckmarkCircleOutline,
                };
            case "rejected":
                return {
                    label: "Rejected",
                    color: "bg-red-100 text-red-700",
                    icon: IoCloseCircleOutline,
                };
            default:
                return {
                    label: "Pending",
                    color: "bg-yellow-100 text-yellow-700",
                    icon: IoTimeOutline,
                };
        }
    };

    // Sample data if no requests
    const sampleRequests = [
        {
            id: 1,
            serviceType: "Pit Cleaning",
            requestDate: "2024-01-15",
            requestTime: "10:30 AM",
            status: "pending",
            description: "Need pit cleaning service urgently",
        },
        {
            id: 2,
            serviceType: "Groundwater Survey",
            requestDate: "2024-01-14",
            requestTime: "2:00 PM",
            status: "success",
            description: "Groundwater survey request",
        },
        {
            id: 3,
            serviceType: "Water Testing",
            requestDate: "2024-01-13",
            requestTime: "11:00 AM",
            status: "rejected",
            description: "Water quality testing",
        },
    ];

    const displayRequests =
        requestStatuses.length > 0 ? requestStatuses : sampleRequests;

    // Vendor data - same structure as UserServiceProvider for consistency
    const vendors = [
        {
            id: 1,
            name: "AquaFix Plumbing",
            category: "Plumbing",
            rating: 4.9,
            reviews: 120,
            distance: "2.5 km away",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFIejiN3gC457JpbQXg8Nt7qcehDsWtO7onZr_F4iCLyg774lap8BmyWKX28dA6XEUOYOTvI4IJp5AVRrnYLJkE_t-QV8wwWUv51EoJN7UOQ-cwBnja--doe1rQD1NsyHwkE7Wr_saOzATfkmTj8rPh8z1Odd6O7z-wZMuWvxT-w9UF-ceN3pMUQiGbIEiTlBam98tEtcs9N9CaQc7kLsnUf--R2N_y81GjMurYcMRQTg1oAx8eRAfXQ4Di0C6ItnYOS3O3oUFC2H2",
        },
        {
            id: 2,
            name: "PureFlow Systems",
            category: "Water Purifiers",
            rating: 4.8,
            reviews: 88,
            distance: "3.1 km away",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCd4RAvRaJsbYSUyfoS4fwssj9zgcp7Y8hVWP4dMart8y6LHd3LOobWc_DJCoABTpLXFycKRHE7HmdR9MWaOPvsnfFQklWSlX-tJW_WL-UDMmJ_IhX54kooCpT3qB82VuUk_BR8gYaLMuhh0Ii8lke0ng2tH2cto1b05Co7nhbLwS1z25RIglCINuaH8cLs23BDqiEtLxmRVDCH2_07YK6aij1rdqQ283U8bWguj6e5Fum9Na0z5NGZReHqqmPCmZg_pVEGk9UwONNK",
        },
        {
            id: 3,
            name: "Clear Tank Co.",
            category: "Tank Cleaning",
            rating: 5.0,
            reviews: 45,
            distance: "5.0 km away",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKw8TD27NpUPP9fG39USVkTsLRqGtYydXMyri5be9HnUSIKXVIoovkIdkep2dDPu-jZCqKsadhh_EPaUi5n72rnW9fAWoeyvWWlocav2Brr321489R9QkJtGMsSl9ZMD6-szaHN-MlqhqEzaJGZecFkMINWVlNjFjh0pPoQ2yhGNGxlXNPWp8FAktY1PIg9srJdfos2U62f1PHplKkFSPehU_ymJGTLWcRJpe9M-SQuoCiWGwYSZ8mmI7CejZP2FYiF-5thU1ZicBB",
        },
    ];

    const backgroundImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva";

    const avatarImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCqZRhSzmWMNhXuX4RPFuS_KD7WQ8XLgbsk2nXkV3JICy3ZcLfqjZnTbmofKaBePVQ9HQeoiASrUYaU_VYP7dBYSFBI9Z5WlMcnCKPDQIZaN5Uo8Qh4iv3tNNNnrRAnqP6QfGEIvqzMRneraT-7cwEGw9ba4Ci_wx2qsxlsRdxcPVRdPcnkz2n2vv4YM02MHGkKA3Punga2QFw4FyWv6phuBqmgoiAjWSehWquP1nyb8tigrHh5j6ir7c3uumnU1LI7khab45fuKmL";

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Profile Header with Background Image */}
            <section className="relative my-4 overflow-hidden rounded-[12px] bg-white p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <div className="absolute inset-0 z-0 opacity-10">
                    <img
                        className="h-full w-full object-cover"
                        src={backgroundImageUrl}
                        alt=""
                    />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div
                        className="h-16 w-16 rounded-full bg-cover bg-center flex-shrink-0"
                        style={{
                            backgroundImage: userAvatar
                                ? `url("${userAvatar}")`
                                : `url("${avatarImageUrl}")`,
                        }}
                    ></div>
                    <div>
                        <p className="text-[22px] font-bold tracking-tight text-gray-800">
                            Welcome, {userName}
                        </p>
                    </div>
                </div>
            </section>

            {/* Services Overview */}
            <h2 className="px-2 pt-4 pb-2 text-lg font-bold text-gray-800">
                Your Services Overview
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Request Status */}
                <div
                    onClick={handleRequestStatusClick}
                    className="flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
                        <IoDocumentTextOutline className="text-xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                            Request Status
                        </h3>
                    </div>
                </div>

                {/* Current Booking */}
                <div
                    onClick={() => navigate("/user/status")}
                    className="flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
                        <IoCalendarOutline className="text-xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                            Current Booking
                        </h3>
                        {/* <p className="text-xs text-[#4A4A4A]">View bookings</p> */}
                    </div>
                </div>

                {/* Find Vendor */}
                <div
                    onClick={() => navigate("/user/serviceprovider")}
                    className="flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
                        <IoSearchOutline className="text-xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                            Find Vendor
                        </h3>
                    </div>
                </div>

                {/* Update Profile */}
                <div
                    onClick={() => navigate("/user/profile")}
                    className="flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
                        <IoPersonCircleOutline className="text-xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                            Update Profile
                        </h3>
                    </div>
                </div>
            </div>

            {/* Top Vendors */}
            <h2 className="px-2 pt-8 pb-2 text-lg font-bold text-gray-800">
                Top Vendors Near You
            </h2>
            <div className="flex flex-col gap-4">
                {vendors.map((vendor) => (
                    <div
                        key={vendor.id}
                        onClick={() => navigate(`/user/vendor/${vendor.id}`)}
                        className="flex gap-4 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <div
                            className="h-20 w-20 rounded-[10px] bg-cover bg-center flex-shrink-0"
                            style={{
                                backgroundImage: `url("${vendor.image}")`,
                            }}
                        ></div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800">
                                {vendor.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                                {vendor.category}
                            </p>
                            <div className="flex items-center gap-1 text-sm mt-1">
                                <IoStar className="text-base text-yellow-500" />
                                <span className="font-bold text-gray-800">
                                    {vendor.rating}
                                </span>
                                <span className="text-gray-400">
                                    ({vendor.reviews})
                                </span>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-[#0A84FF]">
                                {vendor.distance}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {/* View All Vendors Button */}
            <div className="flex justify-end px-2 pt-2">
                <button
                    onClick={() => navigate("/user/serviceprovider")}
                    className="text-sm font-semibold text-[#0A84FF] hover:underline"
                >
                    View All Vendors
                </button>
            </div>

            {/* Request Status Modal */}
            {showStatusModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowStatusModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-[20px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-[20px]">
                            <h2 className="text-xl font-bold text-gray-800">
                                Request Status
                            </h2>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {displayRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-sm">
                                        No requests found
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayRequests.map((request) => {
                                        const statusConfig = getStatusConfig(
                                            request.status
                                        );
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <div
                                                key={request.id}
                                                className="bg-white rounded-[12px] p-5 border border-gray-200 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-base font-bold text-gray-800 mb-2">
                                                            {
                                                                request.serviceType
                                                            }
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <IoTimeOutline className="text-base" />
                                                            <span>
                                                                {new Date(
                                                                    request.requestDate
                                                                ).toLocaleDateString(
                                                                    "en-IN",
                                                                    {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    }
                                                                )}{" "}
                                                                at{" "}
                                                                {
                                                                    request.requestTime
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color} flex items-center gap-1.5 flex-shrink-0`}
                                                    >
                                                        <StatusIcon className="text-sm" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                {request.description && (
                                                    <div className="pt-3 border-t border-gray-100">
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {
                                                                request.description
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
