import { NextResponse } from "next/server";
import { getDuepiClient } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getDuepiClient();
    const state = await client.getStoveState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("[API] Status error:", error);
    return NextResponse.json(
      { error: "Failed to get stove status", detail: String(error) },
      { status: 500 }
    );
  }
}
