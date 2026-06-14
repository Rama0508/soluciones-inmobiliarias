export const guardarLeadDefinition = {
  type: "function" as const,
  function: {
    name: "guardarLead",
    description:
      "Guarda los datos del lead en Google Sheets. Úsala en cuanto tengas nombre + actividad + cualquier otro dato relevante. No esperes a tenerlo todo.",
    parameters: {
      type: "object" as const,
      properties: {
        nombre: { type: "string", description: "Nombre del lead" },
        telefono: {
          type: "string",
          description: "Teléfono del lead (formato internacional)",
        },
        negocio: { type: "string", description: "A qué se dedica el lead" },
        facturacion: {
          type: "string",
          description: "Rango de facturación mensual si lo ha mencionado",
        },
        dolor: {
          type: "string",
          description: "Dolor o necesidad principal del lead",
        },
      },
      required: ["nombre", "telefono"],
    },
  },
};

interface GuardarLeadArgs {
  nombre: string;
  telefono: string;
  negocio?: string;
  facturacion?: string;
  dolor?: string;
  conversationId?: number;
}

export async function guardarLead(
  args: GuardarLeadArgs
): Promise<Record<string, unknown>> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      message: "Tool no configurada: falta GOOGLE_SHEETS_WEBHOOK_URL en .env.local",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: args.nombre,
        telefono: args.telefono,
        negocio: args.negocio ?? "",
        facturacion: args.facturacion ?? "",
        dolor: args.dolor ?? "",
        fecha: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      return { ok: true, message: "Lead guardado en Google Sheets" };
    }
    return { ok: false, message: `Webhook respondió ${res.status}` };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
