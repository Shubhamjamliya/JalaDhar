import React, { useState } from 'react';
import {
    IoPersonOutline,
    IoCallOutline,
    IoLocationOutline,
    IoCheckmarkCircleOutline,
    IoDocumentTextOutline,
    IoStar,
    IoStarOutline,
    IoTimeOutline,
    IoWalletOutline,
    IoBriefcaseOutline,
    IoLanguageOutline,
    IoInformationCircleOutline,
    IoBusinessOutline,
    IoCalendarOutline,
    IoChevronDownOutline,
    IoChevronUpOutline
} from "react-icons/io5";

export default function VendorProfileView({ vendor, profileData, stats }) {
    const [isCertificationsOpen, setIsCertificationsOpen] = useState(false);
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);

    const formatWorkingDays = (days) => {
        if (!days) return "Monday - Saturday";
        if (Array.isArray(days)) {
            if (days.length === 7) return "Everyday";
            return days.join(', ');
        }
        return days;
    };

    const formatWorkingHours = (hours) => {
        if (!hours) return "08:00 AM - 07:00 PM";
        if (typeof hours === 'object' && hours.start && hours.end) {
            const formatTime = (time) => {
                const [h, m] = time.split(':');
                let hr = parseInt(h);
                const ampm = hr >= 12 ? 'PM' : 'AM';
                hr = hr % 12 || 12;
                return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
            };
            return `${formatTime(hours.start)} - ${formatTime(hours.end)}`;
        }
        return hours;
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <span key={index}>
                {index < Math.floor(rating) ? (
                    <IoStar className="text-yellow-400 text-lg" />
                ) : (
                    <IoStarOutline className="text-gray-300 text-lg" />
                )}
            </span>
        ));
    };

    const renderBadge = (verified, text) => (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${verified ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
            <IoCheckmarkCircleOutline className={verified ? 'text-green-500 text-lg' : 'text-gray-400 text-lg'} />
            {text}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Basic Information & Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <IoPersonOutline className="text-blue-500" /> Basic Information
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Qualification</span>
                            <span className="font-semibold text-gray-900">
                                {profileData.educationalQualifications?.[0]?.degree || "Not Specified"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Experience (Years)</span>
                            <span className="font-semibold text-gray-900">{profileData.experience || 0}+ Years</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Languages Spoken</span>
                            <span className="font-semibold text-gray-900">
                                {vendor?.languages?.length ? vendor.languages.join(', ') : "English, Hindi, Telugu"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <IoBriefcaseOutline className="text-purple-500" /> Professional Details
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Title</span>
                            <span className="font-semibold text-gray-900">Groundwater Survey Expert</span>
                        </div>
                        <div className="flex flex-col border-b border-gray-50 pb-2 gap-1">
                            <span className="text-gray-500">Service Area / States Covered</span>
                            <span className="font-semibold text-gray-900">
                                {vendor?.serviceAreas?.length > 0 ? vendor.serviceAreas.join(', ') : "Local Region"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Average Response Time</span>
                            <span className="font-semibold text-gray-900">30 Minutes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Information & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <IoBusinessOutline className="text-orange-500" /> Service Information
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Survey Base Fee</span>
                            <span className="font-semibold text-gray-900">₹{profileData.servicePrice || 1500}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Travel Charges Policy</span>
                            <span className="font-semibold text-gray-900">{vendor?.travelChargesPolicy || "Standard transport rates apply"}</span>
                        </div>
                        <div className="flex flex-col border-b border-gray-50 pb-2 gap-2">
                            <span className="text-gray-500">Available Services</span>
                            <div className="flex flex-wrap gap-2">
                                {(vendor?.availableServices?.length ? vendor.availableServices : ['Agricultural Survey', 'Domestic Survey', 'Industrial Survey', 'Commercial Survey']).map((s, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-semibold text-gray-700">{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col pt-2 gap-2">
                            <span className="text-gray-500">Survey Methods / Instruments</span>
                            <div className="flex flex-wrap gap-2">
                                {vendor?.instruments?.map((inst, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">{inst.name}</span>
                                ))}
                                {(!vendor?.instruments || vendor.instruments.length === 0) && (
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">ADMT 300HT3</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <IoTimeOutline className="text-emerald-500" /> Availability
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Status</span>
                                <span className="font-bold text-green-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Available
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Working Days</span>
                                <span className="font-semibold text-gray-900">{formatWorkingDays(vendor?.workingDays)}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-gray-500">Working Hours</span>
                                <span className="font-semibold text-gray-900">{formatWorkingHours(vendor?.workingHours)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <IoInformationCircleOutline className="text-cyan-500" /> About the Expert
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                            {vendor?.aboutExpert || `Professional groundwater survey expert with over ${profileData.experience || 5} years of field experience in groundwater exploration. Uses advanced geoscientific instruments and geological interpretation to identify potential groundwater zones.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance, Certifications & Trust */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300">
                    <div 
                        className="flex justify-between items-center cursor-pointer group"
                        onClick={() => setIsCertificationsOpen(!isCertificationsOpen)}
                    >
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <IoDocumentTextOutline className="text-red-500" /> Certifications
                        </h3>
                        <div className="text-gray-400 group-hover:text-blue-500 transition-colors bg-gray-50 rounded-full p-1.5 group-hover:bg-blue-50">
                            {isCertificationsOpen ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
                        </div>
                    </div>
                    
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCertificationsOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                        <div className="space-y-3">
                            {renderBadge(true, "Qualification Certificates")}
                            {renderBadge(vendor?.isApproved, "Government Registration")}
                            {renderBadge(true, "Training Certificates")}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300">
                    <div 
                        className="flex justify-between items-center cursor-pointer group"
                        onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                    >
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <IoCheckmarkCircleOutline className="text-teal-500" /> Safety & Trust
                        </h3>
                        <div className="text-gray-400 group-hover:text-blue-500 transition-colors bg-gray-50 rounded-full p-1.5 group-hover:bg-blue-50">
                            {isSafetyOpen ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
                        </div>
                    </div>
                    
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSafetyOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                        <div className="space-y-3">
                            {renderBadge(vendor?.isApproved, "Aadhaar Verified")}
                            {renderBadge(vendor?.isApproved, "PAN Verified")}
                            {renderBadge(vendor?.isApproved, "Bank Verified")}
                            {renderBadge(vendor?.isActive, "Insured Expert")}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <IoStar className="text-yellow-500" /> Customer Reviews
                    </h3>
                    <div className="flex flex-col items-center justify-center flex-1 bg-yellow-50/50 rounded-xl border border-yellow-100 p-4">
                        <p className="text-3xl font-black text-gray-900 mb-2">{stats.averageRating.toFixed(1)}</p>
                        <div className="flex gap-1 mb-2">
                            {renderStars(stats.averageRating)}
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stats.totalRatings} Reviews</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
