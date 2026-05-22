import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  useChecklist,
  useTags,
  useTaskTags,
  useInvalidate,
  useEvents,
  useTaskSchedule,
  priorityMeta,
  type Task,
  type TaskPriority,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import {
  defaultScheduleDurationMinutes,
  findScheduleConflicts,
} from "@/lib/task-schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, X, CalendarClock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { addMinutes, format } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function TaskDialog({ task, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimated, setEstimated] = useState<string>("");
  const [newItem, setNewItem] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState("60");
  const inv = useInvalidate();
  const { data: checklist = [] } = useChecklist(task?.id);
  const { data: allTags = [] } = useTags();
  const { data: taskTagIds = [] } = useTaskTags(task?.id);
  const { data: taskSchedule } = useTaskSchedule(task?.id);
  const { data: allEvents = [] } = useEvents();

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : "");
    setEstimated(task.estimated_minutes?.toString() ?? "");
  }, [task]);

  useEffect(() => {
    if (!task) return;
    if (taskSchedule) {
      setScheduleEnabled(true);
      setScheduleStart(format(new Date(taskSchedule.starts_at), "yyyy-MM-dd'T'HH:mm"));
      const mins = Math.round(
        (new Date(taskSchedule.ends_at).getTime() - new Date(taskSchedule.starts_at).getTime()) / 60000,
      );
      setScheduleDuration(String(Math.max(15, mins)));
    } else {
      setScheduleEnabled(false);
      setScheduleStart("");
      setScheduleDuration(String(defaultScheduleDurationMinutes(task.estimated_minutes)));
    }
  }, [task, taskSchedule]);

  const scheduleConflicts = useMemo(() => {
    if (!scheduleEnabled || !scheduleStart) return [];
    const mins = parseInt(scheduleDuration, 10);
    if (!Number.isFinite(mins) || mins <= 0) return [];
    const start = new Date(scheduleStart);
    const end = addMinutes(start, mins);
    return findScheduleConflicts(allEvents, start, end, taskSchedule?.id);
  }, [allEvents, scheduleDuration, scheduleEnabled, scheduleStart, taskSchedule?.id]);

  if (!task) return null;

  const saveSchedule = async () => {
    if (!user) return;
    if (!scheduleEnabled) {
      if (taskSchedule?.id) {
        const { error } = await supabase.from("calendar_events").delete().eq("id", taskSchedule.id);
        if (error) throw error;
      }
      return;
    }
    if (!scheduleStart) {
      toast.error("Informe o horário de início da execução.");
      throw new Error("missing schedule start");
    }
    const mins = parseInt(scheduleDuration, 10);
    if (!Number.isFinite(mins) || mins < 15) {
      toast.error("A duração mínima é de 15 minutos.");
      throw new Error("invalid duration");
    }
    const startsAt = new Date(scheduleStart);
    const endsAt = addMinutes(startsAt, mins);
    if (endsAt <= startsAt) {
      toast.error("O horário de fim deve ser depois do início.");
      throw new Error("invalid range");
    }

    const payload = {
      owner_id: user.id,
      task_id: task.id,
      title: title.trim() || task.title,
      type: "task" as const,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      color: priorityMeta[priority].color,
      notes: null,
      location: null,
      recurrence_rule: null,
    };

    if (taskSchedule?.id) {
      const { error } = await supabase.from("calendar_events").update(payload).eq("id", taskSchedule.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("calendar_events").insert(payload);
      if (error) throw error;
    }
  };

  const save = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: title.trim() || "Sem título",
        description: description || null,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_minutes: estimated ? parseInt(estimated) : null,
      })
      .eq("id", task.id);
    if (error) return toast.error(error.message);

    try {
      await saveSchedule();
    } catch {
      return;
    }

    inv.tasks(task.project_id);
    inv.events();
    inv.taskSchedule(task.id);
    toast.success("Tarefa atualizada");
  };

  const remove = async () => {
    if (taskSchedule?.id) {
      await supabase.from("calendar_events").delete().eq("id", taskSchedule.id);
    }
    const { error } = await supabase.from("tasks").update({ archived_at: new Date().toISOString() }).eq("id", task.id);
    if (error) return toast.error(error.message);
    inv.tasks(task.project_id);
    inv.events();
    onOpenChange(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const { error } = await supabase
      .from("checklist_items")
      .insert({ task_id: task.id, content: newItem.trim(), position: checklist.length });
    if (error) return toast.error(error.message);
    setNewItem("");
    inv.checklist(task.id);
  };

  const toggleItem = async (id: string, done: boolean) => {
    await supabase.from("checklist_items").update({ done }).eq("id", id);
    inv.checklist(task.id);
  };

  const deleteItem = async (id: string) => {
    await supabase.from("checklist_items").delete().eq("id", id);
    inv.checklist(task.id);
  };

  const toggleTag = async (tagId: string) => {
    if (taskTagIds.includes(tagId)) {
      await supabase.from("task_tags").delete().eq("task_id", task.id).eq("tag_id", tagId);
    } else {
      await supabase.from("task_tags").insert({ task_id: task.id, tag_id: tagId });
    }
    inv.taskTags(task.id);
  };

  const applyEstimatedDuration = () => {
    const mins = defaultScheduleDurationMinutes(estimated ? parseInt(estimated) : null);
    setScheduleDuration(String(mins));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da tarefa</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(priorityMeta) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: priorityMeta[p].color }} />
                        {priorityMeta[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo de entrega</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tempo estimado (min)</Label>
              <Input type="number" min={0} value={estimated} onChange={(e) => setEstimated(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <Label className="text-sm font-semibold">Agendar execução</Label>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={scheduleEnabled}
                  onCheckedChange={(v) => setScheduleEnabled(!!v)}
                />
                Ativo
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Defina quando você vai trabalhar nesta tarefa. O bloco aparece no calendário, como uma reunião no Teams.
            </p>
            {scheduleEnabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleStart}
                      onChange={(e) => setScheduleStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={15}
                        step={15}
                        value={scheduleDuration}
                        onChange={(e) => setScheduleDuration(e.target.value)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={applyEstimatedDuration}>
                        Usar estimativa
                      </Button>
                    </div>
                  </div>
                </div>
                {scheduleStart && scheduleDuration && (
                  <p className="text-xs text-muted-foreground">
                    Término previsto:{" "}
                    <strong>
                      {format(
                        addMinutes(new Date(scheduleStart), parseInt(scheduleDuration, 10) || 60),
                        "dd/MM/yyyy HH:mm",
                      )}
                    </strong>
                  </p>
                )}
                {scheduleConflicts.length > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <span>
                      Conflito com {scheduleConflicts.length} evento(s):{" "}
                      {scheduleConflicts.map((e) => e.title).join(", ")}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const active = taskTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors"
                      style={active ? { background: tag.color, borderColor: tag.color, color: "#fff" } : { borderColor: tag.color, color: tag.color }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-2 pt-2">
            <Label>Checklist</Label>
            <div className="space-y-1.5">
              {checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2 group">
                  <Checkbox checked={c.done} onCheckedChange={(v) => toggleItem(c.id, !!v)} />
                  <span className={cn("flex-1 text-sm", c.done && "line-through text-muted-foreground")}>{c.content}</span>
                  <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100" onClick={() => deleteItem(c.id)}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar item…"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
                />
                <Button variant="outline" size="icon" onClick={addItem}><Plus className="size-4" /></Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={remove}><Trash2 className="size-4 mr-2" /> Arquivar</Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={async () => { await save(); onOpenChange(false); }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
