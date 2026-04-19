import type { LLMProvider } from './provider.js';
import { OllamaProvider } from './ollama.js';

let _ollama: OllamaProvider | null = null;

export function getProvider(id: 'ollama' = 'ollama'): LLMProvider {
  if (id === 'ollama') {
    if (!_ollama) _ollama = new OllamaProvider();
    return _ollama;
  }
  throw new Error(`unknown provider: ${id}`);
}
