import React, { useState } from "react";
import {
  IoTimeOutline,
  IoPersonOutline,
  IoCloseOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoSwapHorizontalOutline,
  IoCheckmarkCircleOutline
} from "react-icons/io5";

export default function AssignmentHistoryModal({
  isOpen,
  onClose,
  entityTitle = "Request",
  assignedTo,
  assignmentHistory = [],
  availableAdmins = [],
  onReassign,
  isSuperAdmin = false
}) {
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);

  if (!isOpen) return null;

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      setIsSubmitting(true);
      await onReassign(selectedAdmin, reassignReason, reassignNotes);
      setShowReassignForm(false);
      setSelectedAdmin("");
      setReassignReason("");
      setReassignNotes("");
    } catch (err) {
      console.error("Reassign failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100">
              <IoTimeOutline />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Assignment Audit History</h3>
              <p className="text-xs text-gray-400">Complete immutable record of admin assignments & reassignments for {entityTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* Current Assigned Admin Card */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {assignedTo?.name ? assignedTo.name.charAt(0).toUpperCase() : <IoPersonOutline />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Currently Assigned To</span>
              <span className="text-xs font-bold text-gray-900">{assignedTo?.name || "Unassigned"}</span>
              {assignedTo?.email && <span className="text-[11px] text-gray-500 block">{assignedTo.email}</span>}
            </div>
          </div>

          {isSuperAdmin && !showReassignForm && (
            <button
              type="button"
              onClick={() => setShowReassignForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <IoSwapHorizontalOutline className="text-sm" />
              Reassign
            </button>
          )}
        </div>

        {/* Manual Reassign Form (Super Admin Only) */}
        {showReassignForm && (
          <form onSubmit={handleReassignSubmit} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Manual Reassignment (Super Admin)</span>
              <button
                type="button"
                onClick={() => setShowReassignForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select New Admin</label>
              <select
                required
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Choose Admin --</option>
                {availableAdmins.map((adm) => (
                  <option key={adm._id} value={adm._id}>
                    {adm.name} ({adm.role.replace(/_/g, ' ')}) - {adm.activeTicketsCount || 0} open tickets
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reason for Reassignment</label>
              <input
                type="text"
                required
                placeholder="e.g. Workload balancing, Admin on leave"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !selectedAdmin}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </form>
        )}

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Audit Trail Timeline</span>

          {assignmentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 font-medium">
              No previous assignment changes recorded.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {assignmentHistory.map((item, idx) => (
                <div key={item._id || idx} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs" />

                  <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">{item.assignedToName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(item.assignedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span className="bg-gray-200/60 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-700">
                        {item.assignedToRole?.replace(/_/g, ' ')}
                      </span>
                      <span>By: <strong className="text-gray-700">{item.reassignedByName || "SYSTEM"}</strong></span>
                    </div>

                    {item.reassignmentReason && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 p-1.5 rounded-lg mt-1 font-medium">
                        <strong>Reason:</strong> {item.reassignmentReason}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[10px] text-gray-400 italic mt-0.5">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
