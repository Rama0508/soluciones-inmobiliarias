import { NextResponse } from "next/server";
import { getConnectionState } from "@/lib/db";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = getConnectionState();

    // Mostrar QR si tenemos la cadena Y status es 'qr' O 'connecting'
    // (incluir 'connecting' mitiga una race condition real en máquinas rápidas — no quitar)
    if (
      state.qr_string &&
      (state.status === "qr" || state.status === "connecting")
    ) {
      const qrPng = await QRCode.toDataURL(state.qr_string, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      return NextResponse.json({
        status: "qr",
        qrPng,
        phone: state.phone,
        updatedAt: state.updated_at,
      });
    }

    return NextResponse.json({
      status: state.status,
      phone: state.phone,
      updatedAt: state.updated_at,
    });
  } catch (e) {
    return NextResponse.json(
      { status: "disconnected", error: String(e) },
      { status: 200 }
    );
  }
}
