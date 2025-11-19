import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoAddCircleOutline,
    IoTrashOutline,
    IoPencilOutline,
    IoCloseOutline,
    IoCheckmarkOutline,
    IoImageOutline,
} from "react-icons/io5";

export default function VendorServices() {
    const navigate = useNavigate();
    const [services, setServices] = useState([
        {
            id: 1,
            name: "Pit Cleaning",
            price: 1500,
            duration: "2 hours",
            description: "Professional pit cleaning service",
            images: [],
            isActive: true,
        },
        {
            id: 2,
            name: "Groundwater Survey",
            price: 3000,
            duration: "4 hours",
            description: "Complete groundwater survey and analysis",
            images: [],
            isActive: true,
        },
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        duration: "",
        description: "",
        images: [],
    });
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newPreviews = [];
        let loadedCount = 0;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                loadedCount++;
                if (loadedCount === files.length) {
                    setImagePreviews((prev) => [...prev, ...newPreviews]);
                    setFormData((prev) => ({
                        ...prev,
                        images: [...prev.images, ...newPreviews],
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (index) => {
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);
        setFormData({ ...formData, images: newPreviews });
    };

    const handleAddService = () => {
        if (formData.name && formData.price) {
            const newService = {
                id: Date.now(),
                name: formData.name,
                price: parseFloat(formData.price),
                duration: formData.duration,
                description: formData.description,
                images: formData.images,
                isActive: true,
            };
            setServices([...services, newService]);
            setFormData({
                name: "",
                price: "",
                duration: "",
                description: "",
                images: [],
            });
            setImagePreviews([]);
            setIsAdding(false);
        }
    };

    const handleDeleteService = (id) => {
        setServices(services.filter((service) => service.id !== id));
    };

    const handleEditService = (service) => {
        setEditingId(service.id);
        setFormData({
            name: service.name,
            price: service.price.toString(),
            duration: service.duration || "",
            description: service.description,
            images: service.images || [],
        });
        setImagePreviews(service.images || []);
    };

    const handleUpdateService = () => {
        if (formData.name && formData.price) {
            setServices(
                services.map((service) =>
                    service.id === editingId
                        ? {
                              ...service,
                              name: formData.name,
                              price: parseFloat(formData.price),
                              duration: formData.duration,
                              description: formData.description,
                              images: formData.images,
                          }
                        : service
                )
            );
            setFormData({
                name: "",
                price: "",
                duration: "",
                description: "",
                images: [],
            });
            setImagePreviews([]);
            setEditingId(null);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            name: "",
            price: "",
            duration: "",
            description: "",
            images: [],
        });
        setImagePreviews([]);
    };

    const toggleServiceActive = (id) => {
        setServices(
            services.map((service) =>
                service.id === id
                    ? { ...service, isActive: !service.isActive }
                    : service
            )
        );
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

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                        Your Services
                    </h1>
                    <p className="text-[#4A4A4A] text-sm">
                        Manage your services, prices, and descriptions
                    </p>
                </div>
                {!isAdding && editingId === null && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-[#0A84FF] text-white p-4 rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#005BBB] transition-colors fixed bottom-20 right-4 z-40 md:relative md:bottom-0 md:right-0"
                    >
                        <IoAddCircleOutline className="text-2xl" />
                    </button>
                )}
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
                                        placeholder="e.g., Pit Cleaning"
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>

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
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Duration *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                duration: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., 2 hours"
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
                                    />
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

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Photos (Multiple) *
                                    </label>
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {imagePreviews.map(
                                                (preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`Preview ${
                                                                index + 1
                                                            }`}
                                                            className="w-full h-24 object-cover rounded-[8px]"
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
            <div className="space-y-4">
                {services.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
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
                            key={service.id}
                            className="bg-white rounded-[12px] p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] transition-shadow"
                        >
                            <div className="flex gap-4">
                                {/* Thumbnail */}
                                {service.images && service.images.length > 0 ? (
                                    <div className="w-24 h-24 flex-shrink-0">
                                        <img
                                            src={service.images[0]}
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
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {service.name}
                                            </h3>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={service.isActive}
                                                    onChange={() =>
                                                        toggleServiceActive(
                                                            service.id
                                                        )
                                                    }
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                                        service.isActive
                                                            ? "bg-[#0A84FF]"
                                                            : "bg-gray-300"
                                                    }`}
                                                >
                                                    <div
                                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                            service.isActive
                                                                ? "translate-x-6"
                                                                : ""
                                                        }`}
                                                    ></div>
                                                </div>
                                            </label>
                                        </div>
                                        {service.description && (
                                            <p className="text-sm text-[#4A4A4A] mb-2 line-clamp-2">
                                                {service.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4">
                                            <p className="text-lg font-semibold text-[#0A84FF]">
                                                ₹
                                                {service.price.toLocaleString()}
                                            </p>
                                            {service.duration && (
                                                <p className="text-sm text-gray-600">
                                                    {service.duration}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() =>
                                                handleEditService(service)
                                            }
                                            className="bg-[#E7F0FB] text-[#0A84FF] p-2 rounded-[8px] hover:bg-[#D0E1F7] transition-colors"
                                            disabled={
                                                editingId !== null || isAdding
                                            }
                                        >
                                            <IoPencilOutline className="text-lg" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteService(service.id)
                                            }
                                            className="bg-red-50 text-red-600 p-2 rounded-[8px] hover:bg-red-100 transition-colors"
                                            disabled={
                                                editingId !== null || isAdding
                                            }
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
        </div>
    );
}
