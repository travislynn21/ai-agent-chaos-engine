import type { CompiledRequest } from "./types";

export type CanonicalUsageDto = { inputStandard: number; cacheRead: number; cacheWrite: number; output: number; };
export type SimulationResult = { id?: string; provider: "openai" | "anthropic"; model: string; compiled: CompiledRequest; estimatedUsage: CanonicalUsageDto | null; estimatedCostUsd: number; error: string | null; };
export type TokenEstimateResponse = { results: SimulationResult[]; };
export type TokenEstimateErrorResponse = { error: string; };
export type TokenExecuteResponse = { success: boolean; requestId: string; actualUsage: CanonicalUsageDto; actualCostUsd: number; reconcileRecord: { id: string; driftReason: string; estimateDeltaUsd: number; estimateDeltaPct: number; } | null; };
export type TokenExecuteErrorResponse = { error: string; };