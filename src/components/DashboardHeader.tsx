"use client";

interface DashboardHeaderProps {
  phone?: string;
}

export default function DashboardHeader({ phone }: DashboardHeaderProps) {
  async function handleDisconnect() {
    if (
      !confirm(
        "¿Desconectar WhatsApp? Tendrás que escanear el QR de nuevo."
      )
    )
      return;
    try {
      await fetch("/api/connection/disconnect", { method: "POST" });
      window.location.reload();
    } catch {
      alert("Error al desconectar. Intenta de nuevo.");
    }
  }

  return (
    <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <span className="text-neutral-100 font-semibold">Agente conectado</span>
        {phone && (
          <span className="text-neutral-500 text-sm">+{phone}</span>
        )}
      </div>
      <button
        onClick={handleDisconnect}
        className="text-neutral-400 hover:text-red-400 text-sm transition-colors"
      >
        Desconectar
      </button>
    </header>
  );
}
