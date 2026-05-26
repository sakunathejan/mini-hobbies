import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";

const Pagination = memo(({ current, total, onChange }) => {
  if (total <= 1) return null;

  const pages = [];
  for (let i = 1; i <= total; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="rounded-md p-2 text-gray-500 transition hover:text-gray-900 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((page) => {
        const isActive = page === current;
        return (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`grid h-9 w-9 place-items-center rounded-md text-sm font-semibold transition ${
              isActive ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="rounded-md p-2 text-gray-500 transition hover:text-gray-900 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
});

export default Pagination;
