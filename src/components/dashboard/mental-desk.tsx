import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  Brain,
  Check,
  Crosshair,
  ListTodo,
  Maximize2,
  Minimize2,
  Move,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
type Particle = { id: number; x: number; y: number; color: string };

const NOTE_STYLE: Record<
  MentalNoteType,
  {
    label: string;
    accent: string;
    bg: string;
    border: string;
    glow: string;
    width: string;
    minHeight: string;
    pin: string;
  }
> = {
  priority: {
    label: "Prioridade",
    accent: "#38bdf8",
    bg: "from-sky-300/18 via-slate-950/88 to-blue-500/14",
    border: "border-sky-300/35",
    glow: "shadow-[0_20px_70px_rgba(56,189,248,0.22)]",
    width: "w-[184px]",
    minHeight: "min-h-[150px]",
    pin: "from-zinc-200 to-slate-500",
  },
  idea: {
    label: "Ideia",
    accent: "#a78bfa",
    bg: "from-violet-300/18 via-slate-950/88 to-fuchsia-500/14",
    border: "border-violet-300/35",
    glow: "shadow-[0_20px_72px_rgba(167,139,250,0.22)]",
    width: "w-[190px]",
    minHeight: "min-h-[154px]",
    pin: "from-violet-200 to-violet-600",
  },
  quick: {
    label: "Rápida",
    accent: "#34d399",
    bg: "from-emerald-300/14 via-slate-950/88 to-cyan-500/10",
    border: "border-emerald-300/28",
    glow: "shadow-[0_18px_56px_rgba(52,211,153,0.16)]",
    width: "w-[158px]",
    minHeight: "min-h-[126px]",
    pin: "from-emerald-200 to-emerald-600",
  },
  urgent: {
    label: "Urgente",
    accent: "#fb7185",
    bg: "from-rose-400/20 via-slate-950/88 to-orange-500/14",
    border: "border-rose-300/40",
    glow: "shadow-[0_0_34px_rgba(251,113,133,0.26),0_20px_72px_rgba(244,63,94,0.16)]",
    width: "w-[186px]",
    minHeight: "min-h-[152px]",
    pin: "from-red-200 to-rose-600",
  },
  brain_dump: {
    label: "Brain Dump",
    accent: "#f59e0b",
    bg: "from-amber-300/18 via-slate-950/88 to-purple-500/12",
    border: "border-amber-300/35",
    glow: "shadow-[0_22px_76px_rgba(245,158,11,0.18)]",
    width: "w-[218px]",
    minHeight: "min-h-[176px]",
    pin: "from-amber-200 to-orange-600",
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const particleId = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [foldingIds, setFoldingIds] = useState<Set<string>>(new Set());

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
  const urgentCount = notes.filter((note) => !note.is_completed && (note.note_type === "urgent" || note.priority === "urgent")).length;
  const expandedNote = notes.find((note) => note.id === expandedNoteId) ?? null;

  const refresh = () => inv.mentalNotes(userId);

  const emitParticles = (x: number, y: number, color: string) => {
    const burst = Array.from({ length: 7 }).map((_, index) => ({
      id: ++particleId.current,
      x: x + Math.cos(index) * 8,
      y: y + Math.sin(index) * 8,
      color,
    }));
    setParticles((current) => [...current, ...burst]);
    setTimeout(() => {
      setParticles((current) => current.filter((particle) => !burst.some((p) => p.id === particle.id)));
    }, 850);
  };

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
    toast.success("Nota adicionada ao canvas.");
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
    setFoldingIds((ids) => new Set(ids).add(note.id));
    setTimeout(async () => {
      await patchNote(note.id, {
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
      setFoldingIds((ids) => {
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
  }, 340);

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
    <Card className="relative overflow-hidden border-white/10 bg-[#050812] p-0 shadow-[0_28px_100px_rgba(2,6,23,0.42)]">
      <DigitalAmbient />

      <div className="relative space-y-4 p-5">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/65">Canvas vivo de produtividade</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Mesa Mental</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">
                Um workspace digital para ideias soltas, urgências e pensamentos que ainda não viraram tarefa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <HudPill label="Ativas" value={activeCount} />
              <HudPill label="Urgentes" value={urgentCount} tone="danger" />
              <Button size="sm" variant="outline" className="gap-1.5 border-white/12 bg-white/8 text-white hover:bg-white/14" onClick={openQuickComposer}>
                <Plus className="size-3.5" />
                Nota
              </Button>
              <Button size="sm" className="gap-1.5 bg-cyan-500/90 text-slate-950 hover:bg-cyan-400" onClick={openBrainDump}>
                <Brain className="size-3.5" />
                Brain Dump
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {MENTAL_NOTE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
                  filterType === type.value
                    ? "border-white/25 bg-white/18 text-white shadow-[0_0_22px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.055] text-white/55 hover:border-white/20 hover:bg-white/10 hover:text-white",
                )}
                style={{ boxShadow: filterType === type.value ? `0 0 20px ${type.accent}28` : undefined }}
              >
                <span className="mr-1.5">{type.emoji}</span>
                {type.label}
              </button>
            ))}
          </div>
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
          <LoadingCanvas />
        ) : filtered.length === 0 ? (
          <EmptyCanvas onCreate={openQuickComposer} />
        ) : isMobile ? (
          <div className="grid gap-3">
            <AnimatePresence>
              {filtered.map((note, index) => (
                <GlassNote
                  key={note.id}
                  note={note}
                  index={index}
                  draggable={false}
                  folding={foldingIds.has(note.id)}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <DigitalCanvas
            canvasRef={canvasRef}
            pan={pan}
            zoom={zoom}
            setPan={setPan}
            setZoom={setZoom}
            particles={particles}
          >
            <AnimatePresence>
              {filtered.map((note, index) => (
                <GlassNote
                  key={note.id}
                  note={note}
                  index={index}
                  draggable
                  canvasRef={canvasRef}
                  pan={pan}
                  zoom={zoom}
                  folding={foldingIds.has(note.id)}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                  onDragEnd={(x, y, info) => {
                    savePosition(note.id, x, y);
                    emitParticles(info.point.x, info.point.y, NOTE_STYLE[note.note_type].accent);
                  }}
                />
              ))}
            </AnimatePresence>
          </DigitalCanvas>
        )}
      </div>
    </Card>
  );
}

function HudPill({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <div className={cn(
      "rounded-2xl border px-3 py-2 text-right backdrop-blur",
      tone === "danger" ? "border-rose-400/20 bg-rose-500/10 text-rose-100" : "border-white/10 bg-white/[0.07] text-white",
    )}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function DigitalAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(14,165,233,0.24),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_58%_90%,rgba(6,182,212,0.12),transparent_38%),linear-gradient(145deg,#050812,#0a1022_50%,#090712)]" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:20px_20px]" />
      <motion.div
        className="absolute -left-24 top-10 size-72 rounded-full bg-cyan-400/16 blur-3xl"
        animate={{ x: [0, 28, -18, 0], y: [0, -14, 18, 0], opacity: [0.22, 0.38, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 top-4 size-80 rounded-full bg-violet-500/16 blur-3xl"
        animate={{ x: [0, -24, 14, 0], y: [0, 16, -12, 0], opacity: [0.18, 0.34, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function DigitalCanvas({
  canvasRef,
  pan,
  zoom,
  setPan,
  setZoom,
  particles,
  children,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  pan: { x: number; y: number };
  zoom: number;
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  particles: Particle[];
  children: React.ReactNode;
}) {
  return (
    <div
      ref={canvasRef}
      className="relative min-h-[570px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#060b18]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-50px_140px_rgba(14,165,233,0.07)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_78%_68%,rgba(168,85,247,0.14),transparent_36%)]" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
      <div className="absolute inset-y-8 left-8 w-px bg-gradient-to-b from-transparent via-violet-200/20 to-transparent" />

      <motion.div
        drag
        dragMomentum={false}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onDragEnd={(_, info) => setPan({ x: pan.x + info.offset.x, y: pan.y + info.offset.y })}
      />

      <div className="absolute right-3 top-3 z-40 flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1 text-white/70 backdrop-blur-md">
        <button
          className="rounded-full p-1.5 hover:bg-white/10"
          onClick={() => setZoom(Math.max(0.86, Number((zoom - 0.06).toFixed(2))))}
        >
          <Minimize2 className="size-3.5" />
        </button>
        <span className="min-w-10 text-center text-[10px] font-bold">{Math.round(zoom * 100)}%</span>
        <button
          className="rounded-full p-1.5 hover:bg-white/10"
          onClick={() => setZoom(Math.min(1.14, Number((zoom + 0.06).toFixed(2))))}
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-semibold text-white/45 backdrop-blur">
        <Move className="size-3" />
        arraste o fundo para mover o canvas
      </div>

      <ParticleBursts particles={particles} />
      <motion.div
        className="absolute inset-0 origin-top-left"
        animate={{ x: pan.x, y: pan.y, scale: zoom }}
        transition={{ type: "spring", stiffness: 150, damping: 24 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ParticleBursts({ particles }: { particles: Particle[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <AnimatePresence>
        {particles.map((particle, index) => (
          <motion.span
            key={particle.id}
            className="absolute size-1.5 rounded-full"
            style={{ left: particle.x, top: particle.y, backgroundColor: particle.color, boxShadow: `0 0 18px ${particle.color}` }}
            initial={{ opacity: 0.9, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 0, x: Math.cos(index * 1.5) * 54, y: Math.sin(index * 1.7) * 44 - 24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function LoadingCanvas() {
  return (
    <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-2xl bg-white/10" />
      ))}
    </div>
  );
}

function EmptyCanvas({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-white/14 bg-white/[0.045] px-6 py-16 text-center shadow-inner">
      <DigitalAmbient />
      <div className="relative">
        <Crosshair className="mx-auto size-9 text-cyan-300" />
        <p className="mt-3 text-sm font-semibold text-white">Canvas livre</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-white/55">
          Solte sua primeira nota e comece a organizar ideias em um espaço digital vivo.
        </p>
        <Button size="sm" className="mt-4 gap-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={onCreate}>
          <Plus className="size-3.5" />
          Criar nota
        </Button>
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
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0b1020]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(34,211,238,0.16),transparent_42%),linear-gradient(120deg,rgba(255,255,255,0.10),transparent_40%)]" />
      <div className="relative mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{mode === "brain_dump" ? "Brain Dump livre" : "Nova nota"}</p>
        <button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
      <div className="relative space-y-2">
        <Input
          placeholder="Título curto"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-white/10 bg-white/8 text-white placeholder:text-white/35"
        />
        <Textarea
          placeholder={mode === "brain_dump" ? "Despeje tudo aqui sem filtro..." : "O que precisa lembrar?"}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={mode === "brain_dump" ? 5 : 3}
          className="resize-none border-white/10 bg-white/8 text-white placeholder:text-white/35"
        />
      </div>
      <div className="relative mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => onCreate(type, title, content)}>
          Adicionar ao canvas
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

  const meta = NOTE_TYPE_META[noteType];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      className="relative overflow-hidden rounded-3xl border bg-[#090d1b]/92 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      style={{ borderColor: `${meta.accent}45` }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 18% 0%, ${meta.accent}20, transparent 38%)` }} />
      <div className="relative mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{meta.emoji} Editando nota</p>
        <button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
      <div className="relative grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="border-white/10 bg-white/8 text-white" />
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="resize-none border-white/10 bg-white/8 text-white" />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOTE_TYPE_META) as MentalNoteType[]).map((type) => (
              <button
                key={type}
                onClick={() => setNoteType(type)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  noteType === type ? "border-white/25 bg-white/14 text-white" : "border-white/10 text-white/55 hover:text-white",
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
                  "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase transition-all",
                  priority === item ? "border-cyan-300/40 bg-cyan-300/15 text-white" : "border-white/10 text-white/45 hover:text-white",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:min-w-[164px]">
          <Button size="sm" variant="outline" className="gap-1.5 border-white/12 bg-white/8 text-white hover:bg-white/14" onClick={onTogglePin}>
            {note.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {note.is_pinned ? "Desfixar" : "Fixar"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-white/12 bg-white/8 text-white hover:bg-white/14" onClick={onToggleComplete}>
            <Check className="size-3.5" />
            Concluir
          </Button>
          {!note.converted_task_id && (
            <Button size="sm" className="gap-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={onConvert}>
              <ListTodo className="size-3.5" />
              Virar tarefa
            </Button>
          )}
          {note.converted_task_id && (
            <Button size="sm" variant="secondary" asChild>
              <Link to="/board">Ver no Kanban</Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="gap-1.5 text-white/45 hover:text-white" onClick={onArchive}>
            <Trash2 className="size-3.5" />
            Remover
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function GlassNote({
  note,
  index,
  draggable,
  canvasRef,
  pan = { x: 0, y: 0 },
  zoom = 1,
  folding,
  onExpand,
  onTogglePin,
  onToggleComplete,
  onDragEnd,
}: {
  note: MentalNote;
  index: number;
  draggable: boolean;
  canvasRef?: RefObject<HTMLDivElement | null>;
  pan?: { x: number; y: number };
  zoom?: number;
  folding: boolean;
  onExpand: () => void;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onDragEnd?: (x: number, y: number, info: PanInfo) => void;
}) {
  const meta = NOTE_STYLE[note.note_type];
  const forgotten = isForgottenNote(note);
  const urgent = note.note_type === "urgent" || note.priority === "urgent";
  const rotation = note.rotation || noteRotation(note.id);
  const spawn = defaultSpawnPosition(index);
  const x = note.x > 0 || note.y > 0 ? note.x : spawn.x;
  const y = note.x > 0 || note.y > 0 ? note.y : spawn.y;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 180, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 18 });
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const foldAnimation = folding
    ? {
        opacity: [1, 0.85, 0],
        scale: [1, 0.75, 0.2],
        rotate: [rotation, rotation + 28, rotation + 150],
        borderRadius: ["1.25rem", "1.4rem", "999px"],
        filter: ["brightness(1)", "brightness(.9)", "brightness(.55)"],
      }
    : undefined;

  const content = (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-[linear-gradient(130deg,rgba(255,255,255,0.22),transparent_34%,rgba(255,255,255,0.08)_72%,transparent)]" />
      <div className="pointer-events-none absolute inset-x-4 top-2 h-px bg-white/35" />
      <div
        className={cn("absolute left-1/2 top-[-8px] h-4 w-9 -translate-x-1/2 rounded-full bg-gradient-to-br shadow-md", meta.pin)}
      >
        <span className="absolute left-2 top-1 size-1 rounded-full bg-white/70" />
      </div>
      {note.note_type === "brain_dump" && (
        <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-16 rotate-[-12deg] rounded-[50%] border border-amber-300/20" />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: meta.accent }}>
            {NOTE_TYPE_META[note.note_type].emoji} {meta.label}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white">{note.title}</p>
        </div>
        <div className="flex gap-0.5 rounded-full bg-white/8 p-0.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin();
            }}
            className="rounded-full p-1 text-white/55 hover:bg-white/12 hover:text-white"
          >
            {note.is_pinned ? <Pin className="size-3 text-cyan-300" /> : <PinOff className="size-3" />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleComplete();
            }}
            className="rounded-full p-1 text-white/55 hover:bg-white/12 hover:text-white"
          >
            <Check className="size-3" />
          </button>
        </div>
      </div>

      {note.content && (
        <p className="relative mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-white/62">{note.content}</p>
      )}

      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        {urgent && <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[9px] font-black uppercase text-rose-200">urgente</span>}
        {forgotten && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-200">rever</span>}
        {note.converted_task_id && <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[9px] font-black uppercase text-cyan-200">tarefa</span>}
      </div>
    </>
  );

  const className = cn(
    "relative cursor-pointer overflow-visible rounded-[1.25rem] border bg-gradient-to-br p-3 backdrop-blur-xl",
    meta.width,
    meta.minHeight,
    meta.border,
    meta.bg,
    meta.glow,
    forgotten && "ring-2 ring-amber-300/30",
    urgent && "animate-pulse",
  );

  const style = {
    borderColor: `${meta.accent}55`,
    boxShadow: urgent ? `0 0 30px ${meta.accent}45, 0 24px 82px rgba(0,0,0,.30)` : undefined,
    transformStyle: "preserve-3d",
  } as CSSProperties;

  if (!draggable) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92, rotate: rotation }}
        animate={foldAnimation ?? { opacity: 1, scale: 1, rotate: rotation }}
        exit={{ opacity: 0, scale: 0.8, rotate: rotation + 18 }}
        transition={{ duration: folding ? 0.58 : 0.25, ease: "easeInOut" }}
        className={className}
        style={{ ...style, rotateX, rotateY }}
        onClick={onExpand}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileHover={{ y: -5, scale: 1.02 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum
      dragTransition={{ bounceStiffness: 240, bounceDamping: 22, power: 0.16, timeConstant: 220 }}
      dragElastic={0.1}
      dragConstraints={canvasRef}
      initial={{ opacity: 0, scale: 0.9, rotate: rotation + 5 }}
      animate={foldAnimation ?? { opacity: 1, scale: 1, x, y, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.78, rotate: rotation + 18 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      whileHover={{ scale: 1.04, zIndex: 30, rotate: rotation * 0.45 }}
      whileDrag={{ scale: 1.08, zIndex: 60, rotate: 0, filter: "brightness(1.08)" }}
      className={cn(className, "absolute left-0 top-0 touch-none")}
      style={{ ...style, rotateX, rotateY }}
      onClick={onExpand}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onPointerDown={(event) => event.stopPropagation()}
      onDragEnd={(_, info) => {
        const nextX = Math.max(0, Math.round(x + info.offset.x / zoom));
        const nextY = Math.max(0, Math.round(y + info.offset.y / zoom));
        onDragEnd?.(nextX, nextY, info);
      }}
    >
      {content}
    </motion.div>
  );
}
