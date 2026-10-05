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
import { formatWorkingDays, formatWorkingHours, getExpertLiveStatus } from "../../../utils/availabilityUtils";

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

  const liveStatus = getExpertLiveStatus(expert);

  // Extract dynamic values with fallback handling
  const experienceYears = typeof expert.experience === "number" ? expert.experience : 0;

  const successfulSurveys = typeof expert.successfulSurveys === "number"
    ? expert.successfulSurveys
    : (typeof expert.surveysCompleted === "number"
        ? expert.surveysCompleted
        : (typeof expert.successCount === "number" ? expert.successCount : 0));

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
  } else if (successfulSurveys > 0 && failedSurveys === 0) {
    successRate = 100;
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

  const price = expert.servicePrice || expert.minPrice || selectedService?.price || 3500;
  const expertId = expert.expertId || (expert._id ? `EXP-${expert._id.toString().slice(-6).toUpperCase()}` : null);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white p-3.5 sm:p-4 shadow-xs border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all duration-200"
    >
      {/* Top Section: Avatar, Name, Live Status, Distance & Rating */}
      <div className="flex items-start gap-3 mb-2.5">
        {/* Profile Avatar */}
        <div className="relative shrink-0">
          <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shadow-inner">
            {expert.profilePicture ? (
              <img
                src={expert.profilePicture}
                alt={expert.name || "Expert Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">👨‍🔧</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#0A84FF] text-white p-0.5 rounded-full shadow-xs border border-white" title="Verified Hydrogeologist Expert">
            <IoShieldCheckmarkOutline className="text-[10px]" />
          </div>
        </div>

        {/* Name, Designation, Rating & Distance */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight group-hover:text-[#0A84FF] transition-colors truncate">
                {expert.name || "Expert Hydrogeologist"}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 font-medium truncate">
                <span className="truncate">{expert.designation || expert.category || "Groundwater Specialist"}</span>
                {expertId && (
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/60 shrink-0">
                    {expertId}
                  </span>
                )}
              </div>
            </div>

            {expert.distance !== null && expert.distance !== undefined && !isNaN(expert.distance) && (
              <span className="shrink-0 text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {expert.distance.toFixed(1)} km
              </span>
            )}
          </div>

          {/* Status + Rating row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                liveStatus.status === 'ONLINE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : liveStatus.status === 'PAUSED'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveStatus.status === 'ONLINE'
                    ? 'bg-emerald-500 animate-pulse'
                    : liveStatus.status === 'PAUSED'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>{liveStatus.shortLabel || liveStatus.label}</span>
            </span>

            <div className="flex items-center gap-1 text-[11px]">
              <IoStar className="text-amber-500 text-xs" />
              <span className="font-extrabold text-gray-800">{averageRating}</span>
              <span className="text-gray-400 text-[10px]">({totalRatings})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section: 4 Key Dynamic Metrics in a slim bar */}
      <div className="grid grid-cols-4 gap-1 mb-2 py-1.5 px-2 bg-gray-50/80 rounded-xl border border-gray-100/80 text-center">
        <div>
          <div className="text-xs font-black text-gray-900 leading-tight">
            {experienceYears > 0 ? `${experienceYears}Y` : "New"}
          </div>
          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Exp</div>
        </div>

        <div className="border-l border-gray-200/60">
          <div className="text-xs font-black text-emerald-600 leading-tight">
            {successRateText}
          </div>
          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Success</div>
        </div>

        <div className="border-l border-gray-200/60">
          <div className="text-xs font-black text-emerald-600 leading-tight">
            {successfulSurveys}
          </div>
          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Passed</div>
        </div>

        <div className="border-l border-gray-200/60">
          <div className="text-xs font-black text-rose-500 leading-tight">
            {failedSurveys}
          </div>
          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Failed</div>
        </div>
      </div>

      {/* Availability Schedule & Service Area Section */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5 px-2 py-1 bg-emerald-50/60 rounded-lg border border-emerald-100/70 text-[10px] text-gray-600">
        <div className="flex items-center gap-1 truncate text-emerald-800 font-semibold">
          <IoCalendarOutline className="text-emerald-600 shrink-0 text-xs" />
          <span className="truncate">{formatWorkingDays(expert.workingDays)} • {formatWorkingHours(expert.workingHours)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-gray-500 font-medium">
          <IoLocationOutline className="text-[#0A84FF] text-xs shrink-0" />
          <span className="truncate max-w-[120px]">{serviceAreas[0]}</span>
        </div>
      </div>

      {/* Bottom Action Section: Price & Select Expert Button */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[9px] text-gray-400 block font-medium leading-none mb-0.5">Survey Base Fee</span>
          <span className="text-base sm:text-lg font-black text-gray-900 leading-tight">
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
            className="px-3.5 py-1.5 bg-[#0A84FF] hover:bg-[#0070DF] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-200 transition-all flex items-center gap-1 shrink-0"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpertProfileCard;
