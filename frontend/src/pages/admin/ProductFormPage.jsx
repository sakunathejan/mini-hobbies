import { Plus, Trash2, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "../../hooks/useFetch.js";
import { getCategories } from "../../services/categoryService.js";
import { createProduct, getProductById, updateProduct } from "../../services/productService.js";
import { uploadProductImages } from "../../services/uploadService.js";

const emptyVariant = () => ({ name: "", sku: "", price: "", stock: 0 });

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const categories = useFetch(getCategories, []);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    brand: "Hot Wheels",
    category: "",
    price: "",
    discountPrice: "",
    stock: 1,
    hasVariants: false,
    variants: [],
    images: [],
    tags: "",
    scale: "1:64",
    material: "Die-cast metal",
    featured: false,
    condition: "New",
    weightKg: "0.5"
  });

  useFetch(
    async () => {
      if (!id) return null;
      const product = await getProductById(id);
      setForm({
        ...product,
        category: product.category?._id || product.category,
        discountPrice: product.discountPrice || "",
        tags: product.tags?.join(", ") || "",
        variants: product.variants?.map((v) => ({ ...v, price: v.price || "" })) || []
      });
      return product;
    },
    [id]
  );

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addVariant = () => {
    update("variants", [...form.variants, emptyVariant()]);
    update("hasVariants", true);
  };

  const removeVariant = (index) => {
    const next = form.variants.filter((_, i) => i !== index);
    update("variants", next);
    if (next.length === 0) update("hasVariants", false);
  };

  const updateVariant = (index, key, value) => {
    const next = [...form.variants];
    next[index] = { ...next[index], [key]: value };
    update("variants", next);
  };

  const handleUpload = async (event) => {
    setUploading(true);
    try {
      const images = await uploadProductImages(event.target.files);
      update("images", [...form.images, ...images]);
      toast.success("Images uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      brand: form.brand,
      category: form.category,
      price: form.hasVariants ? 0 : Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: form.hasVariants ? 0 : Number(form.stock),
      hasVariants: form.hasVariants,
      variants: form.hasVariants ? form.variants.map((v) => {
        const cleaned = { ...v, price: v.price ? Number(v.price) : undefined, stock: Number(v.stock) || 0 };
        if (!cleaned.image?.url) delete cleaned.image;
        return cleaned;
      }) : [],
      images: form.images,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      scale: form.scale,
      material: form.material,
      featured: form.featured,
      condition: form.condition,
      weightKg: parseFloat(form.weightKg) || 0.5
    };
    if (editing) {
      await updateProduct(id, payload);
      toast.success("Product updated.");
    } else {
      await createProduct(payload);
      toast.success("Product created.");
    }
    navigate("/admin/products");
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black">{editing ? "Edit product" : "Add product"}</h1>
      <div className="mt-6 grid gap-5 rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="input text-base" placeholder="Product name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
          <input className="input text-base" placeholder="Brand" value={form.brand} onChange={(event) => update("brand", event.target.value)} />
        </div>
        <textarea className="input min-h-32 text-base" placeholder="Description" value={form.description} onChange={(event) => update("description", event.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-3">
          <select className="input text-base" value={form.category} onChange={(event) => update("category", event.target.value)} required>
            <option value="">Choose category</option>
            {(categories.data || []).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          {!form.hasVariants && (
            <input className="input text-base" type="number" placeholder="Price" value={form.price} onChange={(event) => update("price", event.target.value)} required />
          )}
          {!form.hasVariants && (
            <input className="input text-base" type="number" placeholder="Discount price" value={form.discountPrice} onChange={(event) => update("discountPrice", event.target.value)} />
          )}
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {!form.hasVariants && (
            <input className="input text-base" type="number" placeholder="Stock" value={form.stock} onChange={(event) => update("stock", event.target.value)} />
          )}
          {form.hasVariants && <div />}
          <input className="input text-base" placeholder="Scale" value={form.scale} onChange={(event) => update("scale", event.target.value)} />
          <input className="input text-base" placeholder="Material" value={form.material} onChange={(event) => update("material", event.target.value)} />
          <select className="input text-base" value={form.condition} onChange={(event) => update("condition", event.target.value)}>
            <option>New</option>
            <option>Pre-owned</option>
            <option>Limited Edition</option>
          </select>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-gray-500">Weight per unit (kg)</label>
            <input className="input mt-1 text-base" type="number" min="0" step="0.01" value={form.weightKg} onChange={(event) => update("weightKg", event.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="accent-ember h-5 w-5" checked={form.hasVariants} onChange={(e) => {
              update("hasVariants", e.target.checked);
              if (!e.target.checked) update("variants", []);
            }} />
            <span className="text-sm font-semibold">This product has variants (e.g. different colors, scales)</span>
          </label>

              {form.hasVariants && (
                <div className="mt-4 space-y-3">
                  {form.variants.map((variant, i) => (
                    <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border bg-gray-50 p-3">
                      <div className="min-w-0 flex-[2]">
                        <label className="text-xs font-medium text-gray-500">Name</label>
                        <input className="input mt-1 text-base" placeholder="e.g. Red, 1:64" value={variant.name} onChange={(e) => updateVariant(i, "name", e.target.value)} required />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-medium text-gray-500">SKU</label>
                        <input className="input mt-1 text-base" placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-medium text-gray-500">Price</label>
                        <input className="input mt-1 text-base" type="number" min="0" placeholder="Optional" value={variant.price} onChange={(e) => updateVariant(i, "price", e.target.value)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-medium text-gray-500">Stock</label>
                        <input className="input mt-1 text-base" type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} required />
                      </div>
                      <div className="min-w-0 w-16">
                        <label className="text-xs font-medium text-gray-500">Image</label>
                        {variant.image?.url ? (
                          <div className="relative mt-1">
                            <img src={variant.image.url} alt="" className="aspect-square w-full rounded-md border object-cover" loading="lazy" />
                            <button type="button" onClick={() => updateVariant(i, "image", { url: "", path: "", alt: "" })} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="mt-1 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 p-2 text-gray-400 hover:border-gray-500 hover:text-gray-600 min-h-[44px]">
                            <UploadCloud className="h-4 w-4" />
                            <input className="hidden" type="file" accept="image/*" onChange={async (e) => {
                              const files = e.target.files;
                              if (!files?.length) return;
                              const images = await uploadProductImages(files);
                              if (images?.[0]) updateVariant(i, "image", images[0]);
                              e.target.value = "";
                            }} />
                          </label>
                        )}
                      </div>
                      <button type="button" className="mb-1 text-red-500 hover:text-red-700 min-h-[44px]" onClick={() => removeVariant(i)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary text-sm min-h-[44px]" onClick={addVariant}>
                    <Plus className="h-4 w-4" /> Add variant
                  </button>
                  {form.variants.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Total stock: {form.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)} units
                    </p>
                  )}
                </div>
              )}
        </div>

        <input className="input text-base" placeholder="Tags separated by commas" value={form.tags} onChange={(event) => update("tags", event.target.value)} />
        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 p-6 sm:p-8 text-sm font-semibold text-gray-600 min-h-[60px]">
          <UploadCloud className="h-5 w-5" /> {uploading ? "Uploading..." : "Upload product images to Supabase"}
          <input className="hidden" type="file" multiple accept="image/*" onChange={handleUpload} />
        </label>
        {form.images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.images.map((image) => <img key={image.url} src={image.url} alt={image.alt} className="aspect-square w-full rounded-md object-cover" loading="lazy" />)}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} />
          Featured product
        </label>
        <button className="btn-primary w-full sm:w-auto min-h-[48px]">{editing ? "Update product" : "Save product"}</button>
      </div>
    </form>
  );
};

export default ProductFormPage;