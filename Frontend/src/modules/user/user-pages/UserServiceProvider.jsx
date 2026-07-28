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
import ExpertProfileCard from "../components/ExpertProfileCard";


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
                    vendors.map((vendor) => (
                        <ExpertProfileCard
                            key={vendor._id}
                            expert={vendor}
                            actionLabel="View Profile"
                            onSelect={() => navigate(`/user/vendor-profile/${vendor._id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
