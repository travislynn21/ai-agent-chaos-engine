import { ProviderAdapter, SemanticRequest, CompiledRequest } from "./types";
import { ModelConfig, CanonicalUsage } from "../registry";
import { computeHash } from "../core/hashing";

export const anthropicAdapter: ProviderAdapter = {
  compile(input, model, config) {
    const wirePayload: Record<string, any> = {
      model,
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      ...(input.system ? { system: input.system } : {}),
      ...(input.tools && input.tools.length > 0 ? { tools: input.tools } : {}),
      max_tokens: input.maxOutputTokens ?? 1024,
    };

    if (input.cache?.mode === "explicit" && config.supportsPromptCaching) {
      if (wirePayload.tools && wirePayload.tools.length > 0) {
        const lastTool = wirePayload.tools[wirePayload.tools.length - 1];
        if (typeof lastTool === "object") lastTool.cache_control = { type: "ephemeral" };
      } else if (wirePayload.system) {
        wirePayload.system = [{ type: "text", text: wirePayload.system, cache_control: { type: "ephemeral" } }];
      }
    }

    const totalEstimatedInputLength = JSON.stringify(wirePayload).length;
    const contextLimitPct = Number(((totalEstimatedInputLength / 4 / config.contextWindow) * 100).toFixed(3));

    return {
      provider: "anthropic",
      model,
      wirePayload,
      payloadHash: computeHash(wirePayload),
      promptHash: computeHash(input.messages),
      systemHash: input.system ? computeHash(input.system) : undefined,
      toolsHash: input.tools ? computeHash(input.tools) : undefined,
      contextLimitPct,
      cacheEligibilityReason: config.supportsPromptCaching ? `MODE_${config.cacheMode.toUpperCase()}` : "NOT_SUPPORTED",
    };
  },

  async estimate(compiled) {
    const r = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: compiled.model,
        system: compiled.wirePayload.system,
        messages: compiled.wirePayload.messages,
        tools: compiled.wirePayload.tools,
      }),
    });
    if (!r.ok) throw new Error(`Anthropic preflight failure: ${r.statusText}`);
    const data = await r.json();
    return {
      inputStandard: data.input_tokens ?? 0,
      cacheRead: 0,
      cacheWrite: 0,
      output: compiled.wirePayload.max_tokens,
    };
  },

  async execute(compiled) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(compiled.wirePayload),
    });
    if (!r.ok) throw new Error(`Anthropic execution failed: ${r.statusText}`);
    return r.json();
  },

  reconcile(rawResponse, config) {
    return config.extractUsage(rawResponse);
  },
};