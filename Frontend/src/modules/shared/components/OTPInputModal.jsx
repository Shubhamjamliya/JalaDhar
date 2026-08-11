import React, { useState, useEffect, useRef } from "react";
import { IoAlertCircleOutline, IoCloseOutline } from "react-icons/io5";

export default function OTPInputModal({
    isOpen,
    onClose,
    onSubmit,
    onResend,
    resending = false,
    title = "Enter OTP",
    message = "Please enter the 6-digit OTP code.",
    submitText = "Verify",
    isLoading = false,
    length = 6
}) {
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(30);
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setOtp(new Array(length).fill(""));
            setError("");
            setResendTimer(30);
            setIsResendDisabled(true);

            // Cooldown timer for resending OTP
            const timer = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Focus first input automatically
            setTimeout(() => {
                if (inputRefs.current[0]) {
                    inputRefs.current[0].focus();
                }
            }, 100);
            
            // Lock background scroll
            const origBody = document.body.style.overflow;
            const origHtml = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";

            return () => {
                clearInterval(timer);
                document.body.style.overflow = origBody;
                document.documentElement.style.overflow = origHtml;
            };
        }
    }, [isOpen, length]);

    const handleResendClick = async () => {
        if (isResendDisabled || resending || !onResend) return;
        setResendTimer(30);
        setIsResendDisabled(true);
        try {
            await onResend();
        } catch (err) {
            console.error("Resend error:", err);
        }
    };

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // Only take the last character typed
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        setError("");

        // Auto-advance to next input
        if (value && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
                // If empty, move back and delete
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1].focus();
            } else {
                // Just clear current
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1].focus();
        } else if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1].focus();
        } else if (e.key === "Enter") {
            handleSubmit();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").trim();
        if (isNaN(pastedData)) return;
        
        const newOtp = [...otp];
        for (let i = 0; i < length; i++) {
            if (pastedData[i]) {
                newOtp[i] = pastedData[i];
            }
        }
        setOtp(newOtp);
        
        // Focus last filled input
        const focusIndex = Math.min(pastedData.length, length) - 1;
        if (focusIndex >= 0 && inputRefs.current[focusIndex]) {
            inputRefs.current[focusIndex].focus();
        }
    };

    const handleSubmit = () => {
        const otpString = otp.join("");
        if (otpString.length < length) {
            setError(`Please enter the complete ${length}-digit OTP.`);
            return;
        }
        onSubmit(otpString);
    };

    if (!isOpen) return null;

    const isComplete = otp.join("").length === length;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 touch-none"
            onClick={onClose}
        >
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 relative transform transition-all duration-300 ease-out animate-in zoom-in-95 border border-slate-100 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl shrink-0">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <IoCloseOutline className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 flex-1 text-center">
                    <p className="text-slate-600 text-sm font-semibold leading-relaxed">{message}</p>
                    
                    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                ref={el => inputRefs.current[index] = el}
                                value={data}
                                onChange={e => handleChange(e, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                className="w-10 h-12 sm:w-12 sm:h-14 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-xl sm:text-2xl font-black text-slate-800 focus:bg-white focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 flex items-center justify-center gap-1 font-bold animate-in slide-in-from-top-2">
                            <IoAlertCircleOutline className="text-sm shrink-0" />
                            <span>{error}</span>
                        </p>
                    )}

                    {onResend && (
                        <div className="pt-2 text-center text-xs">
                            <span className="text-slate-500 font-medium">Didn't receive OTP? </span>
                            <button
                                type="button"
                                onClick={handleResendClick}
                                disabled={isResendDisabled || resending}
                                className={`font-extrabold transition-colors ${
                                    isResendDisabled || resending
                                        ? "text-slate-400 cursor-not-allowed"
                                        : "text-[#0A84FF] hover:underline cursor-pointer"
                                }`}
                            >
                                {resending
                                    ? "Resending..."
                                    : isResendDisabled
                                    ? `Resend OTP (${resendTimer}s)`
                                    : "Resend OTP via SMS & WhatsApp"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={!isComplete || isLoading}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold text-white transition-all text-sm shadow-md shadow-blue-500/20 bg-gradient-to-r from-[#0A84FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isLoading ? "Verifying..." : submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}
