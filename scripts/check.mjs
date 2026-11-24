import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chooseSource, parseRepo, repoRoot } from './content.mjs';

let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

check('parse owner/repo', () => {
  assert.deepEqual(parseRepo('manojkumbhar/manojkumbhar-site-data'), {
    owner: 'manojkumbhar',
    repo: 'manojkumbhar-site-data',
  });
});

check('parse github url', () => {
  assert.deepEqual(parseRepo('https://github.com/octocat/example.git'), {
    owner: 'octocat',
    repo: 'example',
  });
});

check('reject a bad repo spec', () => {
  assert.throws(() => parseRepo('not a repo'), /owner\/repo/);
});

check('remote content wins over a local folder', () => {
  assert.equal(chooseSource({ repo: 'owner/repo', dir: '/tmp/data', privateExists: true }), 'remote');
});

check('local dir is next', () => {
  assert.equal(chooseSource({ repo: '', dir: '/tmp/data', privateExists: true }), 'dir');
});

check('private folder is next', () => {
  assert.equal(chooseSource({ repo: '', dir: '', privateExists: true }), 'private');
});

check('sample is the default', () => {
  assert.equal(chooseSource({ repo: '', dir: '', privateExists: false }), 'sample');
});

const cleanEnv = { ...process.env, SITE_DATA_DISABLE_DOTENV: '1' };
for (const key of ['SITE_DATA_REPO', 'SITE_DATA_TOKEN', 'SITE_DATA_REF', 'SITE_DATA_DIR']) delete cleanEnv[key];

const sampleBuild = spawnSync(process.execPath, ['scripts/build.mjs'], {
  cwd: repoRoot,
  env: cleanEnv,
  encoding: 'utf8',
});

check('sample build exits 0', () => {
  assert.equal(sampleBuild.status, 0, sampleBuild.stderr || sampleBuild.stdout);
  assert.match(sampleBuild.stdout, /sample data/);
});

const html = sampleBuild.status === 0
  ? readFileSync(path.join(repoRoot, 'dist', 'index.html'), 'utf8')
  : '';
const trips = sampleBuild.status === 0
  ? JSON.parse(readFileSync(path.join(repoRoot, 'dist', 'assets', 'trips', 'trips.json'), 'utf8'))
  : [];

check('sample page is the fictional profile', () => {
  assert.match(html, /Alex Sample/);
  assert.match(html, /alex\.sample@example\.com/);
  assert.match(html, /data-theme-key="sample-theme"/);
  assert.match(html, /assets\/portrait\.jpg/);
  assert.equal(trips[0].caption, 'Glass Lake, 2024');
  assert.equal(trips.length, 2);
});

const missingToken = spawnSync(process.execPath, ['scripts/build.mjs'], {
  cwd: repoRoot,
  env: { ...cleanEnv, SITE_DATA_REPO: 'example/example' },
  encoding: 'utf8',
});

check('repo without a token fails closed', () => {
  assert.notEqual(missingToken.status, 0);
  assert.match(missingToken.stderr, /SITE_DATA_TOKEN/);
});

const fromDir = spawnSync(process.execPath, ['scripts/build.mjs'], {
  cwd: repoRoot,
  env: { ...cleanEnv, SITE_DATA_DIR: path.join(repoRoot, 'content', 'sample') },
  encoding: 'utf8',
});

check('SITE_DATA_DIR builds that folder', () => {
  assert.equal(fromDir.status, 0, fromDir.stderr || fromDir.stdout);
  assert.match(fromDir.stdout, /local directory/);
});

check('gitignore covers private content, env, and build output', () => {
  for (const rel of ['content/private/site.json', '.env', 'dist/index.html', '.site-data/archive.tar.gz']) {
    const result = spawnSync('git', ['check-ignore', '-q', rel], { cwd: repoRoot });
    assert.equal(result.status, 0, `${rel} is not ignored`);
  }
});

const listed = spawnSync('git', ['ls-files', '-co', '--exclude-standard'], {
  cwd: repoRoot,
  encoding: 'utf8',
});

check('project text files have no token-shaped strings', () => {
  assert.equal(listed.status, 0, listed.stderr);
  const files = listed.stdout.split('\n').filter(Boolean);
  const banned = [/ghp_[A-Za-z0-9_]+/, /github_pat_[A-Za-z0-9_]+/, /BEGIN (?:OPENSSH|RSA) PRIVATE KEY/];
  for (const rel of files) {
    if (/\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(rel)) continue;
    const body = readFileSync(path.join(repoRoot, rel), 'utf8');
    for (const pattern of banned) assert.doesNotMatch(body, pattern, rel);
  }
});

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
