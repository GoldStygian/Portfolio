// Funzioni di supporto condivise da tutti i renderer.

/** Escape per testo HTML. */
export const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Escape per valori di attributo (aggiunge le virgolette). */
export const attr = (s = "") => esc(s).replace(/"/g, "&quot;");

/** Testo con **grassetto** → HTML (escape incluso). */
export const richHtml = (s = "") => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

/** Testo con **grassetto** → testo semplice (per LinkedIn e README). */
export const plain = (s = "") => String(s).replace(/\*\*(.+?)\*\*/g, "$1");

const MONTHS = {
  itShort: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  itLong: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
  enShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** "2025-10-01" | "2025-10" | "2025" → { y, m, d } (m e d possono mancare). */
export function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  return { y, m: m || null, d: d || null };
}

/** Formatta una data a mese. style: itShort | itLong | enShort */
export function fmtMonth(iso, style) {
  const p = parseDate(iso);
  if (!p) return "";
  if (!p.m) return String(p.y);
  return `${MONTHS[style][p.m - 1]} ${p.y}`;
}

/** 2025-10-01 → 01/10/2025 */
export function fmtDMY(iso) {
  const p = parseDate(iso);
  if (!p || !p.m || !p.d) return iso ?? "";
  const z = (n) => String(n).padStart(2, "0");
  return `${z(p.d)}/${z(p.m)}/${p.y}`;
}

/** Intervallo tra due date. Se `end` manca o coincide con `start` mostra una sola data. */
export function fmtRange(start, end, fmt, sep = "–") {
  if (!start) return "";
  const a = fmt(start);
  if (!end || end === start) return a;
  return `${a} ${sep} ${fmt(end)}`;
}

export const stripProtocol = (url = "") => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const CATEGORY_LABELS = {
  LANG: "Linguaggi", TEST: "Testing", WEB: "Web", TOOLS: "Strumenti", OS: "Sistemi operativi",
  MOBILE: "Mobile", DB: "Database", OPS: "DevOps", CLOUD: "Cloud", DOCS: "Documentazione",
  VERSION: "Versioning", DESIGN: "Design",
};

/** Progetti di un target, nell'ordine indicato in targets.<nome>.projects. */
export function projectsFor(profile, target) {
  const byId = new Map(profile.projects.map((p) => [p.id, p]));
  return (profile.targets[target]?.projects ?? []).map((id) => byId.get(id)).filter(Boolean);
}
