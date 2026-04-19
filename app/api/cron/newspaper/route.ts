import { NextResponse } from "next/server";
import { runWeeklyNewspaper } from "@/lib/jobs";
import { verifyCron } from "@/lib/cron/verify";

export async function POST(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  const result = await runWeeklyNewspaper();
  return NextResponse.json(result);
}

export const GET = POST;
