#!/usr/bin/env node
// Da eseguire UNA volta: inserisce nel tuo index.html i marcatori che indicano
// quali parti verranno rigenerate dai dati. Non modifica nient'altro. È idempotente.
//   node scripts/migrate-markers.mjs [percorso/index.html]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.argv[2] || "index.html");
let html = readFileSync(file, "utf8");
const done = [];
const skipped = [];

const has = (n, js) => html.includes(js ? `// BEGIN:${n}` : `<!-- BEGIN:${n} -->`);

/** Inserisce i marcatori attorno all'intervallo [a, b). */
function wrap(name, a, b, js = false) {
  if (has(name, js)) return skipped.push(`${name} (già presente)`);
  if (a < 0 || b < 0 || b < a) return skipped.push(`${name} (punto di ancoraggio non trovato)`);
  const begin = js ? `// BEGIN:${name}\n` : `<!-- BEGIN:${name} -->\n`;
  const end = js ? `\n// END:${name}` : `\n<!-- END:${name} -->`;
  html = html.slice(0, a) + begin + html.slice(a, b).replace(/^\s+|\s+$/g, "") + end + html.slice(b);
  done.push(name);
}

// Regione compresa tra la fine di `open` e la fine dell'ultima occorrenza di `close` dentro la sezione.
function region(sectionId, open, close, extraClosers = 0) {
  const s = html.indexOf(`<section id="${sectionId}"`);
  const e = html.indexOf("</section>", s);
  const o = html.indexOf(open, s);
  if (s < 0 || o < 0 || o > e) return [-1, -1];
  let end = html.lastIndexOf(close, e);
  if (end < 0) return [-1, -1];
  end += close.length;
  for (let i = 0; i < extraClosers; i++) {
    const m = /^\s*<\/div>/.exec(html.slice(end));
    if (!m) return [-1, -1];
    end += m[0].length;
  }
  return [o + open.length, end];
}

// Ordine: dal fondo verso l'alto, così gli indici già calcolati restano validi.
{ const [a, b] = region("projects", '<div class="projects-grid">', "</article>"); wrap("projects", a, b); }
{
  const open = '<span class="uni-timeline-count">';
  const a = html.indexOf(open) + open.length;
  wrap("project-count", a, html.indexOf("</span>", a));
}
{ const [a, b] = region("experience", '<div class="exp-timeline">', "</ul>", 2); wrap("experience", a, b); }
{ const [a, b] = region("formazione", '<div class="edu-grid">', "</ul>"); wrap("education", a, b); }
{
  const open = '<div class="about-bio reveal">';
  const a = html.indexOf(open) + open.length;
  wrap("about", a, html.indexOf("</div>", a));
}
{
  const a = html.indexOf("const DATA = {");
  const m = a < 0 ? null : /\n[ \t]*\};/.exec(html.slice(a));
  wrap("DATA", a, m ? a + m.index + m[0].length : -1, true);
}

writeFileSync(file, html);
console.log(`Marcatori inseriti: ${done.join(", ") || "nessuno"}`);
if (skipped.length) console.log(`Saltati: ${skipped.join("; ")}`);
