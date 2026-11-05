// Publish the static build to GitHub Pages without changing the source checkout.
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (args, cwd = root) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
await stat(join(root, 'dist/index.html'));
const origin = git(['remote', 'get-url', 'origin']);
const existing = git(['ls-remote', '--heads', 'origin', 'refs/heads/gh-pages']);
const staging = await mkdtemp(join(tmpdir(), 'ahsp-pages-'));
try {
  git(['init', '--initial-branch=gh-pages'], staging);
  git(['remote', 'add', 'origin', origin], staging);
  if (existing) {
    git(['fetch', '--depth=1', 'origin', 'gh-pages'], staging);
    git(['checkout', '-B', 'gh-pages', 'FETCH_HEAD'], staging);
  }
  for (const name of ['user.name', 'user.email']) {
    const value = git(['config', name]);
    if (value) git(['config', name, value], staging);
  }
  for (const item of await readdir(staging)) {
    if (item !== '.git') await rm(join(staging, item), { recursive: true, force: true });
  }
  await cp(join(root, 'dist'), staging, { recursive: true });
  git(['add', '--all'], staging);
  if (!git(['status', '--porcelain'], staging)) {
    console.log('gh-pages sudah berisi build terbaru.');
  } else {
    git(['commit', '-m', `Deploy Pustaka AHSP 2026 (${git(['rev-parse', '--short', 'HEAD'])})`], staging);
    git(['push', 'origin', 'HEAD:refs/heads/gh-pages'], staging);
    console.log('Build dipush ke gh-pages. GitHub Pages harus menggunakan cabang gh-pages, folder / (root).');
  }
} finally {
  await rm(staging, { recursive: true, force: true });
}
