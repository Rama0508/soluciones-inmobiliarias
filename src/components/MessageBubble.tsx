"use client";

interface MessageBubbleProps {
  role: "user" | "assistant" | "human";
  content: string;
  createdAt: number;
}

function formatTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  role,
  content,
  createdAt,
}: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[70%] bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
          <p className="text-neutral-100 text-sm whitespace-pre-wrap">{content}</p>
          <p className="text-neutral-500 text-xs mt-1">{formatTime(createdAt)}</p>
        </div>
      </div>
    );
  }

  if (role === "assistant") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[70%] bg-emerald-900 rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-xs font-semibold text-emerald-400 mb-1 uppercase tracking-wider">
            Agente IA
          </p>
          <p className="text-neutral-100 text-sm whitespace-pre-wrap">{content}</p>
          <p className="text-emerald-600 text-xs mt-1">{formatTime(createdAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[70%] bg-amber-900 rounded-2xl rounded-tr-sm px-4 py-2.5">
        <p className="text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wider">
          Humano
        </p>
        <p className="text-neutral-100 text-sm whitespace-pre-wrap">{content}</p>
        <p className="text-amber-600 text-xs mt-1">{formatTime(createdAt)}</p>
      </div>
    </div>
  );
}
