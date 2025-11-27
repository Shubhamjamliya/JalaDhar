import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoStar,
    IoStarOutline,
    IoCallOutline,
    IoLocationOutline,
    IoChevronBackOutline,
    IoMailOutline,
    IoTimeOutline,
} from "react-icons/io5";
import { getVendorProfile } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserVendorProfile() {
    const navigate = useNavigate();
    const { vendorId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [vendorData, setVendorData] = useState(null);
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null });

    useEffect(() => {
        // Get user location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                () => {
                    // Location permission denied or unavailable
                }
            );
        }
        loadVendorProfile();
    }, [vendorId]);

    useEffect(() => {
        if (userLocation.lat && userLocation.lng && vendorData) {
            loadVendorProfile();
        }
    }, [userLocation]);

    const loadVendorProfile = async () => {
        try {
            setLoading(true);
            setError("");
            const params = {};
            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
            }
            const response = await getVendorProfile(vendorId, params.lat, params.lng);
            if (response.success) {
                setVendorData(response.data.vendor);
            } else {
                setError(response.message || "Failed to load vendor profile");
            }
        } catch (err) {
            setError("Failed to load vendor profile");
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;
        return [...Array(5)].map((_, i) => {
            if (i < fullStars) {
                return <IoStar key={i} className="text-lg text-yellow-500" />;
            } else if (i === fullStars && hasHalfStar) {
                return <IoStarOutline key={i} className="text-lg text-yellow-500" />;
            } else {
                return <IoStarOutline key={i} className="text-lg text-gray-300" />;
            }
        });
    };

    const formatAddress = (address) => {
        if (!address) return "Address not available";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "Address not available";
    };

    const handleBookService = (service) => {
        navigate("/user/request-service", {
            state: {
                service: service,
                vendor: vendorData,
            }
        });
    };

    if (loading) {
        return <LoadingSpinner message="Loading vendor profile..." />;
    }

    if (error || !vendorData) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error || "Vendor not found"} />
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="font-semibold">Go Back</span>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#EDF5FC] to-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-4 text-gray-600 hover:text-[#0A84FF] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* Vendor Profile Header Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex flex-col items-center text-center mb-6">
                    {/* Profile Image */}
                    <div className="relative mb-4">
                        <div
                            className="h-32 w-32 rounded-full bg-slate-200 bg-cover bg-center bg-no-repeat shadow-[0_4px_15px_rgba(0,0,0,0.1)] ring-4 ring-white"
                            style={{
                                backgroundImage: vendorData.documents?.profilePicture?.url
                                    ? `url("${vendorData.documents.profilePicture.url}")`
                                    : "none",
                                backgroundColor: vendorData.documents?.profilePicture?.url ? "transparent" : "#E5E7EB"
                            }}
                        >
                            {!vendorData.documents?.profilePicture?.url && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-5xl">👤</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {vendorData.name}
                    </h1>

                    {/* Category */}
                    {vendorData.category && (
                        <p className="text-base text-gray-500 mb-3">
                            {vendorData.category}
                        </p>
                    )}

                    {/* Rating and Reviews */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                            {renderStars(vendorData.averageRating)}
                        </div>
                        <span className="font-bold text-gray-800 text-lg">
                            {vendorData.averageRating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-gray-400 text-sm">
                            ({vendorData.totalRatings || 0} reviews)
                        </span>
                    </div>

                    {/* Distance */}
                    {vendorData.distance !== null && (
                        <div className="flex items-center gap-1 text-[#0A84FF] font-semibold">
                            <IoLocationOutline className="text-lg" />
                            <span>{vendorData.distance.toFixed(1)} km away</span>
                        </div>
                    )}
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    {vendorData.experience && (
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Experience</p>
                            <p className="text-lg font-bold text-gray-800">{vendorData.experience} years</p>
                        </div>
                    )}
                    {vendorData.services && vendorData.services.length > 0 && (
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Services</p>
                            <p className="text-lg font-bold text-gray-800">{vendorData.services.length}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>
                <div className="space-y-4">
                    {vendorData.phone && (
                        <InfoRow
                            icon={<IoCallOutline className="text-2xl text-[#0A84FF]" />}
                            label="Phone Number"
                            value={vendorData.phone}
                        />
                    )}
                    {vendorData.email && (
                        <InfoRow
                            icon={<IoMailOutline className="text-2xl text-[#0A84FF]" />}
                            label="Email"
                            value={vendorData.email}
                        />
                    )}
                    <InfoRow
                        icon={<IoLocationOutline className="text-2xl text-[#0A84FF]" />}
                        label="Address"
                        value={formatAddress(vendorData.address)}
                    />
                </div>
            </div>

            {/* Services Section */}
            {vendorData.services && vendorData.services.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">
                        Services Offered ({vendorData.services.length})
                    </h2>
                    <div className="space-y-4">
                        {vendorData.services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white rounded-[16px] p-5 shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                                            {service.name}
                                        </h3>
                                        {service.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {service.description}
                                            </p>
                                        )}
                                        {service.category && (
                                            <span className="inline-block text-xs text-[#0A84FF] bg-[#0A84FF]/10 px-3 py-1 rounded-full font-medium">
                                                {service.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-2xl font-bold text-[#0A84FF] mb-1">
                                            ₹{service.price?.toLocaleString() || "0"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleBookService(service)}
                                    className="w-full bg-gradient-to-r from-[#0A84FF] to-[#005BBB] text-white font-semibold py-3 px-4 rounded-[12px] hover:shadow-lg transition-all active:scale-[0.98]"
                                >
                                    Book This Service
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

/* ---------------------------
   REUSABLE COMPONENTS
---------------------------- */
function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] bg-opacity-10 shrink-0">
                {icon}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-gray-500 mb-1 font-medium">{label}</span>
                <span className="text-base font-semibold text-gray-800 break-words">
                    {value}
                </span>
            </div>
        </div>
    );
}
