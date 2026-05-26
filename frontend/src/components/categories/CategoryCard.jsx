import { Edit2, Package, Trash2 } from "lucide-react";
import { memo } from "react";

const statusBadge = (featured) =>
  featured
    ? "bg-ember/10 text-ember border border-ember/20"
    : "bg-gray-100 text-gray-500 border border-gray-200";

const CategoryCard = memo(({ category, onEdit, onDelete }) => {
  const createdDate = category.createdAt
    ? new Date(category.createdAt).toLocaleDateString("en-LK", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const initials = (category.name || "C")[0].toUpperCase();
  const colorIndex = category.name ? category.name.length % 5 : 0;
  const gradientColors = [
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-blue-500 to-indigo-600",
    "from-rose-500 to-pink-600",
  ];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="relative h-20 overflow-hidden bg-gray-50 shrink-0">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientColors[colorIndex]}`}>
            <span className="select-none text-2xl font-black text-white/80">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${statusBadge(category.featured)}`}>
            {category.featured ? "Featured" : "Standard"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-xs font-bold text-gray-900 leading-snug truncate">{category.name}</h3>

        {category.description && (
          <p className="mt-1 text-[11px] text-gray-500 line-clamp-1 leading-relaxed">{category.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Package className="h-3 w-3" />
            <span>{category.productCount ?? "—"}</span>
            {createdDate && (
              <>
                <span className="mx-0.5">·</span>
                <span>{createdDate}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label={`Edit ${category.name}`}
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CategoryCard.displayName = "CategoryCard";
export default CategoryCard;
