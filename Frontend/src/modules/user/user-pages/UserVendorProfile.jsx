import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoStar,
    IoStarOutline,
    IoCallOutline,
    IoLocationOutline,
    IoChevronBackOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";

export default function UserVendorProfile() {
    const navigate = useNavigate();
    const { vendorId } = useParams();
    const [userRating, setUserRating] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    // Vendor data - same structure as UserServiceProvider
    const allVendors = [
        {
            id: 1,
            name: "AquaFix Plumbing",
            category: "Plumbing",
            rating: 4.8,
            reviews: 120,
            distance: "2.5 km away",
            phone: "+91 9876543210",
            address: "123 Service Street, New Delhi - 110001",
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBFsVoahTfvkzJLjMrUg2_ewJybuFfZDHviOxHBMo0j_iwdNYmcxJgXdcQutFKCVAngOF23BHMHszB2ESE576PA88h6LyoE50joA_BH4NiYybWZBU2r6JNbXwRRgeWjhbOnyHLLdchOO5Ev8sU0Ul32nWe8MZWj9dJ8sJLV3lG5BJDK5VrsqxVCVj3ujigkdmzT32bWS_wAV2JNPH22tS-K9aiHjB8A_kIQXSzc29su8illJ-JvBkMF_w5N7taB9vhkhFD7bChLELD4",
            services: [
                {
                    id: 1,
                    name: "Tank Cleaning",
                    price: 1500,
                    duration: "2-3 hours",
                    description: "Professional tank cleaning service",
                },
                {
                    id: 2,
                    name: "Pipe Repair",
                    price: 800,
                    duration: "1-2 hours",
                    description: "Quick pipe repair and maintenance",
                },
            ],
            allRatings: [
                {
                    id: 1,
                    userName: "Rajesh K.",
                    rating: 5,
                    comment: "Great service!",
                },
                {
                    id: 2,
                    userName: "Priya S.",
                    rating: 4,
                    comment: "Good work",
                },
            ],
        },
        {
            id: 2,
            name: "PureFlow Systems",
            category: "Water Purifiers",
            rating: 4.9,
            reviews: 88,
            distance: "3.1 km away",
            phone: "+91 9876543211",
            address: "456 Tech Park, Gurgaon - 122001",
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCd4RAvRaJsbYSUyfoS4fwssj9zgcp7Y8hVWP4dMart8y6LHd3LOobWc_DJCoABTpLXFycKRHE7HmdR9MWaOPvsnfFQklWSlX-tJW_WL-UDMmJ_IhX54kooCpT3qB82VuUk_BR8gYaLMuhh0Ii8lke0ng2tH2cto1b05Co7nhbLwS1z25RIglCINuaH8cLs23BDqiEtLxmRVDCH2_07YK6aij1rdqQ283U8bWguj6e5Fum9Na0z5NGZReHqqmPCmZg_pVEGk9UwONNK",
            services: [
                {
                    id: 1,
                    name: "Water Purification",
                    price: 3000,
                    duration: "3-4 hours",
                    description: "Complete water purification system",
                },
                {
                    id: 2,
                    name: "Tank Cleaning",
                    price: 2000,
                    duration: "2-3 hours",
                    description: "Professional tank cleaning",
                },
            ],
            allRatings: [
                {
                    id: 1,
                    userName: "Amit S.",
                    rating: 5,
                    comment: "Excellent",
                },
            ],
        },
        {
            id: 3,
            name: "Clear Tank Co.",
            category: "Tank Cleaning",
            rating: 5.0,
            reviews: 45,
            distance: "5.0 km away",
            phone: "+91 9876543212",
            address: "789 Industrial Area, Noida - 201301",
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAKw8TD27NpUPP9fG39USVkTsLRqGtYydXMyri5be9HnUSIKXVIoovkIdkep2dDPu-jZCqKsadhh_EPaUi5n72rnW9fAWoeyvWWlocav2Brr321489R9QkJtGMsSl9ZMD6-szaHN-MlqhqEzaJGZecFkMINWVlNjFjh0pPoQ2yhGNGxlXNPWp8FAktY1PIg9srJdfos2U62f1PHplKkFSPehU_ymJGTLWcRJpe9M-SQuoCiWGwYSZ8mmI7CejZP2FYiF-5thU1ZicBB",
            services: [
                {
                    id: 1,
                    name: "Tank Cleaning",
                    price: 2500,
                    duration: "3-4 hours",
                    description: "Complete water tank cleaning",
                },
                {
                    id: 2,
                    name: "Water Testing",
                    price: 500,
                    duration: "1 hour",
                    description: "Water quality testing",
                },
            ],
            allRatings: [
                {
                    id: 1,
                    userName: "Sneha M.",
                    rating: 5,
                    comment: "Very professional",
                },
            ],
        },
    ];

    // Find vendor by ID
    const vendorData =
        allVendors.find((v) => v.id === parseInt(vendorId)) || allVendors[0];

    useEffect(() => {
        // Load user rating for this vendor
        const savedRatings =
            JSON.parse(
                localStorage.getItem(`vendor_${vendorId}_ratings`)
            ) || [];
        if (savedRatings.length > 0) {
            const userRatingData = savedRatings.find(
                (r) => r.userId === "current_user"
            );
            if (userRatingData) {
                setUserRating(userRatingData.rating);
            }
        }
    }, [vendorId]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showRatingModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showRatingModal]);

    const handleRatingClick = (rating) => {
        setUserRating(rating);
        // Save rating
        const savedRatings =
            JSON.parse(
                localStorage.getItem(`vendor_${vendorId}_ratings`)
            ) || [];
        const newRating = {
            id: Date.now(),
            userId: "current_user",
            userName: "You",
            rating: rating,
            comment: "",
            date: new Date().toISOString(),
        };
        savedRatings.push(newRating);
        localStorage.setItem(
            `vendor_${vendorId}_ratings`,
            JSON.stringify(savedRatings)
        );
        setShowRatingModal(false);
        setHoveredStar(0);
        alert(`Rating ${rating} stars submitted!`);
    };

    const handleBookService = (serviceId) => {
        // Navigate to request service page with pre-filled service
        navigate(`/user/request-service?service=${serviceId}&vendor=${vendorId}`);
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <span
                key={i}
                className={`text-lg ${
                    i < rating ? "text-yellow-500" : "text-gray-300"
                }`}
            >
                <IoStar />
            </span>
        ));
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-4 text-gray-600 hover:text-[#0A84FF] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* Vendor Profile Header - Similar to UserProfile */}
            <div className="flex flex-col items-center gap-6 text-center mb-8">
                {/* Profile Image */}
                <div className="relative">
                    <div
                        className="h-32 w-32 rounded-full bg-slate-200 bg-cover bg-center bg-no-repeat shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        style={{
                            backgroundImage: `url("${vendorData.image}")`,
                        }}
                    ></div>
                </div>
                {/* Name + Category */}
                <div className="flex flex-col">
                    <p className="text-[22px] font-bold leading-tight text-gray-800">
                        {vendorData.name}
                    </p>
                    <p className="text-base text-gray-500">{vendorData.category}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                            <IoStar className="text-yellow-500 text-base" />
                            <span className="font-bold text-gray-800">
                                {vendorData.rating}
                            </span>
                        </div>
                        <span className="text-gray-400">
                            ({vendorData.reviews} reviews)
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#0A84FF] font-semibold">
                            {vendorData.distance}
                        </span>
                    </div>
                </div>
            </div>

            {/* Vendor Information Card - Similar to UserProfile */}
            <div className="w-full rounded-lg bg-white p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                <div className="flex flex-col space-y-6">
                    {/* Phone */}
                    <InfoRow
                        icon="phone"
                        label="Phone Number"
                        value={vendorData.phone}
                    />
                    {/* Address */}
                    <InfoRow
                        icon="home"
                        label="Address"
                        value={vendorData.address}
                    />
                </div>
            </div>

            {/* Services Section */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Services Offered
                </h2>
                <div className="space-y-4">
                    {vendorData.services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {service.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Duration: {service.duration}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-[#0A84FF] mb-2">
                                        ₹{service.price}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Book Vendor Button */}
            <button
                onClick={() => navigate(`/user/request-service?vendor=${vendorId}`)}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-[#0A84FF] text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02] mb-6"
            >
                Book Vendor
            </button>

            {/* Ratings Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Ratings & Reviews
                    </h2>
                    {!userRating && (
                        <button
                            onClick={() => setShowRatingModal(true)}
                            className="text-sm text-[#0A84FF] font-semibold hover:underline"
                        >
                            Rate Vendor
                        </button>
                    )}
                </div>

                {/* User Rating (if given) */}
                {userRating && (
                    <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">
                                    Your Rating
                                </p>
                                <div className="flex items-center gap-1">
                                    {renderStars(userRating)}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRatingModal(true)}
                                className="text-sm text-[#0A84FF] font-semibold hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                )}

                {/* All Ratings */}
                <div className="space-y-3">
                    {vendorData.allRatings.map((rating) => (
                        <div
                            key={rating.id}
                            className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {rating.userName}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {renderStars(rating.rating)}
                                    </div>
                                </div>
                            </div>
                            {rating.comment && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {rating.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Rating Modal */}
            {showRatingModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => {
                        setShowRatingModal(false);
                        setHoveredStar(0);
                    }}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-md p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            Rate {vendorData.name}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => handleRatingClick(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    className="text-4xl transition-colors"
                                >
                                    {star <= hoveredStar ? (
                                        <IoStar className="text-yellow-500" />
                                    ) : (
                                        <IoStarOutline className="text-gray-300" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowRatingModal(false);
                                setHoveredStar(0);
                            }}
                            className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-[10px] hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
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
    const getIcon = () => {
        switch (icon) {
            case "phone":
                return <IoCallOutline className="text-2xl text-[#0A84FF]" />;
            case "home":
                return <IoLocationOutline className="text-2xl text-[#0A84FF]" />;
            default:
                return <IoCallOutline className="text-2xl text-[#0A84FF]" />;
        }
    };

    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] bg-opacity-10">
                {getIcon()}
            </div>
            <div className="flex flex-col flex-1">
                <span className="text-xs text-gray-500 mb-1">{label}</span>
                <span className="text-base font-medium text-gray-800">
                    {value}
                </span>
            </div>
        </div>
    );
}

