import { memo } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters.js";

const ProductCard = memo(({ product }) => (
  <Link
    to={`/products/${product.slug}`}
    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-amber-300 hover:shadow-sm"
  >
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
      {product.image ? (
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-gray-400">No img</div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{product.name}</p>
      {product.category && <p className="text-xs text-gray-500">{product.category}</p>}
      <p className="text-sm font-bold text-amber-700">
        {product.discountPrice ? (
          <><span className="text-gray-400 line-through">{formatCurrency(product.price)}</span> {formatCurrency(product.discountPrice)}</>
        ) : formatCurrency(product.price)}
      </p>
    </div>
    {!product.inStock && <span className="shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">Out</span>}
  </Link>
));

const ChatMessage = memo(({ msg, onSuggestionClick }) => {
  const isBot = msg.role === "bot";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} px-4`}>
      <div className={`max-w-[85%] space-y-2 ${isBot ? "" : "items-end"}`}>
        {isBot && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">M</span>
            MiniBot
          </div>
        )}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isBot ? "rounded-tl-sm bg-white text-gray-800 shadow-sm ring-1 ring-gray-100" : "rounded-br-sm bg-amber-800 text-white"}`}>
          {msg.text?.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-1" : ""}>{parseInline(line)}</p>
          ))}
          {msg.order && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p><strong>Order:</strong> #{msg.order.orderNumber}</p>
              <p><strong>Status:</strong> {msg.order.status}</p>
              <p><strong>Total:</strong> {formatCurrency(msg.order.total)}</p>
            </div>
          )}
          {msg.cities && msg.cities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {msg.cities.slice(0, 8).map((c) => (
                <span key={c} className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{c}</span>
              ))}
              {msg.cities.length > 8 && <span className="text-xs text-gray-400">+{msg.cities.length - 8} more</span>}
            </div>
          )}
          {msg.action && (
            <a
              href={msg.action.href}
              className="mt-2 inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900"
            >
              {msg.action.label}
            </a>
          )}
        </div>

        {msg.products && msg.products.length > 0 && (
          <div className="space-y-2">
            {msg.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {msg.fallbackProducts && msg.fallbackProducts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">You might also like:</p>
            {msg.fallbackProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s)}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const parseInline = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default ChatMessage;
