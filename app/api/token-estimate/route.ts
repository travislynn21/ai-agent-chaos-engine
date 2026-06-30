import { NextRequest, NextResponse } from "next/server";
import { simulateAcrossModels } from "@/lib/core/simulation";
import { prisma } from "@/lib/db/prisma";
import { ENGINE_VERSION, PRICING_VERSION } from "@/lib/version";
import type { TokenEstimateResponse, TokenEstimateErrorResponse, SimulationResult } from "@/lib/providers/api-types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { semanticRequest, targets } = body;
    if (!semanticRequest || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: "Invalid array criteria." }, { status: 400 });
    }

    const rawResults = await simulateAcrossModels(semanticRequest, targets);
    const validResults = rawResults.filter((r) => !r.error && r.estimatedUsage);
    const failedResults: SimulationResult[] = rawResults.filter((r) => r.error || !r.estimatedUsage).map((r) => ({
      provider: r.provider, model: r.model, compiled: r.compiled, estimatedUsage: null, estimatedCostUsd: 0, error: r.error ?? "PREFLIGHT_FAIL"
    }));

    const createdResults = await prisma.$transaction(async (tx) => {
      return Promise.all(validResults.map(async (r) => {
        const record = await tx.tokenEstimate.create({
          data: {
            provider: r.provider, model: r.model, engineVersion: ENGINE_VERSION, pricingVersion: PRICING_VERSION,
            payloadHash: r.compiled.payloadHash, promptHash: r.compiled.promptHash, systemHash: r.compiled.systemHash, toolsHash: r.compiled.toolsHash,
            estimatedInputStandard: r.estimatedUsage!.inputStandard, estimatedCacheRead: r.estimatedUsage!.cacheRead, estimatedCacheWrite: r.estimatedUsage!.cacheWrite, estimatedOutput: r.estimatedUsage!.output,
            estimatedCostUsd: r.estimatedCostUsd, contextLimitPct: r.compiled.contextLimitPct, cacheEligibilityReason: r.compiled.cacheEligibilityReason
          }
        });
        return { id: record.id, provider: r.provider, model: r.model, compiled: r.compiled, estimatedUsage: r.estimatedUsage!, estimatedCostUsd: r.estimatedCostUsd, error: null };
      }));
    });

    const results = rawResults.map(r => {
      if (r.error || !r.estimatedUsage) return failedResults.find(f => f.model === r.model)!;
      return createdResults.find(c => c.model === r.model)!;
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "ESTIMATE_ROUTE_FATAL" }, { status: 500 });
  }
}