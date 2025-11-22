import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { sendVendorRegistrationOTP } from "../../../services/vendorAuthApi";

export default function VendorSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registrationStep, setRegistrationStep] = useState(1); // 1: form, 2: OTP
    const [verificationToken, setVerificationToken] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const navigate = useNavigate();
    const { register } = useVendorAuth();

    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    // Form state
    const [formData, setFormData] = useState({
        // Basic Details
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        profilePicture: null,
        
        // KYC Details
        aadhaarNo: "",
        panNo: "",
        aadharCard: null,
        panCard: null,
        
        // Education & Experience
        education: "",
        institution: "",
        experience: "",
        experienceDetails: "",
        certificates: [],
        
        // Bank Details
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        cancelledCheque: null,
        
        // Address
        address: {
            street: "",
            city: "",
            state: "",
            pincode: ""
        }
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            if (field === 'certificates') {
                setFormData(prev => ({
                    ...prev,
                    certificates: [...prev.certificates, file]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [field]: file
                }));
            }
        }
    };

    const removeCertificate = (index) => {
        setFormData(prev => ({
            ...prev,
            certificates: prev.certificates.filter((_, i) => i !== index)
        }));
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            setError("Please fill in all required fields");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!formData.bankName || !formData.accountHolderName || !formData.accountNumber || !formData.ifscCode) {
            setError("Please fill in all bank details");
            setLoading(false);
            return;
        }

        if (!formData.experience || isNaN(formData.experience) || parseInt(formData.experience) < 0) {
            setError("Please enter a valid experience (years)");
            setLoading(false);
            return;
        }

        try {
            const response = await sendVendorRegistrationOTP({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });
            
            if (response.success) {
                // Navigate to OTP verification page with registration data
                navigate("/vendor/verify-otp", {
                    state: {
                        registrationData: {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                            password: formData.password,
                            profilePicture: formData.profilePicture,
                            aadharCard: formData.aadharCard,
                            panCard: formData.panCard,
                            certificates: formData.certificates,
                            cancelledCheque: formData.cancelledCheque,
                            accountHolderName: formData.accountHolderName,
                            accountNumber: formData.accountNumber,
                            ifscCode: formData.ifscCode,
                            bankName: formData.bankName,
                            branchName: formData.branchName,
                            education: formData.education,
                            institution: formData.institution,
                            experience: formData.experience,
                            address: formData.address
                        },
                        verificationToken: response.data.token,
                        email: formData.email,
                        otpSent: true
                    }
                });
            } else {
                setError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
            console.error("Send OTP error:", err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] p-4 py-6 overflow-y-auto">
            <div className="w-full max-w-2xl">
                <div className="mt-4 mb-6 flex flex-col items-center">
                    <span className="material-symbols-outlined icon-gradient !text-5xl">
                        water_drop
                    </span>
                    <h1 className="mt-2 text-3xl font-bold tracking-tighter text-[#3A3A3A]">
                        JALADHAR
                    </h1>
                    <p className="mt-3 text-sm text-[#6B7280] text-center">
                        Create your vendor account to get started.
                    </p>
                </div>

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

                <main className="w-full rounded-xl bg-white p-6 shadow-lg">
                    <form className="space-y-4" onSubmit={handleSendOTP}>
                        <div className="flex justify-center mb-3">
                            <h2 className="button-white text-sm font-bold text-gradient px-3 py-1 rounded-full border-2 border-[#1A80E5]">
                                Vendor Sign Up
                            </h2>
                        </div>
                    {/* Section 1: Basic Details */}
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-[#3A3A3A] mb-3">
                            Basic Details
                        </h3>
                        {/* Profile Image Upload */}
                        <ProfileImageUpload 
                            file={formData.profilePicture}
                            onChange={(e) => handleFileChange('profilePicture', e)}
                        />

                        {/* Full Name */}
                        <InputBox
                            label="Full Name *"
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={loading}
                        />

                        {/* Email */}
                        <InputBox
                            label="Email *"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={loading}
                        />

                        {/* Mobile */}
                        <InputBox
                            label="Mobile *"
                            name="phone"
                            type="tel"
                            placeholder="Enter your mobile number"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={loading}
                        />

                        {/* Password */}
                        <PasswordBox
                            label="Password *"
                            name="password"
                            placeholder="Create password"
                            value={formData.password}
                            onChange={handleInputChange}
                            show={showPassword}
                            toggle={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        />

                        {/* Confirm Password */}
                        <PasswordBox
                            label="Confirm Password *"
                            name="confirmPassword"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            show={showConfirmPassword}
                            toggle={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={loading}
                        />
                    </div>

                    {/* Section 2: KYC Details */}
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-[#3A3A3A] mb-3">
                            KYC Details
                        </h3>
                        {/* Upload Aadhaar */}
                        <FileBox 
                            label="Upload Aadhaar Image"
                            onChange={(e) => handleFileChange('aadharCard', e)}
                            file={formData.aadharCard}
                            disabled={loading}
                        />

                        {/* Upload PAN */}
                        <FileBox 
                            label="Upload PAN Image"
                            onChange={(e) => handleFileChange('panCard', e)}
                            file={formData.panCard}
                            disabled={loading}
                        />
                    </div>

                    {/* Section 3: Education & Experience */}
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-[#3A3A3A] mb-3">
                            Education & Experience
                        </h3>
                        {/* Education/Qualification */}
                        <InputBox
                            label="Education/Qualification"
                            name="education"
                            type="text"
                            placeholder="Enter your qualification (e.g., B.Tech, Diploma)"
                            value={formData.education}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        
                        {/* Institution */}
                        <InputBox
                            label="Institution Name"
                            name="institution"
                            type="text"
                            placeholder="Enter institution name"
                            value={formData.institution}
                            onChange={handleInputChange}
                            disabled={loading}
                        />

                        {/* Experience */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                                Experience (Years) *
                            </label>
                            <div className="flex gap-2">
                                <div className="relative w-24">
                                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-lg">
                                        calendar_today
                                    </span>
                                    <input
                                        type="number"
                                        name="experience"
                                        placeholder="Years"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-10 pr-3 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                                        description
                                    </span>
                                    <input
                                        type="text"
                                        name="experienceDetails"
                                        placeholder="Experience details (optional)"
                                        value={formData.experienceDetails}
                                        onChange={handleInputChange}
                                        className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Upload Certificates */}
                        <MultiFileBox 
                            label="Upload Certificates"
                            files={formData.certificates}
                            onChange={(e) => handleFileChange('certificates', e)}
                            onRemove={removeCertificate}
                            disabled={loading}
                        />
                    </div>

                    {/* Section 4: Bank Details */}
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-[#3A3A3A] mb-3">
                            Bank Details *
                        </h3>
                        <InputBox
                            label="Account Holder Name *"
                            name="accountHolderName"
                            type="text"
                            placeholder="Enter account holder name"
                            value={formData.accountHolderName}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <InputBox
                            label="Bank Name *"
                            name="bankName"
                            type="text"
                            placeholder="Enter bank name"
                            value={formData.bankName}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <InputBox
                            label="Account Number *"
                            name="accountNumber"
                            type="text"
                            placeholder="Enter account number"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <InputBox
                            label="IFSC Code *"
                            name="ifscCode"
                            type="text"
                            placeholder="Enter IFSC code"
                            value={formData.ifscCode}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <InputBox
                            label="Branch Name"
                            name="branchName"
                            type="text"
                            placeholder="Enter branch name (optional)"
                            value={formData.branchName}
                            onChange={handleInputChange}
                            disabled={loading}
                        />

                        {/* Upload Cancelled Check */}
                        <FileBox 
                            label="Upload Cancelled Cheque"
                            onChange={(e) => handleFileChange('cancelledCheque', e)}
                            file={formData.cancelledCheque}
                            disabled={loading}
                        />
                    </div>

                    {/* Section 5: Address */}
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-[#3A3A3A] mb-3">
                            Address
                        </h3>
                        {/* Address Fields */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputBox
                                label="Street"
                                name="address.street"
                                type="text"
                                placeholder="Street address"
                                value={formData.address.street}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                            <InputBox
                                label="City"
                                name="address.city"
                                type="text"
                                placeholder="City"
                                value={formData.address.city}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                            <InputBox
                                label="State"
                                name="address.state"
                                type="text"
                                placeholder="State"
                                value={formData.address.state}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                            <InputBox
                                label="Pincode"
                                name="address.pincode"
                                type="text"
                                placeholder="Pincode"
                                value={formData.address.pincode}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="button-gradient w-full rounded-full py-3 text-sm font-bold text-white shadow-[0_6px_15px_rgba(26,128,229,0.25)] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4"
                        >
                            {loading ? "Sending OTP..." : "Sign Up"}
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

/* -------------------- REUSABLE COMPONENTS -------------------- */

function ProfileImageUpload({ file, onChange }) {
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
            onChange(e);
        }
    };

    return (
        <div className="mb-6 flex justify-center">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden">
                    {imagePreview || (file && URL.createObjectURL(file)) ? (
                        <img
                            src={imagePreview || URL.createObjectURL(file)}
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

function InputBox({ label, name, type, placeholder, value, onChange, disabled, icon }) {
    const getIcon = () => {
        if (icon) return icon;
        if (name === "name") return "person";
        if (name === "email") return "mail";
        if (name === "phone") return "phone";
        if (name.includes("address")) return "home";
        if (name.includes("bank") || name.includes("account") || name.includes("ifsc")) return "account_balance";
        return "edit";
    };

    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    {getIcon()}
                </span>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function PasswordBox({ label, name, placeholder, value, onChange, show, toggle, disabled }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    lock
                </span>
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-12 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={toggle}
                    disabled={disabled}
                >
                    <span className="material-symbols-outlined text-xl">
                        {show ? "visibility_off" : "visibility"}
                    </span>
                </button>
            </div>
        </div>
    );
}

function FileBox({ label, onChange, file, disabled }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    upload_file
                </span>
                {file && (
                    <p className="text-xs text-green-600 mb-2 pl-12">
                        ✓ {file.name}
                    </p>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function MultiFileBox({ label, files, onChange, onRemove, disabled }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    upload_file
                </span>
                {files && files.length > 0 && (
                    <div className="mb-2 space-y-1 pl-12">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span className="text-gray-600">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="text-red-600 hover:text-red-800"
                                    disabled={disabled}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
                <p className="text-xs text-gray-500 mt-1 pl-12">
                    You can select multiple files
                </p>
            </div>
        </div>
    );
}

function TextAreaBox({ label, name, placeholder, value, onChange, disabled }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <textarea
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                    rows="3"
                    disabled={disabled}
                ></textarea>
            </div>
        </div>
    );
}
