export const normalizeText = (text = "") =>
  String(text).toLowerCase().trim().replace(/\s+/g, " ").trim();

export const normalizeFrom = (from = "") => normalizeText(from);
export const normalizeTo = (to = "") => normalizeText(to);

export const buildRouteKey = (from = "", to = "") => {
  const f = normalizeFrom(from);
  const t = normalizeTo(to);
  return `${f}|${t}`;
};
