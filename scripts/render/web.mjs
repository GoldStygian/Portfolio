// Rigenera le parti dinamiche di index.html. Il markup è identico a quello scritto a mano,
// così style.css e script.js continuano a funzionare senza modifiche.
import { esc, attr, richHtml, fmtMonth, fmtRange, projectsFor } from "../lib/util.mjs";

export const BLOCKS = ["DATA", "about", "education", "experience", "project-count", "projects"];

function dataBlock(p) {
  const edu = p.education[0];
  const DATA = {
    name: p.person.name,
    tagline: p.person.tagline,
    location: { city: p.person.location.city, country: p.person.location.country },
    university: { full: edu.fullName, short: edu.shortName },
    degree: { score: edu.grade },
    socials: {
      github: { url: p.person.links.github.url, username: p.person.links.github.username, repos: p.person.links.github.repos },
      linkedin: { url: p.person.links.linkedin.url, label: p.person.name },
      email: p.person.email,
    },
    tech_stack: Object.fromEntries(p.skills.map((g) => [g.label, g.items])),
  };
  return `const DATA = ${JSON.stringify(DATA, null, 2)};`;
}

const aboutBlock = (p) => p.about.map((t) => `<p>\n${richHtml(t)}\n</p>`).join("\n");

function educationBlock(p) {
  const icons = ["ri-graduation-cap-fill", "ri-book-open-fill"];
  return p.education
    .map((e, i) => {
      const first = i === 0;
      const list = e.courses
        ? e.courses
            .map(
              (g) =>
                `<li class="edu-area-title">${esc(g.area)}</li>\n` +
                g.items.map(([n, cfu]) => `<li>${esc(n)} <span class="edu-cfu">${cfu} CFU</span></li>`).join("\n")
            )
            .join("\n")
        : e.skills.map((s) => `<li>${esc(s)}</li>`).join("\n");
      return `<div class="edu-card reveal">
<div class="edu-badge${first ? "" : " edu-badge--secondary"}">
<i class="${icons[i] ?? icons[1]}"></i>
</div>
<div class="edu-header">
<h3 class="edu-title">${esc(e.webTitle ?? e.title)}</h3>
<span class="edu-date">${esc(e.start)} — ${esc(e.end)}</span>
</div>
<p class="edu-org">▸ ${esc(e.webInstitution ?? e.institution)}</p>
<div class="edu-score" style="color:var(--${first ? "olive" : "ink-mid"})">${esc(e.grade)}</div>
<ul class="edu-highlights">
${list}
</ul>
</div>`;
    })
    .join("\n\n");
}

function experienceBlock(p) {
  const fmt = (d) => fmtMonth(d, "itShort").toUpperCase();
  return p.experience
    .map((x) => {
      const bullets = x.web?.bullets ?? [`Settore: ${x.sector}`, ...x.activities, ...x.learned];
      return `<div class="exp-entry reveal">
<div class="exp-dot"></div>
<div class="exp-card">
<div class="exp-meta">
<h3 class="exp-role">${esc(x.role)}</h3>
<span class="exp-date">${esc(fmtRange(x.start, x.end, fmt, "—"))}</span>
</div>
<p class="exp-org" style="color:var(--amber)">▸ ${esc(x.company)} — ${esc(x.web?.location ?? x.location)}</p>
<ul>
${bullets.map((b) => `<li>${esc(b)}</li>`).join("\n")}
</ul>
</div>
</div>`;
    })
    .join("\n\n");
}

function projectsBlock(p) {
  return projectsFor(p, "web")
    .map((x) => {
      const href = x.repo || p.person.links.github.url;
      return `<article class="proj-card reveal">
<div class="proj-thumb" style="background:${attr(x.thumbBg)};">
<div class="proj-thumb-bg" style="background:${attr(x.thumbBg)};">
<span class="proj-thumb-text">${esc(x.thumbText)}</span>
</div>
<span class="proj-tag">${esc(x.tag)}</span>
</div>
<div class="proj-body">
<h3 class="proj-title">${esc(x.title)}</h3>
<p class="proj-desc">${esc(x.desc)}</p>
<div class="proj-tags">
${x.tech.map((c) => `<span class="proj-tech">${esc(c)}</span>`).join("\n")}
</div>
</div>
<div class="proj-footer">
<a href="${attr(href)}" target="_blank" class="proj-link">
<i class="ri-github-fill"></i> Apri Repository ↗
</a>
</div>
</article>`;
    })
    .join("\n\n");
}

export function renderBlocks(p) {
  return {
    DATA: dataBlock(p),
    about: aboutBlock(p),
    education: educationBlock(p),
    experience: experienceBlock(p),
    "project-count": `${projectsFor(p, "web").length} projects`,
    projects: projectsBlock(p),
  };
}

/** Sostituisce il contenuto tra i marcatori BEGIN:x / END:x. Restituisce html e blocchi mancanti. */
export function injectWeb(html, p) {
  const blocks = renderBlocks(p);
  const missing = [];
  for (const name of BLOCKS) {
    const js = name === "DATA";
    const begin = js ? `// BEGIN:${name}` : `<!-- BEGIN:${name} -->`;
    const end = js ? `// END:${name}` : `<!-- END:${name} -->`;
    const a = html.indexOf(begin);
    const b = html.indexOf(end);
    if (a === -1 || b === -1 || b < a) { missing.push(name); continue; }
    const inline = name === "project-count";
    const sep = inline ? "" : "\n";
    html = html.slice(0, a + begin.length) + sep + blocks[name] + sep + html.slice(b);
  }
  return { html, missing };
}
