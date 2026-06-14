import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { resolve, join } from "path";

const DATA_DIR = resolve(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "messages.db");

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationMode = "AI" | "HUMAN";
export type MessageRole = "user" | "assistant" | "human";
export type ConnectionStatus = "disconnected" | "qr" | "connecting" | "connected";

export interface Conversation {
  id: number;
  phone: string;
  name: string | null;
  jid: string | null;
  mode: ConversationMode;
  last_message_at: number | null;
  created_at: number;
}

export interface ConversationListItem extends Conversation {
  last_message_preview: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  created_at: number;
}

export interface ConnectionState {
  id: number;
  status: ConnectionStatus;
  qr_string: string | null;
  phone: string | null;
  updated_at: number;
}

export interface OutboxItem {
  id: number;
  conversation_id: number;
  phone: string;
  content: string;
  sent: number;
  created_at: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  jid TEXT,
  mode TEXT CHECK(mode IN ('AI','HUMAN')) NOT NULL DEFAULT 'AI',
  last_message_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role TEXT CHECK(role IN ('user','assistant','human')) NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS connection_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  status TEXT CHECK(status IN ('disconnected','qr','connecting','connected')) NOT NULL DEFAULT 'disconnected',
  qr_string TEXT,
  phone TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT OR IGNORE INTO connection_state (id, status) VALUES (1, 'disconnected');

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  content TEXT NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(sent, created_at);
`;

// ─── Lazy context — importar este módulo NO abre la DB ────────────────────────
// next build lanza ~10 workers que importan las rutas API; abrir SQLite al importar
// provoca SQLITE_BUSY no determinista. La DB se abre solo en la primera llamada real.

interface Ctx {
  db: Database.Database;
  getOrCreate: Database.Statement;
  updateName: Database.Statement;
  updateJid: Database.Statement;
  getByPhone: Database.Statement;
  getById: Database.Statement;
  listConvos: Database.Statement;
  setMode: Database.Statement;
  insertMsg: Database.Statement;
  updateLastMsgAt: Database.Statement;
  getMsgs: Database.Statement;
  getHistory: Database.Statement;
  getConnState: Database.Statement;
  setConnState: Database.Statement;
  enqueueOutbox: Database.Statement;
  getPending: Database.Statement;
  markSent: Database.Statement;
  delMessages: Database.Statement;
  delOutbox: Database.Statement;
  delConvo: Database.Statement;
}

let _ctx: Ctx | null = null;

function ctx(): Ctx {
  if (!_ctx) _ctx = build();
  return _ctx;
}

function build(): Ctx {
  mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  // Micro-migración: añadir columna jid si no existe (bases de datos antiguas)
  const cols = db.prepare("PRAGMA table_info(conversations)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "jid")) {
    db.exec("ALTER TABLE conversations ADD COLUMN jid TEXT");
  }

  return {
    db,
    getOrCreate: db.prepare(
      `INSERT OR IGNORE INTO conversations (phone) VALUES (?)`
    ),
    updateName: db.prepare(
      `UPDATE conversations SET name=? WHERE id=? AND (name IS NULL OR name='')`
    ),
    updateJid: db.prepare(`UPDATE conversations SET jid=? WHERE id=?`),
    getByPhone: db.prepare(`SELECT * FROM conversations WHERE phone=?`),
    getById: db.prepare(`SELECT * FROM conversations WHERE id=?`),
    listConvos: db.prepare(`
      SELECT c.*,
        (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_preview
      FROM conversations c
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    `),
    setMode: db.prepare(`UPDATE conversations SET mode=? WHERE id=?`),
    insertMsg: db.prepare(
      `INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)`
    ),
    updateLastMsgAt: db.prepare(
      `UPDATE conversations SET last_message_at=unixepoch() WHERE id=?`
    ),
    getMsgs: db.prepare(
      `SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT ?`
    ),
    getHistory: db.prepare(
      `SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT ?`
    ),
    getConnState: db.prepare(`SELECT * FROM connection_state WHERE id=1`),
    setConnState: db.prepare(
      `UPDATE connection_state SET status=?, qr_string=?, phone=?, updated_at=unixepoch() WHERE id=1`
    ),
    enqueueOutbox: db.prepare(
      `INSERT INTO outbox (conversation_id, phone, content) VALUES (?, ?, ?)`
    ),
    getPending: db.prepare(
      `SELECT * FROM outbox WHERE sent=0 ORDER BY created_at ASC LIMIT ?`
    ),
    markSent: db.prepare(`UPDATE outbox SET sent=1 WHERE id=?`),
    delMessages: db.prepare(`DELETE FROM messages WHERE conversation_id=?`),
    delOutbox: db.prepare(
      `DELETE FROM outbox WHERE conversation_id=? AND sent=0`
    ),
    delConvo: db.prepare(`DELETE FROM conversations WHERE id=?`),
  };
}

// ─── Exported functions ───────────────────────────────────────────────────────

export function getOrCreateConversation(
  phone: string,
  name?: string,
  jid?: string
): Conversation {
  const c = ctx();
  c.getOrCreate.run(phone);
  const row = c.getByPhone.get(phone) as Conversation;
  if (name) c.updateName.run(name, row.id);
  if (jid && jid !== row.jid) c.updateJid.run(jid, row.id);
  return c.getByPhone.get(phone) as Conversation;
}

export function getConversationById(id: number): Conversation | null {
  return (ctx().getById.get(id) as Conversation) ?? null;
}

export function listConversations(): ConversationListItem[] {
  return ctx().listConvos.all() as ConversationListItem[];
}

export function setMode(conversationId: number, mode: ConversationMode): void {
  ctx().setMode.run(mode, conversationId);
}

export function insertMessage(
  conversationId: number,
  role: MessageRole,
  content: string
): number {
  const c = ctx();
  const tx = c.db.transaction(() => {
    const info = c.insertMsg.run(conversationId, role, content);
    c.updateLastMsgAt.run(conversationId);
    return info.lastInsertRowid as number;
  });
  return tx();
}

export function getMessages(conversationId: number, limit = 50): Message[] {
  return ctx().getMsgs.all(conversationId, limit) as Message[];
}

export function getRecentHistory(conversationId: number, limit = 20): Message[] {
  const rows = ctx().getHistory.all(conversationId, limit) as Message[];
  return rows.reverse();
}

export function getConnectionState(): ConnectionState {
  return ctx().getConnState.get() as ConnectionState;
}

export function setConnectionState(input: {
  status?: ConnectionStatus;
  qr_string?: string | null;
  phone?: string | null;
}): void {
  const current = getConnectionState();
  const status = input.status ?? current.status;
  const qr_string = "qr_string" in input ? input.qr_string : current.qr_string;
  const phone = "phone" in input ? input.phone : current.phone;
  ctx().setConnState.run(status, qr_string ?? null, phone ?? null);
}

export function enqueueOutbox(
  conversationId: number,
  phone: string,
  content: string
): number {
  const info = ctx().enqueueOutbox.run(conversationId, phone, content);
  return info.lastInsertRowid as number;
}

export function getPendingOutbox(limit = 20): OutboxItem[] {
  return ctx().getPending.all(limit) as OutboxItem[];
}

export function markOutboxSent(id: number): void {
  ctx().markSent.run(id);
}

export function deleteConversation(conversationId: number): void {
  const c = ctx();
  const tx = c.db.transaction(() => {
    c.delMessages.run(conversationId);
    c.delOutbox.run(conversationId);
    c.delConvo.run(conversationId);
  });
  tx();
}
