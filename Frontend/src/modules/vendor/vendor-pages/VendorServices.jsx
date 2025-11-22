import { useState, useEffect } from "react";
import {
    IoAddCircleOutline,
    IoTrashOutline,
    IoPencilOutline,
    IoCloseOutline,
    IoCheckmarkOutline,
    IoImageOutline,
    IoConstructOutline,
} from "react-icons/io5";
import {
    getMyServices,
    addService,
    updateService,
    deleteService,
    uploadServiceImages,
} from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";
import ProfileHeader from "../../shared/components/ProfileHeader";
import SectionHeading from "../../shared/components/SectionHeading";

export default function VendorServices() {
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        machineType: "",
        skills: "",
        price: "",
        duration: "",
        category: "",
    });
    const [imagePreviews, setImagePreviews] = useState([]);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getMyServices();
            if (response.success) {
                setServices(response.data.services || []);
            } else {
                setError(response.message || "Failed to load services");
            }
        } catch (err) {
            console.error("Load services error:", err);
            setError("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newPreviews = [];
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push({ file, preview: reader.result });
                if (newPreviews.length === files.length) {
                    setImagePreviews([...imagePreviews, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (index) => {
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);
    };

    const handleAddService = async () => {
        try {
            setError("");
            setSuccess("");

            if (!formData.name || !formData.machineType || !formData.price || !formData.duration) {
                setError("Please fill in all required fields");
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('machineType', formData.machineType);
            formDataToSend.append('skills', JSON.stringify(formData.skills ? formData.skills.split(',').map(s => s.trim()) : []));
            formDataToSend.append('price', formData.price);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('category', formData.category || '');

            // Add images
            imagePreviews.forEach((item) => {
                if (item.file) {
                    formDataToSend.append('images', item.file);
                }
            });

            const response = await addService(formDataToSend);
            
            if (response.success) {
                setSuccess("Service added successfully! Waiting for admin approval.");
                setIsAdding(false);
                setFormData({
                    name: "",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "",
                    category: "",
                });
                setImagePreviews([]);
                await loadServices();
            } else {
                setError(response.message || "Failed to add service");
            }
        } catch (err) {
            console.error("Add service error:", err);
            setError("Failed to add service. Please try again.");
        }
    };

    const handleEditService = (service) => {
        setEditingId(service._id);
        setFormData({
            name: service.name || "",
            description: service.description || "",
            machineType: service.machineType || "",
            skills: Array.isArray(service.skills) ? service.skills.join(', ') : "",
            price: service.price?.toString() || "",
            duration: service.duration?.toString() || "",
            category: service.category || "",
        });
        setImagePreviews(service.images?.map(img => ({ preview: img.url, file: null })) || []);
        setIsAdding(true);
    };

    const handleUpdateService = async () => {
        try {
            setError("");
            setSuccess("");

            if (!formData.name || !formData.machineType || !formData.price || !formData.duration) {
                setError("Please fill in all required fields");
                return;
            }

            const updateData = {
                name: formData.name,
                description: formData.description || '',
                machineType: formData.machineType,
                skills: JSON.stringify(formData.skills ? formData.skills.split(',').map(s => s.trim()) : []),
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                category: formData.category || ''
            };

            const response = await updateService(editingId, updateData);
            
            if (response.success) {
                // Upload new images if any
                const newImages = imagePreviews.filter(item => item.file);
                if (newImages.length > 0) {
                    const imageFiles = newImages.map(item => item.file);
                    await uploadServiceImages(editingId, imageFiles);
                }

                setSuccess("Service updated successfully!");
                setIsAdding(false);
                setEditingId(null);
                setFormData({
                    name: "",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "",
                    category: "",
                });
                setImagePreviews([]);
                await loadServices();
            } else {
                setError(response.message || "Failed to update service");
            }
        } catch (err) {
            console.error("Update service error:", err);
            setError("Failed to update service. Please try again.");
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) {
            return;
        }

        try {
            const response = await deleteService(id);
            if (response.success) {
                setSuccess("Service deleted successfully!");
                await loadServices();
            } else {
                setError(response.message || "Failed to delete service");
            }
        } catch (err) {
            console.error("Delete service error:", err);
            setError("Failed to delete service. Please try again.");
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            name: "",
            description: "",
            machineType: "",
            skills: "",
            price: "",
            duration: "",
            category: "",
        });
        setImagePreviews([]);
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isAdding || editingId) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isAdding, editingId]);

    if (loading) {
        return <LoadingSpinner message="Loading services..." />;
    }

    const vendorProfileImage = vendor?.documents?.profilePicture?.url || null;

    return (
        <PageContainer>
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />

            {/* Profile Header */}
            <ProfileHeader 
                name={vendor?.name || "Vendor"} 
                profileImage={vendorProfileImage}
            />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                    Your Services
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Manage your services, prices, and descriptions
                </p>
            </div>

            {/* Add/Edit Service Modal */}
            {(isAdding || editingId) && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleCancel();
                        }
                    }}
                >
                    <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-[20px]">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? "Edit Service" : "Add New Service"}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Service Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Ground Water Detection"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Machine Type *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.machineType}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    machineType: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Water Detection Machine"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Describe your service..."
                                        rows="3"
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Skills (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.skills}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    skills: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Water Detection, Survey, Analysis"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    category: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Water Services"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Price (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    price: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., 1500"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Duration (minutes) *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    duration: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., 120"
                                            min="1"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Service Images
                                    </label>
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {imagePreviews.map(
                                                (item, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={item.preview}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-[8px]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveImage(index)
                                                            }
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                        >
                                                            <IoCloseOutline className="text-sm" />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D9DDE4] rounded-[12px] cursor-pointer hover:border-[#0A84FF] transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <IoImageOutline className="text-3xl text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600">
                                                Click to upload photos
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PNG, JPG up to 5MB (Multiple)
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={
                                            editingId
                                                ? handleUpdateService
                                                : handleAddService
                                        }
                                        className="flex-1 bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                                    >
                                        <IoCheckmarkOutline className="text-xl" />
                                        {editingId ? "Update" : "Add"}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-[12px] hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Services List */}
            <SectionHeading title={`Your Services (${services.length})`} />
            <div className="space-y-4">
                {services.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
                        <IoConstructOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                            No services added yet
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-[#0A84FF] text-white font-semibold py-2 px-6 rounded-[10px] hover:bg-[#005BBB] transition-colors"
                        >
                            Add Your First Service
                        </button>
                    </div>
                ) : (
                    services.map((service) => (
                        <div
                            key={service._id}
                            className="bg-white rounded-[12px] p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] transition-shadow"
                        >
                            <div className="flex gap-4">
                                {/* Thumbnail */}
                                {service.images && service.images.length > 0 ? (
                                    <div className="w-24 h-24 flex-shrink-0">
                                        <img
                                            src={service.images[0].url}
                                            alt={service.name}
                                            className="w-full h-full object-cover rounded-[12px]"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-[12px] flex items-center justify-center">
                                        <IoImageOutline className="text-3xl text-gray-400" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {service.name}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    service.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    service.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {service.status}
                                                </span>
                                            </div>
                                        </div>
                                        {service.description && (
                                            <p className="text-sm text-[#4A4A4A] mb-2 line-clamp-2">
                                                {service.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <p className="text-lg font-semibold text-[#0A84FF]">
                                                ₹{service.price?.toLocaleString()}
                                            </p>
                                            {service.duration && (
                                                <p className="text-sm text-gray-600">
                                                    {service.duration} min
                                                </p>
                                            )}
                                            {service.machineType && (
                                                <p className="text-sm text-gray-600">
                                                    {service.machineType}
                                                </p>
                                            )}
                                        </div>
                                        {service.skills && service.skills.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {service.skills.map((skill, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleEditService(service)}
                                            className="bg-[#E7F0FB] text-[#0A84FF] p-2 rounded-[8px] hover:bg-[#D0E1F7] transition-colors"
                                            disabled={editingId !== null || isAdding}
                                        >
                                            <IoPencilOutline className="text-lg" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteService(service._id)}
                                            className="bg-red-50 text-red-600 p-2 rounded-[8px] hover:bg-red-100 transition-colors"
                                            disabled={editingId !== null || isAdding}
                                        >
                                            <IoTrashOutline className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Service Button */}
            {!isAdding && editingId === null && services.length > 0 && (
                <div className="fixed bottom-20 right-4 z-40 md:relative md:bottom-0 md:right-0 md:mt-6">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-[#0A84FF] text-white p-4 rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#005BBB] transition-colors"
                    >
                        <IoAddCircleOutline className="text-2xl" />
                    </button>
                </div>
            )}
        </PageContainer>
    );
}
