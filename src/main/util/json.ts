/**
 * Robust JSON extractor for LLM outputs.
 * Handles fenced ```json blocks, leading prose, and multiple top-level objects.
 */
export function extractJson<T = unknown>(raw: string): T {
  const text = raw.trim();

  // 1. Try fenced block first
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fence && fence[1]) {
    const inner = fence[1].trim();
    try {
      return JSON.parse(inner) as T;
    } catch {
      /* fall through */
    }
  }

  // 2. Try the whole string
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through */
  }

  // 3. Find first balanced { ... } or [ ... ]
  const candidate = findBalanced(text);
  if (candidate) {
    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      throw new Error(
        `LLM output contained JSON-like text but failed to parse: ${(err as Error).message}\n--- raw ---\n${text.slice(0, 800)}`,
      );
    }
  }

  throw new Error(`LLM output contained no JSON.\n--- raw ---\n${text.slice(0, 800)}`);
}

function findBalanced(s: string): string | null {
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== '{' && ch !== '[') continue;
    const open = ch;
    const close = ch === '{' ? '}' : ']';
    let depth = 0;
    let inStr = false;
    let escape = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') inStr = !inStr;
      if (inStr) continue;
      if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) return s.slice(i, j + 1);
      }
    }
  }
  return null;
}
