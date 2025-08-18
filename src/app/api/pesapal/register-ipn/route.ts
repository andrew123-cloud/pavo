// src/app/api/pesapal/register-ipn/route.ts
import { registerIpnUrl } from "@/lib/pesapal";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await registerIpnUrl();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
