import { NextResponse } from "next/server";
import { runMatchDay } from "@/lib/jobs";
import { verifyCron } from "@/lib/cron/verify";

export async function POST(req: Request) {
  const deny = await verifyCron(req);
  if (deny) return deny;
  const result = await runMatchDay();
  return NextResponse.json(result);
}

export const GET = POST; // cron-job.org and some schedulers send GET
