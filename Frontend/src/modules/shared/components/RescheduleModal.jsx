import { useState, useEffect } from "react";
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
    IoInformationCircleOutline
} from "react-icons/io5";

/**
 * RescheduleModal Component
 * Allows customers to reschedule groundwater survey appointments with guardrails.
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

    // Initial state calculation
    const getTomorrowDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    };

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

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(getTomorrowDate());
            setSelectedTimeSlot("09:00 AM - 11:00 AM");
            setReasonCategory("Personal / Family emergency");
            setCustomReason("");
            setFormError("");

            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const timeSlots = [
        { label: "Morning (08:00 AM - 11:00 AM)", value: "08:00 AM - 11:00 AM", icon: IoSunnyOutline },
        { label: "Noon (11:00 AM - 01:00 PM)", value: "11:00 AM - 01:00 PM", icon: IoPartlySunnyOutline },
        { label: "Afternoon (02:00 PM - 04:00 PM)", value: "02:00 PM - 04:00 PM", icon: IoPartlySunnyOutline },
        { label: "Evening (04:00 PM - 06:00 PM)", value: "04:00 PM - 06:00 PM", icon: IoMoonOutline },
        { label: "Time TBD by Expert", value: "Time TBD by Expert", icon: IoTimeOutline }
    ];

    const reasonOptions = [
        "Personal / Family emergency",
        "Site / Land preparation pending",
        "Unfavourable weather / heavy rains",
        "Out of town / Travel delay",
        "Laborer / Drilling rig availability issue",
        "Other reason"
    ];

    const handleQuickDateSelect = (daysToAdd) => {
        const d = new Date();
        d.setDate(d.getDate() + daysToAdd);
        setSelectedDate(d.toISOString().split("T")[0]);
    };

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

        const fullReason = customReason.trim()
            ? `${reasonCategory} - ${customReason.trim()}`
            : reasonCategory;

        onReschedule({
            scheduledDate: selectedDate,
            scheduledTime: selectedTimeSlot,
            reason: fullReason
        });
    };

    const currentExpertName = currentBooking?.vendor?.name || "Assigned Expert";
    const currentFormattedDate = currentBooking?.scheduledDate
        ? new Date(currentBooking.scheduledDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Not Set";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) onClose();
            }}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-auto overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100 my-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#0A84FF] flex items-center justify-center shadow-xs">
                            <IoCalendarOutline className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">
                                Reschedule Survey
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Shift your groundwater inspection date & slot
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                    >
                        <IoCloseOutline className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                    {/* Remaining Reschedules Pill */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                            <IoInformationCircleOutline className="text-base text-[#0A84FF]" />
                            <span>Free Reschedules Remaining:</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#0A84FF] text-white font-extrabold text-[11px] shadow-xs">
                            {reschedulesRemaining} of 2 Left
                        </span>
                    </div>

                    {/* Current Appointment Snapshot */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Current Schedule
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                            <div>
                                <span className="text-slate-500 block text-[11px]">Scheduled Date:</span>
                                <strong className="text-slate-900 font-bold">{currentFormattedDate}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[11px]">Time Window:</span>
                                <strong className="text-slate-900 font-bold">{currentBooking?.scheduledTime || "TBD"}</strong>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center gap-1.5 text-slate-600">
                                <IoPersonOutline className="text-slate-500" />
                                <span>Expert: <strong className="text-slate-800">{currentExpertName}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Error Banner if any */}
                    {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold animate-in fade-in">
                            <IoAlertCircleOutline className="text-base flex-shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Step 1: Select New Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            1. Select New Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            min={getTomorrowDate()}
                            max={getMaxDate()}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            required
                            className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white shadow-2xs"
                        />
                        {/* Quick Selection Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                                type="button"
                                onClick={() => handleQuickDateSelect(1)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            >
                                Tomorrow
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickDateSelect(2)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            >
                                In 2 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickDateSelect(5)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            >
                                In 5 Days
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Preferred Time Slot */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            2. Preferred Time Slot
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
                                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                            isSelected
                                                ? "border-[#0A84FF] bg-blue-50/70 text-[#0A84FF] font-bold shadow-2xs"
                                                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Icon className={`text-base flex-shrink-0 ${isSelected ? "text-[#0A84FF]" : "text-slate-400"}`} />
                                            <span className="text-xs truncate">{slot.label}</span>
                                        </div>
                                        {isSelected && <IoCheckmarkCircleOutline className="text-base text-[#0A84FF] flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3: Reason for Rescheduling */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            3. Reason for Reschedule
                        </label>
                        <select
                            value={reasonCategory}
                            onChange={(e) => setReasonCategory(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white"
                        >
                            {reasonOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <textarea
                            rows={2}
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Optional: Add a message or note for the expert..."
                            className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Policy Disclaimer */}
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        🛡️ <strong>Zero Cancellation Penalty:</strong> Your 40% advance deposit carries over seamlessly. The assigned expert will receive an immediate schedule update.
                    </p>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                            Keep Current Date
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-2 py-3 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070DF] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                        >
                            {isLoading ? (
                                <span>Updating Schedule...</span>
                            ) : (
                                <>
                                    <IoCheckmarkCircleOutline className="text-base" />
                                    <span>Confirm Reschedule</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
