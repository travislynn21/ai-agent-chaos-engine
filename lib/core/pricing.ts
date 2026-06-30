import { ModelConfig, CanonicalUsage } from "../registry";

export function calculateCanonicalCost(usage: CanonicalUsage, config: ModelConfig): number {
  const p = config.pricing;
  const standardInputCost = (usage.inputStandard / 1_000_000) * p.inputStandardPer1M;
  const cacheReadCost = (usage.cacheRead / 1_000_000) * p.inputCacheReadPer1M;
  const cacheWriteCost = (usage.cacheWrite / 1_000_000) * p.inputCacheWritePer1M;
  const outputCost = (usage.output / 1_000_000) * p.outputPer1M;
  return Number((standardInputCost + cacheReadCost + cacheWriteCost + outputCost).toFixed(8));
}

export function determineDriftReason(estimated: CanonicalUsage, actual: CanonicalUsage): string {
  if (actual.cacheRead === 0 && estimated.cacheRead > 0) return "CACHE_MISS";
  if (actual.output > estimated.output * 1.15) return "OUTPUT_OVERRUN";
  return "NONE";
}