import { openAIAdapter } from "../providers/openai";
import { anthropicAdapter } from "../providers/anthropic";
import { modelRegistry, ModelConfig } from "../registry";
import { ProviderAdapter, SemanticRequest, CompiledRequest } from "../providers/types";

export type ExecutionTarget = { provider: "openai" | "anthropic"; model: string; };

export function getAdapter(provider: ExecutionTarget["provider"]): ProviderAdapter {
  if (provider === "openai") return openAIAdapter;
  if (provider === "anthropic") return anthropicAdapter;
  throw new Error(`Unsupported provider boundary: ${provider}`);
}

export function compileTarget(semanticRequest: SemanticRequest, target: ExecutionTarget) {
  const config = modelRegistry[target.model];
  if (!config) throw new Error(`Model target ${target.model} absent from registry.`);
  if (config.provider !== target.provider) throw new Error("Provider/model mismatch.");

  const adapter = getAdapter(target.provider);
  const compiled = adapter.compile(semanticRequest, target.model, config);
  return { adapter, compiled, config };
}

export function extractRequestId(rawResponse: any): string {
  if (typeof rawResponse?.id === "string" && rawResponse.id.length > 0) return rawResponse.id;
  if (typeof rawResponse?.response?.id === "string" && rawResponse.response.id.length > 0) return rawResponse.response.id;
  return crypto.randomUUID();
}