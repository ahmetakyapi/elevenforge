import { NextResponse } from "next/server";
import { runWeeklyEconomy } from "@/lib/jobs/training";
import { verifyCron } from "@/lib/cron/verify";

export async function POST(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  const result = await runWeeklyEconomy();
  return NextResponse.json(result);
}

// Cron jobs sweep every league; give them the full serverless budget.
export const maxDuration = 300;
export const dynamic = "force-dynamic";
