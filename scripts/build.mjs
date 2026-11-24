import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { repoRoot, resolveContent, validateContent } from './content.mjs';
import { renderPage } from './render.mjs';

const dist = path.join(repoRoot, 'dist');

async function readSource(name) {
  return readFile(path.join(repoRoot, 'src', name), 'utf8');
}

async function copyReferencedAssets(site, contentDir) {
  const files = new Set([path.posix.join('assets', site.profile.portrait)]);
  for (const trip of site.trips.slice(0, 5)) {
    files.add(path.posix.join('assets/trips', trip.src));
    if (trip.poster) files.add(path.posix.join('assets/trips', trip.poster));
    if (trip.srcWebm) files.add(path.posix.join('assets/trips', trip.srcWebm));
  }
  for (const rel of files) {
    const target = path.join(dist, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(path.join(contentDir, rel), target);
  }
}

async function main() {
  const source = await resolveContent();
  try {
    let site;
    try {
      site = JSON.parse(await readFile(path.join(source.dir, 'site.json'), 'utf8'));
    } catch (error) {
      const failure = new Error(`Could not parse ${path.join(source.dir, 'site.json')}: ${error.message}`);
      failure.isContentError = true;
      throw failure;
    }
    await validateContent(site, source.dir);
    const html = renderPage(site, {
      css: await readSource('styles.css'),
      js: await readSource('site.js'),
      boot: await readSource('boot.js'),
    });
    await rm(dist, { recursive: true, force: true });
    await mkdir(dist, { recursive: true });
    await writeFile(path.join(dist, 'index.html'), html);
    await copyReferencedAssets(site, source.dir);
    const trips = site.trips.slice(0, 5);
    await mkdir(path.join(dist, 'assets', 'trips'), { recursive: true });
    await writeFile(path.join(dist, 'assets', 'trips', 'trips.json'), `${JSON.stringify(trips, null, 2)}\n`);
    console.log(`Content source: ${source.label}`);
    console.log('Wrote dist/index.html');
  } finally {
    await source.cleanup();
  }
}

main().catch((error) => {
  if (error?.isContentError) console.error(error.message);
  else console.error(error);
  process.exit(1);
});
