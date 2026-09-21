// Controlli sul file dati. Gli errori bloccano la build, gli avvisi no.
import { plain } from "./lib/util.mjs";

const DATE_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
export const LIMITS = { linkedinHeadline: 220, linkedinAbout: 2600, linkedinSkills: 50 };

export function validate(p) {
  const errors = [];
  const warnings = [];
  const notes = [];

  // Campi obbligatori
  for (const f of ["name", "email", "headline"]) if (!p.person?.[f]) errors.push(`person.${f} mancante`);
  if (!p.summary) errors.push("summary mancante");

  // Date
  const checkDate = (label, v) => {
    if (v != null && !DATE_RE.test(v)) errors.push(`${label}: data "${v}" non valida (usa YYYY, YYYY-MM o YYYY-MM-DD)`);
  };
  p.experience.forEach((e) => { checkDate(`experience.${e.id}.start`, e.start); checkDate(`experience.${e.id}.end`, e.end); });
  p.projects.forEach((x) => { checkDate(`projects.${x.id}.start`, x.start); checkDate(`projects.${x.id}.end`, x.end); });
  p.certifications.forEach((c) => checkDate(`certifications.${c.id}.date`, c.date));

  // ID unici
  const ids = p.projects.map((x) => x.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => errors.push(`projects: id duplicato "${id}"`));

  // Target → progetti esistenti e con i campi necessari
  const byId = new Map(p.projects.map((x) => [x.id, x]));
  for (const [target, cfg] of Object.entries(p.targets)) {
    for (const id of cfg.projects ?? []) {
      const proj = byId.get(id);
      if (!proj) { errors.push(`targets.${target}: progetto "${id}" non esiste`); continue; }
      for (const field of ["title", "tag", "summary", "desc", "thumbBg", "tech"])
        if (!proj[field]) errors.push(`projects.${id}: campo "${field}" mancante`);
    }
  }

  // Limiti LinkedIn
  const headlineLen = p.person.headline.length;
  if (headlineLen > LIMITS.linkedinHeadline) errors.push(`LinkedIn headline: ${headlineLen}/${LIMITS.linkedinHeadline} caratteri`);
  const aboutLen = p.about.map(plain).join("\n\n").length;
  if (aboutLen > LIMITS.linkedinAbout) errors.push(`LinkedIn About: ${aboutLen}/${LIMITS.linkedinAbout} caratteri`);

  // Repo mancanti
  const noRepo = p.projects.filter((x) => !x.repo).map((x) => x.id);
  if (noRepo.length) notes.push(`${noRepo.length} progetti senza "repo": le card puntano al profilo GitHub (${noRepo.join(", ")})`);

  return { errors, warnings, notes };
}
