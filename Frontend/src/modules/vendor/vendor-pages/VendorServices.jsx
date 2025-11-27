import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import SectionHeading from "../../shared/components/SectionHeading";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function VendorServices() {
    const navigate = useNavigate();
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const toast = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [previewingService, setPreviewingService] = useState(null);
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
            const response = await getMyServices();
            if (response.success) {
                setServices(response.data.services || []);
            } else {
                toast.showError(response.message || "Failed to load services");
            }
        } catch (err) {
            handleApiError(err, "Failed to load services");
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

            if (
                !formData.name ||
                !formData.machineType ||
                !formData.price ||
                !formData.duration
            ) {
                setError("Please fill in all required fields");
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name);
            formDataToSend.append("description", formData.description || "");
            formDataToSend.append("machineType", formData.machineType);
            formDataToSend.append(
                "skills",
                JSON.stringify(
                    formData.skills
                        ? formData.skills.split(",").map((s) => s.trim())
                        : []
                )
            );
            formDataToSend.append("price", formData.price);
            formDataToSend.append("duration", formData.duration);
            formDataToSend.append("category", formData.category || "");

            // Add images
            imagePreviews.forEach((item) => {
                if (item.file) {
                    formDataToSend.append("images", item.file);
                }
            });

            const response = await addService(formDataToSend);

            if (response.success) {
                setSuccess(
                    "Service added successfully! Waiting for admin approval."
                );
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
            setError("Failed to add service. Please try again.");
        }
    };

    const handleEditService = (service) => {
        setEditingId(service._id);
        setFormData({
            name: service.name || "",
            description: service.description || "",
            machineType: service.machineType || "",
            skills: Array.isArray(service.skills)
                ? service.skills.join(", ")
                : "",
            price: service.price?.toString() || "",
            duration: service.duration?.toString() || "",
            category: service.category || "",
        });
        setImagePreviews(
            service.images?.map((img) => ({ preview: img.url, file: null })) ||
                []
        );
        setIsAdding(true);
    };

    const handleUpdateService = async () => {
        try {
            setError("");
            setSuccess("");

            if (
                !formData.name ||
                !formData.machineType ||
                !formData.price ||
                !formData.duration
            ) {
                setError("Please fill in all required fields");
                return;
            }

            const updateData = {
                name: formData.name,
                description: formData.description || "",
                machineType: formData.machineType,
                skills: JSON.stringify(
                    formData.skills
                        ? formData.skills.split(",").map((s) => s.trim())
                        : []
                ),
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                category: formData.category || "",
            };

            const response = await updateService(editingId, updateData);

            if (response.success) {
                // Upload new images if any
                const newImages = imagePreviews.filter((item) => item.file);
                if (newImages.length > 0) {
                    const imageFiles = newImages.map((item) => item.file);
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
            setError("Failed to update service. Please try again.");
        }
    };

    const handleDeleteService = (id) => {
        setServiceToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return;
        const id = serviceToDelete;
        setShowDeleteConfirm(false);
        const loadingToast = toast.showLoading("Deleting service...");
        try {
            const response = await deleteService(id);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Service deleted successfully!");
                setServiceToDelete(null);
                await loadServices();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to delete service");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to delete service");
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
        if (isAdding || editingId || previewingService) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isAdding, editingId, previewingService]);

    if (loading) {
        return <LoadingSpinner message="Loading services..." />;
    }

    return (
        <>
        <PageContainer>

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center gap-2 text-[#3A3A3A] hover:text-[#0A84FF] transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="text-sm font-medium">Back</span>
            </button>

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
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_6px_16px_rgba(10,132,255,0.1)]">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between rounded-t-lg">
                            <h2 className="text-xl font-bold text-[#3A3A3A]">
                                {editingId
                                    ? "Edit Service"
                                    : "Add a New Service"}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    editingId
                                        ? handleUpdateService()
                                        : handleAddService();
                                }}
                            >
                                <div>
                                    <label
                                        className="mb-1 block text-sm font-medium text-[#6B7280]"
                                        htmlFor="service-name"
                                    >
                                        Service Name
                                    </label>
                                    <input
                                        type="text"
                                        id="service-name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Commercial Tank Cleaning"
                                        className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-1 block text-sm font-medium text-[#6B7280]"
                                        htmlFor="service-photos"
                                    >
                                        Service Photos
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
                                                            alt={`Preview ${
                                                                index + 1
                                                            }`}
                                                            className="w-full h-24 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveImage(
                                                                    index
                                                                )
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
                                    <input
                                        className="block w-full text-sm text-[#6B7280] file:mr-4 file:rounded-full file:border-0 file:bg-[#0A84FF]/10 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-[#0A84FF] hover:file:bg-[#0A84FF]/20"
                                        id="service-photos"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className="mb-1 block text-sm font-medium text-[#6B7280]"
                                            htmlFor="service-price"
                                        >
                                            Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            id="service-price"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    price: e.target.value,
                                                })
                                            }
                                            placeholder="1500"
                                            min="0"
                                            step="0.01"
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="mb-1 block text-sm font-medium text-[#6B7280]"
                                            htmlFor="service-duration"
                                        >
                                            Duration (min)
                                        </label>
                                        <input
                                            type="number"
                                            id="service-duration"
                                            value={formData.duration}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    duration: e.target.value,
                                                })
                                            }
                                            placeholder="90"
                                            min="1"
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        className="mb-1 block text-sm font-medium text-[#6B7280]"
                                        htmlFor="service-description"
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="service-description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Describe the service in detail..."
                                        rows="4"
                                        className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                    />
                                </div>

                                {/* Additional Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                                            Machine Type
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
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#6B7280]">
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
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[#6B7280]">
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
                                        className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                    />
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        className="w-full rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] py-3.5 text-base font-semibold text-white shadow-[0_6px_16px_rgba(10,132,255,0.1)] transition hover:opacity-90"
                                    >
                                        {editingId
                                            ? "Update Service"
                                            : "Submit Service"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Services List */}
            <div className="flex flex-col gap-5">
                {services.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-[0_6px_16px_rgba(10,132,255,0.1)]">
                        <IoConstructOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                            No services added yet
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-[#0A84FF] text-white font-semibold py-2 px-6 rounded-lg hover:bg-[#005BBB] transition-colors"
                        >
                            Add Your First Service
                        </button>
                    </div>
                ) : (
                    services.map((service) => (
                        <div
                            key={service._id}
                            className="flex flex-col rounded-xl bg-white p-4 shadow-[0_6px_16px_rgba(10,132,255,0.1)]"
                        >
                            <div className="flex items-center gap-4">
                                {/* Service Image */}
                                {service.images && service.images.length > 0 ? (
                                    <div
                                        className="h-24 w-24 shrink-0 rounded-lg bg-cover bg-center bg-no-repeat"
                                        style={{
                                            backgroundImage: `url("${service.images[0].url}")`,
                                        }}
                                    ></div>
                                ) : (
                                    <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <IoImageOutline className="text-3xl text-gray-400" />
                                    </div>
                                )}

                                <div className="flex-1">
                                    <h2 className="text-base font-bold text-[#3A3A3A]">
                                        {service.name}
                                    </h2>
                                    {service.description && (
                                        <p className="mt-1 text-xs text-[#6B7280]">
                                            {service.description}
                                        </p>
                                    )}
                                    <p className="mt-2 text-base font-semibold text-[#0A84FF]">
                                        ₹
                                        {service.price?.toLocaleString(
                                            "en-IN",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                        {service.duration &&
                                            ` / ${service.duration} min`}
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setPreviewingService(service)
                                    }
                                    className="text-[#00C2A8] self-start"
                                    disabled={editingId !== null || isAdding}
                                >
                                    <span className="material-symbols-outlined">
                                        visibility
                                    </span>
                                </button>
                            </div>

                            <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
                                <label className="switch-container relative inline-flex cursor-pointer items-center">
                                    <input
                                        checked={service.isActive || false}
                                        className="peer sr-only"
                                        type="checkbox"
                                        readOnly
                                    />
                                    <div
                                        className={`slider peer h-6 w-10 rounded-full after:absolute after:top-[4px] after:left-[4px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:content-[''] peer-focus:outline-none transition-all ${
                                            service.isActive
                                                ? "bg-[#0A84FF] after:translate-x-4"
                                                : "bg-gray-200"
                                        }`}
                                    ></div>
                                    <span className="ml-3 text-sm font-medium text-[#3A3A3A]">
                                        {service.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </label>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Preview Service Modal */}
            {previewingService && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setPreviewingService(null);
                        }
                    }}
                >
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        {/* Header with Gradient */}
                        <div
                            className="flex-shrink-0 rounded-t-xl p-5 flex items-center justify-between"
                            style={{
                                background:
                                    "linear-gradient(135deg, #0A84FF 0%, #00C2A8 100%)",
                            }}
                        >
                            <h2 className="text-xl font-bold text-white">
                                Service Details
                            </h2>
                            <button
                                onClick={() => setPreviewingService(null)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-white" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-[#F3F7FA]">
                            <div className="space-y-5">
                                {/* Service Images */}
                                {previewingService.images &&
                                    previewingService.images.length > 0 && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    image
                                                </span>
                                                <h3 className="text-sm font-semibold text-[#3A3A3A]">
                                                    Service Images
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                {previewingService.images.map(
                                                    (image, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative w-full rounded-lg overflow-hidden"
                                                        >
                                                            <img
                                                                src={image.url}
                                                                alt={`Service ${
                                                                    index + 1
                                                                }`}
                                                                className="w-full h-auto object-cover rounded-lg"
                                                            />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Service Name */}
                                <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                            design_services
                                        </span>
                                        <label className="block text-sm font-semibold text-[#3A3A3A]">
                                            Service Name
                                        </label>
                                    </div>
                                    <p className="text-base font-bold text-[#3A3A3A]">
                                        {previewingService.name}
                                    </p>
                                </div>

                                {/* Description */}
                                {previewingService.description && (
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                description
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Description
                                            </label>
                                        </div>
                                        <p className="text-sm text-[#6B7280] leading-relaxed">
                                            {previewingService.description}
                                        </p>
                                    </div>
                                )}

                                {/* Machine Type */}
                                {previewingService.machineType && (
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                precision_manufacturing
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Machine Type
                                            </label>
                                        </div>
                                        <p className="text-sm text-[#3A3A3A]">
                                            {previewingService.machineType}
                                        </p>
                                    </div>
                                )}

                                {/* Price and Duration */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                payments
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Price
                                            </label>
                                        </div>
                                        <p className="text-base font-semibold text-[#0A84FF]">
                                            ₹
                                            {previewingService.price?.toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </p>
                                    </div>
                                    {previewingService.duration && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    schedule
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Duration
                                                </label>
                                            </div>
                                            <p className="text-sm text-[#3A3A3A]">
                                                {previewingService.duration}{" "}
                                                minutes
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Category and Skills in Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {previewingService.category && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    category
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Category
                                                </label>
                                            </div>
                                            <p className="text-sm text-[#3A3A3A]">
                                                {previewingService.category}
                                            </p>
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                info
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Status
                                            </label>
                                        </div>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                                previewingService.status ===
                                                "APPROVED"
                                                    ? "bg-green-100 text-green-700"
                                                    : previewingService.status ===
                                                      "PENDING"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : previewingService.status ===
                                                      "REJECTED"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {previewingService.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Skills */}
                                {previewingService.skills &&
                                    previewingService.skills.length > 0 && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    star
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Skills
                                                </label>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {previewingService.skills.map(
                                                    (skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1.5 bg-[#0A84FF]/10 text-[#0A84FF] rounded-full text-xs font-medium"
                                                        >
                                                            {skill}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Active Status */}
                                <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                            toggle_on
                                        </span>
                                        <label className="block text-sm font-semibold text-[#3A3A3A]">
                                            Active Status
                                        </label>
                                    </div>
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                            previewingService.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {previewingService.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer with Actions */}
                        <form className="flex-shrink-0 border-t border-gray-100 bg-white p-5 flex gap-3 justify-start rounded-b-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    handleEditService(previewingService);
                                    setPreviewingService(null);
                                }}
                                className="bg-[#0A84FF] text-white py-3.5 px-6 rounded-lg hover:bg-[#005BBB] transition-colors flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                                disabled={editingId !== null || isAdding}
                            >
                                <span className="material-symbols-outlined text-base">
                                    edit
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleDeleteService(
                                        previewingService._id
                                    );
                                    setPreviewingService(null);
                                }}
                                className="bg-red-500 text-white py-3.5 px-6 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                                disabled={editingId !== null || isAdding}
                            >
                                <span className="material-symbols-outlined text-base">
                                    delete
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

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

        {/* Delete Service Confirmation Modal */}
        <ConfirmModal
            isOpen={showDeleteConfirm}
            onClose={() => {
                setShowDeleteConfirm(false);
                setServiceToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Service"
            message="Are you sure you want to delete this service? This action cannot be undone."
            confirmText="Yes, Delete"
            cancelText="Cancel"
            confirmColor="danger"
        />
        </>
    );
}
