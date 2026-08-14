import React from "react";
import {
  IoStar,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoBriefcaseOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoTrendingUpOutline,
  IoRibbonOutline,
  IoCalendarOutline,
  IoTimeOutline
} from "react-icons/io5";
import { formatWorkingDays, formatWorkingHours } from "../../../utils/availabilityUtils";

/**
 * ExpertProfileCard
 * Enhanced detailed profile card for groundwater survey experts/vendors.
 * Dynamic attributes shown:
 * 1. Experience
 * 2. Success Rate (%)
 * 3. Successful Surveys
 * 4. Failed Surveys
 * 5. Service Areas
 * 6. Average Rating
 * 7. Availability Schedule (Working Days & Hours)
 */
const ExpertProfileCard = ({ expert, selectedService, onSelect, actionLabel = "Select Expert" }) => {
  if (!expert) return null;

  // Extract dynamic values with fallback handling
  const experienceYears = typeof expert.experience === "number" ? expert.experience : 0;

  const successfulSurveys = typeof expert.successfulSurveys === "number"
    ? expert.successfulSurveys
    : (typeof expert.successCount === "number" ? expert.successCount : 0);

  const failedSurveys = typeof expert.failedSurveys === "number"
    ? expert.failedSurveys
    : (typeof expert.failureCount === "number" ? expert.failureCount : 0);

  const totalSurveys = successfulSurveys + failedSurveys;

  // Calculate success rate dynamically if provided or derived
  let successRate = null;
  if (typeof expert.successRate === "number") {
    successRate = expert.successRate;
  } else if (typeof expert.successRatio === "number" && expert.successRatio > 0) {
    successRate = expert.successRatio;
  } else if (totalSurveys > 0) {
    successRate = Math.round((successfulSurveys / totalSurveys) * 100);
  }

  const successRateText = successRate !== null && totalSurveys > 0 ? `${successRate}%` : "N/A";

  const averageRating = typeof expert.averageRating === "number" && expert.averageRating > 0
    ? expert.averageRating.toFixed(1)
    : "New";

  const totalRatings = typeof expert.totalRatings === "number" ? expert.totalRatings : 0;

  // Service Areas fallback handling
  const serviceAreas = Array.isArray(expert.serviceAreas) && expert.serviceAreas.length > 0
    ? expert.serviceAreas
    : (expert.address?.city ? [expert.address.city, expert.address.state].filter(Boolean) : ["Local Region"]);

  const price = selectedService?.price || expert.minPrice || expert.servicePrice;
  const expertId = expert.expertId || (expert._id ? `EXP-${expert._id.toString().slice(-6).toUpperCase()}` : null);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white p-4.5 sm:p-5 shadow-sm border border-gray-100/90 hover:border-blue-400 hover:shadow-md transition-all duration-300"
    >
      {/* Top Section: Avatar, Verified Badge, Name & Base Price */}
      <div className="flex items-start gap-3.5 mb-3.5">
        {/* Profile Avatar */}
        <div className="relative shrink-0">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shadow-inner">
            {expert.profilePicture ? (
              <img
                src={expert.profilePicture}
                alt={expert.name || "Expert Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl">👨‍🔧</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#0A84FF] text-white p-1 rounded-full shadow-xs border-2 border-white" title="Verified Hydrogeologist Expert">
            <IoShieldCheckmarkOutline className="text-xs" />
          </div>
        </div>

        {/* Name, Designation & Rating Header Block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug group-hover:text-[#0A84FF] transition-colors truncate">
                {expert.name || "Expert Hydrogeologist"}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                  <IoBriefcaseOutline className="text-[#0A84FF]" />
                  <span>{expert.designation || expert.category || "Groundwater Specialist"}</span>
                </p>
                {expertId && (
                  <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    ID: {expertId}
                  </span>
                )}
              </div>
            </div>

            {expert.distance !== null && expert.distance !== undefined && !isNaN(expert.distance) && (
              <span className="shrink-0 text-[11px] font-bold text-[#0A84FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 shadow-2xs">
                {expert.distance.toFixed(1)} km away
              </span>
            )}
          </div>

          {/* Average Rating */}
          <div className="flex items-center gap-1.5 text-xs mt-1.5">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <IoStar className="text-amber-500 text-sm" />
              <span className="font-extrabold text-gray-900">{averageRating}</span>
            </div>
            <span className="text-gray-400 font-semibold text-[11px]">
              ({totalRatings} {totalRatings === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      {/* Grid Section: 4 Key Dynamic Metrics */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3.5 p-2.5 bg-gray-50/80 rounded-2xl border border-gray-100/90">
        {/* Metric 1: Experience */}
        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-gray-100/80 shadow-2xs">
          <div className="flex items-center gap-1 text-[#0A84FF] mb-0.5">
            <IoRibbonOutline className="text-xs" />
            <span className="text-xs font-black">{experienceYears > 0 ? `${experienceYears}Y` : "New"}</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight text-center">Experience</span>
        </div>

        {/* Metric 2: Success Rate */}
        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-gray-100/80 shadow-2xs">
          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
            <IoTrendingUpOutline className="text-xs" />
            <span className="text-xs font-black">{successRateText}</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight text-center">Success %</span>
        </div>

        {/* Metric 3: Successful Surveys */}
        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-gray-100/80 shadow-2xs">
          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
            <IoCheckmarkCircle className="text-xs text-emerald-500" />
            <span className="text-xs font-black">{successfulSurveys}</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight text-center">Successful</span>
        </div>

        {/* Metric 4: Failed Surveys */}
        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-gray-100/80 shadow-2xs">
          <div className="flex items-center gap-1 text-rose-600 mb-0.5">
            <IoCloseCircle className="text-xs text-rose-500" />
            <span className="text-xs font-black">{failedSurveys}</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight text-center">Failed</span>
        </div>
      </div>

      {/* Availability Schedule Section */}
      <div className="mb-3 p-2 bg-emerald-50/70 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900 truncate">
          <IoCalendarOutline className="text-emerald-600 shrink-0 text-xs" />
          <span className="truncate">{formatWorkingDays(expert.workingDays)}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-800 font-semibold shrink-0 bg-white px-2 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs">
          <IoTimeOutline className="text-emerald-600 text-xs" />
          <span>{formatWorkingHours(expert.workingHours)}</span>
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="mb-3.5">
        <div className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-1.5">
          <IoLocationOutline className="text-[#0A84FF]" />
          <span>Service Areas:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {serviceAreas.map((area, idx) => (
            <span
              key={idx}
              className="text-[11px] font-bold text-gray-700 bg-gray-100/90 px-2.5 py-0.5 rounded-full border border-gray-200/60"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Section: Price & Select Expert Button */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-gray-400 block font-semibold">Survey Base Fee</span>
          <span className="text-lg sm:text-xl font-black text-gray-900">
            ₹{price ? price.toLocaleString() : "N/A"}
          </span>
        </div>

        {onSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(expert);
            }}
            className="px-4.5 py-2.5 bg-[#0A84FF] hover:bg-[#0070DF] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all flex items-center gap-1.5"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpertProfileCard;
