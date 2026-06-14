import { NextResponse } from "next/server";
import { listConversations } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conversations = listConversations();
    return NextResponse.json({ conversations });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
