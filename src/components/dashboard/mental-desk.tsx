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
  Layers3,
  ListTodo,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  Stars,
  Trash2,
  X,
  Zap,
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
type DeskParticle = { id: number; x: number; y: number; color: string };

const PARTICLE_DOTS = [
  { left: "8%", top: "18%", delay: 0, size: "size-1" },
  { left: "24%", top: "72%", delay: 0.4, size: "size-1.5" },
  { left: "42%", top: "14%", delay: 0.8, size: "size-1" },
  { left: "68%", top: "28%", delay: 1.1, size: "size-1.5" },
  { left: "84%", top: "62%", delay: 1.5, size: "size-1" },
  { left: "58%", top: "82%", delay: 1.9, size: "size-1" },
];

const NOTE_PERSONALITY: Record<
  MentalNoteType,
  {
    frame: string;
    glow: string;
    clip: string;
    doodle: string;
    width: string;
    minHeight: string;
    motion: "calm" | "pulse" | "spark" | "float";
  }
> = {
  priority: {
    frame: "from-sky-200/95 via-blue-100/95 to-slate-100/95",
    glow: "shadow-[0_22px_60px_rgba(59,130,246,0.22)]",
    clip: "bg-gradient-to-br from-slate-300 to-slate-500",
    doodle: "linear-gradient(90deg, rgba(59,130,246,.22) 0 38%, transparent 38%)",
    width: "w-[178px]",
    minHeight: "min-h-[150px]",
    motion: "calm",
  },
  idea: {
    frame: "from-fuchsia-100/95 via-purple-100/95 to-indigo-100/95",
    glow: "shadow-[0_22px_70px_rgba(168,85,247,0.24)]",
    clip: "bg-gradient-to-br from-fuchsia-300 to-violet-500",
    doodle: "radial-gradient(circle, rgba(168,85,247,.2) 1px, transparent 1.5px)",
    width: "w-[190px]",
    minHeight: "min-h-[158px]",
    motion: "spark",
  },
  quick: {
    frame: "from-emerald-100/95 via-lime-50/95 to-white/95",
    glow: "shadow-[0_18px_52px_rgba(34,197,94,0.16)]",
    clip: "bg-gradient-to-br from-emerald-300 to-lime-500",
    doodle: "linear-gradient(135deg, rgba(34,197,94,.18) 0 20%, transparent 20%)",
    width: "w-[154px]",
    minHeight: "min-h-[122px]",
    motion: "calm",
  },
  urgent: {
    frame: "from-rose-100/95 via-red-100/95 to-orange-50/95",
    glow: "shadow-[0_0_34px_rgba(239,68,68,0.30),0_22px_70px_rgba(248,113,113,0.18)]",
    clip: "bg-gradient-to-br from-red-400 to-orange-500",
    doodle: "linear-gradient(90deg, rgba(239,68,68,.28), transparent 44%)",
    width: "w-[182px]",
    minHeight: "min-h-[152px]",
    motion: "pulse",
  },
  brain_dump: {
    frame: "from-amber-100/95 via-yellow-50/95 to-orange-100/95",
    glow: "shadow-[0_24px_72px_rgba(245,158,11,0.22)]",
    clip: "bg-gradient-to-br from-amber-300 to-orange-500",
    doodle: "repeating-linear-gradient(-18deg, rgba(245,158,11,.18) 0 1px, transparent 1px 12px)",
    width: "w-[214px]",
    minHeight: "min-h-[178px]",
    motion: "float",
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
  const [particles, setParticles] = useState<DeskParticle[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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
  const urgentCount = notes.filter((n) => !n.is_completed && (n.note_type === "urgent" || n.priority === "urgent")).length;
  const expandedNote = notes.find((n) => n.id === expandedNoteId) ?? null;

  const refresh = () => inv.mentalNotes(userId);

  const emitParticles = (x: number, y: number, color: string) => {
    const burst = Array.from({ length: 9 }).map((_, i) => ({
      id: ++particleId.current,
      x: x + (i % 3) * 8,
      y: y + Math.floor(i / 3) * 6,
      color,
    }));
    setParticles((p) => [...p, ...burst]);
    setTimeout(() => {
      setParticles((p) => p.filter((particle) => !burst.some((b) => b.id === particle.id)));
    }, 900);
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
      toast.success("Nota virou tarefa no Kanban!", {
        description: "Abra o quadro para continuar.",
      });
    }
  };

  return (
    <Card className="relative overflow-hidden border-white/10 bg-[#060814]/95 p-0 shadow-[0_24px_90px_rgba(15,23,42,0.38)]">
      <AmbientField />

      <div className="relative space-y-4 p-5">
        <section className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_28%,rgba(129,140,248,0.09)_60%,transparent_82%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 7, -4, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/15 shadow-[0_0_34px_rgba(99,102,241,0.25)]"
              >
                <Sparkles className="size-5 text-primary" />
              </motion.div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Setup mental ativo</p>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
                    Canvas orgânico
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Mesa Mental</h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">
                  Uma superfície viva para ideias, urgências e brain dumps. Arraste, fixe, expanda e transforme pensamentos em tarefas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
              <MetricPill icon={<Layers3 className="size-3.5" />} label="Ativas" value={activeCount} />
              <MetricPill icon={<Zap className="size-3.5" />} label="Urgentes" value={urgentCount} tone="danger" />
              <MetricPill icon={<Crosshair className="size-3.5" />} label="Zoom" value={`${Math.round(zoom * 100)}%`} />
            </div>
          </div>

          <div className="relative mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {MENTAL_NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className={cn(
                    "group rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-300",
                    filterType === t.value
                      ? "border-white/30 bg-white/18 text-white shadow-[0_0_24px_rgba(99,102,241,0.20)]"
                      : "border-white/10 bg-white/[0.06] text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white",
                  )}
                  style={{ boxShadow: filterType === t.value ? `0 0 22px ${t.accent}30` : undefined }}
                >
                  <span className="mr-1.5 transition-transform group-hover:scale-125">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 border-white/15 bg-white/8 text-white hover:bg-white/14" onClick={openQuickComposer}>
                <Plus className="size-3.5" />
                Nota rápida
              </Button>
              <Button size="sm" className="gap-1.5 bg-primary/90 shadow-[0_0_28px_rgba(99,102,241,0.35)]" onClick={openBrainDump}>
                <Brain className="size-3.5" />
                Brain Dump
              </Button>
            </div>
          </div>
        </section>

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
          <LoadingSurface />
        ) : filtered.length === 0 ? (
          <EmptySurface onCreate={openQuickComposer} />
        ) : isMobile ? (
          <div className="grid gap-3">
            <AnimatePresence>
              {filtered.map((note, i) => (
                <MentalNoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  draggable={false}
                  active={activeDragId === note.id}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <LivingCanvas
            canvasRef={canvasRef}
            zoom={zoom}
            setZoom={setZoom}
            particles={particles}
          >
            <AnimatePresence>
              {filtered.map((note, i) => (
                <MentalNoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  draggable
                  canvasRef={canvasRef}
                  zoom={zoom}
                  active={activeDragId === note.id}
                  onExpand={() => setExpandedNoteId(note.id)}
                  onTogglePin={() => togglePin(note)}
                  onToggleComplete={() => toggleComplete(note)}
                  onDragStart={() => setActiveDragId(note.id)}
                  onDragEnd={(x, y, info) => {
                    setActiveDragId(null);
                    savePosition(note.id, x, y);
                    emitParticles(info.point.x, info.point.y, NOTE_TYPE_META[note.note_type].accent);
                  }}
                />
              ))}
            </AnimatePresence>
          </LivingCanvas>
        )}
      </div>
    </Card>
  );
}

function MetricPill({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-2 text-left shadow-inner backdrop-blur",
        tone === "danger"
          ? "border-red-400/20 bg-red-500/10 text-red-100"
          : "border-white/10 bg-white/[0.07] text-white",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.28),transparent_32%),radial-gradient(circle_at_64%_82%,rgba(14,165,233,0.18),transparent_38%),linear-gradient(145deg,#050712,#0b1020_45%,#080914)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:18px_18px]" />
      <motion.div
        animate={{ x: [0, 28, -18, 0], y: [0, -18, 16, 0], opacity: [0.3, 0.48, 0.32] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-20 top-12 size-72 rounded-full bg-blue-500/20 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -24, 20, 0], y: [0, 20, -14, 0], opacity: [0.2, 0.42, 0.24] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-16 top-4 size-80 rounded-full bg-violet-500/20 blur-3xl"
      />
      {PARTICLE_DOTS.map((dot) => (
        <motion.span
          key={`${dot.left}-${dot.top}`}
          className={cn("absolute rounded-full bg-white/70 shadow-[0_0_16px_rgba(255,255,255,0.7)]", dot.size)}
          style={{ left: dot.left, top: dot.top }}
          animate={{ y: [0, -10, 0], opacity: [0.18, 0.65, 0.18], scale: [1, 1.8, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function LivingCanvas({
  canvasRef,
  zoom,
  setZoom,
  particles,
  children,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  setZoom: (zoom: number) => void;
  particles: DeskParticle[];
  children: React.ReactNode;
}) {
  return (
    <div
      ref={canvasRef}
      className="relative min-h-[590px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#080b16]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-40px_120px_rgba(99,102,241,0.08)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_76%_66%,rgba(168,85,247,0.14),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_22%,rgba(255,255,255,0.03)_72%,transparent)]" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      <div className="absolute bottom-8 left-10 right-10 h-px bg-gradient-to-r from-transparent via-violet-300/25 to-transparent" />
      <DeskDoodles />
      <CanvasTools zoom={zoom} setZoom={setZoom} />
      <ParticleBursts particles={particles} />
      <motion.div
        className="absolute inset-0 origin-top-left"
        animate={{ scale: zoom }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function CanvasTools({ zoom, setZoom }: { zoom: number; setZoom: (zoom: number) => void }) {
  return (
    <div className="absolute right-3 top-3 z-40 flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-white/70 backdrop-blur-md">
      <button
        className="rounded-full p-1.5 hover:bg-white/10"
        onClick={() => setZoom(Math.max(0.88, Number((zoom - 0.06).toFixed(2))))}
      >
        <Minimize2 className="size-3.5" />
      </button>
      <span className="min-w-10 text-center text-[10px] font-bold">{Math.round(zoom * 100)}%</span>
      <button
        className="rounded-full p-1.5 hover:bg-white/10"
        onClick={() => setZoom(Math.min(1.12, Number((zoom + 0.06).toFixed(2))))}
      >
        <Maximize2 className="size-3.5" />
      </button>
    </div>
  );
}

function DeskDoodles() {
  return (
    <>
      <div className="absolute left-8 top-28 h-16 w-28 rounded-[50%] border border-dashed border-cyan-300/16 rotate-[-16deg]" />
      <div className="absolute right-24 top-32 h-12 w-24 rounded-full border border-violet-300/15 rotate-12" />
      <div className="absolute bottom-20 left-1/2 h-20 w-32 -translate-x-1/2 rounded-[55%] border border-dashed border-white/10 rotate-6" />
      <div className="absolute left-12 bottom-16 text-white/10">✦</div>
      <div className="absolute right-32 bottom-24 text-white/10">✧</div>
      <div className="absolute left-[42%] top-20 text-cyan-200/15">⌁</div>
    </>
  );
}

function ParticleBursts({ particles }: { particles: DeskParticle[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <AnimatePresence>
        {particles.map((p, index) => (
          <motion.span
            key={p.id}
            className="absolute size-1.5 rounded-full"
            style={{ left: p.x, top: p.y, backgroundColor: p.color, boxShadow: `0 0 18px ${p.color}` }}
            initial={{ opacity: 0.9, scale: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 0,
              x: Math.cos(index * 1.7) * 58,
              y: Math.sin(index * 1.9) * 48 - 28,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function LoadingSurface() {
  return (
    <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/10" />
      ))}
    </div>
  );
}

function EmptySurface({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-white/14 bg-white/[0.045] px-6 py-16 text-center shadow-inner">
      <AmbientField />
      <div className="relative">
        <Stars className="mx-auto size-9 text-primary" />
        <p className="mt-3 text-sm font-semibold text-white">Sua mesa está livre</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-white/55">
          Crie a primeira ideia e a mesa ganha vida com glows, posições orgânicas e movimentos suaves.
        </p>
        <Button size="sm" className="mt-4 gap-1.5" onClick={onCreate}>
          <Plus className="size-3.5" />
          Criar primeira nota
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
      className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0b1020]/88 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(99,102,241,0.22),transparent_42%),linear-gradient(120deg,rgba(255,255,255,0.10),transparent_40%)]" />
      <div className="relative mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {mode === "brain_dump" ? "🧠 Brain Dump livre" : "⚡ Nota rápida"}
        </p>
        <button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
      <div className="relative space-y-2">
        <Input
          placeholder="Título curto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-white/10 bg-white/8 text-white placeholder:text-white/35"
        />
        <Textarea
          placeholder={mode === "brain_dump" ? "Despeje tudo aqui sem filtro..." : "O que precisa lembrar?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={mode === "brain_dump" ? 5 : 3}
          className="resize-none border-white/10 bg-white/8 text-white placeholder:text-white/35"
        />
      </div>
      <div className="relative mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={onClose}>
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
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      className="relative overflow-hidden rounded-3xl border bg-[#090d1b]/92 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      style={{ borderColor: `${meta.accent}45` }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 18% 0%, ${meta.accent}25, transparent 38%)` }} />
      <div className="relative mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {meta.emoji} Ajustando pensamento
        </p>
        <button onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
      <div className="relative grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-white/10 bg-white/8 text-white" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="resize-none border-white/10 bg-white/8 text-white" />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOTE_TYPE_META) as MentalNoteType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNoteType(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  noteType === t ? "border-white/25 bg-white/14 text-white" : "border-white/10 text-white/55 hover:text-white",
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
                  "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase transition-all",
                  priority === p ? "border-primary bg-primary/18 text-white" : "border-white/10 text-white/45 hover:text-white",
                )}
              >
                {p}
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
          <Button size="sm" variant="ghost" className="gap-1.5 text-white/45 hover:text-white" onClick={onArchive}>
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
  zoom = 1,
  active,
  onExpand,
  onTogglePin,
  onToggleComplete,
  onDragStart,
  onDragEnd,
}: {
  note: MentalNote;
  index: number;
  draggable: boolean;
  canvasRef?: RefObject<HTMLDivElement | null>;
  zoom?: number;
  active: boolean;
  onExpand: () => void;
  onTogglePin: () => void;
  onToggleComplete: () => void;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number, info: PanInfo) => void;
}) {
  const meta = NOTE_TYPE_META[note.note_type];
  const personality = NOTE_PERSONALITY[note.note_type];
  const forgotten = isForgottenNote(note);
  const urgent = note.note_type === "urgent" || note.priority === "urgent";
  const rotation = note.rotation || noteRotation(note.id);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 180, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 18 });
  const rotateY = useTransform(springX, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const cardContent = (
    <>
      <div
        className="absolute inset-0 opacity-40 mix-blend-multiply"
        style={{ backgroundImage: personality.doodle, backgroundSize: note.note_type === "idea" ? "14px 14px" : undefined }}
      />
      <div className="absolute inset-x-4 top-2 h-px bg-white/40" />
      <div className={cn("absolute left-1/2 top-[-7px] h-4 w-10 -translate-x-1/2 rounded-full shadow-md", personality.clip)} />
      {note.note_type === "brain_dump" && <BrainDumpMarks />}
      {active && <DragOrbit accent={meta.accent} />}

      <div className="relative flex items-start justify-between gap-2">
        <span className="rounded-xl bg-white/50 px-2 py-1 text-lg leading-none shadow-inner">{meta.emoji}</span>
        <div className="flex gap-0.5 rounded-full bg-white/35 p-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="rounded-full p-1 text-slate-800/70 hover:bg-white/50 hover:text-slate-950"
          >
            {note.is_pinned ? <Pin className="size-3 text-primary" /> : <PinOff className="size-3" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className="rounded-full p-1 text-slate-800/70 hover:bg-white/50 hover:text-slate-950"
          >
            <Check className={cn("size-3", note.is_completed && "text-emerald-700")} />
          </button>
        </div>
      </div>
      <p className="relative mt-3 line-clamp-2 text-sm font-black leading-snug text-slate-950/90">{note.title}</p>
      {note.content && (
        <p className="relative mt-1 line-clamp-4 text-xs leading-relaxed text-slate-800/70">{note.content}</p>
      )}
      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-white/45 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-800/70">
          {meta.label}
        </span>
        {forgotten && (
          <span className="rounded-full bg-amber-500/18 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-900">
            esqueci?
          </span>
        )}
        {note.converted_task_id && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-primary">
            tarefa
          </span>
        )}
      </div>
    </>
  );

  const className = cn(
    "group cursor-pointer overflow-visible rounded-[1.35rem] border p-3 text-left shadow-xl",
    "transition-[filter] duration-300",
    personality.width,
    personality.minHeight,
    personality.glow,
    forgotten && "ring-2 ring-amber-300/60",
    note.is_completed && "opacity-50 saturate-50",
  );

  const cardStyle = {
    background: `linear-gradient(145deg, var(--tw-gradient-stops))`,
    borderColor: `${meta.accent}42`,
    transformStyle: "preserve-3d",
    boxShadow: urgent
      ? `0 0 32px ${meta.accent}55, 0 28px 84px rgba(0,0,0,.22)`
      : undefined,
  } as CSSProperties;

  const motionProps = personality.motion === "pulse"
    ? { scale: [1, 1.018, 1], filter: ["brightness(1)", "brightness(1.06)", "brightness(1)"] }
    : personality.motion === "float"
      ? { y: [0, -4, 0] }
      : personality.motion === "spark"
        ? { boxShadow: [`0 20px 70px ${meta.accent}20`, `0 24px 82px ${meta.accent}35`, `0 20px 70px ${meta.accent}20`] }
        : {};

  if (!draggable) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation, ...motionProps }}
        exit={{ opacity: 0, scale: 0.85, rotate: rotation + 8, transition: { duration: 0.25 } }}
        transition={{ duration: 4, repeat: personality.motion === "calm" ? 0 : Infinity, ease: "easeInOut" }}
        className={cn(className, personality.frame)}
        style={{ ...cardStyle, rotateX, rotateY }}
        onClick={onExpand}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileHover={{ y: -6, scale: 1.025 }}
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
      dragMomentum
      dragTransition={{ bounceStiffness: 260, bounceDamping: 22, power: 0.18, timeConstant: 220 }}
      dragElastic={0.12}
      dragConstraints={canvasRef}
      initial={{ opacity: 0, scale: 0.88, rotate: rotation + 6 }}
      animate={{ opacity: 1, scale: 1, x: posX, y: posY, rotate: rotation, ...motionProps }}
      exit={{ opacity: 0, scale: 0.78, rotate: rotation + 10, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      whileHover={{ scale: 1.045, zIndex: 20, rotate: rotation * 0.45 }}
      whileDrag={{ scale: 1.1, zIndex: 50, rotate: 0, filter: "brightness(1.06)" }}
      className={cn(className, personality.frame, "absolute left-0 top-0 touch-none")}
      style={{ ...cardStyle, rotateX, rotateY }}
      onClick={onExpand}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragEnd={(_, info) => {
        const nx = Math.max(0, Math.round((posX + info.offset.x) / zoom));
        const ny = Math.max(0, Math.round((posY + info.offset.y) / zoom));
        onDragEnd?.(nx, ny, info);
      }}
    >
      {cardContent}
    </motion.div>
  );
}

function BrainDumpMarks() {
  return (
    <>
      <div className="absolute bottom-5 left-4 h-8 w-20 rounded-[50%] border border-orange-500/20 rotate-[-10deg]" />
      <div className="absolute bottom-4 right-4 h-px w-12 rotate-[-18deg] bg-orange-700/20" />
      <div className="absolute right-9 top-16 text-orange-700/20">⌁</div>
    </>
  );
}

function DragOrbit({ accent }: { accent: string }) {
  return (
    <div className="pointer-events-none absolute inset-[-14px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute size-1.5 rounded-full"
          style={{
            backgroundColor: accent,
            boxShadow: `0 0 14px ${accent}`,
            left: `${50 + Math.cos(i) * 42}%`,
            top: `${50 + Math.sin(i) * 42}%`,
          }}
          animate={{ scale: [0.6, 1.35, 0.6], opacity: [0.25, 0.85, 0.25] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}
