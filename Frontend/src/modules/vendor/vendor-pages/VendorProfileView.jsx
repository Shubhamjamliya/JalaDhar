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
    IoChevronUpOutline,
    IoSchoolOutline,
    IoHardwareChipOutline,
    IoShieldCheckmarkOutline
} from "react-icons/io5";

import {
    formatWorkingDays,
    formatWorkingHours
} from "../../../utils/availabilityUtils";
import GroundwaterSurveyFAQSection from "../vendor-components/GroundwaterSurveyFAQSection";

export default function VendorProfileView({ vendor, profileData, stats }) {
    const [isCertificationsOpen, setIsCertificationsOpen] = useState(false);
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);

    const renderBadge = (verified, text) => (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-slate-50 text-slate-500 border border-slate-200/80'
        }`}>
            <IoCheckmarkCircleOutline className={verified ? 'text-emerald-600 text-sm' : 'text-slate-400 text-sm'} />
            <span>{text}</span>
        </div>
    );

    return (
        <div className="space-y-3.5 mt-3.5">
            {/* Grid 1: Basic Information & Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100/90 space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0A84FF] flex items-center justify-center font-bold text-sm shrink-0">
                            <IoPersonOutline />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Basic Information</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Personal background &amp; language skills</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Qualification</span>
                            <span className="font-bold text-slate-900">
                                {profileData.educationalQualifications?.[0]?.degree || "Not Specified"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Experience (Years)</span>
                            <span className="font-bold text-slate-900">{profileData.experience || 0}+ Years</span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100/70 space-y-1">
                            <span className="font-medium text-slate-500 block">Languages Spoken</span>
                            <div className="flex flex-wrap gap-1">
                                {(vendor?.languages?.length ? vendor.languages : ["English", "Hindi", "Telugu"]).map((lang, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-[10px]">
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100/90 space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                            <IoBriefcaseOutline />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Professional Details</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Field role and geographic scope</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Designation / Role</span>
                            <span className="font-bold text-slate-900">Groundwater Survey Expert</span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100/70 space-y-1">
                            <span className="font-medium text-slate-500 block">Service Area & Radius</span>
                            <span className="font-bold text-slate-900 block truncate">
                                {vendor?.serviceAreas?.length > 0
                                    ? vendor.serviceAreas.join(', ')
                                    : (vendor?.district && vendor?.state ? `${vendor.district}, ${vendor.state}` : "Local & Surrounding Regions")}
                                {vendor?.serviceRadius && ` (${vendor.serviceRadius})`}
                            </span>
                        </div>

                        {vendor?.willingToTravel && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                                <span className="font-medium text-slate-500">Travel Flexibility</span>
                                <span className="font-bold text-slate-900">
                                    {vendor.willingToTravel === 'Yes'
                                        ? `Yes (${vendor.modeOfTravel?.length > 0 ? vendor.modeOfTravel.join(', ') : 'All Modes'})`
                                        : 'No'}
                                    {vendor.willingToTravel === 'Yes' && vendor.travelChargesPerKm > 0 && ` • ₹${vendor.travelChargesPerKm}/km`}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Avg. Response SLA</span>
                            <span className="font-bold text-emerald-600">⚡ Within 30 Minutes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid 2: Service Information & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Service Information */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100/90 space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                            <IoBusinessOutline />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Service Information</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Pricing, survey scope &amp; equipment</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Base Survey Fee</span>
                            <span className="font-black text-[#0A84FF] text-xs">₹{profileData.servicePrice || 1500}</span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100/70 space-y-1">
                            <span className="font-medium text-slate-500 block">Available Survey Categories</span>
                            <div className="flex flex-wrap gap-1">
                                {(vendor?.availableServices?.length ? vendor.availableServices : ['Agricultural Survey', 'Domestic Survey', 'Industrial Survey', 'Commercial Survey']).map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700">{s}</span>
                                ))}
                            </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100/70 space-y-1">
                            <span className="font-medium text-slate-500 block">Geophysical Instruments Used</span>
                            <div className="flex flex-wrap gap-1">
                                {vendor?.instruments?.map((inst, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-[#0A84FF] border border-blue-100 rounded-md text-[10px] font-bold">{inst.name}</span>
                                ))}
                                {(!vendor?.instruments || vendor.instruments.length === 0) && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-[#0A84FF] border border-blue-100 rounded-md text-[10px] font-bold">ADMT 300HT3 VES Meter</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Availability & Bio */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100/90 space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                            <IoTimeOutline />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Availability &amp; Bio</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Working schedule and expert profile</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                            <span className="font-medium text-emerald-900">Availability Status</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Available for Booking
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Working Days</span>
                            <span className="font-bold text-slate-900">{formatWorkingDays(vendor?.workingDays)}</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100/70">
                            <span className="font-medium text-slate-500">Working Hours</span>
                            <span className="font-bold text-slate-900">{formatWorkingHours(vendor?.workingHours)}</span>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/70 space-y-0.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">About the Expert</h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                            {vendor?.aboutExpert || profileData.aboutExpert || `Professional groundwater survey expert with over ${profileData.experience || 5} years of field experience.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Collapsible Sections: Certifications & Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Certifications Card */}
                <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100/90">
                    <div 
                        className="flex justify-between items-center cursor-pointer select-none"
                        onClick={() => setIsCertificationsOpen(!isCertificationsOpen)}
                    >
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <IoDocumentTextOutline className="text-[#0A84FF]" />
                            <span>Certifications &amp; Licenses</span>
                        </h3>
                        <div className="text-slate-400 p-1 rounded-lg bg-slate-50">
                            {isCertificationsOpen ? <IoChevronUpOutline className="text-xs" /> : <IoChevronDownOutline className="text-xs" />}
                        </div>
                    </div>

                    {isCertificationsOpen && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            {renderBadge(true, "Certified Hydrogeologist License")}
                            {renderBadge(true, "VES Instrument Calibration Certificate")}
                            {renderBadge(vendor?.isApproved, "Jaladhaara Platform Verified Partner")}
                        </div>
                    )}
                </div>

                {/* Safety Standards Card */}
                <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100/90">
                    <div 
                        className="flex justify-between items-center cursor-pointer select-none"
                        onClick={() => setIsSafetyOpen(!isSafetyOpen)}
                    >
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <IoShieldCheckmarkOutline className="text-emerald-600" />
                            <span>Safety &amp; Compliance Standards</span>
                        </h3>
                        <div className="text-slate-400 p-1 rounded-lg bg-slate-50">
                            {isSafetyOpen ? <IoChevronUpOutline className="text-xs" /> : <IoChevronDownOutline className="text-xs" />}
                        </div>
                    </div>

                    {isSafetyOpen && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            {renderBadge(true, "Field Safety Protocol Compliant")}
                            {renderBadge(true, "Dispute & Insurance SLA Protected")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
