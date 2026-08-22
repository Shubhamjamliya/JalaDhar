import { useState, useEffect } from "react";
import {
    IoCloseOutline,
    IoLogoWhatsapp,
    IoCopyOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoAlertCircleOutline,
    IoCalendarOutline
} from "react-icons/io5";

/**
 * WhatsApp Template Modal for Expert & Field Ops
 * Allows 1-tap dispatch of 6 standardized customer communication templates with dynamic interpolation.
 */
export default function WhatsAppTemplateModal({
    isOpen,
    onClose,
    booking,
    vendor,
    templatesConfig = null
}) {
    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
    const [delayMinutes, setDelayMinutes] = useState("30");
    const [customText, setCustomText] = useState("");
    const [copied, setCopied] = useState(false);
    const [targetPhoneType, setTargetPhoneType] = useState("primary"); // 'primary' | 'alternate'

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
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

    // Reset edits when switching templates or opening
    useEffect(() => {
        setCustomText("");
    }, [selectedTemplateIndex, delayMinutes, isOpen]);

    if (!isOpen || !booking) return null;

    // Dynamic variable resolution
    const customerName = booking.user?.name || booking.name || "Customer";
    const expertName = vendor?.name || booking.vendor?.name || "Jaladhaara Expert";
    const rawBookingId = booking.bookingId || booking._id || booking.id || "";
    const bookingId = rawBookingId ? `ORD-${String(rawBookingId).slice(-8).toUpperCase()}` : "ORD-JALADHAR";

    const formattedDate = booking.scheduledDate
        ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : (booking.scheduleDate ? new Date(booking.scheduleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "the scheduled date");

    const formattedTime = (booking.scheduledTime && booking.scheduledTime !== "TBD" && booking.scheduledTime !== "Time TBD by Expert")
        ? booking.scheduledTime
        : (booking.scheduleTime || "the scheduled time");

    const interpolate = (tmplStr, delayVal = delayMinutes) => {
        if (!tmplStr) return "";
        return tmplStr
            .replace(/\{Customer Name\}/gi, customerName)
            .replace(/\{Expert Name\}/gi, expertName)
            .replace(/\{Booking ID\}/gi, bookingId)
            .replace(/\{Date\}/gi, formattedDate)
            .replace(/\{Time\}/gi, formattedTime)
            .replace(/\{X\}/gi, String(delayVal));
    };

    // The 6 standardized base templates
    const ALL_TEMPLATES = [
        {
            id: "booking_accepted",
            number: 1,
            title: "Booking Accepted",
            icon: <IoCheckmarkCircleOutline className="text-emerald-600 text-lg shrink-0" />,
            badge: "Accepted",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            getDefaultText: () =>
                `Hello ${customerName}, This is ${expertName}, your assigned Jaladhaara Expert.\nI have accepted your Groundwater Survey booking (Booking ID: ${bookingId}). I will contact you shortly to confirm the survey schedule. Thank you.`
        },
        {
            id: "on_the_way",
            number: 2,
            title: "On the Way",
            icon: <IoTimeOutline className="text-blue-600 text-lg shrink-0" />,
            badge: "En Route",
            badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
            getDefaultText: () =>
                `Hello ${customerName},\nI am on my way to your survey location and expect to arrive at approximately ${formattedTime}. Please keep the site accessible. Thank you.`
        },
        {
            id: "schedule_confirmation",
            number: 3,
            title: "Schedule Confirmation",
            icon: <IoCalendarOutline className="text-indigo-600 text-lg shrink-0" />,
            badge: "Scheduled",
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
            getDefaultText: () =>
                `Hello ${customerName},\nYour groundwater survey is scheduled for ${formattedDate} at ${formattedTime}. Kindly ensure someone is available at the site to assist during the survey.`
        },
        {
            id: "need_location",
            number: 4,
            title: "Need Location",
            icon: <IoLocationOutline className="text-amber-600 text-lg shrink-0" />,
            badge: "Location",
            badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
            getDefaultText: () =>
                `Hello ${customerName},\nPlease share your live location or the exact survey site location on WhatsApp to help me reach the site without delay. Thank you.`
        },
        {
            id: "customer_not_reachable",
            number: 5,
            title: "Customer Not Reachable",
            icon: <IoCallOutline className="text-rose-600 text-lg shrink-0" />,
            badge: "Unreachable",
            badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
            getDefaultText: () =>
                `Hello ${customerName},\nI tried contacting you regarding your Jaladhaara survey booking but could not reach you. Please call or reply at your earliest convenience to avoid delays.`
        },
        {
            id: "delay_notification",
            number: 6,
            title: "Delay Notification",
            icon: <IoAlertCircleOutline className="text-orange-600 text-lg shrink-0" />,
            badge: "Delay Update",
            badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
            hasDelayPicker: true,
            getDefaultText: () =>
                `Hello ${customerName},\nDue to unforeseen circumstances, I may be delayed by approximately ${delayMinutes} minutes. Sorry for the inconvenience, and thank you for your patience.`
        }
    ];

    // Filter out templates that Admin disabled (if templatesConfig is passed)
    const TEMPLATES = ALL_TEMPLATES.filter(tmpl => {
        if (templatesConfig && templatesConfig[tmpl.id]) {
            return templatesConfig[tmpl.id].enabled !== false;
        }
        return true;
    }).map(tmpl => {
        const customTmpl = templatesConfig?.[tmpl.id]?.template;
        return {
            ...tmpl,
            getText: () => customTmpl ? interpolate(customTmpl, delayMinutes) : tmpl.getDefaultText()
        };
    });

    const currentTemplate = TEMPLATES[selectedTemplateIndex] || TEMPLATES[0];
    const activeMessageText = customText !== "" ? customText : currentTemplate.getText();

    // Contact number resolution
    const primaryPhone = booking.user?.phone || booking.phone || "";
    const altPhone = booking.alternatePhone || booking.user?.alternatePhone || "";
    const activePhone = targetPhoneType === "alternate" && altPhone ? altPhone : primaryPhone;
    const cleanDigits = activePhone.replace(/\D/g, "");

    const handleSendWhatsApp = () => {
        if (!cleanDigits) return;
        const formattedNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
        const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(activeMessageText)}`;
        window.open(url, "_blank");
        onClose();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(activeMessageText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-white rounded-t-[28px] sm:rounded-[20px] max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200 sm:zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-xs border border-emerald-100 shrink-0">
                            <IoLogoWhatsapp />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                                WhatsApp Quick Update
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Customer: <span className="font-bold text-gray-800">{customerName}</span> ({activePhone || "No Phone"})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                        title="Close"
                    >
                        <IoCloseOutline className="text-xl" />
                    </button>
                </div>

                {/* Primary vs Alternate Phone Selector */}
                {altPhone && (
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
                        <span className="text-gray-500 font-semibold pl-2">Recipient:</span>
                        <button
                            type="button"
                            onClick={() => setTargetPhoneType("primary")}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                                targetPhoneType === "primary"
                                    ? "bg-white text-[#0A84FF] shadow-xs border border-blue-100"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Primary ({primaryPhone})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTargetPhoneType("alternate")}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                                targetPhoneType === "alternate"
                                    ? "bg-white text-emerald-600 shadow-xs border border-emerald-100"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Alt ({altPhone})
                        </button>
                    </div>
                )}

                {/* Body Content */}
                <div className="overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                    {/* Templates Selector Grid */}
                    <div>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                            Select Message Template (6 Options)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TEMPLATES.map((tmpl, idx) => {
                                const isSelected = selectedTemplateIndex === idx;
                                return (
                                    <button
                                        key={tmpl.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTemplateIndex(idx);
                                        }}
                                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                            isSelected
                                                ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                                : "bg-gray-50/70 border-gray-200 hover:bg-gray-100/80"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {tmpl.icon}
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold truncate ${isSelected ? "text-emerald-950" : "text-gray-800"}`}>
                                                    {tmpl.number}. {tmpl.title}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${tmpl.badgeColor}`}>
                                            {tmpl.badge}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delay Selector if Template #6 selected */}
                    {currentTemplate.hasDelayPicker && (
                        <div className="p-3 bg-orange-50/90 rounded-xl border border-orange-200 space-y-1.5 animate-in fade-in duration-150">
                            <label className="text-xs font-bold text-orange-950 flex items-center justify-between">
                                <span>Select Delay Duration:</span>
                                <span className="font-extrabold text-orange-700 bg-white px-2 py-0.5 rounded-md border border-orange-200">
                                    +{delayMinutes} minutes
                                </span>
                            </label>
                            <div className="flex gap-2">
                                {["15", "30", "45", "60"].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setDelayMinutes(mins)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                            delayMinutes === mins
                                                ? "bg-orange-600 text-white shadow-xs"
                                                : "bg-white text-orange-900 border border-orange-200 hover:bg-orange-100"
                                        }`}
                                    >
                                        +{mins}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Live Preview / Editable Message Text */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700 flex items-center gap-1">
                                <span>Message Preview:</span>
                                <span className="text-[10px] font-medium text-gray-400">(Editable)</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                            >
                                <IoCopyOutline />
                                <span>{copied ? "Copied!" : "Copy Text"}</span>
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            value={activeMessageText}
                            onChange={(e) => setCustomText(e.target.value)}
                            className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-sans leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                            placeholder="Type custom message..."
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSendWhatsApp}
                        disabled={!cleanDigits}
                        className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <IoLogoWhatsapp className="text-lg" />
                        <span>Open in WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
