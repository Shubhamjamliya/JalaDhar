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
    IoBriefcaseOutline,
    IoBookOutline,
    IoSchoolOutline,
    IoPersonOutline,
    IoShieldCheckmarkOutline
} from "react-icons/io5";
import { getVendorProfile } from "../../../services/bookingApi";
import { maskPhone } from "../../../utils/phoneMasker";
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
                console.log("Expert Data Debug:", response.data.vendor);
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
                    <ErrorMessage message={error || "Expert not found"} />
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
        <PageContainer title="Expert Profile">
            {/* Expert Profile Header Card */}
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
                        <div className="absolute bottom-1 right-1 bg-blue-500 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                            <IoShieldCheckmarkOutline className="text-white text-sm" />
                        </div>
                    </div>

                    {/* Name & Basic Info */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {vendorData.name}
                    </h1>
                    {(() => {
                        const expertId = vendorData.expertId || (vendorData._id ? `EXP-${vendorData._id.toString().slice(-6).toUpperCase()}` : null);
                        return expertId ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200/80 shadow-2xs">
                                <span>Expert ID: {expertId}</span>
                            </div>
                        ) : null;
                    })()}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100 shadow-sm">
                            <IoStar className="text-yellow-500 text-sm" />
                            <span className="font-bold text-gray-800 text-sm ml-0.5">
                                {vendorData.rating?.averageRating?.toFixed(1) || "New"}
                            </span>
                            <span className="text-xs text-gray-400 font-medium ml-1">
                                ({vendorData.rating?.totalRatings || 0} reviews)
                            </span>
                        </div>
                    </div>

                    {/* Stats Cards - Success/Fail */}
                    {/* Modern Stats Cards */}
                    {/* Stats Cards - Experience, Success %, Successful, Failed */}
                    {(() => {
                        const succ = vendorData.successfulSurveys ?? vendorData.successCount ?? 0;
                        const fail = vendorData.failedSurveys ?? vendorData.failureCount ?? 0;
                        const total = succ + fail;
                        let sRate = vendorData.successRate ?? vendorData.successRatio;
                        if (sRate === undefined || sRate === null) {
                            sRate = total > 0 ? Math.round((succ / total) * 100) : null;
                        }
                        const rateText = sRate !== null && total > 0 ? `${sRate}%` : "N/A";

                        return (
                            <div className="grid grid-cols-4 gap-2 w-full mb-6">
                                <div className="bg-blue-50/50 rounded-xl p-2.5 flex flex-col items-center justify-center border border-blue-100">
                                    <span className="text-base font-bold text-blue-700">
                                        {vendorData.experience || 0}<span className="text-[10px] font-normal text-blue-500">Y</span>
                                    </span>
                                    <span className="text-[9px] uppercase tracking-tight font-bold text-blue-400 mt-1 text-center">Experience</span>
                                </div>
                                <div className="bg-emerald-50/50 rounded-xl p-2.5 flex flex-col items-center justify-center border border-emerald-100">
                                    <span className="text-base font-bold text-emerald-700">
                                        {rateText}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-tight font-bold text-emerald-400 mt-1 text-center">Success %</span>
                                </div>
                                <div className="bg-green-50/50 rounded-xl p-2.5 flex flex-col items-center justify-center border border-green-100">
                                    <span className="text-base font-bold text-green-700">
                                        {succ}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-tight font-bold text-green-400 mt-1 text-center">Successful</span>
                                </div>
                                <div className="bg-rose-50/50 rounded-xl p-2.5 flex flex-col items-center justify-center border border-rose-100">
                                    <span className="text-base font-bold text-rose-700">
                                        {fail}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-tight font-bold text-rose-400 mt-1 text-center">Failed</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Contact & Location Information Section */}
                    <div className="w-full space-y-4 pt-4 border-t border-gray-100">
                        {vendorData.phone && (
                            <InfoRow
                                icon={IoCallOutline}
                                label="Phone Number"
                                value={maskPhone(vendorData.phone)}
                                color="bg-blue-500"
                            />
                        )}
                        <InfoRow
                            icon={IoBriefcaseOutline}
                            label="Designation"
                            value={vendorData.designation || 'Not specified'}
                            color="bg-purple-500"
                        />
                        <InfoRow
                            icon={IoPersonOutline}
                            label="Gender"
                            value={vendorData.gender || 'Not specified'}
                            color="bg-pink-500"
                        />
                        <InfoRow
                            icon={IoSchoolOutline}
                            label="Qualification"
                            value={
                                Array.isArray(vendorData.education)
                                    ? vendorData.education.map(e => typeof e === 'string' ? e : e.degree).join(', ')
                                    : (vendorData.education || 'Not specified')
                            }
                            color="bg-indigo-500"
                        />
                        <InfoRow
                            icon={IoLocationOutline}
                            label="Service Location"
                            value={formatAddress(vendorData.address)}
                            color="bg-teal-500"
                        />
                        {/* Service Areas */}
                        <div className="flex items-start gap-4 text-left pt-2 border-t border-gray-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shrink-0 text-white shadow-sm">
                                <IoLocationOutline className="text-lg" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Service Areas</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(Array.isArray(vendorData.serviceAreas) && vendorData.serviceAreas.length > 0
                                        ? vendorData.serviceAreas
                                        : [vendorData.address?.city, vendorData.address?.state].filter(Boolean)
                                    ).map((area, idx) => (
                                        <span key={idx} className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                                            {area || "Local Region"}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Certificates Section (Masked Credentials) */}
                    {(vendorData.degreeCertificates?.length > 0 || vendorData.trainingCertificates?.length > 0) && (
                        <div className="w-full pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 px-1">Verified Credentials</h3>

                            {/* Degree Certificates */}
                            {vendorData.degreeCertificates?.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">Degree Certificates</p>
                                    <div className="flex flex-wrap gap-2">
                                        {vendorData.degreeCertificates.map((cert, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-xl text-xs font-semibold border border-blue-100/90 shadow-2xs cursor-default"
                                            >
                                                <IoShieldCheckmarkOutline className="text-sm text-blue-600 shrink-0" />
                                                <span>Verified Degree Certificate</span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded ml-auto">Verified</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Training Certificates */}
                            {vendorData.trainingCertificates?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2 font-medium">Training Certificates</p>
                                    <div className="flex flex-wrap gap-2">
                                        {vendorData.trainingCertificates.map((cert, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-100/90 shadow-2xs cursor-default"
                                            >
                                                <IoShieldCheckmarkOutline className="text-sm text-emerald-600 shrink-0" />
                                                <span>Verified Training Certificate</span>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded ml-auto">Verified</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
