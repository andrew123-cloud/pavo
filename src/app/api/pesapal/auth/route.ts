// src/app/api/pesapal/auth/route.ts
import { getAuthToken } from "@/lib/pesapal";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const token = await getAuthToken();
    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
