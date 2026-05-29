import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Eye, Plus, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import AnnouncementPreview from "../../components/announcements/AnnouncementPreview.jsx";
import ImageDropZone from "../../components/announcements/ImageDropZone.jsx";
import RichTextEditor from "../../components/announcements/RichTextEditor.jsx";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, duplicateAnnouncement, bulkDeleteAnnouncements, bulkUpdateAnnouncements, getCategories } from "../../services/announcementService.js";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700", normal: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700", urgent: "bg-red-50 text-red-700"
};
const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600", scheduled: "bg-blue-50 text-blue-700",
  published: "bg-emerald-50 text-emerald-700", archived: "bg-red-50 text-red-700"
};
const PER_PAGE = 15;

const emptyForm = {
  title: "", content: "", type: "banner", priority: "normal",
  status: "draft", category: "general", ctaText: "", ctaUrl: "",
  audience: "all", publishAt: "", expiresAt: ""
};

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({ page: 1, search: "", status: "", priority: "", category: "", type: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [categories, setCategories] = useState(["general"]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      params.page = filters.page;
      params.limit = PER_PAGE;
      const res = await getAnnouncements(params);
      setAnnouncements(res.announcements || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditId(null);
    setImageFile(null);
    setExistingImage(null);
  };

  const allSelected = announcements.length > 0 && announcements.every((a) => selectedIds.includes(a._id));

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : announcements.map((a) => a._id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        type: form.type,
        priority: form.priority,
        status: form.status,
        category: form.category,
        ctaText: form.ctaText || undefined,
        ctaUrl: form.ctaUrl || undefined,
        audience: form.audience,
        publishAt: form.publishAt || undefined,
        expiresAt: form.expiresAt || undefined,
        image: imageFile || (existingImage && !imageFile ? undefined : "null")
      };
      if (editId) {
        const updated = await updateAnnouncement(editId, payload);
        toast.success("Announcement updated.");
        fetchData();
      } else {
        await createAnnouncement(payload);
        toast.success("Announcement created.");
        setFilters((f) => ({ ...f, page: 1 }));
        fetchData();
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setEditId(a._id);
    setForm({
      title: a.title, content: a.content, type: a.type, priority: a.priority,
      status: a.status, category: a.category || "general",
      ctaText: a.ctaText || "", ctaUrl: a.ctaUrl || "",
      audience: a.audience, publishAt: a.publishAt ? a.publishAt.slice(0, 16) : "",
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : ""
    });
    setExistingImage(a.image || null);
    setImageFile(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnnouncement(deleteTarget);
      toast.success("Announcement deleted.");
      fetchData();
    } catch { toast.error("Could not delete."); }
    finally { setDeleteTarget(null); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteAnnouncements(selectedIds);
      toast.success(`${selectedIds.length} deleted.`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error("Bulk delete failed."); }
  };

  const handleBulkAction = async (changes) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateAnnouncements(selectedIds, changes);
      toast.success(`${selectedIds.length} updated.`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error("Bulk update failed."); }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateAnnouncement(id);
      toast.success("Duplicated.");
      fetchData();
    } catch { toast.error("Could not duplicate."); }
  };

  const handleToggleActive = async (a) => {
    try {
      await updateAnnouncement(a._id, { isActive: !a.isActive });
      fetchData();
      toast.success(a.isActive ? "Deactivated." : "Activated.");
    } catch { toast.error("Toggle failed."); }
  };

  const pageOrders = announcements;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Announcements</h1>
          <p className="mt-1 text-sm text-gray-600">Create, schedule, and manage announcements.</p>
        </div>
        {!editId && (
          <button onClick={() => document.getElementById("announcement-form")?.scrollIntoView({ behavior: "smooth" })} className="btn-primary inline-flex items-center gap-2 min-h-[44px]">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Form */}
        <div id="announcement-form" className="min-w-0 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">{editId ? "Edit Announcement" : "Create Announcement"}</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input className="input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Big Sale This Weekend!" required />
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <div className="mt-1 w-full max-w-full">
                <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Image</label>
              <div className="mt-1">
                <ImageDropZone
                  value={imageFile}
                  existingImage={existingImage}
                  onFileChange={(file) => { setImageFile(file); setExistingImage(null); }}
                  onRemove={() => { setImageFile(null); setExistingImage(null); }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="input mt-1 text-base" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="banner">Banner</option>
                  <option value="popup">Popup Modal</option>
                  <option value="toast">Floating Toast</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select className="input mt-1 text-base" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="input mt-1 text-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <input className="input mt-1 text-base" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="cat-list" placeholder="general" />
                <datalist id="cat-list">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Audience</label>
                <select className="input mt-1 text-base" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  <option value="all">All Visitors</option>
                  <option value="users">Logged-in Users</option>
                  <option value="guests">Guests</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">CTA Text</label>
                <input className="input mt-1 text-base" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">CTA URL</label>
              <input className="input mt-1 text-base" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Publish At</label>
                <input className="input mt-1 text-base" type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Expires At</label>
                <input className="input mt-1 text-base" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1 min-h-[48px]" disabled={saving}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              {editId && (
                <button type="button" className="btn-secondary min-h-[48px]" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="min-w-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search announcements..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              />
            </div>
            <select className="input w-auto text-sm" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select className="input w-auto text-sm" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}>
              <option value="">All Types</option>
              <option value="banner">Banner</option>
              <option value="popup">Popup</option>
              <option value="toast">Toast</option>
            </select>
          </div>

          {/* Bulk toolbar */}
          {selectedIds.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border bg-gray-50 px-4 py-2 text-sm">
              <span className="font-medium">{selectedIds.length} selected</span>
              <button onClick={() => handleBulkAction({ status: "published", isActive: true })} className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition">Publish</button>
              <button onClick={() => handleBulkAction({ status: "draft" })} className="rounded bg-gray-500 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-600 transition">Draft</button>
              <button onClick={handleBulkDelete} className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition">Delete</button>
              <button onClick={() => setSelectedIds([])} className="text-xs text-gray-500 hover:underline ml-auto">Clear</button>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No announcements found.</p>
          ) : (
            <>
              <div className="grid gap-3">
                {announcements.map((a) => (
                  <div key={a._id} className={`w-full overflow-hidden rounded-xl border bg-white p-4 transition hover:shadow-sm ${!a.isActive ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedIds.includes(a._id)} onChange={() => toggleOne(a._id)} className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm truncate">{a.title}</h3>
                          <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.normal}`}>{a.priority}</span>
                          <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[a.status] || STATUS_COLORS.draft}`}>{a.status}</span>
                          <span className="shrink-0 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{a.type}</span>
                        </div>
                        <div className="mt-1 flex items-start gap-3">
                          {a.image && <img src={a.image} alt="" className="mt-1 h-10 w-16 shrink-0 rounded object-cover" loading="lazy" />}
                          <div className="text-sm text-gray-600 break-words overflow-hidden max-h-[3em]">{a.content.replace(/<[^>]*>/g, "")}</div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(a.createdAt).toLocaleDateString("en-LK")}</span>
                          <span>·</span>
                          <span>{a.category}</span>
                          {a.audience !== "all" && <><span>·</span><span>{a.audience}</span></>}
                          <span>·</span>
                          <span>{a.views || 0} views</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button title="Preview" onClick={() => setPreviewTarget(a)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition"><Eye className="h-4 w-4" /></button>
                        <button title="Duplicate" onClick={() => handleDuplicate(a._id)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 transition"><Copy className="h-4 w-4" /></button>
                        <button onClick={() => handleToggleActive(a)} className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold transition ${a.isActive ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {a.isActive ? "Active" : "Inactive"}
                        </button>
                        <button className="text-xs text-blue-600 hover:underline" onClick={() => handleEdit(a)}>Edit</button>
                        <button className="text-xs text-red-600 hover:underline" onClick={() => setDeleteTarget(a._id)}><Trash2 className="h-3 w-3 inline" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.pages > 1 && (
                <Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
              )}
            </>
          )}
        </div>
      </div>

      {previewTarget && <AnnouncementPreview announcement={previewTarget} onClose={() => setPreviewTarget(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete announcement?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminAnnouncementsPage;
