import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { NAV_ICONS, SOCIAL_ICONS } from './render.mjs';

const execFileAsync = promisify(execFile);

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const THEME_KEY = /^[A-Za-z0-9_-]{1,64}$/;

export function envValue(name) {
  const value = process.env[name];
  return value == null ? '' : String(value).trim();
}

export function loadDotEnv(file) {
  return readFile(file, 'utf8').then((text) => {
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!/^SITE_DATA_[A-Z0-9_]+$/.test(key)) continue;
      if (process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }).catch((error) => {
    if (error.code === 'ENOENT') return;
    throw error;
  });
}

export function parseRepo(spec) {
  const cleaned = String(spec).trim().replace(/\.git$/, '').replace(/\/$/, '');
  const remote = cleaned.match(/github\.com[:/]([^/\s]+)\/([^/\s]+)$/);
  const short = cleaned.match(/^([^/\s]+)\/([^/\s]+)$/);
  const match = remote || short;
  if (!match || match[1] === '.' || match[2] === '.' || match[1].includes('..') || match[2].includes('..')) {
    throw new Error('SITE_DATA_REPO must look like owner/repo or a github.com repository URL.');
  }
  return { owner: match[1], repo: match[2] };
}

export function chooseSource({ repo, dir, privateExists }) {
  if (repo && dir) {
    console.warn('SITE_DATA_DIR is set, but SITE_DATA_REPO takes priority so a Vercel build cannot be overridden by a leftover folder.');
  }
  if (repo) return 'remote';
  if (dir) return 'dir';
  if (privateExists) return 'private';
  return 'sample';
}

function fail(message) {
  const error = new Error(message);
  error.isContentError = true;
  throw error;
}

function needString(object, key, ctx) {
  const value = object?.[key];
  if (typeof value !== 'string' || !value.trim()) fail(`${ctx}.${key} must be a non-empty string.`);
  return value;
}

function needArray(object, key, ctx) {
  const value = object?.[key];
  if (!Array.isArray(value) || value.length === 0) fail(`${ctx}.${key} must be a non-empty array.`);
  return value;
}

function safeRelative(rel, label) {
  if (typeof rel !== 'string' || !rel.trim()) fail(`${label} is missing a file name.`);
  const parts = rel.split('/');
  if (path.isAbsolute(rel) || rel.includes('\\') || parts.some((part) => part === '' || part === '.' || part === '..')) {
    fail(`${label} path "${rel}" must stay inside the content folder.`);
  }
  return rel;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function validateContent(site, contentDir) {
  if (!site || typeof site !== 'object' || Array.isArray(site)) fail('site.json must be a JSON object.');
  if (site.schemaVersion !== 1) fail('site.json schemaVersion must be 1.');

  needString(site.site, 'title', 'site');
  needString(site.site, 'description', 'site');
  needString(site.site, 'language', 'site');
  needString(site.site, 'footerTagline', 'site');
  const themeKey = needString(site.site, 'themeStorageKey', 'site');
  if (!THEME_KEY.test(themeKey)) fail('site.themeStorageKey may contain only letters, numbers, hyphens, and underscores.');
  needString(site.site?.crumb, 'handle', 'site.crumb');
  needString(site.site?.crumb, 'suffix', 'site.crumb');

  const profile = site.profile;
  for (const key of ['name', 'portrait', 'portraitAlt', 'sidebarTagline', 'status', 'headline', 'headlineEmphasis', 'prompt', 'intro', 'locationShort', 'locationCode']) {
    needString(profile, key, 'profile');
  }
  const portraitRel = `assets/${safeRelative(profile.portrait, 'profile.portrait')}`;
  if (!(await exists(path.join(contentDir, portraitRel)))) {
    fail(`Portrait file not found: ${portraitRel}`);
  }

  const nav = needArray(site, 'navigation', 'site');
  const ids = new Set();
  for (const item of nav) {
    const id = needString(item, 'id', 'navigation[]');
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) fail(`navigation id "${id}" must be a simple fragment (letters, numbers, hyphens).`);
    if (ids.has(id)) fail(`navigation id "${id}" is duplicated.`);
    ids.add(id);
    needString(item, 'label', `navigation.${id}`);
    needString(item, 'icon', `navigation.${id}`);
    if (!NAV_ICONS[item.icon]) fail(`navigation.${id}.icon "${item.icon}" is not supported. Use: ${Object.keys(NAV_ICONS).join(', ')}.`);
  }
  if (!ids.has('top')) fail('navigation must include an item with id "top" (the home link).');

  for (const item of needArray(site, 'topMenu', 'site')) {
    needString(item, 'href', 'topMenu[]');
    needString(item, 'label', 'topMenu[]');
  }

  const social = needArray(site, 'social', 'site');
  for (const item of social) {
    needString(item, 'icon', 'social[]');
    if (!SOCIAL_ICONS[item.icon]) fail(`social icon "${item.icon}" is not supported. Use: ${Object.keys(SOCIAL_ICONS).join(', ')}.`);
    needString(item, 'label', 'social[]');
    needString(item, 'href', 'social[]');
    needString(item, 'short', 'social[]');
  }

  needString(site.now, 'tag', 'now');
  needString(site.now, 'banner', 'now');
  needString(site.now, 'month', 'now');
  needString(site.now?.lead, 'label', 'now.lead');
  needString(site.now?.lead, 'value', 'now.lead');
  needString(site.now?.lead, 'linkLabel', 'now.lead');
  needString(site.now?.lead, 'href', 'now.lead');
  for (const card of needArray(site.now, 'cards', 'now')) {
    needString(card, 'label', 'now.cards[]');
    needString(card, 'value', 'now.cards[]');
    needString(card, 'note', 'now.cards[]');
  }

  for (const item of needArray(site, 'cta', 'site')) {
    needString(item, 'href', 'cta[]');
    needString(item, 'label', 'cta[]');
    if (item.style !== 'solid' && item.style !== 'ghost') fail('cta[].style must be "solid" or "ghost".');
  }

  needString(site.heroTrip, 'kicker', 'heroTrip');
  for (const stat of needArray(site.heroTrip, 'stats', 'heroTrip')) {
    needString(stat, 'value', 'heroTrip.stats[]');
    needString(stat, 'label', 'heroTrip.stats[]');
  }

  needString(site.explore, 'kicker', 'explore');
  needString(site.explore, 'title', 'explore');
  needString(site.explore, 'lede', 'explore');
  for (const card of needArray(site.explore, 'cards', 'explore')) {
    for (const key of ['href', 'tag', 'count', 'title', 'text', 'action']) needString(card, key, 'explore.cards[]');
  }

  needString(site.notes, 'kicker', 'notes');
  needString(site.notes, 'title', 'notes');
  needString(site.notes, 'lede', 'notes');
  needString(site.notes, 'empty', 'notes');

  needString(site.about, 'kicker', 'about');
  needString(site.about, 'title', 'about');
  needString(site.about, 'prompt', 'about');
  needString(site.about, 'howPrompt', 'about');
  if (!Array.isArray(site.about.paragraphs) || site.about.paragraphs.length === 0 || site.about.paragraphs.some((p) => typeof p !== 'string' || !p.trim())) {
    fail('about.paragraphs must be a non-empty list of strings.');
  }
  if (!Array.isArray(site.about.how) || site.about.how.length === 0 || site.about.how.some((p) => typeof p !== 'string' || !p.trim())) {
    fail('about.how must be a non-empty list of strings.');
  }

  needString(site.projects, 'kicker', 'projects');
  needString(site.projects, 'title', 'projects');
  needString(site.projects, 'lede', 'projects');
  let demos = 0;
  for (const item of needArray(site.projects, 'items', 'projects')) {
    needString(item, 'title', 'projects.items[]');
    needString(item, 'status', 'projects.items[]');
    if (item.statusKind && item.statusKind !== 'prog' && item.statusKind !== 'built') {
      fail('projects.items[].statusKind must be omitted, "", "prog", or "built".');
    }
    for (const fact of needArray(item, 'facts', `projects.${item.title}`)) {
      needString(fact, 'label', 'projects.facts[]');
      needString(fact, 'text', 'projects.facts[]');
    }
    if (item.demo) {
      demos += 1;
      if (item.demo.type !== 'carryover') fail('The only supported project demo type is "carryover".');
      needString(item.demo, 'title', 'projects.demo');
      needString(item.demo, 'badge', 'projects.demo');
    }
  }
  if (demos > 1) fail('Only one project can include the carryover demo (it uses fixed element ids).');

  needString(site.beyond, 'kicker', 'beyond');
  needString(site.beyond, 'title', 'beyond');
  for (const item of needArray(site.beyond, 'items', 'beyond')) {
    needString(item, 'icon', 'beyond.items[]');
    needString(item, 'title', 'beyond.items[]');
    needString(item, 'text', 'beyond.items[]');
  }

  needString(site.experience, 'kicker', 'experience');
  needString(site.experience, 'title', 'experience');
  needString(site.experience, 'lede', 'experience');
  for (const item of needArray(site.experience, 'items', 'experience')) {
    needString(item, 'years', 'experience.items[]');
    needString(item, 'title', 'experience.items[]');
    needString(item, 'detail', 'experience.items[]');
  }
  if (site.experience.note != null && typeof site.experience.note !== 'string') fail('experience.note must be a string when present.');

  needString(site.contact, 'kicker', 'contact');
  needString(site.contact, 'title', 'contact');
  needString(site.contact, 'text', 'contact');
  for (const item of needArray(site.contact, 'links', 'contact')) {
    needString(item, 'label', 'contact.links[]');
    needString(item, 'href', 'contact.links[]');
    needString(item, 'short', 'contact.links[]');
  }

  const trips = needArray(site, 'trips', 'site');
  if (trips.length > 5) {
    console.warn(`trips has ${trips.length} entries. The page shows the first 5.`);
  }
  for (const trip of trips.slice(0, 5)) {
    if (trip.type !== 'image' && trip.type !== 'video') fail('Each trip type must be "image" or "video".');
    const src = safeRelative(trip.src, 'trips.src');
    if (!(await exists(path.join(contentDir, 'assets', 'trips', src)))) fail(`Trip file not found: assets/trips/${src}`);
    if (trip.type === 'video') {
      const poster = safeRelative(trip.poster, 'trips.poster');
      if (!(await exists(path.join(contentDir, 'assets', 'trips', poster)))) fail(`Trip poster not found: assets/trips/${poster}`);
      if (trip.srcWebm) {
        const webm = safeRelative(trip.srcWebm, 'trips.srcWebm');
        if (!(await exists(path.join(contentDir, 'assets', 'trips', webm)))) fail(`Trip webm not found: assets/trips/${webm}`);
      }
    }
    if (trip.caption != null && typeof trip.caption !== 'string') fail('trips[].caption must be a string.');
    if (trip.alt != null && typeof trip.alt !== 'string') fail('trips[].alt must be a string.');
    if (trip.objectPosition != null && !/^(?:center|top|bottom|left|right|\d{1,3}%)(?:\s+(?:center|top|bottom|left|right|\d{1,3}%))?$/.test(trip.objectPosition)) {
      fail('trips[].objectPosition must be a simple position such as "center 30%".');
    }
  }
}

async function findContentRoot(dir, depth = 0) {
  if (await exists(path.join(dir, 'site.json'))) return dir;
  if (depth > 3) return null;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findContentRoot(path.join(dir, entry.name), depth + 1);
    if (found) return found;
  }
  return null;
}

export async function downloadRepo({ owner, repo, ref, token }) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tarball/${encodeURIComponent(ref)}`;
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'personal-site-template',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  let archiveResponse = response;
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    await response.body?.cancel?.();
    if (!location) fail(`GitHub redirected without a download location for ${owner}/${repo}@${ref}.`);
    archiveResponse = await fetch(location, { headers: { 'User-Agent': 'personal-site-template' } });
  }

  if (!archiveResponse.ok) {
    let detail = '';
    try {
      const body = await archiveResponse.text();
      const parsed = JSON.parse(body);
      detail = parsed.message ? ` ${parsed.message}` : '';
    } catch {
      detail = '';
    }
    fail(`Could not download ${owner}/${repo}@${ref} (HTTP ${archiveResponse.status}).${detail} Check SITE_DATA_TOKEN (fine-grained, Contents: Read-only, this repository only) and SITE_DATA_REF.`);
  }

  const temp = await mkdtemp(path.join(tmpdir(), 'site-data-'));
  const archivePath = path.join(temp, 'data.tar.gz');
  try {
    await pipeline(Readable.fromWeb(archiveResponse.body), createWriteStream(archivePath));
    await execFileAsync('tar', ['-xzf', archivePath, '-C', temp]);
    const contentRoot = await findContentRoot(temp);
    if (!contentRoot) fail(`Downloaded ${owner}/${repo}@${ref}, but site.json was not in the archive.`);
    return { dir: contentRoot, cleanup: () => rm(temp, { recursive: true, force: true }) };
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
}

export async function resolveContent() {
  if (process.env.SITE_DATA_DISABLE_DOTENV !== '1') {
    await loadDotEnv(path.join(repoRoot, '.env'));
  }

  const repoSpec = envValue('SITE_DATA_REPO');
  const token = envValue('SITE_DATA_TOKEN');
  const ref = envValue('SITE_DATA_REF') || 'main';
  const dir = envValue('SITE_DATA_DIR');
  const privateDir = path.join(repoRoot, 'content', 'private');
  const privateExists = await exists(path.join(privateDir, 'site.json'));
  const kind = chooseSource({ repo: repoSpec, dir, privateExists });

  if (kind === 'remote') {
    if (!token) {
      fail('SITE_DATA_REPO is set but SITE_DATA_TOKEN is empty. Refusing to fall back to sample data, because that would publish the placeholder site.');
    }
    const { owner, repo } = parseRepo(repoSpec);
    const downloaded = await downloadRepo({ owner, repo, ref, token });
    return {
      dir: downloaded.dir,
      label: `remote ${owner}/${repo}@${ref}`,
      cleanup: downloaded.cleanup,
    };
  }

  if (kind === 'dir') {
    if (!(await exists(path.join(dir, 'site.json')))) fail(`SITE_DATA_DIR does not contain site.json: ${dir}`);
    return { dir, label: `local directory ${dir}`, cleanup: async () => {} };
  }

  if (kind === 'private') {
    return { dir: privateDir, label: 'local content/private', cleanup: async () => {} };
  }

  return { dir: path.join(repoRoot, 'content', 'sample'), label: 'sample data (content/sample)', cleanup: async () => {} };
}
