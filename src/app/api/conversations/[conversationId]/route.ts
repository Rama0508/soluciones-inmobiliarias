import { NextResponse } from "next/server";
import { deleteConversation } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ ok: false, error: "id invalido" }, { status: 400 });
  }
  try {
    deleteConversation(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
