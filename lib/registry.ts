export type CacheMode = 'automatic' | 'explicit' | 'both' | 'none';

export type CanonicalUsage = {
  inputStandard: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
};

export type ModelConfig = {
  provider: 'openai' | 'anthropic';
  model: string;
  contextWindow: number;
  supportsPromptCaching: boolean;
  cacheMode: CacheMode;
  minCacheableTokens?: number;
  pricing: {
    inputStandardPer1M: number;
    inputCacheReadPer1M: number;
    inputCacheWritePer1M: number;
    outputPer1M: number;
  };
  extractUsage: (rawResponseBody: any) => CanonicalUsage;
};

export const modelRegistry: Record<string, ModelConfig> = {
  "claude-sonnet-4": {
    provider: "anthropic",
    model: "claude-sonnet-4",
    contextWindow: 200000,
    supportsPromptCaching: true,
    cacheMode: "both",
    minCacheableTokens: 1024,
    pricing: {
      inputStandardPer1M: 3.00,
      inputCacheReadPer1M: 0.30,
      inputCacheWritePer1M: 3.75,
      outputPer1M: 15.00
    },
    extractUsage: (body) => {
      const usage = body?.usage ?? {};
      return {
        inputStandard: usage.input_tokens ?? 0,
        cacheRead: usage.cache_read_input_tokens ?? 0,
        cacheWrite: usage.cache_creation_input_tokens ?? 0,
        output: usage.output_tokens ?? 0
      };
    }
  },
  "gpt-5": {
    provider: "openai",
    model: "gpt-5",
    contextWindow: 128000,
    supportsPromptCaching: true,
    cacheMode: "automatic",
    pricing: {
      inputStandardPer1M: 1.25,
      inputCacheReadPer1M: 0.125,
      inputCacheWritePer1M: 1.25,
      outputPer1M: 10.00
    },
    extractUsage: (body) => {
      const usage = body?.usage ?? {};
      const details = usage.prompt_tokens_details ?? {};
      const cached = details.cached_tokens ?? 0;
      return {
        inputStandard: (usage.prompt_tokens ?? 0) - cached,
        cacheRead: cached,
        cacheWrite: 0,
        output: usage.completion_tokens ?? 0
      };
    }
  }
};