import { useState, useEffect, useMemo, useRef } from "react";
import {
    IoCalendarOutline,
    IoTimeOutline,
    IoPersonOutline,
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoCloseOutline,
    IoSunnyOutline,
    IoPartlySunnyOutline,
    IoMoonOutline,
    IoInformationCircleOutline,
    IoShieldCheckmarkOutline,
    IoChevronDownOutline,
    IoSparklesOutline
} from "react-icons/io5";
import {
    isExpertAvailableOnDate,
    getNextAvailableDates,
    formatWorkingDays,
    normalizeWorkingDays
} from "../../../utils/availabilityUtils";

/**
 * RescheduleModal Component
 * Ultra-modern, responsive modal for rescheduling groundwater survey appointments.
 * Enforces expert working day availability guardrails, custom dropdown, and DD/MM/YYYY date formatting.
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Closes the modal
 * @param {function} onReschedule - Callback receiving { scheduledDate, scheduledTime, reason }
 * @param {object} currentBooking - Current booking details
 * @param {boolean} isLoading - Loading state during submission
 */
export default function RescheduleModal({
    isOpen,
    onClose,
    onReschedule,
    currentBooking,
    isLoading = false
}) {
    const rescheduleCount = currentBooking?.rescheduleCount || 0;
    const reschedulesRemaining = Math.max(0, 2 - rescheduleCount);
    const expert = currentBooking?.vendor;

    const expertScheduleText = useMemo(() => {
        return formatWorkingDays(expert?.workingDays);
    }, [expert?.workingDays]);

    const getMaxDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    };

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("09:00 AM - 11:00 AM");
    const [reasonCategory, setReasonCategory] = useState("Personal / Family emergency");
    const [customReason, setCustomReason] = useState("");
    const [formError, setFormError] = useState("");
    const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
    
    const dateInputRef = useRef(null);
    const reasonDropdownRef = useRef(null);
    const prevIsOpenRef = useRef(false);

    // Format YYYY-MM-DD to DD/MM/YYYY
    const formatToDDMMYYYY = (isoDate) => {
        if (!isoDate) return "";
        const parts = isoDate.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
        }
        return isoDate;
    };

    // Calculate next available working dates for this expert
    const availableQuickDates = useMemo(() => {
        const upcoming = getNextAvailableDates(expert, 4);
        if (upcoming && upcoming.length > 0) {
            return upcoming;
        }

        // Fallback if no specific working days configured
        const fallback = [];
        const today = new Date();
        for (let i = 1; i <= 4; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dateStr = d.toISOString().split("T")[0];
            const shortDay = d.toLocaleDateString("en-IN", { weekday: "short" });
            const dayNum = d.getDate();
            const monthStr = d.toLocaleDateString("en-IN", { month: "short" });
            fallback.push({
                date: dateStr,
                formattedDisplay: i === 1 ? "Tomorrow" : `${shortDay}, ${dayNum} ${monthStr}`
            });
        }
        return fallback;
    }, [expert?.workingDays]);

    // Lock body scroll and set default available date ONLY when modal opens
    useEffect(() => {
        if (isOpen) {
            if (!prevIsOpenRef.current) {
                const upcoming = getNextAvailableDates(expert, 1);
                const firstAvailable = upcoming[0]?.date || (() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    return d.toISOString().split("T")[0];
                })();

                setSelectedDate(firstAvailable);
                setSelectedTimeSlot("09:00 AM - 11:00 AM");
                setReasonCategory("Personal / Family emergency");
                setCustomReason("");
                setFormError("");
                setIsReasonDropdownOpen(false);
            }

            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [isOpen, expert]);

    useEffect(() => {
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

    // Click outside listener to close custom reason dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(event.target)) {
                setIsReasonDropdownOpen(false);
            }
        };

        if (isReasonDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isReasonDropdownOpen]);

    const isCurrentDateAvailable = useMemo(() => {
        if (!selectedDate) return false;
        return isExpertAvailableOnDate(expert, selectedDate);
    }, [expert, selectedDate]);

    const handleDateChange = (newDateVal) => {
        setSelectedDate(newDateVal);
        if (!newDateVal) {
            setFormError("Please select a valid date.");
            return;
        }

        const chosenDate = new Date(newDateVal);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (chosenDate < today) {
            setFormError("Rescheduled date cannot be in the past.");
            return;
        }

        const available = isExpertAvailableOnDate(expert, newDateVal);
        if (!available) {
            let dayName = "that day";
            try {
                const parts = newDateVal.split("-");
                if (parts.length === 3) {
                    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    dayName = d.toLocaleDateString("en-US", { weekday: "long" }) + "s";
                }
            } catch {}
            setFormError(`The assigned expert is not available on ${dayName}. Active schedule: ${expertScheduleText}. Please choose an available working day.`);
        } else {
            setFormError("");
        }
    };

    const formattedSelectedDatePreview = useMemo(() => {
        if (!selectedDate) return "";
        try {
            const parts = selectedDate.split("-");
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                return d.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
            }
        } catch {
            return "";
        }
        return "";
    }, [selectedDate]);

    if (!isOpen) return null;

    const timeSlots = [
        { label: "Morning (08:00 AM - 11:00 AM)", value: "08:00 AM - 11:00 AM", icon: IoSunnyOutline, period: "Morning" },
        { label: "Noon (11:00 AM - 01:00 PM)", value: "11:00 AM - 01:00 PM", icon: IoPartlySunnyOutline, period: "Noon" },
        { label: "Afternoon (02:00 PM - 04:00 PM)", value: "02:00 PM - 04:00 PM", icon: IoPartlySunnyOutline, period: "Afternoon" },
        { label: "Evening (04:00 PM - 06:00 PM)", value: "04:00 PM - 06:00 PM", icon: IoMoonOutline, period: "Evening" },
        { label: "Time TBD by Expert", value: "Time TBD by Expert", icon: IoTimeOutline, period: "Flexible" }
    ];

    const reasonOptions = [
        { label: "Personal / Family emergency", icon: "🚨", desc: "Urgent personal or family matter" },
        { label: "Site / Land preparation pending", icon: "🚜", desc: "Clearing or groundwork not ready" },
        { label: "Unfavourable weather / heavy rains", icon: "🌧️", desc: "Rain, storm or muddy conditions" },
        { label: "Out of town / Travel delay", icon: "✈️", desc: "Customer away from location" },
        { label: "Laborer / Drilling rig availability issue", icon: "👷", desc: "Team or machinery schedule conflict" },
        { label: "Other reason", icon: "📝", desc: "Provide details in note below" }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError("");

        if (!selectedDate) {
            setFormError("Please select a new survey date.");
            return;
        }

        const chosenDate = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (chosenDate < today) {
            setFormError("Rescheduled date cannot be in the past.");
            return;
        }

        if (!isExpertAvailableOnDate(expert, selectedDate)) {
            let dayName = "that day";
            try {
                const parts = selectedDate.split("-");
                if (parts.length === 3) {
                    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    dayName = d.toLocaleDateString("en-US", { weekday: "long" }) + "s";
                }
            } catch {}
            setFormError(`The assigned expert is not available on ${dayName}. Active schedule: ${expertScheduleText}.`);
            return;
        }

        const fullReason = customReason.trim()
            ? `${reasonCategory} - ${customReason.trim()}`
            : reasonCategory;

        onReschedule({
            scheduledDate: selectedDate,
            scheduledTime: selectedTimeSlot,
            reason: fullReason
        });
    };

    const currentExpertName = expert?.name || "Assigned Expert Hydrogeologist";
    const currentFormattedDate = currentBooking?.scheduledDate
        ? new Date(currentBooking.scheduledDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Not Set";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) onClose();
            }}
        >
            <div
                className="bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl max-w-lg w-full mx-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── 1. STICKY MODAL HEADER ── */}
                <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-sky-50/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <IoCalendarOutline className="text-xl sm:text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
                                <span>Reschedule Survey</span>
                                <IoSparklesOutline className="text-amber-500 text-sm hidden sm:inline" />
                            </h3>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                                Shift your groundwater inspection date & slot
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        <IoCloseOutline className="text-lg sm:text-xl" />
                    </button>
                </div>

                {/* ── 2. SCROLLABLE FORM BODY ── */}
                <form id="reschedule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4.5 overscroll-contain">
                    {/* Remaining Reschedules Banner */}
                    <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 shadow-2xs text-xs">
                        <div className="flex items-center gap-2 text-blue-950 font-bold">
                            <div className="w-6 h-6 rounded-full bg-blue-600/10 text-[#0A84FF] flex items-center justify-center shrink-0">
                                <IoInformationCircleOutline className="text-base" />
                            </div>
                            <span>Free Reschedules Remaining:</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#0A84FF] text-white font-black text-[11px] shadow-xs tracking-wide">
                            {reschedulesRemaining} of 2 Left
                        </span>
                    </div>

                    {/* Current Appointment Snapshot & Expert Schedule */}
                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Current Schedule
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                Confirmed
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-0.5">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                <span className="text-slate-500 block text-[10.5px] font-medium">Scheduled Date</span>
                                <strong className="text-slate-900 font-extrabold text-xs mt-0.5 block">{currentFormattedDate}</strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                <span className="text-slate-500 block text-[10.5px] font-medium">Time Window</span>
                                <strong className="text-slate-900 font-extrabold text-xs mt-0.5 block">{currentBooking?.scheduledTime || "TBD"}</strong>
                            </div>
                        </div>

                        {/* Expert Info & Working Days Schedule */}
                        <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-slate-700">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-[#0A84FF] flex items-center justify-center shrink-0 text-xs font-bold">
                                    <IoPersonOutline className="text-xs" />
                                </div>
                                <span className="truncate">
                                    Expert: <strong className="text-slate-900">{currentExpertName}</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-800 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 font-semibold">
                                <IoCalendarOutline className="text-xs text-[#0A84FF] shrink-0" />
                                <span>Expert Working Schedule: <strong>{expertScheduleText}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Error Banner if any */}
                    {formError && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-in fade-in">
                            <IoAlertCircleOutline className="text-lg shrink-0 mt-0.5" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Step 1: Select New Date */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0A84FF] flex items-center justify-center text-[11px] font-black">1</span>
                                <span>Select New Date</span>
                            </label>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                                DD/MM/YYYY
                            </span>
                        </div>

                        {/* Custom Date Input Display with Overlay Native Picker */}
                        <div className="relative group">
                            <div className={`w-full py-3 px-4 rounded-xl border bg-white shadow-2xs flex items-center justify-between transition-all ${
                                !isCurrentDateAvailable
                                    ? "border-rose-400 ring-2 ring-rose-200"
                                    : "border-slate-300 group-hover:border-blue-400"
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        !isCurrentDateAvailable ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-[#0A84FF]"
                                    }`}>
                                        <IoCalendarOutline className="text-lg" />
                                    </div>
                                    <div>
                                        <span className="text-base font-black text-slate-900 tracking-wider">
                                            {formatToDDMMYYYY(selectedDate) || "DD/MM/YYYY"}
                                        </span>
                                        {formattedSelectedDatePreview && (
                                            <span className={`block text-[11px] font-semibold ${
                                                !isCurrentDateAvailable ? "text-rose-600" : "text-[#0A84FF]"
                                            }`}>
                                                {formattedSelectedDatePreview} {!isCurrentDateAvailable && "(Expert Unavailable)"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-slate-400 group-hover:text-[#0A84FF] transition-colors pr-1">
                                    <IoCalendarOutline className="text-xl" />
                                </div>
                            </div>

                            {/* Transparent Native Date Picker Overlay */}
                            <input
                                type="date"
                                ref={dateInputRef}
                                value={selectedDate}
                                min={availableQuickDates[0]?.date || new Date().toISOString().split("T")[0]}
                                max={getMaxDate()}
                                onChange={(e) => handleDateChange(e.target.value)}
                                required
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                title="Click to select date"
                            />
                        </div>

                        {/* Quick Selection Chips - Filtered to Expert Available Working Days */}
                        <div className="space-y-1 pt-1">
                            <span className="text-[10.5px] text-slate-500 font-medium block">
                                Available dates for {currentExpertName.split(" ")[0]}:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {availableQuickDates.map((chip) => {
                                    const isActive = selectedDate === chip.date;
                                    return (
                                        <button
                                            type="button"
                                            key={chip.date}
                                            onClick={() => handleDateChange(chip.date)}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                                                isActive
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs scale-102"
                                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60"
                                            }`}
                                        >
                                            {chip.formattedDisplay} ({formatToDDMMYYYY(chip.date)})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Preferred Time Slot */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0A84FF] flex items-center justify-center text-[11px] font-black">2</span>
                            <span>Preferred Time Slot</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {timeSlots.map((slot) => {
                                const Icon = slot.icon;
                                const isSelected = selectedTimeSlot === slot.value;
                                return (
                                    <button
                                        type="button"
                                        key={slot.value}
                                        onClick={() => setSelectedTimeSlot(slot.value)}
                                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                                            isSelected
                                                ? "border-[#0A84FF] bg-blue-50/80 text-[#0A84FF] font-bold shadow-xs ring-2 ring-blue-500/20"
                                                : "border-slate-200/90 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50/60"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                            }`}>
                                                <Icon className="text-sm" />
                                            </div>
                                            <div className="truncate">
                                                <span className="text-xs font-bold block truncate">{slot.label}</span>
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <IoCheckmarkCircleOutline className="text-lg text-[#0A84FF] shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3: Reason for Rescheduling (Custom Dropdown) */}
                    <div className="space-y-2" ref={reasonDropdownRef}>
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0A84FF] flex items-center justify-center text-[11px] font-black">3</span>
                            <span>Reason for Reschedule</span>
                        </label>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsReasonDropdownOpen(prev => !prev)}
                                className={`w-full py-3 px-4 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer bg-white ${
                                    isReasonDropdownOpen
                                        ? "border-[#0A84FF] ring-2 ring-blue-500/20 shadow-xs"
                                        : "border-slate-300 hover:border-slate-400"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base shrink-0">
                                        {reasonOptions.find(r => r.label === reasonCategory)?.icon || "📝"}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                        {reasonCategory}
                                    </span>
                                </div>
                                <IoChevronDownOutline className={`text-slate-400 text-sm shrink-0 transition-transform duration-200 ${
                                    isReasonDropdownOpen ? "rotate-180 text-[#0A84FF]" : ""
                                }`} />
                            </button>

                            {/* Floating Custom Dropdown Menu */}
                            {isReasonDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                                    {reasonOptions.map((opt) => {
                                        const isSelected = reasonCategory === opt.label;
                                        return (
                                            <button
                                                type="button"
                                                key={opt.label}
                                                onClick={() => {
                                                    setReasonCategory(opt.label);
                                                    setIsReasonDropdownOpen(false);
                                                }}
                                                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                                                    isSelected
                                                        ? "bg-blue-50/90 text-[#0A84FF] font-bold"
                                                        : "hover:bg-slate-50 text-slate-700 font-medium"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="text-base shrink-0">{opt.icon}</span>
                                                    <div className="min-w-0">
                                                        <span className={`text-xs block truncate font-bold ${isSelected ? "text-[#0A84FF]" : "text-slate-800"}`}>
                                                            {opt.label}
                                                        </span>
                                                        <span className="text-[10.5px] text-slate-400 block truncate">
                                                            {opt.desc}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <IoCheckmarkCircleOutline className="text-base text-[#0A84FF] shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <textarea
                            rows={2}
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Optional: Add a specific note or instruction for the hydrogeologist..."
                            className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent resize-none bg-white placeholder:text-slate-400"
                        />
                    </div>

                    {/* Policy Disclaimer */}
                    <div className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
                        <IoShieldCheckmarkOutline className="text-emerald-600 text-base shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-emerald-950 font-bold">Zero Cancellation Penalty:</strong> Your 40% advance deposit carries over seamlessly. The assigned expert will receive an immediate schedule update.
                        </div>
                    </div>
                </form>

                {/* ── 3. STICKY FOOTER ACTIONS ── */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                    <button
                        type="submit"
                        form="reschedule-form"
                        disabled={isLoading || !isCurrentDateAvailable}
                        className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-blue-700 hover:from-[#0070DF] hover:to-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                    >
                        {isLoading ? (
                            <span>Updating Schedule...</span>
                        ) : (
                            <>
                                <IoCheckmarkCircleOutline className="text-lg" />
                                <span>Confirm Reschedule</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
