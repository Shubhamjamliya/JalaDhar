import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VendorSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    const handleVendorSignup = () => {
        navigate("/vendorlogin");
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5">
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
                    Vendor Signup
                </h2>

                {/* Section 1: Basic Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Basic Details
                    </h3>
                    {/* Profile Image Upload */}
                    <ProfileImageUpload />

                    {/* Full Name */}
                    <InputBox
                        label="Full Name"
                        type="text"
                        placeholder="Enter your full name"
                    />

                    {/* Email */}
                    <InputBox
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                    />

                    {/* Mobile */}
                    <InputBox
                        label="Mobile"
                        type="number"
                        placeholder="Enter your mobile number"
                    />

                    {/* Password */}
                    <PasswordBox
                        label="Password"
                        placeholder="Create password"
                        show={showPassword}
                        toggle={() => setShowPassword(!showPassword)}
                    />

                    {/* Confirm Password */}
                    <PasswordBox
                        label="Confirm Password"
                        placeholder="Re-enter password"
                        show={showConfirmPassword}
                        toggle={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                    />
                </div>

                {/* Section 2: KYC Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        KYC Details
                    </h3>
                    {/* Aadhaar No */}
                    <InputBox
                        label="Aadhaar No"
                        type="number"
                        placeholder="Enter Aadhaar number"
                    />

                    {/* PAN No */}
                    <InputBox
                        label="PAN No"
                        type="text"
                        placeholder="Enter PAN number"
                    />

                    {/* Upload Aadhaar */}
                    <FileBox label="Upload Aadhaar Image" />

                    {/* Upload PAN */}
                    <FileBox label="Upload PAN Image" />
                </div>

                {/* Section 3: Education & Experience */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Education & Experience
                    </h3>
                    {/* Education/Qualification */}
                    <InputBox
                        label="Education/Qualification"
                        type="text"
                        placeholder="Enter your qualification"
                    />

                    {/* Experience */}
                    <div className="mb-4">
                        <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-[14px] font-semibold text-[#4A4A4A] mb-2">
                                Experience
                            </p>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="number"
                                    placeholder="Years"
                                    className="w-24 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-[14px] text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                />
                                <input
                                    type="text"
                                    placeholder="Experience details"
                                    className="flex-1 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-[14px] text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Upload Certificates */}
                    <MultiFileBox label="Upload Certificates" />
                </div>

                {/* Section 4: Bank Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Bank Details
                    </h3>
                    <InputBox
                        label="Bank Name"
                        type="text"
                        placeholder="Enter bank name"
                    />
                    <InputBox
                        label="Account No"
                        type="text"
                        placeholder="Enter account number"
                    />
                    <InputBox
                        label="IFSC"
                        type="text"
                        placeholder="Enter IFSC code"
                    />

                    {/* Upload Cancelled Check */}
                    <FileBox label="Upload Cancelled Check" />
                </div>

                {/* Section 5: Service & Address */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Service & Address
                    </h3>
                    {/* Description of Services */}
                    <TextAreaBox
                        label="Description of Services"
                        placeholder="Describe your services"
                    />

                    {/* Full Address */}
                    <TextAreaBox
                        label="Full Address"
                        placeholder="Enter full address"
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleVendorSignup}
                    className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors mt-4"
                >
                    Sign Up
                </button>

                {/* Login */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    Already Registered?{" "}
                    <Link
                        to="/vendorlogin"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function ProfileImageUpload() {
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="mb-6 flex justify-center">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden">
                    {imagePreview ? (
                        <img
                            src={imagePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl text-gray-400">👤</span>
                        </div>
                    )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#0A84FF] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#005BBB] transition-colors">
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </label>
            </div>
        </div>
    );
}

function InputBox({ label, type, placeholder }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <input
                    type={type}
                    placeholder={placeholder}
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                />
            </div>
        </div>
    );
}

function PasswordBox({ label, placeholder, show, toggle }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <div className="flex items-center">
                    <input
                        type={show ? "text" : "password"}
                        placeholder={placeholder}
                        className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                    />
                    <span
                        className="text-gray-500 text-sm cursor-pointer ml-2"
                        onClick={toggle}
                    >
                        {show ? "Hide" : "Show"}
                    </span>
                </div>
            </div>
        </div>
    );
}

function FileBox({ label }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <input
                    type="file"
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                />
            </div>
        </div>
    );
}

function MultiFileBox({ label }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <input
                    type="file"
                    multiple
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                    You can select multiple files
                </p>
            </div>
        </div>
    );
}

function TextAreaBox({ label, placeholder }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <textarea
                    placeholder={placeholder}
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                    rows="3"
                ></textarea>
            </div>
        </div>
    );
}
