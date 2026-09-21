#!/usr/bin/env node
// Uso:
//   node scripts/build.mjs                      build completa (PDF con Chromium/Playwright)
//   node scripts/build.mjs --no-pdf             salta il PDF
//   node scripts/build.mjs --check              solo validazione
//   node scripts/build.mjs --engine=weasyprint  PDF con WeasyPrint invece di Chromium
//   node scripts/build.mjs --root=/percorso     cartella del repo (default: cartella corrente)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { validate } from "./validate.mjs";
import { renderCv } from "./render/cv.mjs";
import { injectWeb } from "./render/web.mjs";
import { renderLinkedin } from "./render/linkedin.mjs";
import { renderReadme } from "./render/readme.mjs";

const args = new Map(process.argv.slice(2).map((a) => { const [k, v = true] = a.replace(/^--/, "").split("="); return [k, v]; }));
const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(args.get("root") || join(here, ".."));
const require = createRequire(join(ROOT, "package.json"));
const p = (...s) => join(ROOT, ...s);

const log = (icon, msg) => console.log(`${icon} ${msg}`);

// 1. Dati + validazione ----------------------------------------------------
const profile = JSON.parse(readFileSync(p("data/profile.json"), "utf8"));
const { errors, warnings, notes } = validate(profile);
notes.forEach((m) => log("ℹ️ ", m));
warnings.forEach((m) => log("⚠️ ", m));
if (errors.length) {
  errors.forEach((m) => log("✖", m));
  process.exit(1);
}
log("✔", "profile.json valido");
if (args.get("check")) process.exit(0);

mkdirSync(p("dist"), { recursive: true });

// 2. CV --------------------------------------------------------------------
function fontFace(pkg, file, family, weight, style = "normal") {
  try {
    const b64 = readFileSync(require.resolve(`${pkg}/files/${file}`)).toString("base64");
    return `@font-face{font-family:"${family}";font-weight:${weight};font-style:${style};src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
  } catch {
    return "";
  }
}
const fontsCss = [
  fontFace("@fontsource/lato", "lato-latin-400-normal.woff2", "Lato", 400),
  fontFace("@fontsource/lato", "lato-latin-400-italic.woff2", "Lato", 400, "italic"),
  fontFace("@fontsource/lato", "lato-latin-700-normal.woff2", "Lato", 700),
  fontFace("@fontsource/montserrat", "montserrat-latin-700-normal.woff2", "Montserrat", 700),
  fontFace("@fontsource/montserrat", "montserrat-latin-800-normal.woff2", "Montserrat", 800),
].join("\n");
if (!fontsCss) log("⚠️ ", "font non trovati (npm install): il CV usa i font di sistema");

const cvHtml = renderCv(profile, { css: readFileSync(p("templates/cv.css"), "utf8"), fontsCss });
writeFileSync(p("dist/cv.html"), cvHtml);
log("✔", "dist/cv.html");

async function makePdf(htmlPath, pdfPath) {
  if (args.get("engine") === "weasyprint") {
    const r = spawnSync("python3", ["-m", "weasyprint", htmlPath, pdfPath], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(r.stderr || "WeasyPrint non disponibile");
    return "WeasyPrint";
  }
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  return "Chromium";
}

if (!args.get("no-pdf")) {
  try {
    const engine = await makePdf(p("dist/cv.html"), p("cv.pdf"));
    log("✔", `cv.pdf (${engine})`);
  } catch (e) {
    log("✖", `PDF non generato: ${e.message.split("\n")[0]}`);
    log("  ", "Chromium: npx playwright install chromium  —  oppure usa --engine=weasyprint");
    process.exit(1);
  }
}

// 3. Testi per LinkedIn e README del profilo GitHub ---------------------------
const { markdown: linkedinMd, stats } = renderLinkedin(profile);
writeFileSync(p("dist/linkedin.md"), linkedinMd);
log("✔", `dist/linkedin.md (headline ${stats.headline}/220, about ${stats.about}/2600, competenze ${stats.skills}/50)`);

writeFileSync(p("dist/README.profile.md"), renderReadme(profile));
log("✔", "dist/README.profile.md");

// 4. Portfolio ---------------------------------------------------------------
const indexPath = p("index.html");
if (existsSync(indexPath)) {
  const before = readFileSync(indexPath, "utf8");
  const { html, missing } = injectWeb(before, profile);
  if (missing.length) {
    log("⚠️ ", `index.html senza marcatori per: ${missing.join(", ")} — esegui una volta: node scripts/migrate-markers.mjs`);
  }
  if (html !== before) writeFileSync(indexPath, html);
  log("✔", `index.html ${html !== before ? "aggiornato" : "già aggiornato"}`);
} else {
  log("ℹ️ ", "index.html non trovato: salto il portfolio");
}
