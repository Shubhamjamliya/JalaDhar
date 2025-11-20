import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoStar,
    IoChevronDownOutline,
} from "react-icons/io5";

export default function UserServiceProvider() {
    const navigate = useNavigate();
    const [selectedFilter, setSelectedFilter] = useState("Price");

    const vendors = [
        {
            id: 1,
            name: "AquaFix Plumbing",
            rating: 4.8,
            services: ["Tank Cleaning", "Pipe Repair"],
            price: 50,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBFsVoahTfvkzJLjMrUg2_ewJybuFfZDHviOxHBMo0j_iwdNYmcxJgXdcQutFKCVAngOF23BHMHszB2ESE576PA88h6LyoE50joA_BH4NiYybWZBU2r6JNbXwRRgeWjhbOnyHLLdchOO5Ev8sU0Ul32nWe8MZWj9dJ8sJLV3lG5BJDK5VrsqxVCVj3ujigkdmzT32bWS_wAV2JNPH22tS-K9aiHjB8A_kIQXSzc29su8illJ-JvBkMF_w5N7taB9vhkhFD7bChLELD4",
        },
        {
            id: 2,
            name: "PureFlow Systems",
            rating: 4.9,
            services: ["Water Purification", "Tank Cleaning"],
            price: 75,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCd4RAvRaJsbYSUyfoS4fwssj9zgcp7Y8hVWP4dMart8y6LHd3LOobWc_DJCoABTpLXFycKRHE7HmdR9MWaOPvsnfFQklWSlX-tJW_WL-UDMmJ_IhX54kooCpT3qB82VuUk_BR8gYaLMuhh0Ii8lke0ng2tH2cto1b05Co7nhbLwS1z25RIglCINuaH8cLs23BDqiEtLxmRVDCH2_07YK6aij1rdqQ283U8bWguj6e5Fum9Na0z5NGZReHqqmPCmZg_pVEGk9UwONNK",
        },
        {
            id: 3,
            name: "Clear Tank Co.",
            rating: 5.0,
            services: ["Tank Cleaning", "Water Testing"],
            price: 60,
            image:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAKw8TD27NpUPP9fG39USVkTsLRqGtYydXMyri5be9HnUSIKXVIoovkIdkep2dDPu-jZCqKsadhh_EPaUi5n72rnW9fAWoeyvWWlocav2Brr321489R9QkJtGMsSl9ZMD6-szaHN-MlqhqEzaJGZecFkMINWVlNjFjh0pPoQ2yhGNGxlXNPWp8FAktY1PIg9srJdfos2U62f1PHplKkFSPehU_ymJGTLWcRJpe9M-SQuoCiWGwYSZ8mmI7CejZP2FYiF-5thU1ZicBB",
        },
    ];

    const filters = [
        { id: "service", label: "Service type" },
        { id: "price", label: "Price" },
        { id: "rating", label: "Rating" },
        { id: "distance", label: "Distance" },
    ];

    const handleFilterClick = (filterId) => {
        setSelectedFilter(filterId);
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const stars = [];

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <IoStar
                        key={i}
                        className="text-base text-yellow-500"
                    />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <IoStar
                        key={i}
                        className="text-base text-yellow-500"
                    />
                );
            } else {
                stars.push(
                    <IoStar
                        key={i}
                        className="text-base text-gray-300"
                    />
                );
            }
        }
        return stars;
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Filter Bar */}
            <div className="flex gap-2 pb-4 overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => handleFilterClick(filter.id)}
                        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-colors ${
                            selectedFilter === filter.id
                                ? "bg-[#0A84FF] text-white"
                                : "bg-white text-gray-800"
                        }`}
                    >
                        <p className="text-sm font-medium">{filter.label}</p>
                        <IoChevronDownOutline
                            className={`text-xl ${
                                selectedFilter === filter.id
                                    ? "text-white/80"
                                    : "text-gray-600/70"
                            }`}
                        />
                    </button>
                ))}
            </div>

            {/* Vendor List */}
            <div className="flex flex-col gap-4">
                {vendors.map((vendor) => (
                    <div
                        key={vendor.id}
                        className="flex flex-col gap-4 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-shrink-0">
                                <div
                                    className="w-16 h-16 bg-center bg-no-repeat bg-cover rounded-[10px]"
                                    style={{
                                        backgroundImage: `url("${vendor.image}")`,
                                    }}
                                ></div>
                            </div>
                            <div className="flex flex-1 flex-col gap-1">
                                <p className="text-base font-bold text-gray-800">
                                    {vendor.name}
                                </p>
                                <div className="flex items-center gap-1 text-yellow-500">
                                    {renderStars(vendor.rating)}
                                    <span className="text-gray-500 text-xs ml-1">
                                        ({vendor.rating})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Service Tags */}
                        <div className="flex flex-wrap gap-2">
                            {vendor.services.map((service, index) => (
                                <span
                                    key={index}
                                    className="text-xs font-medium text-[#0A84FF] bg-[#E7F0FB] px-3 py-1 rounded-full"
                                >
                                    {service}
                                </span>
                            ))}
                        </div>

                        {/* Price and Button */}
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">
                                Starts from:{" "}
                                <span className="font-bold text-gray-800">
                                    ₹{vendor.price}
                                </span>
                            </p>
                            <button
                                onClick={() => navigate(`/user/vendor/${vendor.id}`)}
                                className="flex min-w-[84px] items-center justify-center rounded-full h-10 px-5 bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#005BBB] transition-colors"
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }
  