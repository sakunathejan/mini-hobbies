import { parse } from "csv-parse/sync";
import { normalizeFrom, normalizeTo, buildRouteKey } from "../utils/normalizeAddress.js";

const REQUIRED_HEADERS = ["from", "to", "firstkg", "additionalkg"];

const HEADER_ALIASES = {
  from: ["from", "origin", "source", "fromlocation", "from_location"],
  to: ["to", "destination", "dest", "tolocation", "to_location"],
  firstkg: ["chargefor1stkg", "firstkg", "1stkg", "chargeforfirstkg", "charge_for_1st_kg", "charge for 1st kg", "charge per 1st kg", "basecharge", "base_charge", "firstkgcharge", "first_kg_charge"],
  additionalkg: ["chargeperadditionalkg", "additionalkg", "chargeperadditional1kg", "charge_per_additional_1kg", "charge per additional 1kg", "additionalcharge", "additional_charge", "additionalperkg", "additional_per_kg", "extrakgs", "extra_kg"]
};

const detectHeader = (header) => {
  const h = String(header).toLowerCase().trim().replace(/[\s_-]+/g, "");
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((a) => a.replace(/[\s_-]+/g, "") === h)) return canonical;
    if (canonical === h) return canonical;
  }
  return null;
};

export const parseCSVBuffer = (buffer) => {
  const raw = buffer.toString("utf-8").trim();
  if (!raw) throw new Error("Empty CSV file.");

  const records = parse(raw, {
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
    relax_quotes: true
  });

  if (records.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const rawHeaders = records[0];
  const headerMap = {};

  for (let i = 0; i < rawHeaders.length; i++) {
    const detected = detectHeader(rawHeaders[i]);
    if (detected) {
      headerMap[detected] = i;
    }
  }

  const missing = REQUIRED_HEADERS.filter((h) => !(h in headerMap));
  if (missing.length > 0) {
    throw new Error(
      `Missing required CSV columns: ${missing.join(", ")}. Found headers: ${rawHeaders.join(", ")}`
    );
  }

  const rows = [];
  const invalidRows = [];
  const keyMap = new Map();
  let lineNum = 1;

  for (let r = 1; r < records.length; r++) {
    lineNum = r + 1;
    const row = records[r];
    if (!row || row.every((c) => !String(c).trim())) continue;

    try {
      const from = String(row[headerMap.from] || "").trim();
      const to = String(row[headerMap.to] || "").trim();

      if (!from) {
        invalidRows.push({ line: lineNum, reason: "Empty origin (From)" });
        continue;
      }
      if (!to) {
        invalidRows.push({ line: lineNum, reason: "Empty destination (To)" });
        continue;
      }

      const firstRaw = String(row[headerMap.firstkg] || "").replace(/[^0-9.]/g, "");
      const firstKg = parseFloat(firstRaw);
      if (isNaN(firstKg) || firstKg < 0) {
        invalidRows.push({ line: lineNum, reason: `Invalid first kg charge: "${row[headerMap.firstkg]}"` });
        continue;
      }

      const additionalRaw = String(row[headerMap.additionalkg] || "").replace(/[^0-9.]/g, "");
      const additionalKg = parseFloat(additionalRaw);
      if (isNaN(additionalKg) || additionalKg < 0) {
        invalidRows.push({ line: lineNum, reason: `Invalid additional kg charge: "${row[headerMap.additionalkg]}"` });
        continue;
      }

      const nf = normalizeFrom(from);
      const nt = normalizeTo(to);
      const key = buildRouteKey(from, to);

      keyMap.set(key, {
        from,
        to,
        firstKgCharge: firstKg,
        additionalKgCharge: additionalKg,
        normalizedFrom: nf,
        normalizedTo: nt,
        courierProvider: "koombiyo",
        importedAt: new Date(),
        isActive: true
      });
    } catch {
      invalidRows.push({ line: lineNum, reason: "Malformed row" });
    }
  }

  rows.push(...keyMap.values());

  return {
    rows,
    invalidRows,
    totalRows: records.length - 1,
    headerMap,
    detectedHeaders: Object.keys(headerMap)
  };
};
