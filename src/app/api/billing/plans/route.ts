import { NextResponse } from "next/server";
import { listBillingPlans } from "@/lib/billing-store";

export async function GET() {
  const plans = await listBillingPlans();
  return NextResponse.json({ plans });
}
