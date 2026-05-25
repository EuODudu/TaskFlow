import type { TaskPriority } from "@/lib/queries";

export type MentalNoteType = "priority" | "idea" | "quick" | "urgent" | "brain_dump";
export type MentalNotePriority = "low" | "medium" | "high" | "urgent";

export type MentalNote = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  note_type: MentalNoteType;
  priority: MentalNotePriority;
  x: number;
  y: number;
  rotation: number;
  is_pinned: boolean;
  is_completed: boolean;
  completed_at: string | null;
  converted_task_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export const MENTAL_NOTE_TYPES: {
  value: MentalNoteType | "all";
  label: string;
  emoji: string;
  accent: string;
}[] = [
  { value: "all", label: "Tudo", emoji: "✨", accent: "#6366f1" },
  { value: "priority", label: "Prioridade", emoji: "📌", accent: "#3b82f6" },
  { value: "idea", label: "Ideia", emoji: "💭", accent: "#a855f7" },
  { value: "quick", label: "Rápida", emoji: "⚡", accent: "#22c55e" },
  { value: "urgent", label: "Urgente", emoji: "🔥", accent: "#ef4444" },
  { value: "brain_dump", label: "Brain Dump", emoji: "🧠", accent: "#f59e0b" },
];

export const NOTE_TYPE_META: Record<
  MentalNoteType,
  { label: string; emoji: string; accent: string; paper: string }
> = {
  priority: { label: "Prioridade", emoji: "📌", accent: "#3b82f6", paper: "#dbeafe" },
  idea: { label: "Ideia", emoji: "💭", accent: "#a855f7", paper: "#f3e8ff" },
  quick: { label: "Rápida", emoji: "⚡", accent: "#22c55e", paper: "#dcfce7" },
  urgent: { label: "Urgente", emoji: "🔥", accent: "#ef4444", paper: "#fee2e2" },
  brain_dump: { label: "Brain Dump", emoji: "🧠", accent: "#f59e0b", paper: "#fef3c7" },
};

const FORGOTTEN_MS = 3 * 24 * 60 * 60 * 1000;

export function noteRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash % 11) - 5) * 0.85;
}

export function isForgottenNote(note: MentalNote): boolean {
  if (note.is_completed || note.is_pinned || note.converted_task_id) return false;
  return Date.now() - new Date(note.updated_at).getTime() > FORGOTTEN_MS;
}

export function mapNoteToTaskPriority(note: Pick<MentalNote, "note_type" | "priority">): TaskPriority {
  if (note.note_type === "urgent" || note.priority === "urgent") return "urgent";
  if (note.note_type === "priority" || note.priority === "high") return "high";
  if (note.note_type === "idea" || note.priority === "low") return "low";
  return "medium";
}

export function defaultSpawnPosition(index: number): { x: number; y: number; rotation: number } {
  const cluster = [
    { x: 28, y: 34 },
    { x: 210, y: 72 },
    { x: 410, y: 36 },
    { x: 108, y: 210 },
    { x: 330, y: 236 },
    { x: 560, y: 160 },
    { x: 36, y: 356 },
    { x: 250, y: 386 },
  ];
  const base = cluster[index % cluster.length];
  const ring = Math.floor(index / cluster.length);
  return {
    x: base.x + ring * 34 + (index % 2) * 12,
    y: base.y + ring * 28 - (index % 3) * 10,
    rotation: ((index % 7) - 3) * 1.15,
  };
}

export function parseNoteRow(row: Record<string, unknown>): MentalNote {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? "Nova nota"),
    content: row.content != null ? String(row.content) : null,
    note_type: row.note_type as MentalNoteType,
    priority: row.priority as MentalNotePriority,
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    rotation: Number(row.rotation ?? 0),
    is_pinned: Boolean(row.is_pinned),
    is_completed: Boolean(row.is_completed),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    converted_task_id: row.converted_task_id != null ? String(row.converted_task_id) : null,
    archived_at: row.archived_at != null ? String(row.archived_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
