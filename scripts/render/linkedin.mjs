// LinkedIn non permette di modificare il profilo via API: qui si generano i testi
// già pronti, sezione per sezione, da copiare a mano (2 minuti).
import { plain, fmtMonth, fmtRange, projectsFor } from "../lib/util.mjs";
import { LIMITS } from "../validate.mjs";

const CEFR_TO_LINKEDIN = {
  A1: "Livello elementare", A2: "Livello elementare", B1: "Competenza professionale limitata",
  B2: "Competenza professionale", C1: "Competenza professionale completa", C2: "Madrelingua o bilingue",
};
const levelLabel = (l) => (/nativ/i.test(l) ? "Madrelingua o bilingue" : CEFR_TO_LINKEDIN[(l.match(/[ABC][12]/) || [])[0]] ?? l);

export function renderLinkedin(p) {
  const my = (d) => fmtMonth(d, "itLong");
  const about = p.about.map(plain).join("\n\n");

  // Competenze: prima quelle "in evidenza", poi il resto senza duplicati.
  const pinned = p.targets.linkedin?.pinnedSkills ?? [];
  const all = [...pinned, ...p.skills.flatMap((g) => g.items)];
  const seen = new Set();
  const skills = all.filter((s) => !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));

  const exp = p.experience
    .map((x) => {
      const body = [...x.activities, ...x.learned].map((a) => `• ${a}`).join("\n");
      return `### ${x.role} — ${x.company}
- **Tipo di impiego:** Tirocinio
- **Sede:** ${x.location}
- **Periodo:** ${fmtRange(x.start, x.end, my, "–")}
- **Settore:** ${x.sector}

\`\`\`text
${body}
\`\`\``;
    })
    .join("\n\n");

  const edu = p.education
    .map(
      (e) => `### ${e.institution}
- **Titolo di studio:** ${e.title}
- **Periodo:** ${e.start} – ${e.end}
- **Voto:** ${e.grade}${e.skills ? `\n- **Attività e competenze:** ${e.skills.join("; ")}` : ""}`
    )
    .join("\n\n");

  const projs = projectsFor(p, "linkedin")
    .map((x) => {
      const desc = x.desc;
      const tech = (x.tech ?? []).join(", ");
      const period = fmtRange(x.start, x.end, my, "–");
      return `### ${x.title}${period ? ` (${period})` : ""}
\`\`\`text
${desc}
\`\`\`
**Competenze associate:** ${tech}`;
    })
    .join("\n\n");

  const certs = p.certifications
    .map((c) => `- **${c.name}** — ${c.issuer} (${c.author})\n  Rilasciata: ${my(c.date)} · URL credenziale: ${c.url}`)
    .join("\n");

  const langs = p.languages.map((l) => `- ${l.name} — ${levelLabel(l.level)}`).join("\n");

  const markdown = `# LinkedIn — testi pronti da incollare

> Generato da \`data/profile.json\`. Non modificare qui: cambia il file dati e rigenera.
> Profilo: ${p.person.links.linkedin.url}

## Headline (${p.person.headline.length}/${LIMITS.linkedinHeadline})

\`\`\`text
${p.person.headline}
\`\`\`

## Informazioni (${about.length}/${LIMITS.linkedinAbout})

\`\`\`text
${about}
\`\`\`

## Esperienze

${exp}

## Formazione

${edu}

## Progetti

${projs}

## Competenze (${skills.length}/${LIMITS.linkedinSkills}) — le prime ${pinned.length} vanno messe in evidenza

${skills.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Licenze e certificazioni

${certs}

## Lingue

${langs}
`;

  return { markdown, stats: { headline: p.person.headline.length, about: about.length, skills: skills.length } };
}
