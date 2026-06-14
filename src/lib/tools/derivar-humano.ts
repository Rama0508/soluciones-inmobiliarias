import { setMode } from "../db.js";

export const derivarHumanoDefinition = {
  type: "function" as const,
  function: {
    name: "derivarHumano",
    description:
      "Pasa la conversación a un agente humano. Úsala cuando el lead pide precios específicos, tiene una queja, o la consulta está fuera de tu alcance.",
    parameters: {
      type: "object" as const,
      properties: {
        razon: {
          type: "string",
          description:
            "Por qué se deriva. Útil para el humano que retome la conversación.",
        },
      },
      required: ["razon"],
      // conversationId NO va en el schema — lo inyecta executeTool siempre
    },
  },
};

interface DerivarHumanoArgs {
  razon: string;
  conversationId?: number;
}

export async function derivarHumano(
  args: DerivarHumanoArgs
): Promise<Record<string, unknown>> {
  if (!args.conversationId) {
    return {
      ok: false,
      message:
        "No se pudo derivar: falta conversationId (bug del wrapper de tools)",
    };
  }

  setMode(args.conversationId, "HUMAN");

  return {
    ok: true,
    message: `Conversación derivada a HUMAN. Razón: ${args.razon}`,
    instruccion:
      "Responde al usuario con algo como: 'Te paso con una persona del equipo, te escribe enseguida.' No respondas más en esta conversación.",
  };
}
