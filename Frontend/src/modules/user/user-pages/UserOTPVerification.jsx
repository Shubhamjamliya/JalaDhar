import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { sendUserRegistrationOTP } from "../../../services/authApi";
import { IoArrowBackOutline, IoCheckmarkCircleOutline } from "react-icons/io5";

export default function UserOTPVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth();
    
    const [otp, setOtp] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    
    // Get registration data from location state
    const registrationData = location.state?.registrationData;
    const verificationToken = location.state?.verificationToken;
    const email = location.state?.email;

    useEffect(() => {
        // Redirect if no registration data
        if (!registrationData || !verificationToken || !email) {
            navigate("/usersignup");
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
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const response = await sendUserRegistrationOTP({
                name: registrationData.name,
                email: registrationData.email,
                phone: registrationData.phone
            });
            if (response.success) {
                setSuccess("New OTP sent successfully!");
                setOtpCountdown(60);
                // Update location state with new token
                window.history.replaceState(
                    { ...location.state, verificationToken: response.data.token },
                    ""
                );
            } else {
                setError(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e?.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            setLoading(false);
            return;
        }

        try {
            const result = await register({
                name: registrationData.name,
                email: registrationData.email,
                phone: registrationData.phone,
                password: registrationData.password,
                otp: otp,
                token: verificationToken
            });
            
            if (result.success) {
                setRegistrationSuccess(true);
                setSuccess(result.message || "Registration successful!");
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate("/userlogin", { 
                        state: { 
                            message: "Registration successful! Please login to continue." 
                        } 
                    });
                }, 3000);
            } else {
                setError(result.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5 py-8">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="text-center mb-10 mt-4">
                        <img
                            src="/src/assets/logo.png"
                            alt="Jaladhar"
                            className="w-auto mx-auto mb-2"
                        />
                    </div>

                    {/* Success Message */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <IoCheckmarkCircleOutline className="text-6xl text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Registration Successful!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Your account has been created successfully. You will be redirected to login page shortly.
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A84FF] mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5 py-8">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10 mt-4">
                    <img
                        src="/src/assets/logo.png"
                        alt="Jaladhar"
                        className="w-auto mx-auto mb-2"
                    />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Verify Email
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{success}</p>
                    </div>
                )}

                {/* OTP Verification Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="text-center mb-6">
                        <p className="text-gray-700 text-sm mb-2">
                            An OTP has been sent to <span className="font-semibold">{email}</span>.
                        </p>
                        <p className="text-gray-500 text-xs">
                            Please enter the 6-digit code below to complete registration.
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-4">
                        <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                                Enter OTP
                            </p>
                            <input
                                type="text"
                                placeholder="------"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(value);
                                }}
                                maxLength="6"
                                className="w-full text-[14px] text-gray-600 focus:outline-none text-center text-xl tracking-widest"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Resend OTP / Back */}
                    <div className="flex items-center justify-between text-sm mb-4">
                        {otpCountdown > 0 ? (
                            <p className="text-gray-500">Resend OTP in {otpCountdown}s</p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                className="text-[#0A84FF] hover:underline font-medium"
                                disabled={loading}
                            >
                                Resend OTP
                            </button>
                        )}
                        <Link
                            to="/usersignup"
                            className="text-gray-500 hover:underline font-medium flex items-center gap-1"
                        >
                            <IoArrowBackOutline className="text-base" /> Edit Details
                        </Link>
                    </div>

                    {/* Verify & Register Button */}
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Verifying..." : "Verify & Register"}
                    </button>
                </div>

                {/* Login Link */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    Already Registered?{" "}
                    <Link
                        to="/userlogin"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

