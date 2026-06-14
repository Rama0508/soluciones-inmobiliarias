"use client";

import { useEffect, useState } from "react";
import QRScreen from "./QRScreen";
import Dashboard from "./Dashboard";

type Status = "disconnected" | "qr" | "connecting" | "connected" | "unknown";

interface ConnectionData {
  status: Status;
  qrPng?: string;
  phone?: string;
}

export default function ConnectionGate() {
  const [data, setData] = useState<ConnectionData>({ status: "unknown" });

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch("/api/connection/status", { cache: "no-store" });
        const json = (await res.json()) as ConnectionData;
        if (alive) setData(json);
      } catch {
        if (alive) setData((prev) => ({ ...prev, status: "unknown" }));
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  if (data.status === "connected") {
    return <Dashboard phone={data.phone} />;
  }

  return <QRScreen status={data.status} qrPng={data.qrPng} />;
}
