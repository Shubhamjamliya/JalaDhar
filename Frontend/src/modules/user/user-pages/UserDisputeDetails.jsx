import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoHourglassOutline,
    IoChatbubbleOutline,
    IoDocumentTextOutline,
    IoImageOutline,
    IoArrowForwardOutline,
} from "react-icons/io5";
import { getDisputeDetails, addDisputeComment } from "../../../services/userApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function UserDisputeDetails() {
    const navigate = useNavigate();
    const { disputeId } = useParams();
    const [loading, setLoading] = useState(true);
    const [dispute, setDispute] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadDisputeDetails();
    }, [disputeId]);

    const loadDisputeDetails = async () => {
        try {
            setLoading(true);
            const response = await getDisputeDetails(disputeId);
            if (response.success) {
                setDispute(response.data.dispute);
            } else {
                toast.showError(response.message || "Failed to load dispute details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load dispute details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            toast.showError("Please enter a comment");
            return;
        }

        setSubmittingComment(true);
        const loadingToast = toast.showLoading("Adding comment...");
        try {
            const response = await addDisputeComment(disputeId, { comment: newComment });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Comment added successfully!");
                setNewComment("");
                await loadDisputeDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to add comment");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: "bg-yellow-100 text-yellow-700",
            IN_PROGRESS: "bg-blue-100 text-blue-700",
            RESOLVED: "bg-green-100 text-green-700",
            CLOSED: "bg-gray-100 text-gray-700",
            REJECTED: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const getTypeLabel = (type) => {
        const labels = {
            PAYMENT_ISSUE: "Payment Issue",
            SERVICE_QUALITY: "Service Quality",
            VENDOR_BEHAVIOR: "Vendor Behavior",
            REPORT_ISSUE: "Report Issue",
            CANCELLATION: "Cancellation",
            REFUND: "Refund",
            OTHER: "Other",
        };
        return labels[type] || type;
    };

    if (loading) {
        return <LoadingSpinner message="Loading dispute details..." />;
    }

    if (!dispute) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Dispute not found</p>
                <button
                    onClick={() => navigate("/user/disputes")}
                    className="bg-[#0A84FF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#005BBB] transition-colors"
                >
                    Back to Disputes
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/user/disputes")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <IoChevronBackOutline className="text-2xl text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{dispute.subject}</h1>
                    <p className="text-sm text-gray-500">ID: #{dispute._id.toString().slice(-8).toUpperCase()}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                    {dispute.status}
                </span>
            </div>

            {/* Dispute Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Type</p>
                        <p className="text-sm font-medium text-gray-900">{getTypeLabel(dispute.type)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Priority</p>
                        <p className="text-sm font-medium text-gray-900">{dispute.priority}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Created</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(dispute.createdAt)}</p>
                    </div>
                    {dispute.assignedTo && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                            <p className="text-sm font-medium text-gray-900">{dispute.assignedTo.name}</p>
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">{dispute.description}</p>
                </div>
            </div>

            {/* Related Booking */}
            {dispute.booking && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Booking</h2>
                    <button
                        onClick={() => navigate(`/user/booking/${dispute.booking._id}`)}
                        className="text-sm text-[#0A84FF] hover:underline flex items-center gap-1"
                    >
                        View Booking #{dispute.booking._id.toString().slice(-8).toUpperCase()}
                        <IoArrowForwardOutline />
                    </button>
                </div>
            )}

            {/* Attachments */}
            {dispute.attachments && dispute.attachments.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {dispute.attachments.map((attachment, index) => (
                            <div key={index} className="relative">
                                {attachment.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                    <img
                                        src={attachment.url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(attachment.url, '_blank')}
                                    />
                                ) : (
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center w-full h-32 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <IoDocumentTextOutline className="text-3xl text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-600 truncate px-2">{attachment.fileName}</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments & Updates</h2>
                <div className="space-y-4 mb-6">
                    {dispute.comments && dispute.comments.length > 0 ? (
                        dispute.comments.map((comment, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg ${
                                    comment.commentedByModel === "Admin"
                                        ? "bg-blue-50 border-l-4 border-blue-500"
                                        : "bg-gray-50"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {comment.commentedBy?.name || (comment.commentedByModel === "Admin" ? "Admin" : "You")}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.comment}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                    )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="border-t pt-4">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment or update..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent mb-3"
                    />
                    <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="w-full bg-[#0A84FF] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#005BBB] transition-colors disabled:opacity-50"
                    >
                        {submittingComment ? "Adding..." : "Add Comment"}
                    </button>
                </form>
            </div>

            {/* Resolution */}
            {dispute.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Resolution</h2>
                    <p className="text-sm text-gray-700 mb-2">{dispute.resolution.notes}</p>
                    <p className="text-xs text-gray-500">
                        Resolved by {dispute.resolution.resolvedBy?.name || "Admin"} on {formatDate(dispute.resolution.resolvedAt)}
                    </p>
                </div>
            )}
        </div>
    );
}

