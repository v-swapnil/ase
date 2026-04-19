/**
 * Minimal unified-diff applier.
 * Supports multi-file patches in the standard `--- a/path` / `+++ b/path` /
 * `@@ -a,b +c,d @@` format. Only line-level operations (context, +, -).
 *
 * Returns an array of file changes (path + new content). Caller is responsible
 * for writing them through the safePath-validated writeWorkspaceFile.
 *
 * Throws if any hunk fails to apply (mismatched context).
 */

export interface PatchedFile {
  path: string;
  content: string;
  isNew: boolean;
  isDelete: boolean;
}

interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[]; // each starts with ' ', '+', '-', or '\\'
}

interface FilePatch {
  oldPath: string;
  newPath: string;
  hunks: Hunk[];
}

export function parsePatch(patch: string): FilePatch[] {
  const lines = patch.split('\n');
  const files: FilePatch[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.startsWith('--- ')) {
      const oldPath = stripPrefix(line.slice(4).trim());
      const next = lines[i + 1] ?? '';
      if (!next.startsWith('+++ ')) {
        i++;
        continue;
      }
      const newPath = stripPrefix(next.slice(4).trim());
      i += 2;
      const hunks: Hunk[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('@@')) {
        const header = lines[i] ?? '';
        const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
        if (!m) throw new Error(`bad hunk header: ${header}`);
        const oldStart = parseInt(m[1]!, 10);
        const oldLines = m[2] ? parseInt(m[2], 10) : 1;
        const newStart = parseInt(m[3]!, 10);
        const newLines = m[4] ? parseInt(m[4], 10) : 1;
        i++;
        const body: string[] = [];
        while (i < lines.length) {
          const l = lines[i] ?? '';
          if (l.startsWith('@@') || l.startsWith('--- ') || l.startsWith('diff ')) break;
          body.push(l);
          i++;
        }
        hunks.push({ oldStart, oldLines, newStart, newLines, lines: body });
      }
      files.push({ oldPath, newPath, hunks });
    } else {
      i++;
    }
  }
  return files;
}

function stripPrefix(p: string): string {
  if (p === '/dev/null') return p;
  if (p.startsWith('a/') || p.startsWith('b/')) return p.slice(2);
  return p;
}

export function applyPatchToContent(original: string, hunks: Hunk[]): string {
  const orig = original.split('\n');
  const out: string[] = [];
  let cursor = 0; // 0-based index into orig

  for (const h of hunks) {
    const targetIdx = h.oldStart - 1; // 0-based
    // copy unchanged lines up to the hunk's start
    while (cursor < targetIdx && cursor < orig.length) {
      out.push(orig[cursor] ?? '');
      cursor++;
    }
    for (const ln of h.lines) {
      if (!ln.length) {
        // Empty body line is treated as a context blank line.
        if (cursor < orig.length) out.push(orig[cursor] ?? '');
        cursor++;
        continue;
      }
      const tag = ln[0];
      const text = ln.slice(1);
      if (tag === ' ') {
        const got = orig[cursor];
        if (got !== text) {
          throw new Error(
            `patch context mismatch at line ${cursor + 1}: expected "${text}", got "${got ?? '<eof>'}"`,
          );
        }
        out.push(text);
        cursor++;
      } else if (tag === '-') {
        const got = orig[cursor];
        if (got !== text) {
          throw new Error(
            `patch removal mismatch at line ${cursor + 1}: expected "${text}", got "${got ?? '<eof>'}"`,
          );
        }
        cursor++;
      } else if (tag === '+') {
        out.push(text);
      } else if (tag === '\\') {
        // "\ No newline at end of file" — ignore
      } else {
        throw new Error(`unknown patch line: ${ln}`);
      }
    }
  }
  // tail
  while (cursor < orig.length) {
    out.push(orig[cursor] ?? '');
    cursor++;
  }
  return out.join('\n');
}

export function planPatch(
  patch: string,
  readOriginal: (path: string) => string | null,
): PatchedFile[] {
  const files = parsePatch(patch);
  const out: PatchedFile[] = [];
  for (const f of files) {
    const isNew = f.oldPath === '/dev/null';
    const isDelete = f.newPath === '/dev/null';
    const targetPath = isDelete ? f.oldPath : f.newPath;
    if (isDelete) {
      out.push({ path: targetPath, content: '', isNew: false, isDelete: true });
      continue;
    }
    const original = isNew ? '' : (readOriginal(f.oldPath) ?? '');
    const content = applyPatchToContent(original, f.hunks);
    out.push({ path: targetPath, content, isNew, isDelete: false });
  }
  return out;
}
