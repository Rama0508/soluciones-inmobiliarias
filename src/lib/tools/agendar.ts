export const agendarDefinition = {
  type: "function" as const,
  function: {
    name: "agendar",
    description:
      "Genera el link de Cal.com/Calendly para que el lead agende su llamada. SOLO usar si calificar devolvió score >= 7.",
    parameters: {
      type: "object" as const,
      properties: {
        nombre: { type: "string", description: "Nombre del lead" },
        email: {
          type: "string",
          description: "Email del lead (opcional, para prellenar el formulario de Cal.com)",
        },
      },
      required: ["nombre"],
    },
  },
};

interface AgendarArgs {
  nombre: string;
  email?: string;
  conversationId?: number;
}

export async function agendar(
  args: AgendarArgs
): Promise<Record<string, unknown>> {
  const baseUrl = process.env.CAL_BOOKING_URL;
  if (!baseUrl) {
    return {
      ok: false,
      message: "Tool no configurada: falta CAL_BOOKING_URL en .env.local",
    };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("name", args.nombre);
  if (args.email) url.searchParams.set("email", args.email);

  const link = url.toString();
  return {
    ok: true,
    link,
    message: `Envía este link al lead para agendar: ${link}`,
  };
}
