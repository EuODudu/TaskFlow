import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Brain, Check, ListTodo, Pin, PinOff, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  useColumns,
  useInvalidate,
  useMentalNotes,
  useProjects,
  type BoardColumn,
  type MentalNoteRow,
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

const BOARD_NOTE_STYLE: Record<
  MentalNoteType,
  {
    label: string;
    accent: string;
    note: string;
    text: string;
    muted: string;
    pin: string;
    tape: string;
  }
> = {
  priority: {
    label: "Prioridade",
    accent: "#60a5fa",
    note: "from-blue-50 via-sky-100 to-blue-200",
    text: "text-slate-950",
    muted: "text-slate-700",
    pin: "bg-blue-500",
    tape: "bg-blue-300/55",
  },
  idea: {
    label: "Ideia",
    accent: "#a78bfa",
    note: "from-violet-50 via-fuchsia-100 to-purple-200",
    text: "text-slate-950",
    muted: "text-slate-700",
    pin: "bg-violet-500",
    tape: "bg-violet-300/55",
  },
  quick: {
    label: "Rápida",
    accent: "#34d399",
    note: "from-emerald-50 via-green-100 to-teal-200",
    text: "text-slate-950",
    muted: "text-slate-700",
    pin: "bg-emerald-500",
    tape: "bg-emerald-300/55",
  },
  urgent: {
    label: "Urgente",
    accent: "#fb7185",
    note: "from-rose-50 via-red-100 to-orange-200",
    text: "text-slate-950",
    muted: "text-slate-700",
    pin: "bg-rose-500",
    tape: "bg-rose-300/55",
  },
  brain_dump: {
    label: "Brain Dump",
    accent: "#f59e0b",
    note: "from-amber-50 via-yellow-100 to-orange-200",
    text: "text-slate-950",
    muted: "text-slate-700",
    pin: "bg-amber-500",
    tape: "bg-amber-300/55",
  },
};

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
  const boardRef = useRef<HTMLDivElement>(null);
  const [discardingIds, setDiscardingIds] = useState<Set<string>>(new Set());

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

  const notes = useMemo(() => rawNotes.map((row) => parseNoteRow(row as unknown as Record<string, unknown>)), [rawNotes]);
  const filtered = useMemo(() => {
    const visible = notes.filter((note) => !note.is_completed && !note.archived_at);
    return filterType === "all" ? visible : visible.filter((note) => note.note_type === filterType);
  }, [filterType, notes]);

  const activeCount = notes.filter((note) => !note.is_completed && !note.archived_at).length;
  const expandedNote = notes.find((note) => note.id === expandedNoteId) ?? null;
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
    const position = defaultSpawnPosition(notes.length);
    const { error } = await supabase.from("mental_notes").insert({
      user_id: userId,
      title: title.trim() || "Nova nota",
      content: content.trim() || null,
      note_type: type,
      priority: type === "urgent" ? "urgent" : type === "priority" ? "high" : "medium",
      x: position.x,
      y: position.y,
      rotation: position.rotation,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    closeComposer();
    refresh();
    toast.success("Nota fixada na Mesa Mental.");
  };

  const togglePin = async (note: MentalNote) => {
    await patchNote(note.id, { is_pinned: !note.is_pinned });
  };

  const toggleComplete = async (note: MentalNote) => {
    if (note.is_completed) {
      await patchNote(note.id, { is_completed: false, completed_at: null });
      return;
    }

    setExpandedNoteId(null);
    setDiscardingIds((ids) => new Set(ids).add(note.id));
    setTimeout(async () => {
      await patchNote(note.id, {
        is_completed: true,
        is_pinned: false,
        completed_at: new Date().toISOString(),
      });
      setDiscardingIds((ids) => {
        const next = new Set(ids);
        next.delete(note.id);
        return next;
      });
    }, 620);
  };

  const archiveNote = async (note: MentalNote) => {
    await patchNote(note.id, { archived_at: new Date().toISOString() });
    setExpandedNoteId(null);
    toast.success("Nota removida.");
  };

  const savePosition = useDebouncedCallback(async (id: string, x: number, y: number) => {
    await patchNote(id, { x, y });
  }, 360);

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
      toast.success("Nota virou tarefa no Kanban!");
    }
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-950 p-0 shadow-[0_22px_70px_rgba(2,6,23,0.35)]">
      <div className="border-b border-white/10 bg-slate-950/95 px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Mesa Mental</h2>
            <p className="mt-1 text-xs text-slate-400">
              Um quadro simples para fixar ideias, agora em grafite com os acentos do TaskFlow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 shadow-sm">
              {activeCount} nota(s)
            </span>
            <Button size="sm" variant="outline" className="gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={openQuickComposer}>
              <Plus className="size-3.5" />
              Nova nota
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openBrainDump}>
              <Brain className="size-3.5" />
              Brain Dump
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {MENTAL_NOTE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                filterType === type.value
                  ? "border-primary/40 bg-primary text-primary-foreground"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className="mr-1">{type.emoji}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4">
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
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyBoard onCreate={openQuickComposer} />
        ) : isMobile ? (
          <div className="grid gap-3">
            <AnimatePresence>
              {filtered.map((note, index) => (
                <BoardNote
                  key={note.id}
                  note={note}
                  index={index}
                  dragging={false}
                  discarding={discardingIds.has(note.id)}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <DarkBoard boardRef={boardRef}>
            <AnimatePresence>
              {filtered.map((note, index) => (
                <BoardNote
                  key={note.id}
                  note={note}
                  index={index}
                  dragging
                  boardRef={boardRef}
                  discarding={discardingIds.has(note.id)}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                  onDragEnd={(x, y) => savePosition(note.id, x, y)}
                />
              ))}
            </AnimatePresence>
          </DarkBoard>
        )}
      </div>
    </Card>
  );
}

function DarkBoard({
  boardRef,
  children,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_45px_rgba(2,6,23,0.26)]">
      <div className="rounded-[1.25rem] border border-white/10 bg-slate-950 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_0_80px_rgba(99,102,241,0.08)]">
        <div
          ref={boardRef}
          className="relative min-h-[430px] overflow-hidden rounded-xl border border-white/10 shadow-inner"
          style={{
            backgroundColor: "#050812",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,.10) 1px, transparent 0), linear-gradient(90deg, rgba(99,102,241,.06), transparent 45%, rgba(14,165,233,.05))",
            backgroundSize: "10px 10px, 100% 100%",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.14),transparent_48%)]" />
          {children}
        </div>
      </div>
    </div>
  );
}

function EmptyBoard({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-3">
      <div className="rounded-[1.25rem] border border-white/10 bg-slate-950 p-8 text-center shadow-inner">
        <div className="mx-auto max-w-sm rotate-[-1deg] rounded-xl border border-primary/25 bg-slate-900 p-5 text-white shadow-lg">
          <div className="mx-auto -mt-8 mb-2 size-5 rounded-full bg-primary shadow-md" />
          <p className="font-bold">Quadro vazio</p>
          <p className="mt-1 text-sm text-slate-400">Fixe sua primeira nota para começar.</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={onCreate}>
            <Plus className="size-3.5" />
            Criar nota
          </Button>
        </div>
      </div>
    </div>
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
      initial={{ opacity: 0, y: -8, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -0.5 }}
      exit={{ opacity: 0, y: -8, rotate: 1 }}
      className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-slate-900 p-4 text-white shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{mode === "brain_dump" ? "Brain Dump" : "Nova nota"}</p>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Título da nota"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-white/10 bg-slate-950 text-white"
        />
        <Textarea
          placeholder={mode === "brain_dump" ? "Escreva livremente..." : "Conteúdo"}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={mode === "brain_dump" ? 5 : 3}
          className="resize-none border-white/10 bg-slate-950 text-white"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={() => onCreate(type, title, content)}>
          Fixar no quadro
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
  }, [content, debouncedSave, noteType, priority, title]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-4 text-white shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">Editar nota</p>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="border-white/10 bg-slate-950 text-white" />
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="resize-none border-white/10 bg-slate-950 text-white" />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOTE_TYPE_META) as MentalNoteType[]).map((type) => (
              <button
                key={type}
                onClick={() => setNoteType(type)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  noteType === type ? "border-primary/40 bg-primary text-primary-foreground" : "border-white/10 bg-white/5 text-slate-300",
                )}
              >
                {NOTE_TYPE_META[type].emoji} {NOTE_TYPE_META[type].label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["low", "medium", "high", "urgent"] as MentalNotePriority[]).map((item) => (
              <button
                key={item}
                onClick={() => setPriority(item)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase",
                  priority === item ? "border-primary/40 bg-primary text-primary-foreground" : "border-white/10 bg-white/5 text-slate-400",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[150px]">
          <Button size="sm" variant="outline" className="gap-1.5 border-white/10 bg-white/5 text-white" onClick={onTogglePin}>
            {note.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {note.is_pinned ? "Desfixar" : "Fixar"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-white/10 bg-white/5 text-white" onClick={onToggleComplete}>
            <Check className="size-3.5" />
            Concluir
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
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-400" onClick={onArchive}>
            <Trash2 className="size-3.5" />
            Remover
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function BoardNote({
  note,
  index,
  dragging,
  boardRef,
  discarding,
  onExpand,
  onTogglePin,
  onToggleComplete,
  onDragEnd,
}: {
  note: MentalNote;
  index: number;
  dragging: boolean;
  boardRef?: RefObject<HTMLDivElement | null>;
  discarding: boolean;
  onExpand: () => void;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onDragEnd?: (x: number, y: number) => void;
}) {
  const style = BOARD_NOTE_STYLE[note.note_type];
  const forgotten = isForgottenNote(note);
  const rotation = note.rotation || noteRotation(note.id);
  const spawn = defaultSpawnPosition(index);
  const x = note.x > 0 || note.y > 0 ? note.x : spawn.x;
  const y = note.x > 0 || note.y > 0 ? note.y : spawn.y;
  const isUrgent = note.note_type === "urgent" || note.priority === "urgent";

  const content = (
    <>
      <div className={cn("absolute left-1/2 top-[-11px] size-5 -translate-x-1/2 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.45)]", style.pin)}>
        <span className="absolute left-1 top-1 size-1.5 rounded-full bg-white/55" />
      </div>
      <div className={cn("absolute left-5 right-5 top-2 h-5 rounded-sm opacity-80 rotate-[-2deg]", style.tape)} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.42),transparent_36%,rgba(15,23,42,.08))]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,.20) 1px, transparent 1px), radial-gradient(circle at 1px 1px, rgba(15,23,42,.16) 1px, transparent 0)",
          backgroundSize: "100% 22px, 9px 9px",
        }}
      />
      <div className="pointer-events-none absolute -bottom-1 -right-1 size-10 rounded-tl-xl bg-slate-900/10 shadow-[-3px_-3px_7px_rgba(255,255,255,.28)]" />
      <div className="relative pt-3">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("line-clamp-2 text-base font-black leading-tight", style.text)}>{note.title}</p>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin();
              }}
              className="rounded-md p-1 text-slate-800/55 hover:bg-slate-950/10 hover:text-slate-950"
            >
              {note.is_pinned ? <Pin className="size-3.5 text-primary" /> : <PinOff className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleComplete();
              }}
              className="rounded-md p-1 text-slate-800/55 hover:bg-slate-950/10 hover:text-slate-950"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        </div>

        {note.content && (
          <p className={cn("mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed", style.muted)}>{note.content}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-slate-950/10 px-2 py-0.5 text-[10px] font-bold text-slate-800/70">
            {style.label}
          </span>
          {isUrgent && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-800">urgente</span>}
          {forgotten && <span className="rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold text-amber-900">rever</span>}
        </div>
      </div>
    </>
  );

  const baseClass = cn(
    "relative w-[178px] min-h-[154px] cursor-pointer border bg-gradient-to-br p-3 shadow-[0_14px_26px_rgba(0,0,0,0.38)]",
    "before:pointer-events-none before:absolute before:left-2 before:right-2 before:top-2 before:h-px before:bg-white/45",
    style.note,
    forgotten && "ring-2 ring-amber-400/25",
    isUrgent && "shadow-[0_14px_30px_rgba(127,29,29,0.28)]",
  );

  const discardAnimation = discarding
    ? {
        scale: [1, 0.86, 0.38],
        rotate: [rotation, rotation + 18, rotation + 140],
        x: dragging ? x + 260 : 80,
        y: dragging ? y + 220 : 120,
        opacity: [1, 0.8, 0],
        borderRadius: ["0.18rem", "1.1rem", "999px"],
        filter: ["brightness(1)", "brightness(.82)", "brightness(.55)"],
      }
    : undefined;

  if (!dragging) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.94, rotate: rotation }}
        animate={discardAnimation ?? { opacity: 1, scale: 1, rotate: rotation }}
        exit={{ opacity: 0, scale: 0.8, rotate: rotation + 20 }}
        transition={{ duration: discarding ? 0.58 : 0.22, ease: "easeInOut" }}
        className={baseClass}
        onClick={onExpand}
        style={{ clipPath: "polygon(2% 1%, 98% 0%, 100% 91%, 91% 100%, 1% 98%, 0% 8%)" } as CSSProperties}
        whileHover={{ y: -3, scale: 1.015 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.06}
      dragConstraints={boardRef}
      initial={{ opacity: 0, scale: 0.94, rotate: rotation }}
      animate={discardAnimation ?? { opacity: 1, scale: 1, x, y, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.8, rotate: rotation + 20 }}
      transition={{ duration: discarding ? 0.58 : 0.24, ease: "easeInOut" }}
      whileHover={{ y: -4, scale: 1.025, rotate: rotation * 0.7, zIndex: 20 }}
      whileDrag={{ scale: 1.04, rotate: 0, zIndex: 30, cursor: "grabbing" }}
      className={cn(baseClass, "absolute left-0 top-0 touch-none")}
      onClick={onExpand}
      onDragEnd={(_, info: PanInfo) => {
        const nextX = Math.max(0, Math.round(x + info.offset.x));
        const nextY = Math.max(0, Math.round(y + info.offset.y));
        onDragEnd?.(nextX, nextY);
      }}
      style={{
        clipPath: "polygon(2% 1%, 98% 0%, 100% 91%, 91% 100%, 1% 98%, 0% 8%)",
        transformOrigin: "50% 12%",
      } as CSSProperties}
    >
      {content}
    </motion.div>
  );
}
