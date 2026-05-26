const ENCODED_NEWLINES = /(\r\n|\n|\r)/g;

export const stripNewlines = (str) => (typeof str === "string" ? str.replace(ENCODED_NEWLINES, " ").trim() : str);

export const sanitizeFilename = (original) => {
  const ext = original.split(".").pop()?.toLowerCase() || "";
  const name = original
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  return `${name}.${ext}`;
};

export const detectMagicBytes = (buffer) => {
  const hex = buffer.toString("hex", 0, 8);
  const signatures = {
    "89504e47": "image/png",
    ffd8ffe0: "image/jpeg",
    ffd8ffe1: "image/jpeg",
    ffd8ffe2: "image/jpeg",
    ffd8ffe3: "image/jpeg",
    ffd8ffe8: "image/jpeg",
    "52494646": "image/webp",
    "25504446": "application/pdf"
  };
  for (const [sig, mime] of Object.entries(signatures)) {
    if (hex.startsWith(sig)) return mime;
  }
  return null;
};

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const API_KEY_REGEX = /(sk_live_|sk_test_|pk_live_|pk_test_|sb_secret_|ghp_|gho_|ghu_|github_pat)/gi;

export const redactSecrets = (body) => {
  if (!body || typeof body !== "object") return body;
  const str = JSON.stringify(body);
  if (API_KEY_REGEX.test(str)) {
    return { redacted: true };
  }
  return body;
};
