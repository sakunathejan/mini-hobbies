import { LayoutGrid, List } from "lucide-react";

const ViewToggle = ({ view, onChange, storageKey = "admin_view" }) => {
  const active = view || localStorage.getItem(storageKey) || "grid";

  const handleChange = (v) => {
    localStorage.setItem(storageKey, v);
    onChange(v);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
      <button
        onClick={() => handleChange("grid")}
        className={`rounded-md p-2 transition ${active === "grid" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleChange("list")}
        className={`rounded-md p-2 transition ${active === "list" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ViewToggle;
