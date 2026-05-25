import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Check,
  ListTodo,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  useMentalNotes,
  useProjects,
  useColumns,
  useInvalidate,
  type MentalNoteRow,
  type BoardColumn,
} from "@/lib/queries";
import { useMentalDeskUI } from "@/lib/stores";
import {
  MENTAL_NOTE_TYPES,
  NOTE_TYPE_META,
  defaultSpawnPosition,
  isForgottenNote,
  mapNoteToTaskPriority,
  noteRotation,
  parseNoteRow,
  type MentalNote,
  type MentalNotePriority,
  type MentalNoteType,
} from "@/lib/mental-notes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = { userId: string };

function inferColumnStatus(col?: BoardColumn) {
  if (!col) return "todo" as const;
  return col.default_status;
}

function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

export function MentalDesk({ userId }: Props) {
  const { data: rawNotes = [], isLoading } = useMentalNotes(userId);
  const { data: projects = [] } = useProjects();
  const projectId = projects[0]?.id;
  const { data: columns = [] } = useColumns(projectId);
  const inv = useInvalidate();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    filterType,
    expandedNoteId,
    composerMode,
    setFilterType,
    setExpandedNoteId,
    openQuickComposer,
    openBrainDump,
    closeComposer,
  } = useMentalDeskUI();

  const notes = useMemo(() => rawNotes.map((r) => parseNoteRow(r as unknown as Record<string, unknown>)), [rawNotes]);

  const filtered = useMemo(() => {
    const base = notes.filter((n) => !n.is_completed || n.is_pinned);
    if (filterType === "all") return base;
    return base.filter((n) => n.note_type === filterType);
  }, [notes, filterType]);

  const activeCount = notes.filter((n) => !n.is_completed && !n.archived_at).length;
  const expandedNote = notes.find((n) => n.id === expandedNoteId) ?? null;

  const refresh = () => inv.mentalNotes(userId);

  const patchNote = async (id: string, patch: Partial<MentalNoteRow>) => {
    const { error } = await supabase.from("mental_notes").update(patch).eq("id", id).eq("user_id", userId);
    if (error) {
      if (error.code === "PGRST205" || /mental_notes/i.test(error.message)) {
        toast.error("Execute o SQL da Mesa Mental no Supabase (PENDING_REMOTE.sql).");
        return false;
      }
      toast.error(error.message);
      return false;
    }
    refresh();
    return true;
  };

  const createNote = async (type: MentalNoteType, title: string, content: string) => {
    const index = notes.length;
    const pos = defaultSpawnPosition(index);
    const { error } = await supabase.from("mental_notes").insert({
      user_id: userId,
      title: title.trim() || "Nova nota",
      content: content.trim() || null,
      note_type: type,
      priority: type === "urgent" ? "urgent" : type === "priority" ? "high" : "medium",
      x: pos.x,
      y: pos.y,
      rotation: pos.rotation,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    closeComposer();
    refresh();
    toast.success("Nota criada na mesa!");
  };

  const togglePin = async (note: MentalNote) => {
    await patchNote(note.id, { is_pinned: !note.is_pinned });
  };

  const toggleComplete = async (note: MentalNote) => {
    const next = !note.is_completed;
    await patchNote(note.id, {
      is_completed: next,
      completed_at: next ? new Date().toISOString() : null,
    });
    if (next) setExpandedNoteId(null);
  };

  const archiveNote = async (note: MentalNote) => {
    await patchNote(note.id, { archived_at: new Date().toISOString() });
    setExpandedNoteId(null);
    toast.success("Nota arquivada.");
  };

  const savePosition = useDebouncedCallback(async (id: string, x: number, y: number) => {
    await patchNote(id, { x, y });
  }, 400);

  const convertToTask = async (note: MentalNote) => {
    if (!projectId) {
      toast.error("Crie um projeto no menu lateral antes de converter em tarefa.");
      return;
    }
    const column = columns[0];
    if (!column) {
      toast.error("Adicione uma coluna no Kanban primeiro.");
      return;
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        owner_id: userId,
        project_id: projectId,
        column_id: column.id,
        title: note.title.trim() || "Tarefa da Mesa Mental",
        description: note.content,
        priority: mapNoteToTaskPriority(note),
        position: 0,
        status: inferColumnStatus(column),
      })
      .select("id")
      .single();

    if (taskError) {
      toast.error(taskError.message);
      return;
    }

    const ok = await patchNote(note.id, {
      converted_task_id: task.id,
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
    if (ok) {
      inv.tasks(projectId);
      setExpandedNoteId(null);
      toast.success("Nota virou tarefa no Kanban!", {
        description: "Abra o quadro para continuar.",
      });
    }
  };

  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/80 p-0 shadow-sm backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-8 top-6 size-32 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary" />
              Mesa Mental
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Post-its vivos para ideias, prioridades e brain dumps — sem parecer um quadro corporativo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {activeCount} ativa(s)
            </span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openQuickComposer}>
              <Plus className="size-3.5" />
              Nota rápida
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openBrainDump}>
              <Brain className="size-3.5" />
              Brain Dump
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MENTAL_NOTE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                filterType === t.value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background/50 text-muted-foreground hover:border-primary/40",
              )}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {composerMode !== "closed" && (
            <NoteComposer
              key={composerMode}
              mode={composerMode}
              onClose={closeComposer}
              onCreate={createNote}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {expandedNote && (
            <ExpandedNotePanel
              note={expandedNote}
              onClose={() => setExpandedNoteId(null)}
              onPatch={patchNote}
              onTogglePin={() => togglePin(expandedNote)}
              onToggleComplete={() => toggleComplete(expandedNote)}
              onConvert={() => convertToTask(expandedNote)}
              onArchive={() => archiveNote(expandedNote)}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
            <p className="text-sm font-medium">Sua mesa está livre</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Solte uma ideia, um lembrete urgente ou um brain dump para começar.
            </p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={openQuickComposer}>
              <Plus className="size-3.5" />
              Criar primeira nota
            </Button>
          </div>
        ) : isMobile ? (
          <div className="grid gap-3">
            <AnimatePresence>
              {filtered.map((note, i) => (
                <MentalNoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  draggable={false}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div
            ref={canvasRef}
            className="relative min-h-[440px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-muted/25 via-background/40 to-muted/15 shadow-inner"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_42%),radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.06),transparent_40%)]" />
            <AnimatePresence>
              {filtered.map((note, i) => (
                <MentalNoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  draggable
                  canvasRef={canvasRef}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                  onDragEnd={(x, y) => savePosition(note.id, x, y)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}

function NoteComposer({
  mode,
  onClose,
  onCreate,
}: {
  mode: "quick" | "brain_dump";
  onClose: () => void;
  onCreate: (type: MentalNoteType, title: string, content: string) => void;
}) {
  const [title, setTitle] = useState(mode === "brain_dump" ? "Brain dump" : "");
  const [content, setContent] = useState("");
  const type: MentalNoteType = mode === "brain_dump" ? "brain_dump" : "quick";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-primary/25 bg-background/80 p-4 shadow-lg backdrop-blur-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">
          {mode === "brain_dump" ? "🧠 Brain Dump" : "⚡ Nota rápida"}
        </p>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Título curto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-background/60"
        />
        <Textarea
          placeholder={mode === "brain_dump" ? "Despeje tudo aqui sem filtro..." : "O que precisa lembrar?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={mode === "brain_dump" ? 5 : 3}
          className="resize-none bg-background/60"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={() => onCreate(type, title, content)}>
          Adicionar à mesa
        </Button>
      </div>
    </motion.div>
  );
}

function ExpandedNotePanel({
  note,
  onClose,
  onPatch,
  onTogglePin,
  onToggleComplete,
  onConvert,
  onArchive,
}: {
  note: MentalNote;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<MentalNoteRow>) => Promise<boolean>;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onConvert: () => void;
  onArchive: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? "");
  const [noteType, setNoteType] = useState(note.note_type);
  const [priority, setPriority] = useState(note.priority);

  const debouncedSave = useDebouncedCallback(
    async (t: string, c: string, nt: MentalNoteType, p: MentalNotePriority) => {
      await onPatch(note.id, { title: t, content: c || null, note_type: nt, priority: p });
    },
    600,
  );

  useEffect(() => {
    debouncedSave(title, content, noteType, priority);
  }, [title, content, noteType, priority, debouncedSave]);

  const meta = NOTE_TYPE_META[noteType];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-2xl border bg-background/90 p-4 shadow-lg backdrop-blur-md"
      style={{ borderColor: `${meta.accent}40` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">
          {meta.emoji} Editando nota
        </p>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="resize-none" />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOTE_TYPE_META) as MentalNoteType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNoteType(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  noteType === t ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                {NOTE_TYPE_META[t].emoji} {NOTE_TYPE_META[t].label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["low", "medium", "high", "urgent"] as MentalNotePriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase",
                  priority === p ? "border-primary bg-primary/10" : "border-border text-muted-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:min-w-[160px]">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onTogglePin}>
            {note.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {note.is_pinned ? "Desfixar" : "Fixar"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onToggleComplete}>
            <Check className="size-3.5" />
            {note.is_completed ? "Reabrir" : "Concluir"}
          </Button>
          {!note.converted_task_id && (
            <Button size="sm" className="gap-1.5" onClick={onConvert}>
              <ListTodo className="size-3.5" />
              Virar tarefa
            </Button>
          )}
          {note.converted_task_id && (
            <Button size="sm" variant="secondary" asChild>
              <Link to="/board">Ver no Kanban</Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={onArchive}>
            <Trash2 className="size-3.5" />
            Arquivar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function MentalNoteCard({
  note,
  index,
  draggable,
  canvasRef,
  onExpand,
  onTogglePin,
  onToggleComplete,
  onDragEnd,
}: {
  note: MentalNote;
  index: number;
  draggable: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onExpand: () => void;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onDragEnd?: (x: number, y: number) => void;
}) {
  const meta = NOTE_TYPE_META[note.note_type];
  const forgotten = isForgottenNote(note);
  const urgent = note.note_type === "urgent" || note.priority === "urgent";
  const rotation = note.rotation || noteRotation(note.id);

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-lg leading-none">{meta.emoji}</span>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            {note.is_pinned ? <Pin className="size-3 text-primary" /> : <PinOff className="size-3" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            <Check className={cn("size-3", note.is_completed && "text-emerald-600")} />
          </button>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-foreground/90">{note.title}</p>
      {note.content && (
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-foreground/65">{note.content}</p>
      )}
      {note.converted_task_id && (
        <span className="mt-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          Virou tarefa
        </span>
      )}
    </>
  );

  const className = cn(
    "w-[152px] cursor-pointer rounded-xl border p-3 shadow-lg transition-shadow",
    "backdrop-blur-[2px]",
    forgotten && "ring-2 ring-amber-400/40",
    urgent && "shadow-[0_0_24px_rgba(239,68,68,0.22)]",
    note.is_completed && "opacity-55 saturate-50",
  );

  const style = {
    background: `linear-gradient(145deg, ${meta.paper}, ${meta.paper}dd)`,
    borderColor: `${meta.accent}35`,
    rotate: `${rotation}deg`,
  } as React.CSSProperties;

  if (!draggable) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
        className={className}
        style={style}
        onClick={onExpand}
        whileHover={{ y: -4, scale: 1.02 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  const spawn = defaultSpawnPosition(index);
  const posX = note.x > 0 || note.y > 0 ? note.x : spawn.x;
  const posY = note.x > 0 || note.y > 0 ? note.y : spawn.y;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={canvasRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, x: posX, y: posY }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
      whileHover={{ scale: 1.03, zIndex: 20 }}
      whileDrag={{ scale: 1.05, zIndex: 30, rotate: 0 }}
      className={cn(className, "absolute left-0 top-0 touch-none")}
      style={style}
      onClick={onExpand}
      onDragEnd={(_, info) => {
        const nx = Math.max(0, Math.round(posX + info.offset.x));
        const ny = Math.max(0, Math.round(posY + info.offset.y));
        onDragEnd?.(nx, ny);
      }}
    >
      {cardContent}
    </motion.div>
  );
}
