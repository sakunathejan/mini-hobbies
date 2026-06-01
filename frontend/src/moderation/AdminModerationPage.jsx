import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Ban, Clock, AlertTriangle, Loader2, Search, Shield, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import StatusBadge from "../moderation/StatusBadge.jsx";
import ModerationTimeline from "../moderation/ModerationTimeline.jsx";
import {
  getAdminCases,
  getAdminStats,
  getAdminCaseDetail,
  warnUser,
  suspendUser,
  banUser,
  liftModeration,
  resolveAppeal,
} from "../moderation/moderationService.js";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Pagination from "../components/ui/Pagination.jsx";

const DURATIONS = [
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "14 days", hours: 336 },
  { label: "30 days", hours: 720 },
];

const AdminModerationPage = () => {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalCustomerId, setModalCustomerId] = useState("");
  const [modalCustomerName, setModalCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(24);
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liftTarget, setLiftTarget] = useState(null);
  const [appealModal, setAppealModal] = useState(null);
  const [appealResponse, setAppealResponse] = useState("");

  const fetchCases = useCallback(async (p) => {
    setLoading(true);
    try {
      const result = await getAdminCases({ page: p, type: typeFilter || undefined, status: statusFilter || undefined, search: search || undefined });
      setCases(result.cases);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cases.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCases(page); }, [fetchCases, page]);

  const handleAction = (type, customer = {}) => {
    setModalType(type);
    setModalCustomerId(customer._id || "");
    setModalCustomerName(customer.name || "");
    setReason("");
    setDuration(24);
    setEvidence("");
    setNotes("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) { toast.error("Reason is required."); return; }
    setSubmitting(true);
    try {
      let result;
      if (modalType === "warn") {
        result = await warnUser(modalCustomerId, reason.trim(), evidence.trim(), notes.trim());
      } else if (modalType === "suspend") {
        result = await suspendUser(modalCustomerId, reason.trim(), duration, evidence.trim(), notes.trim());
      } else {
        result = await banUser(modalCustomerId, reason.trim(), evidence.trim(), notes.trim());
      }
      toast.success(result.message);
      setShowModal(false);
      fetchCases(page);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLift = async () => {
    if (!liftTarget) return;
    try {
      const result = await liftModeration(liftTarget);
      toast.success(result.message);
      setLiftTarget(null);
      fetchCases(page);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to lift moderation.");
    }
  };

  const openCaseDetail = async (caseId) => {
    try {
      const detail = await getAdminCaseDetail(caseId);
      setSelectedCase(detail);
    } catch (err) {
      toast.error("Failed to load case details.");
    }
  };

  const handleAppealResolve = async (action) => {
    if (!appealModal || !appealResponse.trim()) { toast.error("Response is required."); return; }
    try {
      const result = await resolveAppeal(appealModal, appealResponse.trim(), action);
      toast.success(result.message);
      setAppealModal(null);
      setAppealResponse("");
      fetchCases(page);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve appeal.");
    }
  };

  const statCards = stats ? [
    { label: "Active Bans", value: stats.activeBans, color: "text-red-600" },
    { label: "Active Suspensions", value: stats.activeSuspensions, color: "text-orange-600" },
    { label: "Active Warnings", value: stats.activeWarnings, color: "text-amber-600" },
    { label: "Pending Appeals", value: stats.pendingAppeals, color: "text-blue-600" },
    { label: "Total Cases", value: stats.totalCases, color: "text-gray-900" },
  ] : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Moderation</h1>
          <p className="mt-1 text-sm text-gray-600">Manage warnings, suspensions, and bans.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by customer name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input w-full pl-9 text-sm" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="input w-36 text-sm">
          <option value="">All types</option>
          <option value="warning">Warning</option>
          <option value="suspension">Suspension</option>
          <option value="ban">Ban</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-36 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="appealed">Appealed</option>
          <option value="lifted">Lifted</option>
        </select>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
            <Shield className="h-8 w-8" />
            <p className="text-sm">No moderation cases found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cases.map((c) => (
              <div key={c._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.customerId?.name || "Unknown Customer"}
                    </span>
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-gray-500 capitalize">{c.type}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600 line-clamp-1">{c.reason}</p>
                  <p className="text-xs text-gray-400">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-LK") : "—"}
                    {c.issuedByName ? ` · by ${c.issuedByName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openCaseDetail(c._id)} className="btn-secondary text-xs">View</button>
                  {c.status === "active" && (
                    <button type="button" onClick={() => setLiftTarget(c.customerId?._id || c.customerId)} className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Lift</button>
                  )}
                  {c.appealed && c.status === "appealed" && (
                    <button type="button" onClick={() => setAppealModal(c._id)} className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700">Review Appeal</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3">
            <Pagination current={page} total={pagination.pages} onChange={setPage} />
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold capitalize">{modalType} Customer</h3>
            <p className="mt-1 text-sm text-gray-500">{modalCustomerName || modalCustomerId}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Reason</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input w-full text-sm" placeholder="Describe the reason..." />
              </div>
              {modalType === "suspend" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Duration</label>
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input w-full text-sm">
                    {DURATIONS.map((d) => (
                      <option key={d.hours} value={d.hours}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Evidence (optional)</label>
                <input type="text" value={evidence} onChange={(e) => setEvidence(e.target.value)} className="input w-full text-sm" placeholder="Link or reference..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Admin Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input w-full text-sm" placeholder="Internal notes..." />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary text-xs">
                {submitting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                {submitting ? "Processing..." : `Issue ${modalType === "suspend" ? "Suspension" : modalType === "warn" ? "Warning" : "Ban"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!liftTarget} title="Lift Moderation?" message="Remove all active moderation actions on this customer?" confirmLabel="Lift" cancelLabel="Cancel" destructive={false} onConfirm={handleLift} onCancel={() => setLiftTarget(null)} />

      {appealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAppealModal(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Review Appeal</h3>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">Response to Customer</label>
              <textarea value={appealResponse} onChange={(e) => setAppealResponse(e.target.value)} rows={3} className="input w-full text-sm" placeholder="Write your response..." />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setAppealModal(null)} className="btn-secondary text-xs">Cancel</button>
              <button type="button" onClick={() => handleAppealResolve("reject")} className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Reject</button>
              <button type="button" onClick={() => handleAppealResolve("lift")} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Accept & Lift</button>
            </div>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedCase(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Case Details</h3>
              <button type="button" onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold">{selectedCase.customerId?.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{selectedCase.customerId?.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><StatusBadge status={selectedCase.type} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={selectedCase.status} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Reason</span><span>{selectedCase.reason}</span></div>
              {selectedCase.duration && <div className="flex justify-between"><span className="text-gray-500">Duration</span><span>{selectedCase.duration} hours</span></div>}
              {selectedCase.expiresAt && <div className="flex justify-between"><span className="text-gray-500">Expires</span><span>{new Date(selectedCase.expiresAt).toLocaleString("en-LK")}</span></div>}
              {selectedCase.issuedByName && <div className="flex justify-between"><span className="text-gray-500">Issued By</span><span>{selectedCase.issuedByName}</span></div>}
              {selectedCase.evidence && <div className="flex justify-between"><span className="text-gray-500">Evidence</span><span>{selectedCase.evidence}</span></div>}
              {selectedCase.resolvedAt && <div className="flex justify-between"><span className="text-gray-500">Resolved</span><span>{new Date(selectedCase.resolvedAt).toLocaleString("en-LK")}</span></div>}
              {selectedCase.appealed && (
                <>
                  <div className="border-t pt-3 mt-3"><p className="font-semibold text-blue-600">Appeal</p></div>
                  <div className="flex justify-between"><span className="text-gray-500">Message</span><span>{selectedCase.appealMessage}</span></div>
                  {selectedCase.appealResponse && <div className="flex justify-between"><span className="text-gray-500">Response</span><span>{selectedCase.appealResponse}</span></div>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModerationPage;
