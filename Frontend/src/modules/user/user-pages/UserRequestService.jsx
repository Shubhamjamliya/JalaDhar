import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoImageOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCloseOutline,
} from "react-icons/io5";

export default function UserRequestService() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        serviceType: "",
        description: "",
        date: "",
        time: "",
        address: "",
        images: [],
    });

    const serviceTypes = [
        "Pit Cleaning",
        "Groundwater Survey",
        "Water Testing",
        "Borewell Service",
        "Water Tank Cleaning",
        "Pipe Repair",
    ];

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setFormData({
            ...formData,
            images: [...formData.images, ...newImages],
        });
    };

    const handleRemoveImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save request to localStorage
        const requests = JSON.parse(localStorage.getItem("userRequests")) || [];
        const newRequest = {
            id: Date.now(),
            ...formData,
            status: "pending",
            createdAt: new Date().toISOString(),
        };
        requests.push(newRequest);
        localStorage.setItem("userRequests", JSON.stringify(requests));
        alert("Service request submitted successfully!");
        navigate("/user/status");
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Request Service
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Fill in the details to request a service
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Service Type */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Select Service Type
                    </label>
                    <select
                        value={formData.serviceType}
                        onChange={(e) =>
                            setFormData({ ...formData, serviceType: e.target.value })
                        }
                        required
                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                    >
                        <option value="">Choose a service</option>
                        {serviceTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Upload Problem Images */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Upload Problem Images
                    </label>
                    <div className="space-y-3">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D9DDE4] rounded-[12px] bg-white cursor-pointer hover:border-[#0A84FF] transition-colors shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <IoImageOutline className="text-3xl text-[#0A84FF] mb-2" />
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-[#0A84FF]">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <p className="text-xs text-[#4A4A4A] mt-1">
                                    PNG, JPG up to 5MB
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                            />
                        </label>

                        {/* Image Previews */}
                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {formData.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="relative group rounded-[10px] overflow-hidden"
                                    >
                                        <img
                                            src={image.preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <IoCloseOutline className="text-sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        required
                        rows="4"
                        placeholder="Describe your problem in detail..."
                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] resize-none"
                    />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            <IoCalendarOutline className="inline text-base mr-1" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData({ ...formData, date: e.target.value })
                            }
                            required
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            <IoTimeOutline className="inline text-base mr-1" />
                            Time
                        </label>
                        <input
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                                setFormData({ ...formData, time: e.target.value })
                            }
                            required
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        <IoLocationOutline className="inline text-base mr-1" />
                        Address
                    </label>
                    <textarea
                        value={formData.address}
                        onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                        }
                        required
                        rows="3"
                        placeholder="Enter your complete address..."
                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] resize-none"
                    />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-[#0A84FF] text-white font-semibold py-4 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors shadow-[0px_4px_10px_rgba(10,132,255,0.2)] text-lg"
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    );
}

