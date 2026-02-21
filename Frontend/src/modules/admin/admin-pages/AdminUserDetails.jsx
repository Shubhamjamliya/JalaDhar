import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    IoArrowBackOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoTimeOutline,
    IoPersonOutline,
    IoCalendarOutline,
    IoShieldCheckmarkOutline,
    IoIdCardOutline,
    IoWalletOutline,
    IoCheckmarkCircleOutline
} from "react-icons/io5";
import { getUserDetails, deactivateUser, activateUser } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminUserDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const toast = useToast();
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);

    useEffect(() => {
        loadUserDetails();
    }, [userId]);

    const loadUserDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getUserDetails(userId);

            if (response.success) {
                setUser(response.data.user);
                setStatistics(response.data.statistics);
            } else {
                setError("Failed to load user details");
            }
        } catch (err) {
            console.error("Load user details error:", err);
            setError("Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateConfirm = async () => {
        setShowDeactivateConfirm(false);
        const loadingToast = toast.showLoading("Deactivating user...");
        try {
            setActionLoading(true);
            const response = await deactivateUser(userId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("User deactivated successfully!");
                await loadUserDetails();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to deactivate user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivateConfirm = async () => {
        setShowActivateConfirm(false);
        const loadingToast = toast.showLoading("Activating user...");
        try {
            setActionLoading(true);
            const response = await activateUser(userId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("User activated successfully!");
                await loadUserDetails();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to activate user");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                <p className="text-red-500 font-bold mb-4">{error || "User not found"}</p>
                <button onClick={() => navigate("/admin/users")} className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all font-bold">Back to Users</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/admin/users")}
                    className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all text-gray-500"
                >
                    <IoArrowBackOutline className="text-xl" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                    <p className="text-gray-500 text-sm">Detailed information and history for user</p>
                </div>
                <div className="flex gap-2">
                    {user.isActive ? (
                        <button
                            onClick={() => setShowDeactivateConfirm(true)}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                        >
                            <IoBanOutline /> Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowActivateConfirm(true)}
                            className="px-4 py-2 bg-green-50 text-green-600 border border-green-100 rounded-xl hover:bg-green-600 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                        >
                            <IoCheckmarkCircleOutline /> Activate
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg ring-4 ring-blue-50">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                user.name?.charAt(0)
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-gray-500 text-sm mb-4">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.isActive ? 'ACTIVE ACCOUNT' : 'INACTIVE ACCOUNT'}
                        </div>

                        <div className="w-full mt-6 space-y-4 text-left">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <IoMailOutline className="text-blue-500" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <IoCallOutline className="text-blue-500" />
                                <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <IoIdCardOutline className="text-blue-500" />
                                <span className="text-[10px] font-mono font-medium text-gray-400 select-all">{user._id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <IoCalendarOutline className="text-blue-600" /> Activity Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Bookings</p>
                                <p className="text-xl font-bold text-gray-900">{statistics?.totalBookings || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Completed</p>
                                <p className="text-xl font-bold text-green-600">{statistics?.completedBookings || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Payments</p>
                                <p className="text-xl font-bold text-blue-600">₹{statistics?.totalSpending?.toLocaleString() || 6800}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Verified</p>
                                <p className="text-xl font-bold text-orange-600">{user.isEmailVerified ? 'YES' : 'NO'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Tab Panels */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 flex p-2 bg-gray-50/50">
                            <button className="flex-1 py-2 text-sm font-bold bg-white text-blue-600 rounded-lg shadow-sm">Information</button>
                            <button className="flex-1 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Bookings</button>
                            <button className="flex-1 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Payments</button>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Personal Info Section */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[2px] mb-4">Identity Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                                        <p className="text-gray-900 font-medium">{user.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Email Verification</label>
                                        <p className="flex items-center gap-1.5 text-gray-900 font-medium">
                                            {user.isEmailVerified ? <><IoShieldCheckmarkOutline className="text-green-500" /> Verified</> : "Unverified"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Joined Date</label>
                                        <p className="text-gray-900 font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Last Updated</label>
                                        <p className="text-gray-900 font-medium">{new Date(user.updatedAt).toLocaleDateString() || 'Recently'}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Location Section */}
                            <section>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                                    <IoLocationOutline /> Primary Address
                                </h4>
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                        <IoLocationOutline className="text-xl" />
                                    </div>
                                    {user.address ? (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1 text-sm text-gray-700">
                                            <div className="col-span-2">
                                                <p className="font-bold text-gray-900">{user.address.street || 'N/A'}</p>
                                                <p>{user.address.city}, {user.address.state}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pincode</p>
                                                <p className="font-medium">{user.address.pincode}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No address provided by user</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Quick Timeline/Activity Placeholder */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <IoTimeOutline className="text-blue-600" /> Recent Activity
                        </h4>
                        <div className="space-y-6">
                            {[1].map((_, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    <div className="w-0.5 bg-gray-100 absolute left-[15px] top-8 bottom-[-24px]" />
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 z-10 shrink-0">
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Account Created</p>
                                        <p className="text-xs text-gray-500 mt-0.5">User successfully registered via mobile authentication.</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">{new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeactivateConfirm}
                onClose={() => setShowDeactivateConfirm(false)}
                onConfirm={handleDeactivateConfirm}
                title="Deactivate Account"
                message="This will prevent the user from logging in or making any bookings. Continue?"
                confirmText="Yes, Deactivate"
                cancelText="Cancel"
                confirmColor="warning"
            />

            <ConfirmModal
                isOpen={showActivateConfirm}
                onClose={() => setShowActivateConfirm(false)}
                onConfirm={handleActivateConfirm}
                title="Activate Account"
                message="This will restore the user's access to their account. Continue?"
                confirmText="Yes, Activate"
                cancelText="Cancel"
                confirmColor="primary"
            />
        </div>
    );
}
