import { NextResponse } from "next/server";
import { setConnectionState } from "@/lib/db";
import { rmSync, mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

export const dynamic = "force-dynamic";

const AUTH_DIR = resolve(process.cwd(), "auth");
const DATA_DIR = resolve(process.cwd(), "data");
const RESTART_FLAG = join(DATA_DIR, ".restart");

export async function POST() {
  try {
    setConnectionState({ status: "disconnected", qr_string: null, phone: null });
    rmSync(AUTH_DIR, { recursive: true, force: true });
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(RESTART_FLAG, "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
