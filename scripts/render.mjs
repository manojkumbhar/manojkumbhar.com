/**
 * Renders the approved one-page site from a content object.
 * Presentation (markup, class names, CSS, behavior) stays fixed.
 * Every visible string comes from the content object.
 */

export const NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  now: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  beyond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  experience: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
};

export const SOCIAL_ICONS = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.2 1.5-2.2 2.9V21H9z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4zm-1.2 17.9h1.9L7.1 4.2H5.1z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></svg>',
};

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function escText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(value) {
  return escText(value).replace(/"/g, '&quot;');
}

function isExternal(href) {
  return /^https?:\/\//i.test(href);
}

function externalAttrs(href) {
  return isExternal(href) ? ' target="_blank" rel="noopener"' : '';
}

function statusClass(kind) {
  if (!kind) return 'st';
  if (kind === 'prog' || kind === 'built') return `st ${kind}`;
  throw new Error(`Unknown project statusKind "${kind}". Use "", "prog", or "built".`);
}

function renderInitialSlide(trip) {
  const position = trip.objectPosition ? ` style="object-position:${escAttr(trip.objectPosition)}"` : '';
  if (trip.type === 'video') {
    const poster = trip.poster ? ` poster="assets/trips/${escAttr(trip.poster)}"` : '';
    const webm = trip.srcWebm
      ? `<source src="assets/trips/${escAttr(trip.srcWebm)}" type="video/webm">`
      : '';
    return `<video playsinline webkit-playsinline muted preload="metadata"${poster} aria-label="${escAttr(trip.alt || trip.caption || 'Trip video')}"${position}>${webm}<source src="assets/trips/${escAttr(trip.src)}" type="video/mp4"></video>`;
  }
  return `<img src="assets/trips/${escAttr(trip.src)}" alt="${escAttr(trip.alt || trip.caption || '')}" width="900" height="1600" fetchpriority="high"${position}>`;
}

function renderDemo(demo) {
  if (!demo) return '';
  return `
          <div class="demo" id="carry">
            <div class="hd"><span>${escText(demo.title)}</span><span class="sample">${escText(demo.badge)}</span></div>
            <div class="sum" aria-live="polite">
              <span></span><span class="c" id="cTens">1</span><span></span>
              <span></span><span id="a1">2</span><span id="a0">7</span>
              <span>+</span><span id="b1">1</span><span id="b0">5</span>
              <span class="rule"></span>
              <span></span><span class="ans" id="r1">?</span><span class="ans" id="r0">?</span>
            </div>
            <p class="explain" id="explain">Add the ones first. What happens when they make more than 9?</p>
            <div class="row"><button class="btn btn-solid" type="button" id="step">Next step</button><button class="btn btn-ghost" type="button" id="newsum">New sum</button></div>
          </div>`;
}

export function renderPage(site, { css, js, boot }) {
  const profile = site.profile;
  const first = site.trips[0];
  const nav = site.navigation.map((item) => {
    const active = item.id === 'top' ? ' class="active"' : '';
    return `      <li><a href="#${escAttr(item.id)}"${active}>${NAV_ICONS[item.icon]}${escText(item.label)}</a></li>`;
  }).join('\n');

  const platforms = site.social.map((item) => {
    const label = item.ariaLabel || item.label;
    const title = item.title || item.label;
    return `    <a href="${escAttr(item.href)}"${externalAttrs(item.href)} aria-label="${escAttr(label)}" title="${escAttr(title)}">${SOCIAL_ICONS[item.icon]}</a>`;
  }).join('\n');

  const topMenu = site.topMenu.map((item) =>
    `      <li><a href="${escAttr(item.href)}">${escText(item.label)}</a></li>`
  ).join('\n');

  const ctas = site.cta.map((item) => {
    const style = item.style === 'ghost' ? 'btn-ghost' : 'btn-solid';
    const icon = item.style === 'ghost' ? '' : ` ${ARROW}`;
    return `          <a class="btn ${style}" href="${escAttr(item.href)}">${escText(item.label)}${icon}</a>`;
  }).join('\n');

  const stats = site.heroTrip.stats.map((item) =>
    `<div><b>${escText(item.value)}</b>${escText(item.label)}</div>`
  ).join('');

  const nowCards = site.now.cards.map((card) =>
    `      <div><div class="lbl">${escText(card.label)}</div><div class="val">${escText(card.value)}</div><div class="note">${escText(card.note)}</div></div>`
  ).join('\n');

  const explore = site.explore.cards.map((card) =>
    `        <a href="${escAttr(card.href)}" class="panel xcard reveal"><div class="top"><span class="ctag">${escText(card.tag)}</span><span class="ccount">${escText(card.count)}</span></div><h3>${escText(card.title)}</h3><p>${escText(card.text)}</p><div class="cact"><span>${escText(card.action)}</span><span class="arr">→</span></div></a>`
  ).join('\n');

  const aboutParas = site.about.paragraphs.map((paragraph, index) => {
    const style = index === site.about.paragraphs.length - 1 ? ' style="margin:0"' : '';
    return `          <p${style}>${escText(paragraph)}</p>`;
  }).join('\n');

  const how = site.about.how.map((item) => `            <li>${escText(item)}</li>`).join('\n');

  const projects = site.projects.items.map((item) => `
        <article class="panel story reveal">
          <div class="top"><h3>${escText(item.title)}</h3><span class="${statusClass(item.statusKind)}">${escText(item.status)}</span></div>
          <dl>
${item.facts.map((fact) => `            <div><dt>${escText(fact.label)}</dt><dd>${escText(fact.text)}</dd></div>`).join('\n')}
          </dl>${renderDemo(item.demo)}
        </article>`).join('\n');

  const beyond = site.beyond.items.map((item) =>
    `        <div class="panel chip reveal"><span class="ic">${escText(item.icon)}</span><b>${escText(item.title)}</b><p>${escText(item.text)}</p></div>`
  ).join('\n');

  const timeline = site.experience.items.map((item) =>
    `        <li><span class="yr">${escText(item.years)}</span><b>${escText(item.title)}</b><span>${escText(item.detail)}</span></li>`
  ).join('\n');

  const note = site.experience.note
    ? `\n      <small>${escText(site.experience.note)}</small>`
    : '';

  const contactLinks = site.contact.links.map((item) =>
    `          <a href="${escAttr(item.href)}"${externalAttrs(item.href)}>${escText(item.label)} <small>${escText(item.short)}</small></a>`
  ).join('\n');

  return `<!doctype html>
<html lang="${escAttr(site.site.language)}" data-theme-key="${escAttr(site.site.themeStorageKey)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escText(site.site.title)}</title>
<meta name="description" content="${escAttr(site.site.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script>
${boot.trim()}
</script>
<style>
${css.replace(/\s*$/, '')}
</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>

<!-- ===== Sidebar ===== -->
<aside class="side" id="side" aria-label="Sidebar">
  <div class="me">
    <a href="#top" class="avatar"><img src="assets/${escAttr(profile.portrait)}" alt="${escAttr(profile.portraitAlt)}" width="112" height="112"></a>
    <a href="#top" class="name">${escText(profile.name)}</a>
    <p class="sub">${escText(profile.sidebarTagline)}</p>
  </div>
  <nav aria-label="Sections">
    <ul>
${nav}
    </ul>
  </nav>
  <div class="platforms" aria-label="Elsewhere">
    <button id="theme" type="button" aria-label="Toggle light or dark mode" title="Light / dark">
      <svg class="theme-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      <svg class="theme-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    </button>
${platforms}
  </div>
  <div class="foot">© <span class="yr"></span> · ${escText(profile.locationCode)}</div>
</aside>
<div class="scrim" id="scrim"></div>

<div class="main" id="top">
  <header class="topbar">
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-controls="side" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    <span class="crumb">~/<b>${escText(site.site.crumb.handle)}</b>.${escText(site.site.crumb.suffix)}</span>
    <ul class="topmenu" aria-label="Quick links">
${topMenu}
    </ul>
  </header>

  <!-- ===== NOW strip (above the fold) ===== -->
  <div id="now" aria-label="What I'm doing now">
    <div class="nowbar"><span class="tag">${escText(site.now.tag)}</span><span>${escText(site.now.banner)}</span><span class="month mono">${escText(site.now.month)}</span></div>
    <div class="nowgrid">
      <div class="first"><div class="lbl"><span class="live"></span>${escText(site.now.lead.label)}</div><div class="val">${escText(site.now.lead.value)}</div><a href="${escAttr(site.now.lead.href)}">${escText(site.now.lead.linkLabel)}</a></div>
${nowCards}
    </div>
  </div>

  <main class="content" id="content">
    <!-- ===== Hero ===== -->
    <section class="hero" aria-label="Introduction">
      <div>
        <div class="status"><i></i>${escText(profile.status)}</div>
        <h1>${escText(profile.headline)} <em>${escText(profile.headlineEmphasis)}</em></h1>
        <p class="prompt">${escText(profile.prompt)}<span class="cur"></span></p>
        <p class="sub">${escText(profile.intro)}</p>
        <div class="cta">
${ctas}
        </div>
      </div>
      <figure class="panel hud trek" style="margin:0">
        <div class="bar"><span>${escText(site.heroTrip.kicker)}</span><span id="tripBar">● ${escText(first.caption || first.trip || '')}</span></div>
        <div class="photo-slot" id="tripShow" role="region" aria-roledescription="carousel" aria-label="Trip photos" tabindex="0">
          <div class="ss-track">
            <div class="slide is-active" role="group" aria-roledescription="slide" aria-label="1 of 1" aria-hidden="false">
              ${renderInitialSlide(first)}
            </div>
          </div>
          <div class="ss-caption" aria-live="polite">${escText(first.caption || '')}</div>
          <button type="button" class="ss-prev" aria-label="Previous photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="ss-next" aria-label="Next photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <div class="ss-dots" role="tablist" aria-label="Choose a trip photo"></div>
        </div>
        <figcaption class="cap">${stats}</figcaption>
      </figure>
    </section>

    <!-- ===== Explore ===== -->
    <section aria-labelledby="explore-h">
      <p class="kicker">${escText(site.explore.kicker)}</p>
      <h2 id="explore-h">${escText(site.explore.title)}</h2>
      <p class="lede">${escText(site.explore.lede)}</p>
      <div class="explore">
${explore}
      </div>
    </section>

    <!-- ===== Latest / Notes ===== -->
    <section id="notes" aria-labelledby="notes-h">
      <p class="kicker">${escText(site.notes.kicker)}</p>
      <h2 id="notes-h">${escText(site.notes.title)}</h2>
      <p class="lede">${escText(site.notes.lede)}</p>
      <div class="panel reveal" style="padding:26px">
        <p style="margin:0;color:var(--muted)">${escText(site.notes.empty)}</p>
      </div>
    </section>

    <!-- ===== About ===== -->
    <section id="about" aria-labelledby="about-h">
      <p class="kicker">${escText(site.about.kicker)}</p>
      <h2 id="about-h">${escText(site.about.title)}</h2>
      <div class="about">
        <div class="panel hud reveal">
          <p class="prompt-h">${escText(site.about.prompt)}</p>
${aboutParas}
        </div>
        <div class="panel reveal" style="padding:26px">
          <p class="prompt-h">${escText(site.about.howPrompt)}</p>
          <ul class="how">
${how}
          </ul>
        </div>
      </div>
    </section>

    <!-- ===== Projects ===== -->
    <section id="projects" aria-labelledby="proj-h">
      <p class="kicker">${escText(site.projects.kicker)}</p>
      <h2 id="proj-h">${escText(site.projects.title)}</h2>
      <p class="lede">${escText(site.projects.lede)}</p>
      <div class="projects">
${projects}
      </div>
    </section>

    <!-- ===== Beyond work ===== -->
    <section id="beyond" aria-labelledby="beyond-h">
      <p class="kicker">${escText(site.beyond.kicker)}</p>
      <h2 id="beyond-h">${escText(site.beyond.title)}</h2>
      <div class="beyond">
${beyond}
      </div>
    </section>

    <!-- ===== Experience (lower on the page) ===== -->
    <section id="experience" aria-labelledby="exp-h" class="career">
      <p class="kicker">${escText(site.experience.kicker)}</p>
      <h2 id="exp-h">${escText(site.experience.title)}</h2>
      <p class="lede">${escText(site.experience.lede)}</p>
      <ol class="tl reveal">
${timeline}
      </ol>${note}
    </section>

    <!-- ===== Contact ===== -->
    <section id="contact" aria-labelledby="contact-h">
      <div class="panel hud contact reveal">
        <div>
          <p class="kicker">${escText(site.contact.kicker)}</p>
          <h2 id="contact-h">${escText(site.contact.title)}</h2>
          <p>${escText(site.contact.text)}</p>
        </div>
        <div class="clinks">
${contactLinks}
        </div>
      </div>
    </section>

    <footer><span>© <span class="yr"></span> ${escText(profile.name)} · ${escText(profile.locationShort)}</span><span>${escText(site.site.footerTagline)}</span></footer>
  </main>
</div>

<script>
${js.replace(/\s*$/, '')}
</script>
</body>
</html>
`;
}
