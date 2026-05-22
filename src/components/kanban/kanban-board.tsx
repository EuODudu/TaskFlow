import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { useTasks, useColumns, useEvents, useInvalidate, checkAndAwardBadges, qk, type CalendarEvent, type Task, type BoardColumn } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { XP_REWARDS } from "@/lib/gamification";
import { useUI } from "@/lib/stores";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
    const t = e.active.data.current?.task as Task | undefined;
    if (t) setActiveTask(t);
  };

  const onDragOver = (_e: DragOverEvent) => {};

  const handleTaskCompleted = (task: Task) => {
    if (!user) return;
    const reward = getEstimatedTaskReward(task);
    toast.success(`+${reward.xp} XP • +${reward.coins} moedas ✨`, {
      description: task.due_date && new Date(task.due_date) > new Date()
        ? "Tarefa concluída com bônus de entrega antecipada!"
        : "Tarefa concluída!",
      duration: 3000,
    });
    checkAndAwardBadges(user.id).then((newBadges) => {
      newBadges.forEach((b) => toast.success(`${b.icon} Conquista desbloqueada!`, { description: b.name, duration: 5000 }));
      if (newBadges.length > 0) inv.userBadges(user.id);
      inv.profile();
    });
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
      })
      .eq("id", task.id);
    if (error) return toast.error(error.message);
    inv.tasks(projectId);
    inv.events();
    handleTaskCompleted(task);
  };

  const planTaskToday = async (task: Task) => {
    const today = new Date().toISOString().slice(0, 10);
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
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData || activeData.type !== "task") return;
    const draggedTask = activeData.task as Task;

    // Determine target column id
    let targetColumnId: string | null = null;
    let targetIndex = 0;
    if (overData?.type === "column") {
      targetColumnId = overData.columnId;
      targetIndex = (tasksByColumn.get(targetColumnId!)?.length ?? 0);
    } else if (overData?.type === "task") {
      const overTask = overData.task as Task;
      targetColumnId = overTask.column_id;
      const list = tasksByColumn.get(targetColumnId!) ?? [];
      const idx = list.findIndex((t) => t.id === overTask.id);
      targetIndex = idx >= 0 ? idx : list.length;
    }
    if (!targetColumnId) return;

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    const statusForColumn = inferStatus(targetColumn);

    const sourceColumnId = draggedTask.column_id;
    const sourceList = sourceColumnId && sourceColumnId !== targetColumnId
      ? (tasksByColumn.get(sourceColumnId) ?? []).filter((t) => t.id !== draggedTask.id)
      : [];

    // Reorder in target column
    const targetList = [...(tasksByColumn.get(targetColumnId) ?? [])];
    if (draggedTask.column_id === targetColumnId) {
      const oldIdx = targetList.findIndex((t) => t.id === draggedTask.id);
      if (oldIdx < 0) return;
      targetList.splice(oldIdx, 1);
      const nextIndex = oldIdx < targetIndex ? targetIndex - 1 : targetIndex;
      targetList.splice(Math.max(0, nextIndex), 0, draggedTask);
    } else {
      targetList.splice(Math.max(0, targetIndex), 0, draggedTask);
    }

    const targetUpdates = targetList.map((t, i) => ({
      id: t.id,
      column_id: targetColumnId!,
      position: i,
      status: t.id === draggedTask.id ? statusForColumn : t.status,
    }));
    const sourceUpdates = sourceList.map((t, i) => ({
      id: t.id,
      column_id: sourceColumnId!,
      position: i,
      status: t.status,
    }));
    const updates = [...targetUpdates, ...sourceUpdates];

    // Optimistic update: apply changes to cache immediately
    const previousTasks = qc.getQueryData<Task[]>(qk.tasks(projectId));
    qc.setQueryData<Task[]>(qk.tasks(projectId), (old = []) =>
      old.map((t) => {
        const u = updates.find((x) => x.id === t.id);
        return u ? { ...t, column_id: u.column_id, position: u.position, status: u.status } : t;
      }),
    );

    const results = await Promise.all(
      updates.map((u) =>
        supabase
          .from("tasks")
          .update({ column_id: u.column_id, position: u.position, status: u.status })
          .eq("id", u.id),
      ),
    );
    const error = results.find((result) => result.error)?.error;

    if (error) {
      qc.setQueryData(qk.tasks(projectId), previousTasks);
      toast.error(error.message);
      return;
    }

    // XP notification when moving a task to done
    if (statusForColumn === "done" && draggedTask.status !== "done" && user) {
      handleTaskCompleted(draggedTask);
    }

    inv.events();
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
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
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
      </DragOverlay>
      <TaskDialog task={editing} open={open} onOpenChange={setOpen} />
    </DndContext>
  );
}

function inferStatus(col?: BoardColumn) {
  if (!col) return "todo" as const;
  return col.default_status;
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