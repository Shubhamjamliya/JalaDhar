import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoChevronDownOutline,
} from "react-icons/io5";
import { getNearbyVendors } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserServiceProvider() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [vendors, setVendors] = useState([]);
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
    const [filters, setFilters] = useState({
        serviceType: "",
        price: "",
        rating: "",
        experience: ""
    });

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
        loadVendors();
    }, []);

    useEffect(() => {
        loadVendors();
    }, [filters, userLocation]);

    const loadVendors = async () => {
        try {
            setLoading(true);
            setError("");
            const params = { limit: 50 };

            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
            }

            // Apply filters
            if (filters.serviceType) {
                params.serviceType = filters.serviceType;
            }
            if (filters.price) {
                const [min, max] = filters.price.split("-").map(Number);
                if (min) params.minPrice = min;
                if (max) params.maxPrice = max;
            }
            if (filters.rating) {
                params.minRating = parseFloat(filters.rating);
            }
            if (filters.experience) {
                params.minExperience = parseFloat(filters.experience);
            }

            const response = await getNearbyVendors(params);
            if (response.success) {
                setVendors(response.data.vendors || []);
            } else {
                setError(response.message || "Failed to load vendors");
            }
        } catch (err) {
            console.error("Load vendors error:", err);
            setError("Failed to load vendors");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: prev[filterName] === value ? "" : value
        }));
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;
        const stars = [];
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <span key={i} className="material-symbols-outlined text-base text-yellow-500">star</span>
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <span key={i} className="material-symbols-outlined text-base text-yellow-500">star_half</span>
                );
            } else {
                stars.push(
                    <span key={i} className="material-symbols-outlined text-base text-gray-300">star</span>
                );
            }
        }
        return stars;
    };

    const formatPrice = (price) => {
        return `₹${price?.toLocaleString() || "0"}`;
    };

    if (loading && vendors.length === 0) {
        return <LoadingSpinner message="Loading vendors..." />;
    }

    return (
        <div className="min-h-screen bg-[#F3F7FA] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

            {/* Top Navigation Bar */}
            <div className="sticky top-16 z-10 flex items-center bg-[#F3F7FA]/80 backdrop-blur-sm p-4 pb-3 -mx-4 md:-mx-6 justify-center mb-4">
                <button
                    onClick={() => navigate("/user/dashboard")}
                    className="absolute left-4 flex size-10 items-center justify-center rounded-full text-[#3A3A3A]"
                >
                    <IoChevronBackOutline className="text-2xl" />
                </button>
                <h1 className="text-[#3A3A3A] text-lg font-bold leading-tight">Find a Vendor</h1>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 p-4 pt-0 overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-4">
                <button
                    onClick={() => handleFilterChange("serviceType", "")}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${filters.serviceType === ""
                            ? "bg-[#1A80E5] text-white"
                            : "bg-white text-[#3A3A3A]"
                        }`}
                >
                    <p className="text-sm font-medium leading-normal">Service type</p>
                    <IoChevronDownOutline className="text-xl" />
                </button>
                <button
                    onClick={() => handleFilterChange("price", "")}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${filters.price === ""
                            ? "bg-[#1A80E5] text-white"
                            : "bg-white text-[#3A3A3A]"
                        }`}
                >
                    <p className="text-sm font-medium leading-normal">Price</p>
                    <IoChevronDownOutline className="text-xl" />
                </button>
                <button
                    onClick={() => handleFilterChange("rating", "")}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${filters.rating === ""
                            ? "bg-[#1A80E5] text-white"
                            : "bg-white text-[#3A3A3A]"
                        }`}
                >
                    <p className="text-sm font-medium leading-normal">Rating</p>
                    <IoChevronDownOutline className="text-xl" />
                </button>
                <button
                    onClick={() => handleFilterChange("experience", "")}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${filters.experience === ""
                            ? "bg-[#1A80E5] text-white"
                            : "bg-white text-[#3A3A3A]"
                        }`}
                >
                    <p className="text-sm font-medium leading-normal">Experience</p>
                    <IoChevronDownOutline className="text-xl" />
                </button>
            </div>

            {/* Vendor List */}
            <div className="flex flex-col gap-4 px-4">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <p className="text-[#4A4A4A] text-sm">No vendors available</p>
                    </div>
                ) : (
                    vendors.map((vendor) => (
                        <div
                            key={vendor._id}
                            className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                        >
                            {/* Vendor Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="shrink-0">
                                    <div
                                        className="w-20 h-20 bg-center bg-no-repeat bg-cover rounded-lg"
                                        style={{
                                            backgroundImage: vendor.documents?.profilePicture?.url
                                                ? `url("${vendor.documents.profilePicture.url}")`
                                                : "none",
                                            backgroundColor: vendor.documents?.profilePicture?.url ? "transparent" : "#E5E7EB"
                                        }}
                                    >
                                        {!vendor.documents?.profilePicture?.url && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl">👤</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <p className="text-[#3A3A3A] text-base font-bold leading-tight truncate">
                                        {vendor.name}
                                    </p>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        {renderStars(vendor.averageRating)}
                                        <span className="text-[#3A3A3A]/60 text-xs font-medium ml-1">
                                            ({vendor.averageRating?.toFixed(1) || "0.0"})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Tags */}
                            {vendor.serviceTags && vendor.serviceTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {vendor.serviceTags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="text-xs font-medium text-[#1A80E5] bg-[#1A80E5]/10 px-3 py-1 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Price, Experience, and View Profile Button */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-[#3A3A3A]/80">
                                        Starts from: <span className="font-bold text-[#3A3A3A]">
                                            {formatPrice(vendor.minPrice)}
                                        </span>
                                    </p>
                                    {vendor.experience && (
                                        <p className="text-xs text-[#3A3A3A]/60">
                                            {vendor.experience} years experience
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate(`/user/vendor-profile/${vendor._id}`)}
                                    className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-5 bg-[#1A80E5] text-white text-sm font-medium leading-normal shrink-0"
                                >
                                    <span className="truncate">View Profile</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
