import { ProviderAdapter, SemanticRequest, CompiledRequest } from "./types";
import { ModelConfig, CanonicalUsage } from "../registry";
import { computeHash } from "../core/hashing";

export const openAIAdapter: ProviderAdapter = {
  compile(input, model, config) {
    const messages: any[] = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push(...input.messages);

    const wirePayload: Record<string, any> = {
      model,
      messages,
      ...(input.tools && input.tools.length > 0 ? { tools: input.tools } : {}),
      ...(input.maxOutputTokens ? { max_completion_tokens: input.maxOutputTokens } : {}),
    };

    if (input.cache?.mode === "explicit") {
      throw new Error(`OpenAI model ${model} does not support explicit cache modes.`);
    }

    const totalEstimatedInputLength = JSON.stringify(wirePayload).length;
    const contextLimitPct = Number(((totalEstimatedInputLength / 4 / config.contextWindow) * 100).toFixed(3));

    return {
      provider: "openai",
      model,
      wirePayload,
      payloadHash: computeHash(wirePayload),
      promptHash: computeHash(input.messages),
      systemHash: input.system ? computeHash(input.system) : undefined,
      toolsHash: input.tools ? computeHash(input.tools) : undefined,
      contextLimitPct,
      cacheEligibilityReason: config.supportsPromptCaching ? "AUTOMATIC_ELIGIBLE" : "NOT_SUPPORTED",
    };
  },

  async estimate(compiled) {
    const r = await fetch("https://api.openai.com/v1/responses/input_tokens", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: compiled.model,
        input: compiled.wirePayload.messages,
        tools: compiled.wirePayload.tools ?? [],
      }),
    });
    if (!r.ok) throw new Error(`OpenAI preflight failure: ${r.statusText}`);
    const data = await r.json();
    return {
      inputStandard: data.input_tokens ?? 0,
      cacheRead: 0,
      cacheWrite: 0,
      output: compiled.wirePayload.max_completion_tokens ?? 500,
    };
  },

  async execute(compiled) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(compiled.wirePayload),
    });
    if (!r.ok) throw new Error(`OpenAI execution failed: ${r.statusText}`);
    return r.json();
  },

  reconcile(rawResponse, config) {
    return config.extractUsage(rawResponse);
  },
};