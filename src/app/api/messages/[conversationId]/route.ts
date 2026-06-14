import { NextResponse } from "next/server";
import {
  getMessages,
  getConversationById,
  insertMessage,
  enqueueOutbox,
} from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id invalido" }, { status: 400 });
  }
  try {
    const messages = getMessages(id, 200);
    return NextResponse.json({ messages });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "id invalido" }, { status: 400 });
  }

  let body: { content?: string } = {};
  try {
    body = (await req.json()) as { content?: string };
  } catch {
    return NextResponse.json({ error: "body invalido" }, { status: 400 });
  }

  const content = body.content?.trim() ?? "";
  if (!content) {
    return NextResponse.json({ error: "contenido vacio" }, { status: 400 });
  }

  const conv = getConversationById(id);
  if (!conv) {
    return NextResponse.json(
      { error: "conversacion no encontrada" },
      { status: 404 }
    );
  }

  try {
    // insertMessage guarda en el panel inmediatamente (role='human')
    // enqueueOutbox encola para que el proceso bot lo envíe por WhatsApp
    const messageId = insertMessage(id, "human", content);
    enqueueOutbox(id, conv.phone, content);
    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
