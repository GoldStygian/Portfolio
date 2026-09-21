import { esc, attr, fmtDMY, fmtMonth, fmtRange, projectsFor, stripProtocol } from "../lib/util.mjs";

const ICONS = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5" fill="currentColor" stroke="none"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>',
};

const link = (href, text) => `<a href="${attr(href)}">${esc(text)}</a>`;

/** Singola voce: stringa oppure { text, children } (sotto-elenco). */
const li = (it) =>
  typeof it === "string"
    ? `<li>${esc(it)}</li>`
    : `<li>${esc(it.text)}<ul class="o">${it.children.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></li>`;

function contactBox(p) {
  const { person } = p;
  const phone = process.env.CV_PHONE || person.phone;
  const items = [
    [ICONS.pin, esc(`${person.location.country}, ${person.location.region}`)],
    [ICONS.mail, link(`mailto:${person.email}`, person.email)],
    [ICONS.github, link(person.links.github.url, person.links.github.username)],
    phone && [ICONS.phone, link(`tel:${phone.replace(/\s/g, "")}`, phone)],
    [ICONS.globe, link(person.links.portfolio.url, person.links.portfolio.label)],
    [ICONS.linkedin, link(person.links.linkedin.url, person.links.linkedin.handle)],
  ].filter(Boolean);
  return `<div class="contact">${items.map(([i, t]) => `<span class="ci"><i>${i}</i>${t}</span>`).join("")}</div>`;
}

function education(p) {
  return p.education
    .map((e) => {
      const list = [`<li>${esc(e.institution)}</li>`, `<li>Votazione finale: ${esc(e.grade)}</li>`];
      if (e.skills) {
        list.push(`<li>${esc(e.skillsIntro)}<ul class="o">${e.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></li>`);
      }
      return `<div class="edu">
  <div class="period">${esc(e.start)} – ${esc(e.end)}</div>
  <div class="edu-title">${esc(e.title)}</div>
  <ul>${list.join("")}</ul>
</div>`;
    })
    .join("\n");
}

function experience(p) {
  return p.experience
    .map((x) => {
      const act = x.activities.map((a) => `<li>${esc(a)}</li>`).join("");
      const learned = x.learned.map((a) => `<li>${esc(a)}</li>`).join("");
      return `<article class="job">
  <div class="row"><h3>${esc(x.company)}</h3><span class="date">${fmtDMY(x.start)} – ${fmtDMY(x.end)}</span></div>
  <ul class="tight">
    <li><b>Ruolo</b>: ${esc(x.role)}</li>
    <li><b>Luogo</b>: ${esc(x.location)}</li>
    <li><b>Settore</b>: ${esc(x.sector)}</li>
    <li><b>Attività svolte</b>:<ul class="o">${act}</ul></li>
    <li><b>Conoscenze acquisite</b>:<ul class="o small">${learned}</ul></li>
  </ul>
</article>`;
    })
    .join("\n");
}

function project(x) {
  const date = fmtRange(x.start, x.end, (d) => fmtMonth(d, "enShort"));
  const sub = x.subtitle ? ` <span class="sub">(${esc(x.subtitle)})</span>` : "";
  const tech = x.tech?.length ? `<li><b>Tecnologie</b>: ${esc(x.tech.join(", "))}</li>` : "";
  const lis = `<li>${esc(x.summary)}</li>` + tech;
  return `<article class="proj">
  <div class="row"><h3>${esc(x.title)}${sub}</h3>${date ? `<span class="date">${esc(date)}</span>` : ""}</div>
  <ul>${lis}</ul>
</article>`;
}

function skills(p) {
  return `<ul>${p.skills.map((g) => `<li><b>${esc(g.label)}</b>: ${esc(g.items.join(", "))}</li>`).join("")}</ul>`;
}

function certifications(p) {
  return `<ul class="certs">${p.certifications
    .map(
      (c) => `<li>${esc(c.name)}<ul class="o">
  <li>${esc(c.issuer)} – ${esc(c.author)} – ${c.hours} ore - ${esc(fmtMonth(c.date, "itLong"))}</li>
  <li>url: ${link(c.url, stripProtocol(c.url))}</li>
</ul></li>`
    )
    .join("")}</ul>`;
}

const section = (title, body, { line = false, cls = "" } = {}) =>
  `<section class="${cls}"><h2${line ? "" : ' class="u"'}>${title}</h2>${body}</section>`;

export function renderCv(p, { css, fontsCss = "" }) {
  const projs = projectsFor(p, "cv");
  const n1 = p.targets.cv.projectsOnPage1 ?? 1;
  const page1 = projs.slice(0, n1);
  const page2 = projs.slice(n1);

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>CV — ${esc(p.person.name)}</title>
<style>${fontsCss}
${css}</style>
</head>
<body>
<header class="head">
  <h1>${esc(p.person.name)}</h1>
  ${contactBox(p)}
</header>

<section class="profile">
  <h2 class="ruled"><span>PROFILE INFO</span></h2>
  <p>${esc(p.summary)}</p>
</section>

<div class="cols">
  <aside class="side">
    ${section("EDUCATION", education(p))}
    ${section("LANGUAGES", `<ul>${p.languages.map((l) => `<li>${esc(l.name)} (${esc(l.level)})</li>`).join("")}</ul>`)}
    ${section("DRIVING LICENSES", `<ul>${p.drivingLicenses.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`)}
  </aside>
  <main class="main">
    ${section("EXPERIENCES", experience(p))}
    ${page1.length ? section("PROJECTS", page1.map(project).join("\n")) : ""}
  </main>
</div>

<div class="page2">
  ${page2.length ? section("PROJECTS", page2.map(project).join("\n")) : ""}
  ${section("IT SKILLS", skills(p))}
  ${section("CERTIFICATIONS", certifications(p))}
</div>
</body>
</html>
`;
}
