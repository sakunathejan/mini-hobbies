import { useCallback, useEffect, useState } from "react";
import {
  Search, Loader2, Eye, Ban, Clock, AlertTriangle, CheckCircle, XCircle,
  Trash2, MessageSquare, Shield, User, Calendar, Filter, X,
  ChevronRight, Send, ThumbsUp, ThumbsDown, FileText, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge.jsx";
import ModerationTimeline from "../components/ModerationTimeline.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import {
  getAllCases, getModerationHistory, approveAppeal, rejectAppeal,
  deleteAppeal, deleteCase, updateAppealStatus, addAppealNote, getAppealStats,
} from "../services/moderationService.js";

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "appeals", label: "Appeals" },
  { key: "expired", label: "Expired" },
  { key: "lifted", label: "Lifted" },
];

const APPEAL_SUB_TABS = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "under_review", label: "Under Review", icon: Eye },
  { key: "waiting_customer", label: "Waiting", icon: MessageSquare },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "rejected", label: "Rejected", icon: XCircle },
  { key: "escalated", label: "Escalated", icon: AlertTriangle },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "warning", label: "Warnings" },
  { value: "suspension", label: "Suspensions" },
  { value: "ban", label: "Bans" },
];

const SEVERITY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const AdminModerationPage = () => {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [appealSubTab, setAppealSubTab] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedCase, setSelectedCase] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [noteInput, setNoteInput] = useState("");

  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCases = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search: search || undefined };
      if (statusFilter === "appeals") {
        params.appealStatus = appealSubTab;
      } else if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (typeFilter) params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await getAllCases(params);
      setCases(result.data);
      setPagination(result);
    } catch {} finally {
      setLoading(false);
    }
  }, [statusFilter, appealSubTab, typeFilter, search, startDate, endDate]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  useEffect(() => {
    if (statusFilter === "appeals") getAppealStats().then(setStats).catch(() => {});
  }, [statusFilter, fetchCases]);

  useEffect(() => {
    if (statusFilter !== "appeals") setAppealSubTab("pending");
  }, [statusFilter]);

  const openDetail = async (c) => {
    setSelectedCase(c);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getModerationHistory(c.customer?._id);
      setDetailData(data);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (caseId) => {
    try {
      const result = await approveAppeal(caseId, reviewNotes || "");
      toast.success("Appeal approved — account restored");
      setReviewModal(null);
      setReviewNotes("");
      setAppealSubTab("approved");
      fetchCases();
      if (selectedCase?._id === caseId) openDetail(selectedCase);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve appeal");
    }
  };

  const handleReject = async (caseId) => {
    if (!reviewNotes.trim()) { toast.error("Please provide a rejection reason."); return; }
    try {
      await rejectAppeal(caseId, reviewNotes);
      toast.success("Appeal rejected");
      setReviewModal(null);
      setReviewNotes("");
      setAppealSubTab("rejected");
      fetchCases();
      if (selectedCase?._id === caseId) openDetail(selectedCase);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject appeal");
    }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await updateAppealStatus(caseId, newStatus);
      toast.success(`Status set to ${newStatus.replace(/_/g, " ")}`);
      fetchCases();
      if (selectedCase?._id === caseId) openDetail(selectedCase);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !selectedCase) return;
    try {
      await addAppealNote(selectedCase._id, noteInput.trim());
      toast.success("Note added");
      setNoteInput("");
      openDetail(selectedCase);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add note");
    }
  };

  const handleDeleteRecord = async (caseId, name) => {
    setDeleteConfirm({ caseId, name });
  };

  const confirmDeleteRecord = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteCase(deleteConfirm.caseId);
      toast.success("Record deleted");
      if (selectedCase?._id === deleteConfirm.caseId) setSelectedCase(null);
      setDeleteConfirm(null);
      fetchCases();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Moderation</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchCases()} className="btn-secondary text-sm flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {statusFilter === "appeals" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Pending", value: stats.pending, color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
            { label: "Under Review", value: stats.underReview, color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
            { label: "Approved", value: stats.approved, color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
            { label: "Approval Rate", value: `${stats.approvalRate}%`, color: "bg-purple-50 text-purple-700 border-purple-200", icon: ThumbsUp },
            { label: "Active Bans", value: stats.activeBans, color: "bg-red-50 text-red-700 border-red-200", icon: Ban },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border ${s.color} p-4`}>
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 opacity-70" />
                <span className="text-xs font-medium opacity-70">{s.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${statusFilter === t.key ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-sm flex items-center gap-1.5 ${showFilters ? "bg-gray-200" : ""}`}>
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, reason, appeal..." className="input pl-9 text-sm w-64" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input text-sm">
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input text-sm" />
          </div>
          <button onClick={() => { setTypeFilter(""); setStartDate(""); setEndDate(""); setSearch(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline">Clear all</button>
        </div>
      )}

      {/* Appeals sub-tabs */}
      {statusFilter === "appeals" && (
        <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-1">
          {APPEAL_SUB_TABS.map((t) => (
            <button key={t.key} onClick={() => setAppealSubTab(t.key)}
              className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-semibold transition ${
                appealSubTab === t.key
                  ? "bg-white text-gray-900 border border-b-white border-gray-200 -mb-px shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cases.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Shield className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}

          {/* Case cards */}
          {statusFilter !== "appeals" ? (
            /* Table layout for non-appeals */
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Date</th>
                    <th className="w-28 p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cases.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{c.customer?.name || "—"}</div>
                        <div className="text-xs text-gray-500">{c.customer?.email || ""}</div>
                      </td>
                      <td className="p-4"><StatusBadge status={c.type} /></td>
                      <td className="p-4"><StatusBadge status={c.status} /></td>
                      <td className="max-w-[220px] truncate p-4 text-gray-600">{c.reason}</td>
                      <td className="p-4 text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-LK") : "—"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(c)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteRecord(c._id, c.customer?.name || "Unknown")}
                            className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete record">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card layout for appeals */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cases.map((c) => {
                const isPending = c.appealStatus === "pending";
                return (
                  <div key={c._id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                      {/* Top section */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-sm text-gray-700 uppercase">
                            {c.customer?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{c.customer?.name || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{c.customer?.email || ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={c.type} />
                          <StatusBadge status={c.appealStatus} />
                        </div>
                      </div>

                      {/* Middle section */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700 font-medium">Reason:</span>
                          <span className="text-gray-600">{c.reason}</span>
                        </div>
                        {c.appealMessage && (
                          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 mt-2">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <p className="text-sm text-gray-700 leading-relaxed">{c.appealMessage}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{new Date(c.createdAt).toLocaleDateString("en-LK")}</span>
                          {c.endAt && <span>· Ends: {new Date(c.endAt).toLocaleDateString("en-LK")}</span>}
                          {c.severity && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SEVERITY_COLORS[c.severity] || ""}`}>
                              {c.severity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                        <button onClick={() => openDetail(c)}
                          className="btn-secondary text-xs flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </button>
                        {c.appealStatus !== "none" && c.appealStatus !== "approved" && c.appealStatus !== "rejected" && (
                          <>
                            {isPending && (
                              <button onClick={() => handleStatusChange(c._id, "under_review")}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition">
                                Mark Under Review
                              </button>
                            )}
                            <button onClick={() => { setReviewModal({ caseId: c._id, action: "approve" }); setReviewNotes(""); }}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">
                              Approve
                            </button>
                            <button onClick={() => { setReviewModal({ caseId: c._id, action: "reject" }); setReviewNotes(""); }}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">
                              Reject
                            </button>
                            {!isPending && (
                              <button onClick={() => handleStatusChange(c._id, "pending")}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition">
                                Reset to Pending
                              </button>
                            )}
                          </>
                        )}
                        <button onClick={() => handleDeleteRecord(c._id, c.customer?.name || "Unknown")}
                          className="ml-auto rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete record">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchCases(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                p === pagination.page ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-bold text-sm uppercase">
                  {selectedCase.customer?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedCase.customer?.name || "Unknown"}</h2>
                  <p className="text-xs text-gray-500">{selectedCase.customer?.email || ""}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCase(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Case info */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Type</span>
                    <div className="mt-1"><StatusBadge status={selectedCase.type} /></div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                    <div className="mt-1"><StatusBadge status={selectedCase.status} /></div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Severity</span>
                    <p className="mt-1 font-medium text-gray-700 capitalize">{selectedCase.severity || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Moderator</span>
                    <p className="mt-1 font-medium text-gray-700">{selectedCase.moderator?.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Created</span>
                    <p className="mt-1 font-medium text-gray-700">{selectedCase.createdAt ? new Date(selectedCase.createdAt).toLocaleDateString("en-LK") : "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">End Date</span>
                    <p className="mt-1 font-medium text-gray-700">{selectedCase.endAt ? new Date(selectedCase.endAt).toLocaleDateString("en-LK") : "—"}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Moderation Reason</h3>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-800">{selectedCase.reason}</p>
                  {selectedCase.message && <p className="mt-2 text-xs text-gray-500">{selectedCase.message}</p>}
                </div>
              </div>

              {/* Appeal message */}
              {selectedCase.appealMessage && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Appeal Message</h3>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-blue-900 leading-relaxed">{selectedCase.appealMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status controls */}
              {selectedCase.appealStatus && selectedCase.appealStatus !== "none" && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Appeal Actions</h3>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Current:</span>
                      <StatusBadge status={selectedCase.appealStatus} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["under_review", "waiting_customer", "escalated"].filter((s) => s !== selectedCase.appealStatus).map((s) => (
                        <button key={s} onClick={() => handleStatusChange(selectedCase._id, s)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition">
                          {s.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    {selectedCase.appealStatus !== "approved" && selectedCase.appealStatus !== "rejected" && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => { setReviewModal({ caseId: selectedCase._id, action: "approve" }); setReviewNotes(""); }}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition">
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button onClick={() => { setReviewModal({ caseId: selectedCase._id, action: "reject" }); setReviewNotes(""); }}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Internal notes */}
              {selectedCase.appealStatus && selectedCase.appealStatus !== "none" && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Internal Notes</h3>
                  <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                      {selectedCase.appealInternalNotes?.length > 0 ? (
                        selectedCase.appealInternalNotes.map((n, i) => (
                          <div key={i} className="rounded-lg bg-gray-50 p-3">
                            <p className="text-sm text-gray-700">{n.text}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{n.author} · {n.createdAt ? new Date(n.createdAt).toLocaleString("en-LK") : ""}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">No internal notes yet.</p>
                      )}
                    </div>
                    <div className="border-t border-gray-100 p-3 flex gap-2">
                      <input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                        placeholder="Add a private note..." className="input text-sm flex-1" />
                      <button onClick={handleAddNote} disabled={!noteInput.trim()}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Moderation History</h3>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  {detailLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                  ) : (
                    <ModerationTimeline cases={detailData?.cases || []} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative w-full max-w-md animate-bounce-in rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                reviewModal.action === "approve" ? "bg-green-100" : "bg-red-100"
              }`}>
                {reviewModal.action === "approve"
                  ? <CheckCircle className="h-5 w-5 text-green-600" />
                  : <XCircle className="h-5 w-5 text-red-600" />}
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {reviewModal.action === "approve" ? "Approve Appeal" : "Reject Appeal"}
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {reviewModal.action === "approve"
                ? "This will restore the user's account and lift all active moderation actions."
                : "The moderation action will remain active. Add a reason the user will see."}
            </p>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-700">
                {reviewModal.action === "approve" ? "Approval note (optional)" : "Rejection reason *"}
              </label>
              <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                rows={3} className="input text-sm w-full" placeholder={
                  reviewModal.action === "approve"
                    ? "Optional note for the user..."
                    : "Explain why the appeal was rejected..."
                } />
              {reviewModal.action === "reject" && !reviewNotes.trim() && (
                <p className="text-xs text-red-500">A reason is required when rejecting.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setReviewModal(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => reviewModal.action === "approve" ? handleApprove(reviewModal.caseId) : handleReject(reviewModal.caseId)}
                disabled={reviewModal.action === "reject" && !reviewNotes.trim()}
                className={`text-sm px-4 py-2 rounded-lg font-semibold text-white transition ${
                  reviewModal.action === "approve"
                    ? "bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    : "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                }`}>
                {reviewModal.action === "approve" ? "Approve Appeal" : "Reject Appeal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Record"
        message={`Permanently delete the record for "${deleteConfirm?.name || "this customer"}"? All moderation data, appeal history, and internal notes will be removed. This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Record"}
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteRecord}
        onCancel={() => setDeleteConfirm(null)}
      />

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminModerationPage;