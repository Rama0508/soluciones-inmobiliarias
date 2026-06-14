"use client";

import { useEffect, useState } from "react";

type Status = "disconnected" | "qr" | "connecting" | "connected" | "unknown";

interface QRScreenProps {
  status: Status;
  qrPng?: string;
}

export default function QRScreen({ status, qrPng }: QRScreenProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [qrPng]);

  const statusMessage: Record<Status, string> = {
    connecting: "Conectando...",
    disconnected: "Esperando al bot...",
    unknown: "Cargando...",
    qr: "Generando QR...",
    connected: "",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-2xl">
        <h1 className="text-2xl font-bold text-neutral-100 mb-1 text-center">
          Conectar WhatsApp
        </h1>
        <p className="text-neutral-400 text-sm text-center mb-6">
          Escanea el QR con WhatsApp para activar el agente
        </p>

        <div className="flex justify-center mb-6">
          {qrPng ? (
            <div>
              <div className="bg-white p-3 rounded-xl inline-block">
                <img
                  src={qrPng}
                  alt="QR de WhatsApp"
                  className="w-64 h-64 block"
                />
              </div>
              {elapsed > 60 && (
                <p className="mt-3 text-amber-400 text-sm text-center">
                  El QR puede haber caducado. Recarga la página.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-neutral-400 text-sm">{statusMessage[status]}</p>
            </div>
          )}
        </div>

        <div className="bg-neutral-800 rounded-xl p-4">
          <p className="text-neutral-300 text-sm font-medium mb-2">
            Cómo vincular:
          </p>
          <ol className="text-neutral-400 text-sm space-y-1 list-decimal list-inside">
            <li>Abre WhatsApp en tu móvil</li>
            <li>Ve a Dispositivos vinculados</li>
            <li>Pulsa &quot;Vincular un dispositivo&quot;</li>
            <li>Escanea este QR</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
