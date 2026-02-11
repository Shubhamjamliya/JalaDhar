import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { sendVendorRegistrationOTP } from "../../../services/vendorAuthApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import logo from "@/assets/AppLogo.png";

export default function VendorOTPVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useVendorAuth();

    const [otp, setOtp] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const toast = useToast();

    // Get registration data from location state
    const registrationData = location.state?.registrationData;
    const verificationToken = location.state?.verificationToken;
    const email = location.state?.email;

    useEffect(() => {
        // Redirect if no registration data
        if (!registrationData || !verificationToken || !email) {
            navigate("/vendorsignup");
            return;
        }

        // Start countdown if OTP was just sent
        if (location.state?.otpSent) {
            setOtpCountdown(60);
        }
    }, [location.state, navigate, registrationData, verificationToken, email]);

    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    const handleResendOTP = async () => {
        setLoading(true);
        const loadingToast = toast.showLoading("Resending OTP...");
        try {
            const response = await sendVendorRegistrationOTP({
                name: registrationData.name,
                email: registrationData.email,
                phone: registrationData.phone
            });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("New OTP sent successfully!");
                setOtpCountdown(60);
                // Update location state with new token
                window.history.replaceState(
                    { ...location.state, verificationToken: response.data.token },
                    ""
                );
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e?.preventDefault();
        setLoading(true);

        if (!otp || otp.length !== 6) {
            toast.showError("Please enter a valid 6-digit OTP");
            setLoading(false);
            return;
        }

        const loadingToast = toast.showLoading("Verifying OTP and registering...");

        try {
            // Create FormData with all registration data
            const formDataToSend = new FormData();

            // Basic details
            formDataToSend.append('name', registrationData.name);
            formDataToSend.append('email', registrationData.email);
            formDataToSend.append('phone', registrationData.phone);
            formDataToSend.append('password', registrationData.password);
            formDataToSend.append('otp', otp);
            formDataToSend.append('token', verificationToken);

            // Files
            if (registrationData.profilePicture) {
                formDataToSend.append('profilePicture', registrationData.profilePicture);
            }
            if (registrationData.aadharCard) {
                formDataToSend.append('aadharCard', registrationData.aadharCard);
            }
            if (registrationData.panCard) {
                formDataToSend.append('panCard', registrationData.panCard);
            }
            if (registrationData.cancelledCheque) {
                formDataToSend.append('cancelledCheque', registrationData.cancelledCheque);
            }
            if (registrationData.groundwaterRegDetails) {
                formDataToSend.append('groundwaterRegDetails', registrationData.groundwaterRegDetails);
            }
            if (registrationData.certificates && registrationData.certificates.length > 0) {
                registrationData.certificates.forEach((cert) => {
                    formDataToSend.append('certificates', cert);
                });
            }
            if (registrationData.trainingCertificates && registrationData.trainingCertificates.length > 0) {
                registrationData.trainingCertificates.forEach((cert) => {
                    formDataToSend.append('trainingCertificates', cert);
                });
            }

            // Bank details
            formDataToSend.append('bankDetails[accountHolderName]', registrationData.accountHolderName);
            formDataToSend.append('bankDetails[accountNumber]', registrationData.accountNumber);
            formDataToSend.append('bankDetails[ifscCode]', registrationData.ifscCode);
            formDataToSend.append('bankDetails[bankName]', registrationData.bankName);
            formDataToSend.append('bankDetails[branchName]', registrationData.branchName || '');

            // Educational qualifications
            const educationalQualifications = (registrationData.education && registrationData.institution) ? [{
                degree: registrationData.education,
                institution: registrationData.institution,
                year: new Date().getFullYear(),
                percentage: null
            }] : [];
            formDataToSend.append('educationalQualifications', JSON.stringify(educationalQualifications));

            // Experience
            formDataToSend.append('experience', parseInt(registrationData.experience));
            if (registrationData.experienceDetails) {
                formDataToSend.append('experienceDetails', registrationData.experienceDetails);
            }

            // Service Details
            if (registrationData.machineType) {
                formDataToSend.append('machineType', registrationData.machineType);
            }
            if (registrationData.serviceImages && registrationData.serviceImages.length > 0) {
                registrationData.serviceImages.forEach((image) => {
                    formDataToSend.append('serviceImages', image);
                });
            }
            if (registrationData.servicePrice) {
                formDataToSend.append('servicePrice', registrationData.servicePrice);
            }

            // Address (coordinates are already in address.coordinates)
            const addressToSend = {
                ...registrationData.address,
                coordinates: registrationData.address?.coordinates || null
            };
            formDataToSend.append('address', JSON.stringify(addressToSend));

            // Selected place info (if address was selected from dropdown)
            if (registrationData.selectedPlace) {
                formDataToSend.append('selectedPlace', JSON.stringify(registrationData.selectedPlace));
            }

            const result = await register(formDataToSend);

            if (result.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(result.message || "Registration successful! Your account is pending admin approval.");
                setRegistrationSuccess(true);
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate("/vendorlogin", {
                        state: {
                            message: "Registration successful! Your account is pending admin approval."
                        }
                    });
                }, 2000);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(result.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] p-4 py-6 overflow-y-auto">
                <div className="w-full max-w-sm">
                    <div className="mt-4 mb-6 flex flex-col items-center">
                        <img
                            src={logo}
                            alt="Jaladhaara Logo"
                            className="h-32 object-contain mb-4"
                        />
                    </div>

                    <main className="w-full rounded-xl bg-white p-6 shadow-lg text-center">
                        <span className="material-symbols-outlined text-6xl text-green-500 mb-4">
                            check_circle
                        </span>
                        <h2 className="text-2xl font-bold text-[#3A3A3A] mb-2">
                            Registration Successful!
                        </h2>
                        <p className="text-sm text-[#6B7280] mb-2">
                            Your account has been created successfully.
                        </p>
                        <p className="text-xs text-[#6B7280] mb-6">
                            Your account is pending admin approval. You will be redirected to login page shortly.
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A80E5] mx-auto"></div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] p-4 py-6 overflow-y-auto">
            <div className="w-full max-w-sm">
                <div className="mt-4 mb-6 flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-32 object-contain mb-4"
                    />
                    <p className="mt-1 text-sm text-[#6B7280] text-center">
                        Verify your email to complete registration.
                    </p>
                </div>

                <main className="w-full rounded-xl bg-white p-6 shadow-lg">
                    <form className="space-y-4" onSubmit={handleVerifyOTP}>
                        <div className="flex justify-center mb-3">
                            <h2 className="button-white text-sm font-bold text-gradient px-3 py-1 rounded-full border-2 border-[#1A80E5]">
                                Verify Email
                            </h2>
                        </div>

                        <div className="text-center mb-4">
                            <p className="text-sm text-[#6B7280] mb-1">
                                An OTP has been sent to
                            </p>
                            <p className="text-sm font-bold text-[#3A3A3A] mb-2">
                                {email}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                                Please enter the 6-digit code below to complete registration.
                            </p>
                        </div>

                        {/* OTP Input */}
                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                                lock
                            </span>
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(value);
                                }}
                                maxLength="6"
                                className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm text-center tracking-widest"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        {/* Resend OTP / Back */}
                        <div className="flex items-center justify-between text-xs">
                            {otpCountdown > 0 ? (
                                <p className="text-[#6B7280]">Resend OTP in {otpCountdown}s</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="text-[#1A80E5] hover:underline font-medium"
                                    disabled={loading}
                                >
                                    Resend OTP
                                </button>
                            )}
                            <Link
                                to="/vendorsignup"
                                className="text-[#6B7280] hover:text-[#1A80E5] font-medium flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Edit Details
                            </Link>
                        </div>

                        {/* Verify & Register Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="button-gradient w-full rounded-full py-3 text-sm font-bold text-white shadow-[0_6px_15px_rgba(26,128,229,0.25)] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? "Verifying..." : "Verify & Register"}
                        </button>
                    </form>
                </main>

                <div className="mt-6 mb-4 text-center">
                    <p className="text-sm text-[#6B7280]">
                        Already Registered?{" "}
                        <Link
                            to="/vendorlogin"
                            className="font-semibold text-[#1A80E5] hover:text-blue-700"
                        >
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

