"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardHeader from "./DashboardHeader";
import ConversationList from "./ConversationList";
import ConversationPanel from "./ConversationPanel";

export interface ConversationItem {
  id: number;
  phone: string;
  name: string | null;
  mode: "AI" | "HUMAN";
  last_message_at: number | null;
  last_message_preview: string | null;
}

interface DashboardProps {
  phone?: string;
}

export default function Dashboard({ phone }: DashboardProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = (await res.json()) as { conversations: ConversationItem[] };
      setConversations(data.conversations ?? []);
      setSelectedId((prev) => {
        if (prev === null && (data.conversations ?? []).length > 0) {
          return data.conversations[0].id;
        }
        return prev;
      });
    } catch {
      // silent — el polling seguirá intentando
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950">
      <DashboardHeader phone={phone} />
      <div className="flex flex-1 overflow-hidden" style={{ display: "grid", gridTemplateColumns: "320px 1fr" }}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRefresh={refresh}
        />
        <ConversationPanel conversation={selected} onRefresh={refresh} />
      </div>
    </div>
  );
}
