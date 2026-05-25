import { Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import useFetch from "../../hooks/useFetch.js";
import { createCategory, deleteCategory, getCategories } from "../../services/categoryService.js";

const emptyForm = { name: "", description: "", featured: false };

const AdminCategoriesPage = () => {
  const { data, setData, loading, error } = useFetch(getCategories, []);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const category = await createCategory(form);
      setData([...(data || []), category]);
      setForm(emptyForm);
      toast.success(`"${category.name}" added.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create category.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? Products in this category must be moved first.`)) {
      return;
    }

    try {
      await deleteCategory(id);
      setData((current) => (current || []).filter((category) => category._id !== id));
      toast.success("Category deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete category.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="h-fit rounded-lg border border-gray-200 bg-white p-5">
        <h1 className="text-2xl font-black">Add category</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create new shop categories anytime. They appear in product forms and on the storefront.
        </p>
        <div className="mt-5 grid gap-3">
          <input
            required
            className="input"
            placeholder="Category name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <textarea
            className="input min-h-28"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setForm({ ...form, featured: event.target.checked })}
            />
            Featured on homepage (when using featured filter)
          </label>
        </div>
        <button className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-gray-300" disabled={saving}>
          {saving ? "Saving..." : "Add category"}
        </button>
      </form>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b p-5">
          <h2 className="font-black">Current categories</h2>
          <p className="mt-1 text-sm text-gray-600">{(data || []).length} total</p>
        </div>

        {loading && <p className="p-5 text-sm text-gray-600">Loading categories...</p>}
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {!loading && !error && !(data || []).length && (
          <p className="p-5 text-sm text-gray-600">No categories yet. Add your first one on the left.</p>
        )}

        <div className="divide-y">
          {(data || []).map((category) => (
            <div key={category._id} className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{category.name}</h3>
                  {category.featured && (
                    <span className="rounded-full bg-ember/10 px-2 py-0.5 text-xs font-semibold text-ember">Featured</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{category.description || "No description yet."}</p>
                {category.slug && <p className="mt-1 text-xs text-gray-400">/{category.slug}</p>}
              </div>
              <button
                type="button"
                aria-label={`Delete ${category.name}`}
                onClick={() => remove(category._id, category.name)}
                className="rounded-md p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminCategoriesPage;
