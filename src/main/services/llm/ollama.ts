import { OLLAMA_URL } from '@shared/constants';
import type {
  ChatOptions,
  ChatResult,
  LLMProvider,
  ModelInfo,
  PullProgress,
} from './provider.js';

interface OllamaChatChunk {
  model: string;
  created_at: string;
  message?: { role: string; content: string };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama';
  readonly label = 'Ollama (local)';
  private readonly baseUrl: string;

  constructor(baseUrl = OLLAMA_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`);
    if (!res.ok) throw new Error(`ollama listModels failed: ${res.status}`);
    const data = (await res.json()) as {
      models?: { name: string; size?: number; modified_at?: string }[];
    };
    return (data.models ?? []).map((m) => ({
      name: m.name,
      sizeBytes: m.size,
      modifiedAt: m.modified_at,
    }));
  }

  async chat(opts: ChatOptions): Promise<ChatResult> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: opts.signal,
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        stream: true,
        options: {
          temperature: opts.temperature ?? 0.2,
        },
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`ollama chat failed: ${res.status} ${await res.text().catch(() => '')}`);
    }

    let content = '';
    let model = opts.model;
    let totalDurationMs: number | undefined;
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;

    for await (const chunk of jsonLines<OllamaChatChunk>(res.body)) {
      if (chunk.message?.content) {
        content += chunk.message.content;
        opts.onDelta?.(chunk.message.content);
      }
      if (chunk.done) {
        model = chunk.model;
        if (chunk.total_duration) totalDurationMs = chunk.total_duration / 1_000_000;
        promptTokens = chunk.prompt_eval_count;
        completionTokens = chunk.eval_count;
      }
    }

    return {
      content,
      model,
      usage: { promptTokens, completionTokens, totalDurationMs },
    };
  }

  async pullModel(
    name: string,
    onProgress: (p: PullProgress) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal,
      body: JSON.stringify({ name, stream: true }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`ollama pull failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
    for await (const chunk of jsonLines<PullProgress>(res.body)) {
      onProgress(chunk);
      if (chunk.status === 'success') return;
    }
  }

  async deleteModel(name: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`ollama delete failed: ${res.status}`);
  }
}

async function* jsonLines<T>(body: ReadableStream<Uint8Array>): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          yield JSON.parse(line) as T;
        } catch {
          /* skip malformed line */
        }
      }
    }
    const tail = buf.trim();
    if (tail) {
      try { yield JSON.parse(tail) as T; } catch { /* ignore */ }
    }
  } finally {
    reader.releaseLock();
  }
}
