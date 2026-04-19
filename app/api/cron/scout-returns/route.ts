import { NextResponse } from "next/server";
import { processScoutReturns } from "@/lib/jobs";
import { verifyCron } from "@/lib/cron/verify";

export async function POST(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  const result = await processScoutReturns();
  return NextResponse.json(result);
}

export const GET = POST;
