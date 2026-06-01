import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import type { EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAllTasks, useColumns, useEvents, useInvalidate, useProjects, priorityMeta, type BoardColumn, type CalendarEvent, type Task, type TaskPriority } from "@/lib/queries";
import { findScheduleConflicts, rangesOverlap } from "@/lib/task-schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { addMinutes, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

type Editing = {
  id?: string;
  title: string;
  starts_at: string;
  ends_at: string;
  type: "meeting" | "event" | "reminder" | "task";
  project_id: string;
  priority: TaskPriority;
  notes: string;
  location: string;
  recurrence: string;
};

type CalendarFilters = {
  tasks: boolean;
  meetings: boolean;
  events: boolean;
  reminders: boolean;
};

type CopyDayState = {
  sourceDate: string;
  targetDate: string;
};

const emptyEvent = (start?: Date, projectId = ""): Editing => ({
  title: "",
  starts_at: format(start ?? new Date(), "yyyy-MM-dd'T'HH:mm"),
  ends_at: format(addMinutes(start ?? new Date(), 60), "yyyy-MM-dd'T'HH:mm"),
  type: "event",
  project_id: projectId,
  priority: "medium",
  notes: "",
  location: "",
  recurrence: "none",
});

const RRULES: Record<string, string | null> = {
  none: null,
  daily: "FREQ=DAILY",
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
};

function dateKey(date: string | Date) {
  return format(new Date(date), "yyyy-MM-dd");
}

function moveDateKeepingLocalTime(date: string, targetDate: string) {
  const original = new Date(date);
  return new Date(`${targetDate}T${format(original, "HH:mm:ss")}`);
}

function eventPassesFilter(e: CalendarEvent, filters: CalendarFilters) {
  if (e.type === "task") return filters.tasks;
  if (e.type === "meeting") return filters.meetings;
  if (e.type === "event") return filters.events;
  if (e.type === "reminder") return filters.reminders;
  return true;
}

function pickColumnForCopy(columns: BoardColumn[], preferredColumnId: string | null) {
  if (columns.length === 0) return null;
  const preferred = preferredColumnId ? columns.find((c) => c.id === preferredColumnId) : undefined;
  if (preferred && preferred.default_status !== "done") return preferred;
  return (
    columns.find((c) => c.default_status === "backlog")
    ?? columns.find((c) => c.default_status === "todo")
    ?? columns.find((c) => c.default_status !== "done")
    ?? columns[0]
  );
}

function detectConflicts(events: CalendarEvent[]) {
  const timed = events.filter((e) => !e.recurrence_rule);
  const sorted = [...timed].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const conflictIds = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (
        rangesOverlap(
          new Date(sorted[i].starts_at),
          new Date(sorted[i].ends_at),
          new Date(sorted[j].starts_at),
          new Date(sorted[j].ends_at),
        )
      ) {
        conflictIds.add(sorted[i].id);
        conflictIds.add(sorted[j].id);
      }
    }
  }
  return conflictIds;
}

export function CalendarView() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: events = [] } = useEvents();
  const { data: tasks = [] } = useAllTasks();
  const inv = useInvalidate();
  const calRef = useRef<FullCalendar | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [open, setOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CalendarEvent | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [copyDay, setCopyDay] = useState<CopyDayState>(() => ({
    sourceDate: format(new Date(), "yyyy-MM-dd"),
    targetDate: format(new Date(), "yyyy-MM-dd"),
  }));
  const [filters, setFilters] = useState<CalendarFilters>({
    tasks: true,
    meetings: true,
    events: true,
    reminders: true,
  });
  const selectedProjectId = editing?.project_id || projects[0]?.id || "";
  const { data: selectedColumns = [] } = useColumns(selectedProjectId);

  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const tasksToCopy = useMemo(
    () => events.filter((e) => e.type === "task" && dateKey(e.starts_at) === copyDay.sourceDate),
    [copyDay.sourceDate, events],
  );

  const copyDayOptions = useMemo(() => {
    const options = new Map<string, number>();
    for (const event of events) {
      if (event.type !== "task") continue;
      const key = dateKey(event.starts_at);
      options.set(key, (options.get(key) ?? 0) + 1);
    }
    return [...options.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  const visibleEvents = useMemo(
    () => events.filter((e) => eventPassesFilter(e, filters)),
    [events, filters],
  );

  const conflicts = useMemo(() => detectConflicts(visibleEvents), [visibleEvents]);

  const fcEvents = useMemo<EventInput[]>(() => {
    const out: EventInput[] = [];
    for (const e of visibleEvents) {
      const isTask = e.type === "task";
      const linkedTask = e.task_id ? taskById.get(e.task_id) : undefined;
      const taskColor = linkedTask ? priorityMeta[linkedTask.priority].color : "#3b82f6";
      const base: EventInput = {
        id: isTask ? `task-${e.id}` : `event-${e.id}`,
        title: isTask ? linkedTask?.title ?? e.title : e.title,
        backgroundColor: isTask
          ? taskColor
          : e.color ?? (e.type === "meeting" ? "#a855f7" : e.type === "reminder" ? "#f59e0b" : "#6366f1"),
        borderColor: conflicts.has(e.id) ? "#ef4444" : isTask ? taskColor : e.color ?? undefined,
        classNames: conflicts.has(e.id) ? ["fc-event-conflict"] : isTask ? ["fc-event-task"] : [],
        extendedProps: {
          kind: isTask ? "task" : "event",
          raw: e,
          taskId: e.task_id,
        },
      };
      if (e.recurrence_rule && !isTask) {
        base.rrule = { freq: e.recurrence_rule.replace("FREQ=", "").toLowerCase() as "daily" | "weekly" | "monthly", dtstart: e.starts_at };
        base.duration = { milliseconds: new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime() };
      } else {
        base.start = e.starts_at;
        base.end = e.ends_at;
      }
      out.push(base);
    }
    return out;
  }, [visibleEvents, taskById, conflicts]);

  const handleDateClick = (info: { date: Date }) => {
    setEditing(emptyEvent(info.date, projects[0]?.id));
    setOpen(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    const props = info.event.extendedProps;
    if (props.kind === "task") {
      const raw = props.raw as CalendarEvent;
      setTaskToDelete(raw);
      return;
    }
    const raw = props.raw as CalendarEvent;
    setEditing({
      id: raw.id,
      title: raw.title,
      starts_at: format(new Date(raw.starts_at), "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(new Date(raw.ends_at), "yyyy-MM-dd'T'HH:mm"),
      type: raw.type === "task" ? "event" : raw.type,
      project_id: projects[0]?.id ?? "",
      priority: "medium",
      notes: raw.notes ?? "",
      location: raw.location ?? "",
      recurrence: raw.recurrence_rule ? raw.recurrence_rule.replace("FREQ=", "").toLowerCase() : "none",
    });
    setOpen(true);
  };

  const handleDropOrResize = async (info: EventDropArg | EventResizeDoneArg) => {
    const props = info.event.extendedProps;
    const newStart = info.event.start as Date;
    const newEnd = (info.event.end ?? addMinutes(newStart, 60)) as Date;

    if (props.kind === "task") {
      const raw = props.raw as CalendarEvent;
      const { error } = await supabase
        .from("calendar_events")
        .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
        .eq("id", raw.id);
      if (error) {
        info.revert();
        return toast.error(error.message);
      }
      if (raw.task_id) inv.taskSchedule(raw.task_id);
    } else {
      const raw = props.raw as CalendarEvent;
      const { error } = await supabase
        .from("calendar_events")
        .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
        .eq("id", raw.id);
      if (error) {
        info.revert();
        return toast.error(error.message);
      }
    }
    inv.events();

    const overlapping = findScheduleConflicts(events, newStart, newEnd, (props.raw as CalendarEvent).id);
    if (overlapping.length > 0) {
      toast.warning("Horário atualizado com conflito", {
        description: overlapping.map((e) => e.title).join(", "),
      });
    }
  };

  const saveEvent = async () => {
    if (!editing || !user) return;
    const startsAt = new Date(editing.starts_at);
    const endsAt = new Date(editing.ends_at);
    if (endsAt <= startsAt) return toast.error("O horário de fim deve ser depois do início.");

    if (editing.type === "task") {
      if (!selectedProjectId) return toast.error("Crie ou selecione um projeto para adicionar a tarefa ao Kanban.");
      const targetColumn =
        selectedColumns.find((c) => c.default_status === "backlog")
        ?? selectedColumns.find((c) => c.default_status === "todo")
        ?? selectedColumns[0];
      if (!targetColumn) return toast.error("Crie uma coluna no Kanban antes de adicionar tarefas pelo calendário.");

      const durationMinutes = Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
      const columnTasks = tasks.filter((task) => task.project_id === selectedProjectId && task.column_id === targetColumn.id);
      const { data: createdTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          owner_id: user.id,
          project_id: selectedProjectId,
          column_id: targetColumn.id,
          title: editing.title.trim() || "Tarefa agendada",
          priority: editing.priority,
          status: targetColumn.default_status,
          position: columnTasks.length,
          estimated_minutes: durationMinutes,
          description: editing.notes || null,
        })
        .select("id")
        .single();
      if (taskError) return toast.error(taskError.message);

      const payload = {
        owner_id: user.id,
        task_id: createdTask.id,
        title: editing.title.trim() || "Tarefa agendada",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        type: "task" as const,
        color: priorityMeta[editing.priority].color,
        notes: editing.notes || null,
        location: editing.location || null,
        recurrence_rule: null,
      };
      const res = editing.id
        ? await supabase.from("calendar_events").update(payload).eq("id", editing.id)
        : await supabase.from("calendar_events").insert(payload);
      if (res.error) return toast.error(res.error.message);

      inv.tasks(selectedProjectId);
      inv.events();
      setOpen(false);
      toast.success("Tarefa criada no Kanban e agendada");
      return;
    }

    const payload = {
      owner_id: user.id,
      title: editing.title.trim() || "Sem título",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      type: editing.type,
      notes: editing.notes || null,
      location: editing.location || null,
      recurrence_rule: RRULES[editing.recurrence],
    };
    let res;
    if (editing.id) {
      res = await supabase.from("calendar_events").update(payload).eq("id", editing.id);
    } else {
      res = await supabase.from("calendar_events").insert(payload);
    }
    if (res.error) return toast.error(res.error.message);
    inv.events();
    setOpen(false);
    toast.success("Evento salvo");
  };

  const deleteEvent = async () => {
    if (!editing?.id) return;
    await supabase.from("calendar_events").delete().eq("id", editing.id);
    inv.events();
    setOpen(false);
  };

  const deleteTaskFromCalendar = async () => {
    if (!taskToDelete) return;

    setDeletingTask(true);
    try {
      const linkedTask = taskToDelete.task_id ? taskById.get(taskToDelete.task_id) : undefined;
      const projectId = linkedTask?.project_id;

      if (taskToDelete.task_id) {
        const { error: taskError } = await supabase
          .from("tasks")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", taskToDelete.task_id);
        if (taskError) throw taskError;
      }

      const { error: eventError } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", taskToDelete.id);
      if (eventError) throw eventError;

      if (projectId) inv.tasks(projectId);
      else inv.tasks();
      inv.events();
      if (taskToDelete.task_id) inv.taskSchedule(taskToDelete.task_id);

      setTaskToDelete(null);
      toast.success(taskToDelete.task_id ? "Tarefa excluída do Kanban e do calendário" : "Agendamento excluído do calendário");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a tarefa.");
    } finally {
      setDeletingTask(false);
    }
  };

  const copyTasksFromDay = async () => {
    if (!user) return;
    if (!copyDay.sourceDate || !copyDay.targetDate) return toast.error("Escolha o dia de origem e o dia de destino.");
    if (copyDay.sourceDate === copyDay.targetDate) return toast.error("Escolha uma data de destino diferente da origem.");
    if (tasksToCopy.length === 0) return toast.error("Esse dia não tem tarefas agendadas para copiar.");

    setCopying(true);

    try {
      const taskLookup = new Map(taskById);
      const missingTaskIds = tasksToCopy
        .map((event) => event.task_id)
        .filter((id): id is string => !!id && !taskLookup.has(id));

      if (missingTaskIds.length > 0) {
        const { data: fetchedTasks, error: fetchError } = await supabase
          .from("tasks")
          .select("*")
          .in("id", missingTaskIds)
          .is("archived_at", null);
        if (fetchError) throw fetchError;
        for (const task of fetchedTasks ?? []) taskLookup.set(task.id, task);
      }

      const projectIds = [
        ...new Set(
          tasksToCopy
            .map((event) => (event.task_id ? taskLookup.get(event.task_id)?.project_id : null))
            .filter((id): id is string => !!id),
        ),
      ];

      const columnsByProject = new Map<string, BoardColumn[]>();
      if (projectIds.length > 0) {
        const { data: projectColumns, error: columnsError } = await supabase
          .from("board_columns")
          .select("*")
          .in("project_id", projectIds)
          .order("position");
        if (columnsError) throw columnsError;
        for (const column of projectColumns ?? []) {
          const list = columnsByProject.get(column.project_id) ?? [];
          list.push(column);
          columnsByProject.set(column.project_id, list);
        }
      }

      const positionByColumn = new Map<string, number>();
      for (const task of tasks) {
        if (!task.column_id) continue;
        const key = `${task.project_id}:${task.column_id}`;
        positionByColumn.set(key, Math.max(positionByColumn.get(key) ?? 0, task.position + 1));
      }

      let copied = 0;
      let skipped = 0;

      for (const event of tasksToCopy) {
        const sourceTask = event.task_id ? taskLookup.get(event.task_id) : undefined;
        if (!sourceTask) {
          skipped++;
          continue;
        }

        const projectColumns = columnsByProject.get(sourceTask.project_id) ?? [];
        const targetColumn = pickColumnForCopy(projectColumns, sourceTask.column_id);
        if (!targetColumn) {
          skipped++;
          continue;
        }

        const startsAt = moveDateKeepingLocalTime(event.starts_at, copyDay.targetDate);
        const endsAt = moveDateKeepingLocalTime(event.ends_at, copyDay.targetDate);
        const columnKey = `${sourceTask.project_id}:${targetColumn.id}`;
        const nextPosition = positionByColumn.get(columnKey) ?? 0;
        positionByColumn.set(columnKey, nextPosition + 1);

        const plannedFor = dateKey(startsAt);
        const baseTaskPayload = {
          owner_id: user.id,
          project_id: sourceTask.project_id,
          column_id: targetColumn.id,
          title: sourceTask.title,
          description: sourceTask.description,
          priority: sourceTask.priority,
          status: targetColumn.default_status,
          position: nextPosition,
          estimated_minutes: sourceTask.estimated_minutes,
          due_date: plannedFor,
          is_favorite: sourceTask.is_favorite,
          completed_at: null,
        };

        let createdTaskId: string | null = null;
        const firstInsert = await supabase
          .from("tasks")
          .insert({ ...baseTaskPayload, planned_for: plannedFor })
          .select("id")
          .single();

        if (firstInsert.error) {
          const missingPlannedFor =
            firstInsert.error.code === "PGRST204"
            || firstInsert.error.code === "42703"
            || /planned_for/i.test(firstInsert.error.message);

          if (!missingPlannedFor) throw firstInsert.error;

          const fallbackInsert = await supabase
            .from("tasks")
            .insert(baseTaskPayload)
            .select("id")
            .single();
          if (fallbackInsert.error) throw fallbackInsert.error;
          createdTaskId = fallbackInsert.data.id;
        } else {
          createdTaskId = firstInsert.data.id;
        }

        const eventPayload = {
          owner_id: user.id,
          task_id: createdTaskId,
          title: event.title || sourceTask.title,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          type: "task" as const,
          color: event.color ?? priorityMeta[sourceTask.priority].color,
          notes: event.notes,
          location: event.location,
          all_day: event.all_day,
          recurrence_rule: null,
        };

        const { error: eventError } = await supabase.from("calendar_events").insert(eventPayload);
        if (eventError) throw eventError;
        copied++;
      }

      if (copied === 0) {
        toast.error(
          skipped > 0
            ? "Não foi possível copiar: as tarefas não estão vinculadas ao Kanban ou o projeto não tem colunas."
            : "Não encontrei tarefas vinculadas ao Kanban nesse dia.",
        );
        return;
      }

      inv.events();
      projectIds.forEach((projectId) => inv.tasks(projectId));
      inv.tasks();

      setCopyOpen(false);
      const suffix = skipped > 0 ? ` (${skipped} ignorada(s) sem coluna no Kanban)` : "";
      toast.success(`${copied} tarefa(s) copiadas para ${format(new Date(`${copyDay.targetDate}T00:00:00`), "dd/MM")}${suffix}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível copiar as tarefas.");
    } finally {
      setCopying(false);
    }
  };

  const renderEventContent = (arg: EventContentArg) => {
    const isTask = arg.event.extendedProps.kind === "task";
    return (
      <div className="min-w-0 px-1.5 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {isTask && <span className="size-1.5 shrink-0 rounded-full bg-white/80" />}
          <span className="truncate text-[11px] font-semibold leading-tight">{arg.event.title}</span>
        </div>
        {arg.timeText && <div className="truncate text-[10px] leading-tight opacity-80">{arg.timeText}</div>}
      </div>
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <FilterToggle
            label="Tarefas"
            checked={filters.tasks}
            onChange={(v) => setFilters((f) => ({ ...f, tasks: v }))}
            color="#3b82f6"
          />
          <FilterToggle
            label="Reuniões"
            checked={filters.meetings}
            onChange={(v) => setFilters((f) => ({ ...f, meetings: v }))}
            color="#a855f7"
          />
          <FilterToggle
            label="Eventos"
            checked={filters.events}
            onChange={(v) => setFilters((f) => ({ ...f, events: v }))}
            color="#6366f1"
          />
          <FilterToggle
            label="Lembretes"
            checked={filters.reminders}
            onChange={(v) => setFilters((f) => ({ ...f, reminders: v }))}
            color="#f59e0b"
          />
          {conflicts.size > 0 && (
            <span className="rounded-full border border-destructive/25 bg-destructive/5 px-2.5 py-1 font-medium text-destructive">
              {conflicts.size} conflito(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-4"
            onClick={() => setCopyOpen(true)}
          >
            <Copy className="size-3.5" />
            Copiar dia
          </Button>
          <Button size="sm" className="rounded-full px-4" onClick={() => { setEditing(emptyEvent(undefined, projects[0]?.id)); setOpen(true); }}>
            + Novo evento
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card/50 p-3 shadow-sm [&_.fc]:h-full [&_.fc-event-conflict]:ring-2 [&_.fc-event-conflict]:ring-destructive/60">
        <FullCalendar
          ref={calRef as React.RefObject<FullCalendar>}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
          buttonText={{ today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }}
          locale="pt-br"
          firstDay={0}
          editable
          selectable
          height="100%"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator
          dayMaxEventRows={4}
          events={fcEvents}
          eventContent={renderEventContent}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleDropOrResize}
          eventResize={handleDropOrResize}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar evento" : "Novo evento"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 py-2">
              <div className="space-y-2"><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} autoFocus /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Início</Label><Input type="datetime-local" value={editing.starts_at} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="datetime-local" value={editing.ends_at} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as Editing["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="task">Tarefa</SelectItem>
                      <SelectItem value="reminder">Lembrete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editing.type === "task" ? (
                  <div className="space-y-2">
                    <Label>Projeto do Kanban</Label>
                    <Select value={selectedProjectId} onValueChange={(v) => setEditing({ ...editing, project_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Repetição</Label>
                    <Select value={editing.recurrence} onValueChange={(v) => setEditing({ ...editing, recurrence: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não repete</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                        <SelectItem value="monthly">Mensalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {editing.type === "task" && (
                <div className="space-y-2">
                  <Label>Prioridade da tarefa</Label>
                  <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v as TaskPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(priorityMeta) as TaskPriority[]).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <span className="flex items-center gap-2">
                            <span className="size-2 rounded-full" style={{ background: priorityMeta[priority].color }} />
                            {priorityMeta[priority].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Ao salvar, a tarefa será criada no Kanban e este bloco ficará vinculado a ela.
                  </p>
                </div>
              )}
              <div className="space-y-2"><Label>Local</Label><Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Notas</Label><Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} /></div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {editing?.id && <Button variant="ghost" onClick={deleteEvent}>Excluir</Button>}
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={saveEvent}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar tarefas de outro dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Copiar tarefas de</Label>
              <Input
                type="date"
                value={copyDay.sourceDate}
                onChange={(e) => setCopyDay((state) => ({ ...state, sourceDate: e.target.value }))}
              />
              {copyDayOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {copyDayOptions.slice(0, 6).map(([date, count]) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setCopyDay((state) => ({ ...state, sourceDate: date }))}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                        copyDay.sourceDate === date
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {format(new Date(`${date}T00:00:00`), "dd/MM")} ({count})
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {tasksToCopy.length} tarefa(s) encontrada(s) nesse dia.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Colar em</Label>
              <Input
                type="date"
                value={copyDay.targetDate}
                onChange={(e) => setCopyDay((state) => ({ ...state, targetDate: e.target.value }))}
              />
            </div>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              As tarefas serão recriadas no Kanban e agendadas no mesmo horário do dia escolhido.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setCopyOpen(false)}>Cancelar</Button>
            <Button onClick={copyTasksFromDay} disabled={copying || tasksToCopy.length === 0}>
              {copying ? "Copiando..." : "Copiar tarefas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai remover "{taskToDelete?.title ?? "esta tarefa"}" do calendário e arquivar a tarefa no Kanban.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTask}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTaskFromCalendar} disabled={deletingTask}>
              {deletingTask ? "Excluindo..." : "Excluir tarefa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-medium transition-colors",
        checked
          ? "border-border bg-muted/50 text-foreground hover:bg-muted"
          : "border-transparent text-muted-foreground hover:bg-muted/40",
      )}
    >
      <span className={cn("size-2 rounded-full", !checked && "opacity-40")} style={{ background: color }} />
      {label}
    </button>
  );
}
