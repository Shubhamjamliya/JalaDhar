import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoStar,
    IoStarOutline,
    IoCallOutline,
    IoLocationOutline,
    IoMailOutline,
    IoChevronBackOutline,
    IoConstructOutline,
    IoBriefcaseOutline
} from "react-icons/io5";
import { getVendorProfile } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import PageContainer from "../../shared/components/PageContainer";

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
                console.log("Vendor Data Debug:", response.data.vendor);
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

    const formatAddress = (address) => {
        if (!address) return "Address not available";
        if (address.geoLocation && address.geoLocation.formattedAddress) {
            return address.geoLocation.formattedAddress;
        }
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        return parts.join(", ") || "Address not available";
    };

    const handleBookService = (service) => {
        navigate("/user/survey", {
            state: {
                service: service,
                vendor: vendorData,
            }
        });
    };

    if (loading) {
        return (
            <PageContainer>
                <div className="flex h-[80vh] items-center justify-center">
                    <LoadingSpinner message="Loading profile..." />
                </div>
            </PageContainer>
        );
    }

    if (error || !vendorData) {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <ErrorMessage message={error || "Vendor not found"} />
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-6 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                    >
                        <IoChevronBackOutline className="text-xl" />
                        <span className="font-semibold">Go Back</span>
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="Vendor Profile">
            {/* Vendor Profile Header Card */}
            <section className="relative mb-6 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                    {/* Profile Image */}
                    <div className="relative mb-4">
                        <div className="h-28 w-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                            {vendorData.profilePicture ? (
                                <img
                                    src={vendorData.profilePicture}
                                    alt={vendorData.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-4xl">
                                    👤
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 h-6 w-6 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Name & Basic Info */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {vendorData.name}
                    </h1>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                            <IoStar className="text-yellow-500 text-sm" />
                            <span className="font-bold text-gray-800 text-sm">
                                {vendorData.rating?.averageRating?.toFixed(1) || "New"}
                            </span>
                        </div>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm font-medium">
                            {vendorData.experience ? `${vendorData.experience} Years Exp.` : "Fresher"}
                        </span>
                    </div>

                    {/* Stats Cards - Success/Fail - Using Mock Data if actual stats missing */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
                        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 flex flex-col items-center">
                            <span className="text-2xl font-bold text-emerald-600">
                                {vendorData.stats?.completedBookings || 0}
                            </span>
                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                Success
                            </span>
                        </div>
                        <div className="bg-red-50 rounded-2xl p-3 border border-red-100 flex flex-col items-center">
                            <span className="text-2xl font-bold text-red-600">
                                {vendorData.stats?.cancelledBookings || 0}
                            </span>
                            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                                Failed
                            </span>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="w-full space-y-4 pt-4 border-t border-gray-100">
                        {vendorData.phone && (
                            <InfoRow
                                icon={IoCallOutline}
                                label="Phone Number"
                                value={vendorData.phone}
                                color="bg-blue-500"
                            />
                        )}
                        <InfoRow
                            icon={IoLocationOutline}
                            label="Service Location"
                            value={formatAddress(vendorData.address)}
                            color="bg-teal-500"
                        />
                    </div>
                </div>
            </section>

            {/* Service & Machines Section */}
            {vendorData.services && vendorData.services.length > 0 && (
                <section className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                    {/* Main Service Card - Since single service per vendor */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <IoBriefcaseOutline className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {vendorData.services[0].name}
                                </h2>
                                <p className="text-sm font-bold text-blue-600">
                                    ₹{vendorData.services[0].price?.toLocaleString()} <span className="text-gray-400 font-normal">/ visit</span>
                                </p>
                            </div>
                        </div>

                        {/* Machines List */}
                        {vendorData.services[0].machineType && (
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                                    Equipment & Machines
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {vendorData.services[0].machineType.split(',').map((machine, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100"
                                        >
                                            <div className="bg-white p-2 rounded-xl shadow-sm text-[#0A84FF]">
                                                <IoConstructOutline className="text-lg" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">
                                                {machine.trim()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => handleBookService(vendorData.services[0])}
                            className="w-full bg-[#0A84FF] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span>Book Now</span>
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </div>
                </section>
            )}
        </PageContainer>
    );
}

/* ---------------------------
   REUSABLE COMPONENTS
---------------------------- */
function InfoRow({ icon: Icon, label, value, color = "bg-blue-500" }) {
    return (
        <div className="flex items-start gap-4 text-left">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color} shrink-0 text-white shadow-sm`}>
                <Icon className="text-lg" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</span>
                <span className="text-sm font-semibold text-gray-900 break-words leading-snug">
                    {value}
                </span>
            </div>
        </div>
    );
}
