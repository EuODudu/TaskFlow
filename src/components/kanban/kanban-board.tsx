import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { useTasks, useColumns, useEvents, useInvalidate, checkAndAwardBadges, qk, type CalendarEvent, type Task, type BoardColumn } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { XP_REWARDS } from "@/lib/gamification";
import { useUI } from "@/lib/stores";
import { TaskCard, TaskCardDragPreview } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function getEstimatedTaskReward(task: Task) {
  const priorityReward = {
    low: { xp: 35, coins: 7 },
    medium: { xp: 50, coins: 10 },
    high: { xp: 70, coins: 14 },
    urgent: { xp: 90, coins: 18 },
  }[task.priority] ?? { xp: 50, coins: 10 };

  const estimated = task.estimated_minutes ?? 0;
  const estimateBonus =
    estimated >= 120 ? { xp: 35, coins: 8 } :
    estimated >= 60 ? { xp: 20, coins: 5 } :
    estimated >= 30 ? { xp: 10, coins: 2 } :
    { xp: 0, coins: 0 };
  const earlyBonus = task.due_date && new Date(task.due_date) > new Date()
    ? { xp: XP_REWARDS.TASK_EARLY, coins: 5 }
    : { xp: 0, coins: 0 };

  return {
    xp: priorityReward.xp + estimateBonus.xp + earlyBonus.xp,
    coins: priorityReward.coins + estimateBonus.coins + earlyBonus.coins,
  };
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { data: columns = [] } = useColumns(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: events = [] } = useEvents();
  const inv = useInvalidate();
  const qc = useQueryClient();
  const searchQuery = useUI((s) => s.searchQuery);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  const dragOverKey = useRef<string | null>(null);
  const dragSnapshot = useRef<Task[] | null>(null);

  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;

    const intersection = rectIntersection(args);
    if (intersection.length > 0) return intersection;

    return closestCorners(args);
  };

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    columns.forEach((c) => map.set(c.id, []));
    const filtered = searchQuery
      ? tasks.filter((t) =>
          (t.title + " " + (t.description ?? "")).toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : tasks;
    filtered.forEach((t) => {
      if (t.column_id && map.has(t.column_id)) map.get(t.column_id)!.push(t);
    });
    map.forEach((list) => list.sort((a, b) => a.position - b.position));
    return map;
  }, [columns, tasks, searchQuery]);

  const { data: checklistCounts = {} } = useQuery({
    queryKey: ["checklist-counts", projectId, tasks.map((t) => t.id).join(",")],
    enabled: tasks.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("checklist_items")
        .select("task_id, done")
        .in("task_id", tasks.map((t) => t.id));
      const counts: Record<string, { done: number; total: number }> = {};
      (data ?? []).forEach((row) => {
        const c = (counts[row.task_id] ||= { done: 0, total: 0 });
        c.total++;
        if (row.done) c.done++;
      });
      return counts;
    },
  });

  const scheduleByTaskId = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const event of events) {
      if (event.type === "task" && event.task_id) map.set(event.task_id, event);
    }
    return map;
  }, [events]);

  const onDragStart = (e: DragStartEvent) => {
    dragOverKey.current = null;
    dragSnapshot.current = [...(qc.getQueryData<Task[]>(qk.tasks(projectId)) ?? tasks)];
    const t = e.active.data.current?.task as Task | undefined;
    if (t) setActiveTask(t);
  };

  const onDragCancel = () => {
    dragOverKey.current = null;
    const snapshot = dragSnapshot.current;
    dragSnapshot.current = null;
    setActiveTask(null);
    if (snapshot) qc.setQueryData(qk.tasks(projectId), snapshot);
    inv.tasks(projectId);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const draggedTask = active.data.current?.task as Task | undefined;
    if (!draggedTask) return;

    const overKey = `${active.id}:${over.id}`;
    if (dragOverKey.current === overKey) return;
    dragOverKey.current = overKey;

    const liveTasks = qc.getQueryData<Task[]>(qk.tasks(projectId)) ?? tasks;
    const liveMap = groupTasksByColumn(columns, liveTasks);
    const moving = liveTasks.find((t) => t.id === draggedTask.id);
    if (!moving?.column_id) return;

    const activeColumnId = moving.column_id;
    const overColumnId = resolveColumnId(over.id, over.data.current as DndPayload | undefined, columns, liveMap);
    if (!overColumnId || activeColumnId === overColumnId) return;

    const overList = liveMap.get(overColumnId) ?? [];
    let insertIndex = overList.length;
    if (over.data.current?.type === "task") {
      const overTask = over.data.current.task as Task;
      const idx = overList.findIndex((t) => t.id === overTask.id);
      if (idx >= 0) insertIndex = idx;
    }

    qc.setQueryData<Task[]>(qk.tasks(projectId), (old = []) => {
      const next = old.map((t) => ({ ...t }));
      const moving = next.find((t) => t.id === draggedTask.id);
      if (!moving) return old;

      const sourceTasks = next
        .filter((t) => t.column_id === activeColumnId && t.id !== moving.id)
        .sort((a, b) => a.position - b.position);
      sourceTasks.forEach((t, i) => {
        t.position = i;
      });

      const targetTasks = next
        .filter((t) => t.column_id === overColumnId && t.id !== moving.id)
        .sort((a, b) => a.position - b.position);
      moving.column_id = overColumnId;
      targetTasks.splice(insertIndex, 0, moving);
      targetTasks.forEach((t, i) => {
        t.position = i;
      });

      return next;
    });
  };

  const handleTaskCompleted = async (task: Task) => {
    if (!user) return;
    const reward = getEstimatedTaskReward(task);
    toast.success(`+${reward.xp} XP • +${reward.coins} moedas ✨`, {
      description: task.due_date && new Date(task.due_date) > new Date()
        ? "Tarefa concluída com bônus de entrega antecipada!"
        : "Tarefa concluída!",
      duration: 3000,
    });
    const newBadges = await checkAndAwardBadges(user.id);
    newBadges.forEach((b) =>
      toast.success(`${b.icon} Conquista desbloqueada!`, { description: b.name, duration: 5000 }),
    );
    if (newBadges.length > 0) inv.userBadges(user.id);
    inv.profile();
  };

  const completeTask = async (task: Task) => {
    if (task.status === "done") return;
    const doneColumn = columns.find((c) => c.default_status === "done");
    const doneTasks = doneColumn ? tasksByColumn.get(doneColumn.id) ?? [] : [];
    const { error } = await supabase
      .from("tasks")
      .update({
        status: "done",
        column_id: doneColumn?.id ?? task.column_id,
        position: doneTasks.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);
    if (error) return toast.error(error.message);
    inv.tasks(projectId);
    inv.events();
    await handleTaskCompleted(task);
  };

  const planTaskToday = async (task: Task) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { error } = await (supabase as any)
      .from("tasks")
      .update({ planned_for: today })
      .eq("id", task.id);
    if (error) {
      if (error.code === "PGRST204" || error.code === "42703" || /planned_for/i.test(error.message)) {
        toast.error("Execute a migration de planejamento do dia para habilitar esta função.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    inv.tasks(projectId);
    toast.success("Tarefa adicionada ao plano de hoje");
  };

  const onDragEnd = async (e: DragEndEvent) => {
    dragOverKey.current = null;
    setActiveTask(null);
    const { active, over } = e;
    const baseline = dragSnapshot.current ?? tasks;
    dragSnapshot.current = null;

    if (!over) {
      qc.setQueryData(qk.tasks(projectId), baseline);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current as DndPayload | undefined;
    if (!activeData || activeData.type !== "task") {
      qc.setQueryData(qk.tasks(projectId), baseline);
      return;
    }
    const draggedTask = activeData.task as Task;

    const liveTasks = qc.getQueryData<Task[]>(qk.tasks(projectId)) ?? tasks;
    const liveMap = groupTasksByColumn(columns, liveTasks);
    const targetColumnId = resolveColumnId(over.id, overData, columns, liveMap);
    if (!targetColumnId) {
      qc.setQueryData(qk.tasks(projectId), baseline);
      return;
    }

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    const statusForColumn = inferStatus(targetColumn);
    const liveDragged = liveTasks.find((t) => t.id === draggedTask.id) ?? draggedTask;
    const sourceColumnId = baseline.find((t) => t.id === draggedTask.id)?.column_id ?? liveDragged.column_id;

    const affectedColumns = new Set<string>([targetColumnId]);
    if (sourceColumnId) affectedColumns.add(sourceColumnId);

    const completedAt = new Date().toISOString();
    const updates: { id: string; column_id: string; position: number; status: Task["status"]; completed_at?: string | null }[] = [];
    for (const colId of affectedColumns) {
      const list = liveMap.get(colId) ?? [];
      list.forEach((t, i) => {
        const before = baseline.find((b) => b.id === t.id);
        const status =
          t.id === draggedTask.id && colId === targetColumnId ? statusForColumn : t.status;
        const completed_at =
          t.id === draggedTask.id
            ? status === "done"
              ? (before?.completed_at ?? completedAt)
              : null
            : t.completed_at;
        if (
          !before ||
          before.column_id !== colId ||
          before.position !== i ||
          (t.id === draggedTask.id && (before.status !== status || before.completed_at !== completed_at))
        ) {
          updates.push({ id: t.id, column_id: colId, position: i, status, completed_at });
        }
      });
    }

    if (updates.length === 0) return;

    qc.setQueryData<Task[]>(qk.tasks(projectId), (old = []) =>
      old.map((t) => {
        const u = updates.find((x) => x.id === t.id);
        return u ? { ...t, column_id: u.column_id, position: u.position, status: u.status, completed_at: u.completed_at ?? null } : t;
      }),
    );

    const results = await Promise.all(
      updates.map((u) =>
        supabase
          .from("tasks")
          .update({ column_id: u.column_id, position: u.position, status: u.status, completed_at: u.completed_at ?? null })
          .eq("id", u.id),
      ),
    );
    const error = results.find((result) => result.error)?.error;

    if (error) {
      qc.setQueryData(qk.tasks(projectId), baseline);
      toast.error(error.message);
      return;
    }

    inv.tasks(projectId);

    if (statusForColumn === "done" && draggedTask.status !== "done" && user) {
      await handleTaskCompleted(draggedTask);
    }

    inv.events();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {columns.map((col) => (
          <ColumnView
            key={col.id}
            column={col}
            tasks={tasksByColumn.get(col.id) ?? []}
            scheduleByTaskId={scheduleByTaskId}
            checklistCounts={checklistCounts}
            onCardClick={(t) => { setEditing(t); setOpen(true); }}
            onCompleteTask={completeTask}
            onPlanToday={planTaskToday}
            onTaskCreated={() => inv.tasks(projectId)}
            projectId={projectId}
            userId={user?.id}
          />
        ))}
        <AddColumn projectId={projectId} nextPosition={columns.length} />
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask && <TaskCardDragPreview task={activeTask} onClick={() => {}} />}
      </DragOverlay>
      <TaskDialog task={editing} open={open} onOpenChange={setOpen} />
    </DndContext>
  );
}

function inferStatus(col?: BoardColumn) {
  if (!col) return "todo" as const;
  return col.default_status;
}

type DndPayload = { type?: string; columnId?: string; task?: Task };

function groupTasksByColumn(columns: BoardColumn[], taskList: Task[]) {
  const map = new Map<string, Task[]>();
  columns.forEach((c) => map.set(c.id, []));
  taskList.forEach((t) => {
    if (t.column_id && map.has(t.column_id)) map.get(t.column_id)!.push(t);
  });
  map.forEach((list) => list.sort((a, b) => a.position - b.position));
  return map;
}

function resolveColumnId(
  id: UniqueIdentifier,
  overData: DndPayload | undefined,
  columns: BoardColumn[],
  tasksByColumn: Map<string, Task[]>,
): string | null {
  if (overData?.type === "column" && overData.columnId) return overData.columnId;
  if (overData?.type === "task" && overData.task?.column_id) return overData.task.column_id;
  const sid = String(id);
  if (sid.startsWith("col-")) return sid.slice(4);
  for (const col of columns) {
    if ((tasksByColumn.get(col.id) ?? []).some((t) => t.id === sid)) return col.id;
  }
  return null;
}

function ColumnView({
  column, tasks, scheduleByTaskId, checklistCounts, onCardClick, onCompleteTask, onPlanToday, onTaskCreated, projectId, userId,
}: {
  column: BoardColumn;
  tasks: Task[];
  scheduleByTaskId: Map<string, CalendarEvent>;
  checklistCounts: Record<string, { done: number; total: number }>;
  onCardClick: (t: Task) => void;
  onCompleteTask: (t: Task) => void;
  onPlanToday: (t: Task) => void;
  onTaskCreated: () => void;
  projectId: string;
  userId?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}`, data: { type: "column", columnId: column.id } });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const inv = useInvalidate();

  const create = async () => {
    if (!newTitle.trim() || !userId) return;
    const { error } = await supabase.from("tasks").insert({
      owner_id: userId,
      project_id: projectId,
      column_id: column.id,
      title: newTitle.trim(),
      position: tasks.length,
      status: inferStatus(column),
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
    setAdding(false);
    onTaskCreated();
  };

  const deleteColumn = async () => {
    await supabase.from("board_columns").delete().eq("id", column.id);
    inv.columns(projectId);
    inv.tasks(projectId);
  };

  return (
    <>
    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir coluna</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir "{column.name}"? As tarefas serão desvinculadas da coluna.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteColumn}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div ref={setNodeRef} className={`w-80 shrink-0 flex flex-col rounded-xl bg-muted/40 border ${isOver ? "ring-2 ring-primary/40" : ""}`}>
      <div className="px-3 py-2.5 flex items-center gap-2 border-b">
        <span className="size-2 rounded-full" style={{ background: column.color }} />
        <span className="text-sm font-semibold">{column.name}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <div className="ml-auto flex items-center">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7"><MoreVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmDelete(true)}><Trash2 className="size-4 mr-2" />Excluir coluna</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-32">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onClick={() => onCardClick(t)}
              onComplete={() => onCompleteTask(t)}
              onPlanToday={() => onPlanToday(t)}
              checklistDone={checklistCounts[t.id]?.done}
              checklistTotal={checklistCounts[t.id]?.total}
              scheduledEvent={scheduleByTaskId.get(t.id)}
            />
          ))}
        </SortableContext>
        {adding && (
          <div className="bg-card border rounded-lg p-2 space-y-2">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); create(); } if (e.key === "Escape") { setAdding(false); setNewTitle(""); } }}
              placeholder="Título da tarefa"
              className="text-sm h-8"
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={create}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(""); }}>Cancelar</Button>
            </div>
          </div>
        )}
        {!adding && tasks.length === 0 && (
          <button onClick={() => setAdding(true)} className="w-full text-xs text-muted-foreground hover:text-foreground py-3 rounded-md border border-dashed">
            + Adicionar tarefa
          </button>
        )}
      </div>
    </div>
    </>
  );
}

function AddColumn({ projectId, nextPosition }: { projectId: string; nextPosition: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const inv = useInvalidate();
  const submit = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("board_columns").insert({
      project_id: projectId,
      name: name.trim(),
      position: nextPosition,
      color: "#64748b",
    });
    if (error) return toast.error(error.message);
    setName("");
    setEditing(false);
    inv.columns(projectId);
  };
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="w-72 shrink-0 h-12 rounded-xl border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50">
        + Adicionar coluna
      </button>
    );
  }
  return (
    <div className="w-72 shrink-0 flex gap-2">
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da coluna" onKeyDown={(e) => e.key === "Enter" && submit()} />
      <Button onClick={submit}>OK</Button>
    </div>
  );
}