"use client";

import type { ConversationItem } from "./Dashboard";

function formatRelative(unixSeconds: number | null): string {
  if (!unixSeconds) return "";
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRefresh: () => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <aside className="border-r border-neutral-800 bg-neutral-900 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
          Conversaciones · {conversations.length}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 text-sm">
            <p>Sin conversaciones aún.</p>
            <p className="mt-1">
              Escribe desde otro móvil al número conectado.
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${
                conv.id === selectedId ? "bg-neutral-800" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-neutral-100 text-sm truncate">
                  {conv.name ?? `+${conv.phone}`}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider flex-shrink-0 ${
                    conv.mode === "AI"
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-amber-950 text-amber-400"
                  }`}
                >
                  {conv.mode === "AI" ? "IA" : "Human"}
                </span>
              </div>
              {conv.name && (
                <p className="text-neutral-500 text-xs mb-0.5">
                  +{conv.phone}
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-neutral-400 text-xs truncate flex-1">
                  {conv.last_message_preview ?? "Sin mensajes"}
                </p>
                <span className="text-neutral-600 text-xs flex-shrink-0">
                  {formatRelative(conv.last_message_at)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
