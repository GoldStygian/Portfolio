import { plain, projectsFor } from "../lib/util.mjs";

const image = (src, alt = "", attrs = "") => `<img src="${src}" alt="${alt}"${attrs}>`;

const ICON_SLUGS = {
  "C++": "cplusplus",
  JavaScript: "javascript",
  TypeScript: "typescript",
  Junit: "junit",
  "Selenium WebDriver": "selenium",
  "Allure Report": "allure",
  PostgreSQL: "postgresql",
  "LaTeX": "latex",
  Windows: "windows",
};

function skillTables(skills) {
  return skills
    .map(({ label: category, items }) => {
      const labels = items.join(" | ");
      const separator = items.map(() => "-").join("|");
      const cells = items
        .map((icon) => {
          const normalized = ICON_SLUGS[icon] ?? icon.toLowerCase().replace(/\s+/g, "");
          const source = ["figma", "kali", "mint", "ubuntu"].includes(normalized)
            ? `https://skillicons.dev/icons?i=${normalized}`
            : `https://github.com/devicons/devicon/blob/master/icons/${normalized}/${normalized}-original.svg`;
          return image(source, icon, ' width="55" height="55"');
        })
        .join(" | ");
      return `### ${category}\n| ${labels} |\n|${separator}|\n| ${cells} |`;
    })
    .join("\n\n");
}

export function renderReadme(p) {
  const { person } = p;
  const edu = p.education[0];
  const config = p.readme ?? {};

  const stack = p.skills
    .map(({ label, items }) => `| ${label} | ${items.join(", ")} |`)
    .join("\n");

  const universityProjects = p.projects
    .filter((x) => x.tag === "PROG UNI")
    .map(({ title, exam, repo, desc }) => `- **${exam} - ${repo ? `[${title}](${repo})` : title}** — ${desc}`)
    .join("\n");

    /*
  const featured = universityProjects
    .map(({ title, exam, repo, desc }) => `- **${repo ? `[${title}](${repo})` : title}** — ${desc}`)
    .join("\n");
*/

  const stats = config.stats
    ? `<p align="center">\n  <a href="https://github.com/anuraghazra/github-readme-stats">\n    ${image(config.stats.languages, "Top languages", ' height="200" align="center"')}\n    ${image(config.stats.profile, "GitHub statistics", ' height="200" align="center"')}\n  </a>\n</p>`
    : "";

  return `${config.introImage ? `[![Matrix SVG](${config.introImage})](${config.introImage})\n\n` : ""}# ${person.name}

**${person.tagline}** · ${edu.shortName}, ${person.location.city}

${p.about.map(plain).join("\n\n")}

${config.trophy ? `<p align="center">\n  <a href="${config.trophy.url}">\n    ${image(config.trophy.image, "trophy")}\n  </a>\n</p>` : ""}

${universityProjects ? `## University's project\n${universityProjects}` : ""}

${config.personalProjects ? `## Public Personal project:\n${config.personalProjects.map(({ label, url }) => `- 🛠️ [${label}](${url})`).join("\n")}` : ""}

## Statistics

${stats}

## Skills

${skillTables(p.skills)}

Altri progetti nei [repository](${person.links.github.repos}) e nel [portfolio](${person.links.portfolio.url}).

## 📫 How to reach me

<a href="mailto:${person.email}" target="blank"><img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="gmail"/></a>
<a href="${person.links.linkedin.url}" target="blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="linkedin"/></a>
`;
}

/*
## Progetti in evidenza

${featured}
*/

/*
## Stack

| | |
|---|---|
${stack}
*/