import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const slices = await prisma.tokenReconcile.groupBy({
      by: ['provider', 'model', 'driftReason'],
      _avg: { estimateDeltaUsd: true, estimateDeltaPct: true },
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    return NextResponse.json({ success: true, slices });
  } catch (error: any) {
    return NextResponse.json({ error: "ANALYTICS_FAIL" }, { status: 500 });
  }
}