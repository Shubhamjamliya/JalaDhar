import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {

    IoChevronDownOutline,
    IoStarOutline,
} from "react-icons/io5";
import { getNearbyVendors } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import LocationSelector from "../../../components/LocationSelector";

export default function UserServiceProvider() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [vendors, setVendors] = useState([]);
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null, address: null });
    const [radius, setRadius] = useState(50);
    const [filters, setFilters] = useState({
        serviceType: "",
        price: "",
        rating: "",
        experience: ""
    });

    useEffect(() => {
        loadVendors();
    }, [filters, userLocation, radius]);

    const loadVendors = async () => {
        try {
            setLoading(true);
            setError("");
            const params = { limit: 50 };

            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
                params.radius = radius;
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
        const ratingValue = rating || 0;
        const fullStars = Math.floor(ratingValue);
        const hasHalfStar = ratingValue % 1 >= 0.5;
        return [...Array(5)].map((_, i) => {
            if (i < fullStars) {
                return <IoStarOutline key={i} className="text-base text-yellow-500" style={{ fill: '#CA8A04' }} />;
            } else if (i === fullStars && hasHalfStar) {
                return <IoStarOutline key={i} className="text-base text-yellow-500" style={{ fill: '#CA8A04', opacity: 0.5 }} />;
            } else {
                return <IoStarOutline key={i} className="text-base text-yellow-500" style={{ fill: '#CA8A04', opacity: 0.3 }} />;
            }
        });
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
                {/* Back button removed - handled by UserNavbar */}
                <h1 className="text-[#3A3A3A] text-lg font-bold leading-tight">Find a Vendor</h1>
            </div>

            {/* Location Selector */}
            <div className="px-4 mb-4">
                <LocationSelector
                    onLocationSelect={setUserLocation}
                    showRadiusSelector={false}
                    onRadiusChange={setRadius}
                    initialRadius={radius}
                />
            </div>


            {/* Vendor List */}
            <div className="flex flex-col gap-4 px-4">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <p className="text-[#4A4A4A] text-sm">No vendors available</p>
                    </div>
                ) : (
                    vendors.map((vendor, index) => {
                        // Generate different colored backgrounds for profile pictures
                        const colors = ['#B3E5FC', '#FFEB3B', '#C8E6C9', '#FFCCBC', '#E1BEE7'];
                        const bgColor = colors[index % colors.length];

                        return (
                            <div
                                key={vendor._id}
                                className="relative flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-lg"
                            >
                                {/* Distance Badge - Top Right */}
                                {userLocation.lat && userLocation.lng && vendor.distance !== null && vendor.distance !== undefined && !isNaN(vendor.distance) && (
                                    <span className="absolute top-2 right-2 text-xs font-semibold text-white bg-orange-400 px-2.5 py-1 rounded-full whitespace-nowrap z-10">
                                        {typeof vendor.distance === 'number' ? vendor.distance.toFixed(1) : vendor.distance} km away
                                    </span>
                                )}

                                {/* Vendor Header - Profile Picture and Name */}
                                <div className="flex items-start gap-3 overflow-hidden">
                                    {/* Circular Profile Picture */}
                                    <div className="relative shrink-0">
                                        <div
                                            className="h-20 w-20 rounded-full bg-cover bg-center bg-no-repeat border-4 border-white shadow-md"
                                            style={{
                                                backgroundImage: vendor.profilePicture
                                                    ? `url("${vendor.profilePicture}")`
                                                    : "none",
                                                backgroundColor: vendor.profilePicture ? "transparent" : bgColor
                                            }}
                                        >
                                            {!vendor.profilePicture && (
                                                <div className="w-full h-full flex items-center justify-center rounded-full">
                                                    <span className="text-3xl">👤</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Name and Rating */}
                                    <div className={`flex flex-1 flex-col gap-1 min-w-0 ${userLocation.lat && userLocation.lng && vendor.distance !== null && vendor.distance !== undefined && !isNaN(vendor.distance) ? 'pr-24' : ''}`}>
                                        <p className="text-gray-800 text-base font-bold leading-tight truncate">
                                            {vendor.name}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {renderStars(vendor.averageRating || 0)}
                                            <span className="text-gray-600 text-xs font-medium ml-1">
                                                ({vendor.averageRating?.toFixed(1) || "0.0"})
                                                {vendor.totalRatings > 0 && (
                                                    <span className="text-gray-500 ml-1">
                                                        • {vendor.totalRatings} {vendor.totalRatings === 1 ? "rating" : "ratings"}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Tags */}
                                {vendor.serviceTags && vendor.serviceTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {vendor.serviceTags.map((tag, tagIndex) => (
                                            <span
                                                key={tagIndex}
                                                className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Price and Experience */}
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-gray-600">
                                        Starts from: <span className="font-bold text-gray-800">
                                            {formatPrice(vendor.minPrice)}
                                        </span>
                                    </p>
                                    {vendor.experience && (
                                        <p className="text-xs text-gray-500">
                                            {vendor.experience} years experience
                                        </p>
                                    )}
                                </div>

                                {/* View Profile Button - Moved to Bottom */}
                                <button
                                    onClick={() => navigate(`/user/vendor-profile/${vendor._id}`)}
                                    className="relative flex items-center justify-center bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#81D4FA] text-[#1976D2] px-3 py-2 rounded-xl text-xs font-semibold hover:from-[#90CAF9] hover:via-[#BBDEFB] hover:to-[#64B5F6] transition-all shadow-md hover:shadow-lg active:scale-[0.98] overflow-hidden w-full"
                                >
                                    {/* Glossy/Highlight Effect */}
                                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                                    <span className="relative z-10">View Profile</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
