import OpenAI, { toFile } from "openai";
import { buildSystemPrompt } from "./system-prompt.js";
import { toolDefinitions, executeTool } from "./tools/index.js";
import type { Message } from "./db.js";

// Lazy singleton — reads process.env at call time (after env-loader runs)
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Falta OPENROUTER_API_KEY. Ejecuta /setup.");
  }
  _client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/divisualproject/whatsapp-ai-agent-kit",
      "X-Title": "WhatsApp AI Agent Kit",
    },
  });
  return _client;
}

const MODEL = () => process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const MAX_TURNS = 5;

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    const ext = mimeType.includes("mp4") ? "mp4"
      : mimeType.includes("mpeg") ? "mp3"
      : mimeType.includes("webm") ? "webm"
      : mimeType.includes("wav") ? "wav"
      : "ogg";
    const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });
    const result = await getClient().audio.transcriptions.create({
      file,
      model: "openai/whisper-1",
      language: "es",
    });
    return result.text ?? null;
  } catch {
    return null;
  }
}

export async function validateApiKey(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getClient().models.list();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function generateReply(input: {
  history: Message[];
  conversationId: number;
  imageData?: { base64: string; mimeType: string };
}): Promise<string> {
  const client = getClient();

  const lastMsg = input.history[input.history.length - 1];
  const prevHistory = input.history.slice(0, -1);

  // Mapear roles del historial: 'human' (operador humano) se presenta como 'assistant'
  // para que el LLM lo interprete como respuestas propias previas
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...prevHistory.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Último mensaje: visión si hay imagen, texto plano si no
  if (lastMsg) {
    if (input.imageData && lastMsg.role === "user") {
      const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
        {
          type: "image_url",
          image_url: { url: `data:${input.imageData.mimeType};base64,${input.imageData.base64}` },
        },
      ];
      if (lastMsg.content && lastMsg.content !== "[Imagen recibida]") {
        parts.push({ type: "text", text: lastMsg.content });
      }
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({
        role: (lastMsg.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: lastMsg.content,
      });
    }
  }

  let turns = 0;

  while (turns < MAX_TURNS) {
    const res = await client.chat.completions.create({
      model: MODEL(),
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
      temperature: 0.4,
    });

    const msg = res.choices[0].message;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content ?? "";
    }

    messages.push({
      role: "assistant",
      content: msg.content ?? "",
      tool_calls: msg.tool_calls,
    });

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {
        // JSON malformado del modelo — continuar con args vacíos
      }

      const result = await executeTool(call.function.name, args, {
        conversationId: input.conversationId,
      });

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }

    turns++;
  }

  return "Déjame un momento — vuelvo contigo enseguida.";
}
