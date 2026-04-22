// Custom Cursor
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});
document.querySelectorAll('a, button, input, textarea, [class*="cursor"]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// Scroll Progress
window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    document.getElementById('progressBar').style.width = (document.documentElement.scrollTop / h * 100) + '%';
});

// Reveal on Scroll
const revealEls = document.querySelectorAll('.reveal');
new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.08 }).observe
    ? (() => {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
        }, { threshold: 0.08 });
        revealEls.forEach(el => obs.observe(el));
    })() : revealEls.forEach(el => el.classList.add('active'));

// Contact form — Web3Forms
async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('submit-btn');
    const wrap = document.getElementById('contact-form-wrap');

    // Loading state
    btn.disabled = true;
    btn.textContent = '⏳ TRASMISSIONE IN CORSO...';
    btn.style.opacity = '0.6';

    try {
        const formData = new FormData(form);
        const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            wrap.innerHTML = `
                <div style="padding:60px 20px;text-align:center;font-family:var(--font-mono);">
                    <div style="font-size:48px;margin-bottom:16px;">✓</div>
                    <div style="font-size:18px;font-weight:700;color:var(--olive);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Trasmissione Ricevuta</div>
                    <div style="font-size:12px;color:var(--ink-fade);line-height:1.7;">Messaggio inviato con successo.<br>Ti contatterò a breve.</div>
                </div>
            `;
        } else {
            throw new Error(data.message || 'Errore sconosciuto');
        }
    } catch (err) {
        btn.disabled = false;
        btn.textContent = '▶ TRASMETTI DATI';
        btn.style.opacity = '1';
        wrap.insertAdjacentHTML('beforeend', `
            <div id="form-error" style="margin-top:12px;padding:12px;border:1px solid var(--red);font-family:var(--font-mono);font-size:11px;color:var(--red);text-align:center;letter-spacing:.05em;">
                ✖ ERRORE: ${err.message}. Riprova.
            </div>
        `);
        // Rimuovi il messaggio di errore precedente se esiste
        setTimeout(() => {
            const errorEl = document.getElementById('form-error');
            if (errorEl) errorEl.remove();
        }, 5000);
    }
}

// GitHub Stats
async function fetchGitHubStats() {
    try {
        const res = await fetch('https://api.github.com/users/GoldStygian');
        if (!res.ok) throw new Error();
        const data = await res.json();
        document.getElementById('stat-repos').textContent = data.public_repos;
        document.getElementById('stat-repos-stats').textContent = data.public_repos;
        document.getElementById('total-contributions').textContent = data.public_repos * 12;

        const statusEl = document.getElementById('gh-badges-status');
        statusEl.textContent = 'Loaded'; statusEl.style.animation = 'none';

        const badges = [];
        if (data.public_repos >= 10) badges.push({ name: '10+ Repos', icon: 'ri-folder-open-fill', color: 'var(--olive)' });
        if (data.public_repos >= 5) badges.push({ name: 'Active Dev', icon: 'ri-terminal-fill', color: 'var(--amber)' });
        if (data.followers > 0) badges.push({ name: 'Followed', icon: 'ri-user-heart-fill', color: 'var(--red)' });
        badges.push({ name: 'Contributor', icon: 'ri-medal-line', color: 'rgba(234,232,213,.6)' });

        const repeated = [...badges, ...badges, ...badges, ...badges];
        document.getElementById('gh-history-badges').innerHTML = repeated.map(b => `
            <div class="badge-item">
                <div class="badge-icon-wrap"><i class="${b.icon}" style="color:${b.color};font-size:18px;"></i></div>
                <div class="badge-label">${b.name}</div>
            </div>
        `).join('');
    } catch (err) {
        const el = document.getElementById('gh-badges-status');
        if (el) { el.textContent = 'Offline'; el.style.color = 'var(--red)'; el.style.animation = 'none'; }
    }
}
fetchGitHubStats();

// ══════════════════════════════════════════════════════════════
//  Sostituzione automatica — Cerca classi "data.x.y.z",
//  risolve il percorso nell'oggetto DATA, e sostituisce il contenuto.
//
//  Uso nell'HTML:
//    <span class="data.name">testo da sostituire</span>
//    <a class="data.socials.github.url" href="">link</a>
// ══════════════════════════════════════════════════════════════
function replaceContent() {
    // Trova tutti gli elementi che hanno almeno una classe che inizia con "data."
    document.querySelectorAll('[class*="data."]').forEach(el => {
        el.classList.forEach(cls => {
            if (!cls.startsWith('data.')) return;

            // Risolvi il percorso: "data.socials.github.url" → DATA.socials.github.url
            const path = cls.substring(5).split('.'); // rimuovi "data." e splitta
            let value = DATA;
            for (const key of path) {
                if (value == null) return;
                value = value[key];
            }
            if (value == null) return;

            // Se è un <a>: setta href (con mailto: per email)
            if (el.tagName === 'A') {
                if (typeof value === 'string' && value.includes('@')) {
                    el.href = 'mailto:' + value;
                    // Scrive il testo solo se il link non ha elementi figli (es. icone)
                    if (!el.children.length) el.textContent = value;
                } else {
                    el.href = value;
                }
            } else {
                // Per tutti gli altri elementi: setta il testo
                el.textContent = value;
            }
        });
    });
}

// ── Ticker — tutti gli item di DATA.tech_stack ───────────────────
(function renderTicker() {
    const items = Object.values(DATA.tech_stack).flat();
    const spans = items.map(t => `<span>${t} <span class="ticker-dot">✦</span></span>`).join('');
    document.getElementById('ticker-content').innerHTML = spans + spans;
})();

// ── renderSkills — legge direttamente DATA.tech_stack ────────────
(function renderSkills() {
    const body  = document.getElementById('skills-body');
    const badge = document.getElementById('skills-node-count');
    if (!body) return;

    let html = '';
    let total = 0;

    Object.entries(DATA.tech_stack).forEach(([cat, items]) => {
        total += items.length;
        const pills = items.map(n => `<span class="skill-pill">${n}</span>`).join('');
        html += `
        <div class="skill-group">
            <div class="skill-group-header">
                <span class="skill-group-cat">${cat}</span>
                <span class="skill-group-count">${items.length} node${items.length > 1 ? 's' : ''}</span>
            </div>
            <div class="skill-pills">${pills}</div>
        </div>`;
    });

    body.innerHTML = html;
    if (badge) badge.textContent = `${total} nodes loaded`;
})();

// ── Hero Terminal Animation ───────────────────────────────────────
(function initHeroTerminal() {
    const body = document.getElementById('hero-term-body');
    if (!body) return;

    // Each entry: { html, delay (ms from previous line) }
    const SCENE = [
        { html: '<span class="ht-line" style="color:#555">GNU/Linux — Federico II Build</span>', delay: 0 },
        { html: '<span class="ht-line" style="color:#555">Kernel 6.6.10-arch1-1 on x86_64</span>', delay: 300 },
        { html: '<span class="ht-line"> </span>', delay: 200 },
        { html: '<span class="ht-line"><span class="ht-ok">[ OK ]</span> Started udev Coldplug Helpers.</span>', delay: 500 },
        { html: '<span class="ht-line"><span class="ht-ok">[ OK ]</span> Found device /dev/sda1.</span>', delay: 320 },
        { html: '<span class="ht-line"><span class="ht-ok">[ OK ]</span> Reached target Local File Systems.</span>', delay: 320 },
        { html: '<span class="ht-line"><span class="ht-ok">[ OK ]</span> Started Network Manager.</span>', delay: 320 },
        { html: '<span class="ht-line"><span class="ht-ok">[ OK ]</span> <span class="ht-knowledge">AI-Module: Base Knowledge Loaded.</span></span>', delay: 600 },
        { html: '<span class="ht-line"><span class="ht-ok">[ OK ]</span> <span class="ht-knowledge">NLP-Engine: Natural Language Activated.</span></span>', delay: 420 },
        { html: '<span class="ht-line"> </span>', delay: 300 },
        { html: '<span class="ht-line" style="color:#e2c97e">Welcome back, r4ff4. System operational.</span>', delay: 700 },
        { html: '<span class="ht-line"> </span>', delay: 200 },
        { html: '<span class="ht-line" id="ht-cmd1"><span class="ht-user">r4ff4</span><span style="color:#888">@</span><span class="ht-prompt">federico-ii</span><span style="color:#888">:~$</span> </span>', delay: 800 },
        { html: null, type: 'type', target: 'ht-cmd1', text: 'cat ~/me.txt', delay: 400 },
        { html: '<span class="ht-line ht-output">Hi, I\'m Raffaele — CS Graduate 110/110</span>', delay: 1200 },
        { html: '<span class="ht-line ht-output">Federico II, Napoli · Open to Collaborate</span>', delay: 180 },
        { html: '<span class="ht-line"> </span>', delay: 200 },
        { html: '<span class="ht-line" id="ht-cmd2"><span class="ht-user">r4ff4</span><span style="color:#888">@</span><span class="ht-prompt">federico-ii</span><span style="color:#888">:~$</span> </span>', delay: 700 },
        { html: null, type: 'type', target: 'ht-cmd2', text: 'neofetch', delay: 400 },
        { html: '<span class="ht-line ht-output">OS: Federico II Linux x86_64</span>', delay: 900 },
        { html: '<span class="ht-line ht-output">Languages: Python · C++ · Java · JS</span>', delay: 200 },
        { html: '<span class="ht-line ht-output">Stack: Angular · Django · Flutter</span>', delay: 200 },
        { html: '<span class="ht-line ht-output">Degree: 110/110 — Computer Science</span>', delay: 200 },
        { html: '<span class="ht-line"> </span>', delay: 300 },
        { html: '<span class="ht-line" id="ht-cmd3"><span class="ht-user">r4ff4</span><span style="color:#888">@</span><span class="ht-prompt">federico-ii</span><span style="color:#888">:~$</span> </span>', delay: 700 },
        { html: null, type: 'type', target: 'ht-cmd3', text: 'clear', delay: 400 },
    ];

    let timers = [];

    function typeInto(el, text, speed, onDone) {
        let i = 0;
        const cursor = document.createElement('span');
        cursor.className = 'ht-cursor';
        el.appendChild(cursor);

        function tick() {
            if (i < text.length) {
                cursor.insertAdjacentText('beforebegin', text[i]);
                i++;
                const t = setTimeout(tick, speed + Math.random() * 30);
                timers.push(t);
            } else {
                cursor.remove();
                if (onDone) onDone();
            }
        }
        const t = setTimeout(tick, 0);
        timers.push(t);
    }

    function run() {
        body.innerHTML = '';
        timers.forEach(clearTimeout);
        timers = [];

        let elapsed = 0;

        SCENE.forEach((entry, idx) => {
            elapsed += entry.delay;
            const t = setTimeout(() => {

                // CLEAR action — erase and restart after a pause
                if (entry.type === 'type' && entry.text === 'clear') {
                    const cmdEl = document.getElementById(entry.target);
                    if (cmdEl) typeInto(cmdEl, entry.text, 90, () => {
                        const restartTimer = setTimeout(() => {
                            run();
                        }, 1200);
                        timers.push(restartTimer);
                    });
                    return;
                }

                if (entry.type === 'type') {
                    const cmdEl = document.getElementById(entry.target);
                    if (cmdEl) typeInto(cmdEl, entry.text, 90);
                    return;
                }

                body.insertAdjacentHTML('beforeend', entry.html);

                // keep scroll at bottom
                body.scrollTop = body.scrollHeight;

            }, elapsed);
            timers.push(t);
        });
    }

    run();
})();

replaceContent();
