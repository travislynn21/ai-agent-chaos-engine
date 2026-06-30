import { NextRequest, NextResponse } from "next/server";
import { compileTarget, extractRequestId } from "@/lib/core/execution";
import { prisma } from "@/lib/db/prisma";
import { calculateCanonicalCost, determineDriftReason } from "@/lib/core/pricing";
import { ENGINE_VERSION, PRICING_VERSION } from "@/lib/version";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { semanticRequest, target, lastEstimateId } = body;
    if (!semanticRequest || !target?.provider || !target?.model) {
      return NextResponse.json({ error: "Missing parameters." }, { status: 400 });
    }

    const { adapter, compiled, config } = compileTarget(semanticRequest, target);
    const rawResponse = await adapter.execute(compiled);
    const actualUsage = adapter.reconcile(rawResponse, config);
    const actualCostUsd = calculateCanonicalCost(actualUsage, config);
    const requestId = extractRequestId(rawResponse);

    let reconcileRecord = null;
    if (lastEstimateId) {
      const estimate = await prisma.tokenEstimate.findUnique({ where: { id: lastEstimateId } });
      if (estimate) {
        let driftReason = compiled.payloadHash !== estimate.payloadHash ? "STRUCTURAL_CHURN" : determineDriftReason({
          inputStandard: estimate.estimatedInputStandard, cacheRead: estimate.estimatedCacheRead ?? 0, cacheWrite: estimate.estimatedCacheWrite ?? 0, output: estimate.estimatedOutput
        }, actualUsage);

        const estimatedCostUsd = Number(estimate.estimatedCostUsd);
        const estimateDeltaUsd = Number((actualCostUsd - estimatedCostUsd).toFixed(8));
        const estimateDeltaPct = estimatedCostUsd > 0 ? Number((((actualCostUsd - estimatedCostUsd) / estimatedCostUsd) * 100).toFixed(4)) : 0;

        reconcileRecord = await prisma.tokenReconcile.upsert({
          where: { requestId },
          update: { payloadHash: compiled.payloadHash, promptHash: compiled.promptHash, actualInputStandard: actualUsage.inputStandard, actualCacheRead: actualUsage.cacheRead, actualCacheWrite: actualUsage.cacheWrite, actualOutput: actualUsage.output, actualCostUsd, estimateDeltaUsd, estimateDeltaPct, driftReason, rawUsageJson: rawResponse?.usage ?? rawResponse },
          create: { requestId, provider: target.provider, model: target.model, engineVersion: ENGINE_VERSION, pricingVersion: PRICING_VERSION, payloadHash: compiled.payloadHash, promptHash: compiled.promptHash, systemHash: compiled.systemHash, toolsHash: compiled.toolsHash, estimatedCostUsd, actualInputStandard: actualUsage.inputStandard, actualCacheRead: actualUsage.cacheRead, actualCacheWrite: actualUsage.cacheWrite, actualOutput: actualUsage.output, actualCostUsd, estimateDeltaUsd, estimateDeltaPct, driftReason, rawUsageJson: rawResponse?.usage ?? rawResponse }
        });
      }
    }

    return NextResponse.json({ success: true, requestId, compiled, actualUsage, actualCostUsd, reconcileRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "EXECUTE_ROUTE_FATAL" }, { status: 500 });
  }
}