import React from "react";
import {
  IoStar,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoBriefcaseOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoTrendingUpOutline,
  IoRibbonOutline
} from "react-icons/io5";

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

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all duration-300"
    >
      {/* Top Section: Avatar, Verified Badge, Name & Base Price */}
      <div className="flex items-start gap-4 mb-4">
        {/* Profile Avatar */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shadow-inner">
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
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-sm" title="Verified Hydrogeologist Expert">
            <IoShieldCheckmarkOutline className="text-xs" />
          </div>
        </div>

        {/* Name, Designation & Rating */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {expert.name || "Expert Hydrogeologist"}
            </h3>
            {expert.distance !== null && expert.distance !== undefined && !isNaN(expert.distance) && (
              <span className="shrink-0 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {expert.distance.toFixed(1)} km away
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
            <IoBriefcaseOutline className="text-blue-500" />
            <span>{expert.designation || expert.category || "Groundwater Specialist"}</span>
          </p>

          {/* Average Rating */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200/60">
              <IoStar className="text-yellow-500 text-sm" />
              <span className="font-bold text-gray-800">{averageRating}</span>
            </div>
            <span className="text-gray-400 font-medium">
              ({totalRatings} {totalRatings === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      {/* Grid Section: 4 Key Dynamic Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
        {/* Metric 1: Experience */}
        <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1 text-blue-600 mb-0.5">
            <IoRibbonOutline className="text-xs" />
            <span className="text-xs font-bold">{experienceYears > 0 ? `${experienceYears}Y` : "New"}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Experience</span>
        </div>

        {/* Metric 2: Success Rate */}
        <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
            <IoTrendingUpOutline className="text-xs" />
            <span className="text-xs font-bold">{successRateText}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Success %</span>
        </div>

        {/* Metric 3: Successful Surveys */}
        <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
            <IoCheckmarkCircle className="text-xs text-emerald-500" />
            <span className="text-xs font-bold">{successfulSurveys}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Successful</span>
        </div>

        {/* Metric 4: Failed Surveys */}
        <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-1 text-rose-600 mb-0.5">
            <IoCloseCircle className="text-xs text-rose-500" />
            <span className="text-xs font-bold">{failedSurveys}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Failed</span>
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="mb-4">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1.5">
          <IoLocationOutline className="text-blue-500" />
          <span>Service Areas:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {serviceAreas.map((area, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium text-gray-700 bg-gray-100/80 px-2.5 py-0.5 rounded-full border border-gray-200/50"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Section: Price & Select Expert Button */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-gray-400 block font-medium">Survey Base Fee</span>
          <span className="text-lg font-extrabold text-gray-900">
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
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all flex items-center gap-1.5"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpertProfileCard;
