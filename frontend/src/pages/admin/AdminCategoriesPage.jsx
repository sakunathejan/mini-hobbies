import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CategoryCard from "../../components/categories/CategoryCard.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../../services/categoryService.js";

const emptyForm = { name: "", description: "", image: "", featured: false };

const sortOptions = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "products", label: "Most products" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const Modal = ({ open, onClose, title, children }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      ref.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
    <div className="h-20 animate-pulse bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="h-2.5 w-full animate-pulse rounded bg-gray-200" />
      <div className="flex justify-between pt-1">
        <div className="h-2.5 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-2.5 w-10 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  </div>
);

const AdminCategoriesPage = () => {
  const { data, setData, loading, error } = useFetch(getCategories, []);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchInputRef = useRef(null);

  const categories = useMemo(() => {
    let items = Array.isArray(data) ? data : [];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)
      );
    }

    const [field, dir] = sort.split("-");
    items = [...items].sort((a, b) => {
      if (field === "name") return dir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (field === "newest" || field === "oldest") {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return field === "newest" ? db - da : da - db;
      }
      if (field === "products") return (b.productCount || 0) - (a.productCount || 0);
      return 0;
    });

    return items;
  }, [data, search, sort]);

  const openAdd = useCallback(() => {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((category) => {
    setForm({ name: category.name || "", description: category.description || "", image: category.image || "", featured: !!category.featured });
    setEditId(category._id);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((category) => {
    setDeleteTarget(category);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget._id);
      setData((prev) => (Array.isArray(prev) ? prev.filter((c) => c._id !== deleteTarget._id) : prev));
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete category.");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, setData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const updated = await updateCategory(editId, form);
        setData((prev) => (Array.isArray(prev) ? prev.map((c) => (c._id === editId ? { ...c, ...updated } : c)) : prev));
        toast.success(`"${form.name}" updated.`);
      } else {
        const created = await createCategory(form);
        setData((prev) => (Array.isArray(prev) ? [...prev, created] : [created]));
        toast.success(`"${form.name}" added.`);
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  }, [form, editId, setData]);

  const stats = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    const total = items.length;
    const featured = items.filter((c) => c.featured).length;
    const totalProducts = items.reduce((s, c) => s + (c.productCount || 0), 0);
    return { total, featured, totalProducts };
  }, [data]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Categories</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your shop categories.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          { label: "Featured", value: stats.featured, color: "text-ember" },
          { label: "Products", value: stats.totalProducts, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-3 text-center">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`mt-0.5 text-xl font-black ${s.color}`}>{loading ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-gray-200" /> : s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-9 pr-8 text-sm"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input pl-9 pr-8 text-sm min-w-[140px]">
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>
      )}

      <AnimatePresence mode="wait">
        {!loading && !error && categories.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mt-4 text-base font-semibold text-gray-700">
              {search ? "No categories match your search" : "No categories yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {search ? "Try a different search term." : "Create your first category to organize products."}
            </p>
            {!search && (
              <button type="button" onClick={openAdd} className="btn-primary mt-5 inline-flex items-center gap-1.5 text-sm">
                <Plus className="h-4 w-4" /> Add Category
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !error && categories.length > 0 && (
        <motion.div
          key="grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          <AnimatePresence mode="popLayout">
            {categories.map((category) => (
              <motion.div
                key={category._id}
                layout
                variants={cardVariants}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <CategoryCard category={category} onEdit={openEdit} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="Add category"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setForm(emptyForm); }} title={editId ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Name *</label>
            <input
              required
              className="input w-full text-sm"
              placeholder="e.g. Electronics"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
            <textarea
              className="input w-full min-h-24 text-sm"
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Image URL</label>
            <input
              type="url"
              className="input w-full text-sm"
              placeholder="https://example.com/image.jpg"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            />
            {form.image && (
              <div className="mt-2 h-24 w-full overflow-hidden rounded-lg bg-gray-50">
                <img src={form.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Featured on homepage</span>
              <p className="text-xs text-gray-500">Show this category prominently on the storefront.</p>
            </div>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary flex-1 text-sm">
              {saving ? "Saving..." : editId ? "Update Category" : "Add Category"}
            </button>
            <button type="button" onClick={() => { setModalOpen(false); setEditId(null); setForm(emptyForm); }} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name || ""}"?`}
        message={deleteTarget?.productCount > 0
          ? `This category has ${deleteTarget.productCount} product(s). Move them to another category before deleting.`
          : "Are you sure you want to delete this category? This action cannot be undone."}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminCategoriesPage;
