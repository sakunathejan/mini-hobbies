const ALLOWED_TAGS = new Set([
  "b", "i", "u", "strong", "em", "a", "ul", "ol", "li",
  "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "span", "div", "pre", "code"
]);

const ALLOWED_ATTRS = new Set(["href", "target", "rel", "class", "style"]);

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:"];

export const sanitizeHtml = (input) => {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, (match) => {
    const tagName = match.match(/<\/?(\w+)/)?.[1]?.toLowerCase();
    if (!tagName || !ALLOWED_TAGS.has(tagName)) return escapeText(match);
    if (match.startsWith("</")) return match;
    const attrs = match.match(/(\S+)\s*=\s*"([^"]*)"/g);
    let safe = `<${tagName}`;
    if (attrs) {
      for (const attr of attrs) {
        const [, name, value] = attr.match(/(\S+)\s*=\s*"([^"]*)"/) || [];
        if (!name || !ALLOWED_ATTRS.has(name.toLowerCase())) continue;
        if (name.toLowerCase() === "href" || name.toLowerCase() === "src") {
          const proto = value.match(/^([a-z]+:)/)?.[1];
          if (proto && !ALLOWED_PROTOCOLS.includes(proto)) continue;
        }
        if (name.toLowerCase() === "href") {
          const lower = value.toLowerCase();
          if (lower.startsWith("javascript:") || lower.startsWith("data:")) continue;
        }
        safe += ` ${name}="${value.replace(/"/g, "&quot;")}"`;
      }
    }
    safe += ">";
    return safe;
  });
};

const escapeText = (text) => {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};
