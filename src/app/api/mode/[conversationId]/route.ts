import { NextResponse } from "next/server";
import { setMode, type ConversationMode } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function POST(req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id invalido" }, { status: 400 });
  }

  let body: { mode?: string } = {};
  try {
    body = (await req.json()) as { mode?: string };
  } catch {
    return NextResponse.json({ error: "body invalido" }, { status: 400 });
  }

  if (body.mode !== "AI" && body.mode !== "HUMAN") {
    return NextResponse.json(
      { error: "mode debe ser 'AI' o 'HUMAN'" },
      { status: 400 }
    );
  }

  try {
    setMode(id, body.mode as ConversationMode);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
