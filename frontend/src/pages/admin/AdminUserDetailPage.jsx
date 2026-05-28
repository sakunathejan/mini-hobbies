import { ArrowLeft, Key, LogOut, Mail, MailCheck, MessageSquare, Save, Trash2, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import { addAdminNote, deleteUser, forceLogoutUser, getUserById, getUserOrders, resetUserPassword, updateUser, verifyUserEmail } from "../../services/adminUserService.js";
import { formatCurrency } from "../../utils/formatters.js";
import StatusBadge from "../../moderation-system/components/StatusBadge.jsx";
import ModerationTimeline from "../../moderation-system/components/ModerationTimeline.jsx";
import ModerationModal from "../../moderation-system/modals/ModerationModal.jsx";
import {
  getModerationHistory,
  warnUser,
  suspendUser,
  banUser,
  liftModeration,
} from "../../moderation-system/services/moderationService.js";

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [moderationHistory, setModerationHistory] = useState(null);
  const [modHistoryLoading, setModHistoryLoading] = useState(false);
  const [moderationAction, setModerationAction] = useState(null);
  const [liftConfirm, setLiftConfirm] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserById(id);
      setUser(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchOrders = useCallback(async (p) => {
    setOrdersLoading(true);
    try {
      const result = await getUserOrders(id, { page: p, limit: 10 });
      setOrders(result.data);
      setOrdersPagination(result.pagination);
    } catch {} finally {
      setOrdersLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(() => { fetchOrders(ordersPage); }, [fetchOrders, ordersPage]);

  useEffect(() => {
    if (!id) return;
    const fetchMod = async () => {
      setModHistoryLoading(true);
      try {
        const data = await getModerationHistory(id);
        setModerationHistory(data);
      } catch {} finally {
        setModHistoryLoading(false);
      }
    };
    if (user && !loading) fetchMod();
  }, [id, user, loading]);

  const handleEdit = async () => {
    setSaving(true);
    try {
      const updated = await updateUser(id, editForm);
      setUser((prev) => ({ ...prev, ...updated }));
      toast.success("User updated.");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setEditForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    setEditing(true);
  };

  const handleNote = async () => {
    if (!noteText.trim()) return;
    setSendingNote(true);
    try {
      const result = await addAdminNote(id, noteText.trim());
      setUser((prev) => ({ ...prev, adminNotes: result.notes }));
      setNoteText("");
      toast.success("Note added.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add note.");
    } finally {
      setSendingNote(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction === "delete") {
        await deleteUser(id);
        toast.success("User deleted.");
        navigate("/admin/users", { replace: true });
        return;
      } else if (confirmAction === "verify-email") {
        const result = await verifyUserEmail(id, true);
        toast.success(result.message);
        fetchUser();
      } else if (confirmAction === "unverify-email") {
        const result = await verifyUserEmail(id, false);
        toast.success(result.message);
        fetchUser();
      } else if (confirmAction === "force-logout") {
        await forceLogoutUser(id);
        toast.success("User logged out from all devices.");
      } else if (confirmAction === "reset-password") {
        if (!resetPasswordValue || resetPasswordValue.length < 8) {
          toast.error("Password must be at least 8 characters.");
          return;
        }
        await resetUserPassword(id, resetPasswordValue);
        toast.success("Password reset. All sessions invalidated.");
        setShowResetForm(false);
        setResetPasswordValue("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    } finally {
      setConfirmAction(null);
    }
  };

  const handleLift = async () => {
    try {
      const result = await liftModeration(id);
      toast.success(result.message);
      await Promise.all([
        fetchUser(),
        getModerationHistory(id).then((data) => setModerationHistory(data)),
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to lift moderation.");
    }
  };

  const confirmThen = (action) => {
    setConfirmAction(action);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm text-ember hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Orders" },
    { key: "login-history", label: "Login History" },
    { key: "moderation", label: "Moderation" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div>
      <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm text-ember hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                (user.name || "U")[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black">{user.name || "Unnamed User"}</h2>
                {user.emailVerified && <UserCheck className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openEdit} className="btn-secondary text-xs">
              <Save className="mr-1 h-3.5 w-3.5" /> Edit
            </button>
            <button type="button" onClick={() => confirmThen("delete")} className="btn-danger text-xs">
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </button>
            <div className="relative">
              <button type="button" onClick={() => setShowResetForm(!showResetForm)} className="btn-secondary text-xs">
                <Key className="mr-1 h-3.5 w-3.5" /> Password
              </button>
              {showResetForm && (
                <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                  <p className="mb-2 text-xs font-medium text-gray-600">New password (min 8 chars)</p>
                  <input type="text" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} className="input mb-2 w-full text-sm" placeholder="Enter new password..." autoFocus />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { confirmThen("reset-password"); setShowResetForm(false); }} className="btn-primary flex-1 text-xs">Reset & Logout</button>
                    <button type="button" onClick={() => { setShowResetForm(false); setResetPasswordValue(""); }} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => confirmThen(user.emailVerified ? "unverify-email" : "verify-email")} className="btn-secondary text-xs">
              {user.emailVerified ? <MailCheck className="mr-1 h-3.5 w-3.5" /> : <Mail className="mr-1 h-3.5 w-3.5" />}
              {user.emailVerified ? "Unverify" : "Verify"} Email
            </button>
            <button type="button" onClick={() => confirmThen("force-logout")} className="btn-secondary text-xs">
              <LogOut className="mr-1 h-3.5 w-3.5" /> Force Logout
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <span className="text-xs text-gray-500">Orders</span>
            <p className="font-semibold">{user.orderCount ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Total Spent</span>
            <p className="font-semibold">{formatCurrency(user.totalSpent || 0)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Registered</span>
            <p className="font-semibold">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-LK") : "—"}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Last Login</span>
            <p className="font-semibold">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-LK") : "Never"}</p>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-base font-bold">Edit Customer</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
              <input type="text" className="input w-full text-sm" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input type="email" className="input w-full text-sm" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
              <input type="text" className="input w-full text-sm" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleEdit} disabled={saving} className="btn-primary text-xs">{saving ? "Saving..." : "Save Changes"}</button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-6 border-b border-gray-200">
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={`px-5 py-3 text-sm font-semibold transition-colors ${activeTab === t.key ? "border-b-2 border-ember text-ember" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-bold">Account Info</h3>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email Verified</span>
                  <span className={user.emailVerified ? "text-emerald-600" : "text-gray-400"}>{user.emailVerified ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Login Attempts</span>
                  <span>{user.loginAttempts ?? 0}</span>
                </div>
                {user.lastLoginIp && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last IP</span>
                    <span className="text-xs">{user.lastLoginIp}</span>
                  </div>
                )}
                {user.lastLoginDevice && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Device</span>
                    <span className="text-xs">{user.lastLoginDevice}</span>
                  </div>
                )}
                {user.authProvider && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Auth Provider</span>
                    <span className="capitalize">{user.authProvider}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-bold">Admin Notes</h3>
              </div>
              <div className="p-5">
                <div className="flex gap-2">
                  <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNote()} placeholder="Add a note..." className="input flex-1 text-sm" />
                  <button type="button" onClick={handleNote} disabled={sendingNote || !noteText.trim()} className="btn-primary text-xs">
                    <MessageSquare className="mr-1 h-3.5 w-3.5" /> Add
                  </button>
                </div>
                {(!user.adminNotes || user.adminNotes.length === 0) ? (
                  <p className="mt-4 text-xs text-gray-500">No notes yet.</p>
                ) : (
                  <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                    {[...(user.adminNotes || [])].reverse().map((note, i) => (
                      <div key={note._id || i} className="rounded-lg bg-gray-50 p-3 text-xs">
                        <p className="text-gray-700">{note.text}</p>
                        <p className="mt-1 text-gray-400">{note.adminName || "Admin"} · {note.createdAt ? new Date(note.createdAt).toLocaleDateString("en-LK") : "—"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="mt-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-bold">Order History</h3>
            </div>
            {ordersLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No orders yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <div key={order._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div>
                      <Link to={`/admin/orders`} className="font-semibold hover:underline">{order.orderNumber}</Link>
                      <p className="text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-LK") : "—"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-semibold">{formatCurrency(order.total || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {ordersPagination.pages > 1 && (
              <div className="border-t border-gray-100 px-5 py-3">
                <Pagination current={ordersPage} total={ordersPagination.pages} onChange={setOrdersPage} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "login-history" && (
        <div className="mt-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-bold">Login History</h3>
            </div>
            {!user.loginHistory || user.loginHistory.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No login history available.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {user.loginHistory.map((entry) => (
                  <div key={entry._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {entry.success ? (
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-500" />
                      )}
                      <span>{entry.ip || "Unknown IP"}</span>
                      {entry.device && <span className="text-xs text-gray-500">· {entry.device}</span>}
                      {entry.failureReason && <span className="text-xs text-red-400">({entry.failureReason})</span>}
                    </div>
                    <span className="text-xs text-gray-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-LK") : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "moderation" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-bold">Account Moderation</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={user.moderationStatus || "active"} />
                <span className="text-sm text-gray-600">
                  {user.moderationStatus === "warned" ? "Account has active warnings" :
                   user.moderationStatus === "suspended" ? "Account is temporarily suspended" :
                   user.moderationStatus === "banned" ? "Account is permanently banned" :
                   "No active moderation actions."}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModerationAction({ type: "warn" })} className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">Warn</button>
                <button type="button" onClick={() => setModerationAction({ type: "suspend" })} className="rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600">Suspend</button>
                <button type="button" onClick={() => setModerationAction({ type: "ban" })} className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Ban</button>
                <button type="button" onClick={() => setLiftConfirm(true)} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Lift</button>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-bold">Moderation History</h3>
            {modHistoryLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : (
              <ModerationTimeline cases={moderationHistory?.cases || []} />
            )}
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="mt-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-bold">Admin Notes</h3>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNote()} placeholder="Add a note..." className="input flex-1 text-sm" />
                <button type="button" onClick={handleNote} disabled={sendingNote || !noteText.trim()} className="btn-primary text-xs">Add</button>
              </div>
              {(!user.adminNotes || user.adminNotes.length === 0) ? (
                <p className="text-xs text-gray-500">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...(user.adminNotes || [])].reverse().map((note, i) => (
                    <div key={note._id || i} className="rounded-lg bg-gray-50 p-4 text-sm">
                      <p className="text-gray-700">{note.text}</p>
                      <p className="mt-1 text-xs text-gray-400">{note.adminName || "Admin"} · {note.createdAt ? new Date(note.createdAt).toLocaleString("en-LK") : "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ModerationModal
        open={!!moderationAction}
        type={moderationAction?.type}
        customer={{ _id: id, name: user?.name }}
        onClose={() => setModerationAction(null)}
        onConfirm={async (payload) => {
          const fn = moderationAction.type === "warn" ? warnUser :
                     moderationAction.type === "ban" ? banUser : suspendUser;
          const result = await fn(id, payload);
          toast.success(result.message + (result.case?.emailSent ? " — Email sent to customer." : ""));
          await Promise.all([
            fetchUser(),
            getModerationHistory(id).then((data) => setModerationHistory(data)),
          ]);
          setModerationAction(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction === "delete" ? "Delete customer?" : confirmAction === "force-logout" ? "Force logout?" : "Confirm action"}
        message={confirmAction === "delete" ? `This will permanently disable ${user.name || "this customer"}'s account.` : confirmAction === "force-logout" ? `This will log ${user.name || "this customer"} out of all devices.` : "Are you sure?"}
        confirmLabel={confirmAction === "delete" ? "Delete" : confirmAction === "force-logout" ? "Force Logout" : "Confirm"}
        cancelLabel="Cancel"
        destructive={confirmAction === "delete" || confirmAction === "force-logout"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={liftConfirm}
        title="Lift Moderation?"
        message={`Remove all active warnings, suspensions, or bans on ${user?.name || "this user"}?`}
        confirmLabel="Lift"
        cancelLabel="Cancel"
        destructive={false}
        onConfirm={async () => { await handleLift(); setLiftConfirm(false); }}
        onCancel={() => setLiftConfirm(false)}
      />
    </div>
  );
};

export default AdminUserDetailPage;
