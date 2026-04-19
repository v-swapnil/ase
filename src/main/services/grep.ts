import { readdir, readFile, stat } from 'node:fs/promises';
import { join, sep } from 'node:path';

const DEFAULT_IGNORED = new Set([
  '.git', 'node_modules', '.DS_Store', '.next', 'dist', 'out', '.turbo',
  '.venv', 'venv', '__pycache__', '.cache',
]);

export interface GrepHit {
  path: string;
  line: number;
  text: string;
}

export interface GrepOptions {
  pattern: string;
  isRegex?: boolean;
  caseSensitive?: boolean;
  rel?: string;
  maxHits?: number;
  /** Skip files larger than this (bytes). */
  maxFileBytes?: number;
}

/**
 * Recursive content grep within `root`. Returns hits sorted by file then line.
 */
export async function grep(root: string, opts: GrepOptions): Promise<GrepHit[]> {
  const maxHits = opts.maxHits ?? 500;
  const maxFileBytes = opts.maxFileBytes ?? 512 * 1024;
  const start = opts.rel ? join(root, opts.rel) : root;

  const matcher = opts.isRegex
    ? new RegExp(opts.pattern, opts.caseSensitive ? '' : 'i')
    : null;
  const needle = opts.caseSensitive ? opts.pattern : opts.pattern.toLowerCase();

  const hits: GrepHit[] = [];

  async function walk(absDir: string): Promise<void> {
    if (hits.length >= maxHits) return;
    let entries: string[];
    try {
      entries = await readdir(absDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (DEFAULT_IGNORED.has(entry)) continue;
      const abs = join(absDir, entry);
      let s;
      try {
        s = await stat(abs);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        await walk(abs);
      } else if (s.isFile() && s.size <= maxFileBytes) {
        try {
          const text = await readFile(abs, 'utf8');
          const lines = text.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? '';
            const hay = opts.caseSensitive ? line : line.toLowerCase();
            const match = matcher ? matcher.test(line) : hay.includes(needle);
            if (match) {
              const rel = abs.slice(root.length + 1).split(sep).join('/');
              hits.push({ path: rel, line: i + 1, text: line });
              if (hits.length >= maxHits) return;
            }
          }
        } catch {
          /* binary or unreadable — skip */
        }
      }
    }
  }

  await walk(start);
  return hits;
}
