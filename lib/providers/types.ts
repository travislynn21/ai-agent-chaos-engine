import { CacheMode, CanonicalUsage, ModelConfig } from "../registry";

export type SemanticRequest = {
  system?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: any }>;
  tools?: any[];
  maxOutputTokens?: number;
  cache?: {
    mode: "auto" | "explicit" | "off";
    breakpoints?: string[];
  };
};

export type CompiledRequest = {
  provider: "openai" | "anthropic";
  model: string;
  wirePayload: Record<string, any>;
  payloadHash: string;
  promptHash: string;
  systemHash?: string;
  toolsHash?: string;
  contextLimitPct: number;
  cacheEligibilityReason?: string;
};

export interface ProviderAdapter {
  compile(input: SemanticRequest, model: string, config: ModelConfig): CompiledRequest;
  estimate(compiled: CompiledRequest): Promise<CanonicalUsage>;
  execute(compiled: CompiledRequest): Promise<any>;
  reconcile(rawResponse: any, config: ModelConfig): CanonicalUsage;
}