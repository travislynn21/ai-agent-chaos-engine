import { SemanticRequest, CompiledRequest } from "../providers/types";
import { openAIAdapter } from "../providers/openai";
import { anthropicAdapter } from "../providers/anthropic";
import { modelRegistry } from "../registry";
import { calculateCanonicalCost } from "./pricing";

function getAdapter(provider: "openai" | "anthropic") {
  if (provider === "openai") return openAIAdapter;
  if (provider === "anthropic") return anthropicAdapter;
  throw new Error(`Unsupported provider entry: ${provider}`);
}

export async function simulateAcrossModels(
  req: SemanticRequest,
  targets: Array<{ provider: "openai" | "anthropic"; model: string }>
) {
  return Promise.all(
    targets.map(async ({ provider, model }) => {
      const config = modelRegistry[model];
      if (!config) throw new Error(`Model signature ${model} is missing.`);
      const adapter = getAdapter(provider);
      const compiled = adapter.compile(req, model, config);
      
      try {
        const estimatedUsage = await adapter.estimate(compiled);
        const estimatedCostUsd = calculateCanonicalCost(estimatedUsage, config);
        return { provider, model, compiled, estimatedUsage, estimatedCostUsd, error: null };
      } catch (err: any) {
        return { provider, model, compiled, estimatedUsage: null, estimatedCostUsd: 0, error: err?.message || "PREFLIGHT_FAIL" };
      }
    })
  );
}