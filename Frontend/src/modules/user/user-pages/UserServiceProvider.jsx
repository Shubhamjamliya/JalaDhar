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
import PageContainer from "../../shared/components/PageContainer";


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
        // Try to get user's location from profile or browser
        if (user?.address?.coordinates) {
            setUserLocation({
                lat: user.address.coordinates.coordinates[1],
                lng: user.address.coordinates.coordinates[0],
                address: user.address.street || user.address.city
            });
        }
    }, [user]);

    useEffect(() => {
        if (userLocation.lat && userLocation.lng) {
            loadVendors();
        } else {
            // Load all vendors if no location
            loadVendors();
        }
    }, [userLocation, radius, filters]);

    const loadVendors = async () => {
        try {
            setLoading(true);
            setError("");
            const params = {
                radius,
                ...filters
            };
            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
            }

            const response = await getNearbyVendors(params);
            if (response.success) {
                setVendors(response.data.vendors || []);
            } else {
                setError(response.message || "Failed to load experts");
            }
        } catch (err) {
            console.error("Load experts error:", err);
            setError("Failed to load experts");
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
        return <LoadingSpinner message="Loading experts..." />;
    }

    return (
        <PageContainer className="pb-28">
            <ErrorMessage message={error} />

            {/* Top Navigation Bar */}
            <div className="flex items-center bg-[#F3F7FA] p-4 pb-3 justify-center mb-4">
                {/* Back button removed - handled by UserNavbar */}
                <h1 className="text-[#3A3A3A] text-lg font-bold leading-tight">Find an Expert</h1>
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


            {/* Expert List */}
            <div className="flex flex-col gap-4 px-4">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <p className="text-[#4A4A4A] text-sm">No experts available</p>
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
        </PageContainer>
    );
}
