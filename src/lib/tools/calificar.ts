export const calificarDefinition = {
  type: "function" as const,
  function: {
    name: "calificar",
    description:
      "Califica al lead con un score del 1 al 10. Devuelve si califica (score >= 7) para agendar una llamada.",
    parameters: {
      type: "object" as const,
      properties: {
        tieneNegocioActivo: {
          type: "boolean",
          description: "El lead tiene un negocio activo (no es idea o proyecto futuro)",
        },
        facturaMasDe5kMes: {
          type: "boolean",
          description: "El negocio factura más de 5.000€/mes",
        },
        dolorEncajaConPropuesta: {
          type: "boolean",
          description: "El problema del lead encaja con lo que ofrecemos",
        },
        urgenciaAlta: {
          type: "boolean",
          description: "El lead quiere resolver esto en los próximos 30 días",
        },
        presupuestoConfirmado: {
          type: "boolean",
          description: "Ha confirmado que tiene presupuesto disponible",
        },
      },
      // TODO: Umbral (score >= 7) y pesos ajustables según tu negocio
    },
  },
};

interface CalificarArgs {
  tieneNegocioActivo?: boolean;
  facturaMasDe5kMes?: boolean;
  dolorEncajaConPropuesta?: boolean;
  urgenciaAlta?: boolean;
  presupuestoConfirmado?: boolean;
  conversationId?: number;
}

export async function calificar(
  args: CalificarArgs
): Promise<Record<string, unknown>> {
  // TODO: Pesos ajustables según tu negocio (máx 10)
  let score = 0;
  if (args.tieneNegocioActivo) score += 3;
  if (args.facturaMasDe5kMes) score += 3;
  if (args.dolorEncajaConPropuesta) score += 2;
  if (args.urgenciaAlta) score += 1;
  if (args.presupuestoConfirmado) score += 1;

  const califica = score >= 7;

  return {
    ok: true,
    score,
    califica,
    mensaje: califica
      ? "Lead cualificado. Procede a agendar llamada."
      : "Lead NO cualificado. Responde cordialmente sin agendar.",
  };
}
