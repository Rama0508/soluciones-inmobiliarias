"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { ConversationItem } from "./Dashboard";
import MessageBubble from "./MessageBubble";
import ModeToggle from "./ModeToggle";

interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "human";
  content: string;
  created_at: number;
}

interface ConversationPanelProps {
  conversation: ConversationItem | null;
  onRefresh: () => void;
}

export default function ConversationPanel({
  conversation,
  onRefresh,
}: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { cache: "no-store" });
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    let mounted = true;
    fetchMessages(conversation.id);
    const interval = setInterval(() => {
      if (mounted) fetchMessages(conversation.id);
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [conversation?.id, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleModeChange(mode: "AI" | "HUMAN") {
    if (!conversation) return;
    await fetch(`/api/mode/${conversation.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    onRefresh();
  }

  async function handleSend() {
    if (!conversation || !input.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput("");
      onRefresh();
      await fetchMessages(conversation.id);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleDelete() {
    if (!conversation) return;
    if (
      !confirm(
        `¿Borrar la conversación con ${conversation.name ?? conversation.phone}? Esta acción no se puede deshacer.`
      )
    )
      return;
    await fetch(`/api/conversations/${conversation.id}`, { method: "DELETE" });
    onRefresh();
  }

  if (!conversation) {
    return (
      <section className="flex items-center justify-center bg-neutral-950 text-neutral-500">
        Selecciona una conversación
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-neutral-950 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
        <div>
          <h2 className="font-semibold text-neutral-100">
            {conversation.name ?? `+${conversation.phone}`}
          </h2>
          {conversation.name && (
            <p className="text-neutral-500 text-sm">+{conversation.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle mode={conversation.mode} onChange={handleModeChange} />
          <button
            onClick={handleDelete}
            className="text-neutral-500 hover:text-red-400 text-sm transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-neutral-600 text-sm mt-8">
            Sin mensajes aún
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              createdAt={msg.created_at}
            />
          ))
        )}
      </div>

      <div className="border-t border-neutral-800 px-6 py-4 bg-neutral-900">
        {conversation.mode === "HUMAN" ? (
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={2}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 resize-none focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm text-center">
            El agente IA responde automáticamente. Cambia a Modo Humano para
            escribir tú.
          </p>
        )}
      </div>
    </section>
  );
}
