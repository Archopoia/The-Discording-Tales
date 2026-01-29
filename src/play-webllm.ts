/**
 * WebLLM bootstrap for Play tab GM chat.
 * Creates the in-browser LLM engine and exposes it via window for gm-chat.js.
 * Model list: https://webllm.mlc.ai/docs/user/basic_usage.html
 */
import { CreateMLCEngine } from '@mlc-ai/web-llm';

const DEFAULT_MODEL = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

declare global {
  interface Window {
    WebLLMEngine: Awaited<ReturnType<typeof CreateMLCEngine>> | null;
    getWebLLMEngine: () => Promise<Awaited<ReturnType<typeof CreateMLCEngine>>>;
    WebLLMProgress: { text: string; progress: number };
    WebLLMError: string | null;
  }
}

let enginePromise: Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> | null = null;

function init(): void {
  window.WebLLMEngine = null;
  window.WebLLMProgress = { text: '', progress: 0 };
  window.WebLLMError = null;

  window.getWebLLMEngine = function getWebLLMEngine(): Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> {
    if (window.WebLLMEngine) {
      return Promise.resolve(window.WebLLMEngine);
    }
    if (enginePromise) {
      return enginePromise;
    }
    enginePromise = (async () => {
      const initProgressCallback = (progress: { text?: string; progress?: number }) => {
        window.WebLLMProgress = {
          text: typeof progress.text === 'string' ? progress.text : '',
          progress: typeof progress.progress === 'number' ? progress.progress : 0,
        };
        window.dispatchEvent(new CustomEvent('webllm-progress', { detail: window.WebLLMProgress }));
      };
      try {
        const engine = await CreateMLCEngine(DEFAULT_MODEL, {
          initProgressCallback,
        });
        window.WebLLMEngine = engine;
        window.dispatchEvent(new Event('webllm-ready'));
        return engine;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        window.WebLLMError = message;
        window.dispatchEvent(new CustomEvent('webllm-error', { detail: { message } }));
        enginePromise = null;
        throw err;
      }
    })();
    return enginePromise;
  };
}

init();
