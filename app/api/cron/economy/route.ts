import { NextResponse } from "next/server";
import { runWeeklyEconomy } from "@/lib/jobs/training";
import { verifyCron } from "@/lib/cron/verify";

export async function POST(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  const result = await runWeeklyEconomy();
  return NextResponse.json(result);
}

export const GET = POST;
