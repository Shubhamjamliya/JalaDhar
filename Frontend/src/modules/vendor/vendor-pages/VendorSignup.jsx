import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";

export default function VendorSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const navigate = useNavigate();
    const { register } = useVendorAuth();

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

    const handleVendorSignup = async (e) => {
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
            // Create FormData
            const formDataToSend = new FormData();
            
            // Basic details
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('password', formData.password);
            
            // Files
            if (formData.profilePicture) {
                formDataToSend.append('profilePicture', formData.profilePicture);
            }
            if (formData.aadharCard) {
                formDataToSend.append('aadharCard', formData.aadharCard);
            }
            if (formData.panCard) {
                formDataToSend.append('panCard', formData.panCard);
            }
            if (formData.cancelledCheque) {
                formDataToSend.append('cancelledCheque', formData.cancelledCheque);
            }
            formData.certificates.forEach((cert) => {
                formDataToSend.append('certificates', cert);
            });
            
            // Bank details - Send as nested fields for validation
            formDataToSend.append('bankDetails[accountHolderName]', formData.accountHolderName);
            formDataToSend.append('bankDetails[accountNumber]', formData.accountNumber);
            formDataToSend.append('bankDetails[ifscCode]', formData.ifscCode);
            formDataToSend.append('bankDetails[bankName]', formData.bankName);
            formDataToSend.append('bankDetails[branchName]', formData.branchName || '');
            
            // Educational qualifications (array) - only send if both degree and institution are provided
            const educationalQualifications = (formData.education && formData.institution) ? [{
                degree: formData.education,
                institution: formData.institution,
                year: new Date().getFullYear(),
                percentage: null
            }] : [];
            formDataToSend.append('educationalQualifications', JSON.stringify(educationalQualifications));
            
            // Experience
            formDataToSend.append('experience', parseInt(formData.experience));
            
            // Address
            formDataToSend.append('address', JSON.stringify(formData.address));
            
            const result = await register(formDataToSend);
            
            if (result.success) {
                setSuccess(result.message || "Registration successful! Your account is pending admin approval.");
                // Clear form
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    confirmPassword: "",
                    profilePicture: null,
                    aadhaarNo: "",
                    panNo: "",
                    aadharCard: null,
                    panCard: null,
                    education: "",
                    institution: "",
                    experience: "",
                    experienceDetails: "",
                    certificates: [],
                    bankName: "",
                    accountHolderName: "",
                    accountNumber: "",
                    ifscCode: "",
                    branchName: "",
                    cancelledCheque: null,
                    address: {
                        street: "",
                        city: "",
                        state: "",
                        pincode: ""
                    }
                });
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate("/vendorlogin");
                }, 3000);
            } else {
                setError(result.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Signup error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5 py-8">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="text-center mb-6">
                    <img
                        src="/src/assets/logo.png"
                        alt="Jaladhar"
                        className="w-auto mx-auto mb-2"
                    />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    Vendor Signup
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

                <form onSubmit={handleVendorSignup}>
                    {/* Section 1: Basic Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
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
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
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
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
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
                        <div className="mb-4">
                            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-2">
                                    Experience (Years) *
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="experience"
                                        placeholder="Years"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-24 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-[14px] text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                        disabled={loading}
                                    />
                                    <input
                                        type="text"
                                        name="experienceDetails"
                                        placeholder="Experience details (optional)"
                                        value={formData.experienceDetails}
                                        onChange={handleInputChange}
                                        className="flex-1 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-[14px] text-gray-600 focus:outline-none focus:border-[#0A84FF]"
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
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
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
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
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
                        className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing up..." : "Sign Up"}
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
                </form>
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

function InputBox({ label, name, type, placeholder, value, onChange, disabled }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function PasswordBox({ label, name, placeholder, value, onChange, show, toggle, disabled }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <div className="flex items-center">
                    <input
                        type={show ? "text" : "password"}
                        name={name}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                        disabled={disabled}
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

function FileBox({ label, onChange, file, disabled }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                {file && (
                    <p className="text-xs text-green-600 mb-2">
                        ✓ {file.name}
                    </p>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={onChange}
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function MultiFileBox({ label, files, onChange, onRemove, disabled }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                {files && files.length > 0 && (
                    <div className="mb-2 space-y-1">
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
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                    disabled={disabled}
                />
                <p className="text-xs text-gray-500 mt-1">
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
