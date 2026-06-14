import { guardarLeadDefinition, guardarLead } from "./guardar-lead.js";
import { calificarDefinition, calificar } from "./calificar.js";
import { agendarDefinition, agendar } from "./agendar.js";
import { derivarHumanoDefinition, derivarHumano } from "./derivar-humano.js";

type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

type GenericHandler = (
  args: Record<string, unknown> & { conversationId?: number }
) => Promise<Record<string, unknown>>;

export const toolDefinitions: ToolDefinition[] = [
  guardarLeadDefinition,
  calificarDefinition,
  agendarDefinition,
  derivarHumanoDefinition,
];

const handlers: Record<string, GenericHandler> = {
  guardarLead: guardarLead as unknown as GenericHandler,
  calificar: calificar as unknown as GenericHandler,
  agendar: agendar as unknown as GenericHandler,
  derivarHumano: derivarHumano as unknown as GenericHandler,
};

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: { conversationId: number }
): Promise<Record<string, unknown>> {
  const handler = handlers[toolName];
  if (!handler) {
    return { ok: false, message: `Tool desconocida: ${toolName}` };
  }
  // conversationId se inyecta siempre — no va en el schema de las tools
  return handler({ ...args, conversationId: context.conversationId });
}
