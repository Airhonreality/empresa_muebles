/**
 * validate-text-encoding.mjs
 *
 * Guards text files against:
 *   1. Invalid UTF-8 bytes
 *   2. UTF-8 BOM in tracked text files
 *   3. Mojibake signatures that usually mean double-encoding
 *
 * The active contract ignores archival .history snapshots.
 *
 * Usage:
 *   node scripts/validate-text-encoding.mjs
 *   node scripts/validate-text-encoding.mjs --repo path/to/repo
 *   node scripts/validate-text-encoding.mjs --staged
 *   node scripts/validate-text-encoding.mjs storage/db/page_routes.json scripts/admin/workspaces.json
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2).filter(Boolean);
const stagedMode = args.includes('--staged');
const explicitFiles = args.filter(arg => arg !== '--staged');
const repoFlagIndex = explicitFiles.indexOf('--repo');
const repoRoot = repoFlagIndex >= 0 ? explicitFiles[repoFlagIndex + 1] : process.cwd();
const repoFiles = repoFlagIndex >= 0
  ? explicitFiles.filter((_, index) => index !== repoFlagIndex && index !== repoFlagIndex + 1)
  : explicitFiles;

const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.jsonc', '.json5',
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.ps1', '.psm1', '.css', '.scss', '.html', '.xml',
  '.yml', '.yaml', '.toml', '.ini', '.env'
]);

const TEXT_BASENAMES = new Set([
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  'pre-commit',
  'pre-push',
  'pre-receive',
  'post-merge',
  'post-checkout'
]);

const IGNORED_PREFIXES = [
  '.history/'
];

const MOJIBAKE_MARKERS = [
  /[\u00c3\u00c2\u00e2]/,
  /\u00ef\u00bb\u00bf/,
  /\uFFFD/
];

function isTextFile(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || TEXT_BASENAMES.has(base);
}

function getFilesFromGitIndex() {
  const output = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: repoRoot });
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(filePath => !IGNORED_PREFIXES.some(prefix => filePath.startsWith(prefix)));
}

function getTrackedFiles() {
  const output = execSync('git ls-files -z', { encoding: 'utf8', cwd: repoRoot });
  return output
    .split('\0')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(filePath => !IGNORED_PREFIXES.some(prefix => filePath.startsWith(prefix)));
}

function decodeUtf8Strict(bytes, filePath) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`invalid utf-8 bytes in ${filePath}`);
  }
}

function findMojibakeLines(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const marker of MOJIBAKE_MARKERS) {
      if (marker.test(line)) {
        hits.push({
          line: index + 1,
          snippet: line.trim().slice(0, 220)
        });
        break;
      }
    }
  });
  return hits;
}

const files = explicitFiles.length > 0
  ? repoFiles
  : stagedMode
    ? getFilesFromGitIndex()
    : getTrackedFiles();

const targets = stagedMode
  ? files.filter(isTextFile)
  : files;

const errors = [];

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) {
    if (stagedMode) continue;
    errors.push({ filePath, message: 'file does not exist' });
    continue;
  }

  const bytes = fs.readFileSync(filePath);

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    errors.push({ filePath, message: 'UTF-8 BOM is not allowed' });
    continue;
  }

  let raw;
  try {
    raw = decodeUtf8Strict(bytes, filePath);
  } catch (error) {
    errors.push({ filePath, message: error.message });
    continue;
  }

  const hits = findMojibakeLines(raw);
  for (const hit of hits) {
    errors.push({
      filePath,
      message: `mojibake marker on line ${hit.line}`,
      snippet: hit.snippet
    });
  }
}

if (errors.length > 0) {
  console.error('\nEncoding validation failed:\n');
  for (const error of errors) {
    console.error(`- ${error.filePath}: ${error.message}`);
    if (error.snippet) {
      console.error(`  ${error.snippet}`);
    }
  }
  console.error('\nUse UTF-8 without BOM and rewrite the file from the original source.');
  process.exit(1);
}

console.log(`Encoding validation passed (${targets.length} file(s)).`);
