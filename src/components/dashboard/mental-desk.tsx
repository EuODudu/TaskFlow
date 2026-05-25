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

const POST_IT_STYLE: Record<MentalNoteType, { paper: string; pin: string; tape: string; label: string }> = {
  priority: {
    paper: "from-yellow-100 via-amber-50 to-yellow-200",
    pin: "bg-sky-500",
    tape: "bg-sky-200/55",
    label: "Prioridade",
  },
  idea: {
    paper: "from-violet-100 via-fuchsia-50 to-purple-100",
    pin: "bg-violet-500",
    tape: "bg-violet-200/55",
    label: "Ideia",
  },
  quick: {
    paper: "from-lime-100 via-green-50 to-emerald-100",
    pin: "bg-emerald-500",
    tape: "bg-emerald-200/55",
    label: "Rápida",
  },
  urgent: {
    paper: "from-rose-100 via-red-50 to-orange-100",
    pin: "bg-red-500",
    tape: "bg-red-200/55",
    label: "Urgente",
  },
  brain_dump: {
    paper: "from-amber-100 via-yellow-50 to-orange-100",
    pin: "bg-amber-500",
    tape: "bg-amber-200/55",
    label: "Brain Dump",
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
  const [crumplingIds, setCrumplingIds] = useState<Set<string>>(new Set());

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
    const visible = notes.filter((note) => (!note.is_completed || note.is_pinned) && !note.archived_at);
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
    toast.success("Nota pregada no quadro!");
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
    setCrumplingIds((ids) => new Set(ids).add(note.id));
    setTimeout(async () => {
      await patchNote(note.id, {
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
      setCrumplingIds((ids) => {
        const next = new Set(ids);
        next.delete(note.id);
        return next;
      });
    }, 620);
  };

  const archiveNote = async (note: MentalNote) => {
    await patchNote(note.id, { archived_at: new Date().toISOString() });
    setExpandedNoteId(null);
    toast.success("Nota removida do quadro.");
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
    <Card className="overflow-hidden border-amber-200/40 bg-[#f4e2b8] p-0 shadow-sm dark:border-amber-900/30 dark:bg-[#17120b]">
      <div className="border-b border-amber-900/10 bg-amber-50/80 px-5 py-4 dark:border-amber-100/10 dark:bg-amber-950/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-amber-950 dark:text-amber-50">Mesa Mental</h2>
            <p className="mt-1 text-xs text-amber-900/65 dark:text-amber-100/55">
              Um quadro de avisos simples para pregar ideias rápidas e mover post-its.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-900/15 bg-white/65 px-3 py-1 text-xs font-semibold text-amber-950 shadow-sm dark:border-amber-100/10 dark:bg-white/10 dark:text-amber-50">
              {activeCount} nota(s)
            </span>
            <Button size="sm" variant="outline" className="gap-1.5 bg-white/70" onClick={openQuickComposer}>
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
                  ? "border-amber-900/30 bg-amber-900 text-amber-50 dark:bg-amber-100 dark:text-amber-950"
                  : "border-amber-900/15 bg-white/55 text-amber-950/65 hover:bg-white/85 dark:border-amber-100/10 dark:bg-white/8 dark:text-amber-50/65",
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
              <div key={index} className="h-36 animate-pulse rounded-xl bg-amber-900/10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyBoard onCreate={openQuickComposer} />
        ) : isMobile ? (
          <div className="grid gap-3">
            <AnimatePresence>
              {filtered.map((note, index) => (
                <PostItNote
                  key={note.id}
                  note={note}
                  index={index}
                  dragging={false}
                  crumpling={crumplingIds.has(note.id)}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <BulletinBoard boardRef={boardRef}>
            <AnimatePresence>
              {filtered.map((note, index) => (
                <PostItNote
                  key={note.id}
                  note={note}
                  index={index}
                  dragging
                  boardRef={boardRef}
                  crumpling={crumplingIds.has(note.id)}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                  onDragEnd={(x, y) => savePosition(note.id, x, y)}
                />
              ))}
            </AnimatePresence>
          </BulletinBoard>
        )}
      </div>
    </Card>
  );
}

function BulletinBoard({
  boardRef,
  children,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_18px_45px_rgba(120,53,15,0.16)]">
      <div className="rounded-[1.25rem] border-[10px] border-[#c99a55] bg-[#b98543] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),inset_0_0_60px_rgba(73,34,10,0.20)]">
        <div
          ref={boardRef}
          className="relative min-h-[430px] overflow-hidden rounded-xl border border-amber-950/10 shadow-inner"
          style={{
            backgroundColor: "#b98345",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,.16) 1px, transparent 0), radial-gradient(circle at 3px 4px, rgba(79,38,12,.16) 1px, transparent 0), linear-gradient(90deg, rgba(255,255,255,.05), transparent 45%, rgba(0,0,0,.04))",
            backgroundSize: "8px 8px, 11px 11px, 100% 100%",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,244,214,0.22),transparent_48%)]" />
          {children}
        </div>
      </div>
    </div>
  );
}

function EmptyBoard({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.6rem] bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 p-3">
      <div className="rounded-[1.25rem] border-[10px] border-[#c99a55] bg-[#b98543] p-8 text-center shadow-inner">
        <div className="mx-auto max-w-sm rounded-xl bg-yellow-100 p-5 text-amber-950 shadow-lg rotate-[-1deg]">
          <div className="mx-auto -mt-8 mb-2 size-5 rounded-full bg-red-500 shadow-md" />
          <p className="font-bold">Quadro vazio</p>
          <p className="mt-1 text-sm text-amber-900/70">Pregue sua primeira nota para começar.</p>
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
      className="mx-auto max-w-2xl rounded-xl border border-amber-900/15 bg-yellow-100 p-4 text-amber-950 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{mode === "brain_dump" ? "Brain Dump" : "Nova nota"}</p>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-amber-900/10">
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Título da nota"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-amber-900/15 bg-yellow-50"
        />
        <Textarea
          placeholder={mode === "brain_dump" ? "Escreva livremente..." : "Conteúdo"}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={mode === "brain_dump" ? 5 : 3}
          className="resize-none border-amber-900/15 bg-yellow-50"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={() => onCreate(type, title, content)}>
          Pregar no quadro
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
      className="overflow-hidden rounded-xl border border-amber-900/15 bg-yellow-50 p-4 text-amber-950 shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">Editar post-it</p>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-amber-900/10">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="border-amber-900/15 bg-white/60" />
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="resize-none border-amber-900/15 bg-white/60" />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOTE_TYPE_META) as MentalNoteType[]).map((type) => (
              <button
                key={type}
                onClick={() => setNoteType(type)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  noteType === type ? "border-amber-900/35 bg-amber-900 text-amber-50" : "border-amber-900/15 bg-white/50",
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
                  priority === item ? "border-amber-900/35 bg-amber-900 text-amber-50" : "border-amber-900/15 bg-white/50 text-amber-950/65",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[150px]">
          <Button size="sm" variant="outline" className="gap-1.5 bg-white/60" onClick={onTogglePin}>
            {note.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {note.is_pinned ? "Desfixar" : "Fixar"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 bg-white/60" onClick={onToggleComplete}>
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
          <Button size="sm" variant="ghost" className="gap-1.5 text-amber-950/60" onClick={onArchive}>
            <Trash2 className="size-3.5" />
            Remover
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PostItNote({
  note,
  index,
  dragging,
  boardRef,
  crumpling,
  onExpand,
  onTogglePin,
  onToggleComplete,
  onDragEnd,
}: {
  note: MentalNote;
  index: number;
  dragging: boolean;
  boardRef?: RefObject<HTMLDivElement | null>;
  crumpling: boolean;
  onExpand: () => void;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onDragEnd?: (x: number, y: number) => void;
}) {
  const style = POST_IT_STYLE[note.note_type];
  const forgotten = isForgottenNote(note);
  const rotation = note.rotation || noteRotation(note.id);
  const spawn = defaultSpawnPosition(index);
  const x = note.x > 0 || note.y > 0 ? note.x : spawn.x;
  const y = note.x > 0 || note.y > 0 ? note.y : spawn.y;
  const isUrgent = note.note_type === "urgent" || note.priority === "urgent";

  const content = (
    <>
      <div className={cn("absolute left-1/2 top-[-11px] size-5 -translate-x-1/2 rounded-full shadow-[0_3px_6px_rgba(0,0,0,0.28)]", style.pin)}>
        <span className="absolute left-1 top-1 size-1.5 rounded-full bg-white/50" />
      </div>
      <div className={cn("absolute left-5 right-5 top-2 h-5 rounded-sm opacity-70 rotate-[-2deg]", style.tape)} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "linear-gradient(rgba(120,53,15,.25) 1px, transparent 1px)",
          backgroundSize: "100% 22px",
        }}
      />
      <div className="relative pt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-base font-black leading-tight text-amber-950">{note.title}</p>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin();
              }}
              className="rounded-md p-1 text-amber-950/55 hover:bg-amber-900/10 hover:text-amber-950"
            >
              {note.is_pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleComplete();
              }}
              className="rounded-md p-1 text-amber-950/55 hover:bg-amber-900/10 hover:text-amber-950"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        </div>

        {note.content && (
          <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-amber-950/78">{note.content}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-amber-950/10 px-2 py-0.5 text-[10px] font-bold text-amber-950/60">
            {style.label}
          </span>
          {isUrgent && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-800">urgente</span>}
          {forgotten && <span className="rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold text-amber-800">rever</span>}
        </div>
      </div>
    </>
  );

  const baseClass = cn(
    "relative w-[172px] min-h-[148px] cursor-pointer rounded-[0.4rem] border border-amber-900/10 bg-gradient-to-br p-3 shadow-[0_12px_22px_rgba(67,36,11,0.22)]",
    "before:pointer-events-none before:absolute before:bottom-0 before:right-0 before:size-7 before:rounded-tl-md before:bg-amber-950/10 before:shadow-[-2px_-2px_4px_rgba(255,255,255,0.25)]",
    style.paper,
    forgotten && "ring-2 ring-amber-700/25",
    isUrgent && "shadow-[0_13px_26px_rgba(127,29,29,0.24)]",
  );

  const crumpleAnimation = crumpling
    ? {
        scale: [1, 0.86, 0.38],
        rotate: [rotation, rotation + 18, rotation + 140],
        x: dragging ? x + 260 : 80,
        y: dragging ? y + 220 : 120,
        opacity: [1, 0.8, 0],
        borderRadius: ["0.4rem", "1.1rem", "999px"],
        filter: ["brightness(1)", "brightness(.92)", "brightness(.75)"],
      }
    : undefined;

  if (!dragging) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.94, rotate: rotation }}
        animate={crumpleAnimation ?? { opacity: 1, scale: 1, rotate: rotation }}
        exit={{ opacity: 0, scale: 0.8, rotate: rotation + 20 }}
        transition={{ duration: crumpling ? 0.58 : 0.22, ease: "easeInOut" }}
        className={baseClass}
        onClick={onExpand}
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
      animate={crumpleAnimation ?? { opacity: 1, scale: 1, x, y, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.8, rotate: rotation + 20 }}
      transition={{ duration: crumpling ? 0.58 : 0.24, ease: "easeInOut" }}
      whileHover={{ y: -4, scale: 1.025, rotate: rotation * 0.7, zIndex: 20 }}
      whileDrag={{ scale: 1.04, rotate: 0, zIndex: 30, cursor: "grabbing" }}
      className={cn(baseClass, "absolute left-0 top-0 touch-none")}
      onClick={onExpand}
      onDragEnd={(_, info: PanInfo) => {
        const nextX = Math.max(0, Math.round(x + info.offset.x));
        const nextY = Math.max(0, Math.round(y + info.offset.y));
        onDragEnd?.(nextX, nextY);
      }}
      style={{ transformOrigin: "50% 12%" } as CSSProperties}
    >
      {content}
    </motion.div>
  );
}
