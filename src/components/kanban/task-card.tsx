import { useSortable } from "@dnd-kit/sortable";
import type { MouseEvent, ReactNode } from "react";
import { CSS } from "@dnd-kit/utilities";
import { Calendar as CalIcon, CalendarClock, Check, CheckSquare, Clock, GripVertical, Sun } from "lucide-react";
import { priorityMeta, type CalendarEvent, type Task } from "@/lib/queries";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  onClick: () => void;
  onComplete?: () => void;
  onPlanToday?: () => void;
  checklistDone?: number;
  checklistTotal?: number;
  scheduledEvent?: CalendarEvent;
};

function TaskCardBody({
  task,
  onClick,
  onComplete,
  onPlanToday,
  checklistDone,
  checklistTotal,
  scheduledEvent,
  dragHandle,
  className,
}: TaskCardProps & {
  dragHandle?: ReactNode;
  className?: string;
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
  const plannedFor = (task as Task & { planned_for?: string | null }).planned_for;
  const plannedToday = plannedFor ? isToday(new Date(`${plannedFor}T00:00:00`)) : false;
  const done = task.status === "done";

  const handleAction = (event: MouseEvent, action?: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    action?.();
  };

  return (
    <div className={cn("bg-card border rounded-lg p-3 transition-all space-y-2", className)}>
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="size-1.5 mt-1.5 rounded-full shrink-0" style={{ background: priorityMeta[task.priority].color }} />
        <p className="text-sm font-medium flex-1 leading-snug cursor-pointer" onClick={onClick}>
          {task.title}
        </p>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-3.5">{task.description}</p>
      )}
      <div className="flex items-center gap-3 pl-3.5 text-xs text-muted-foreground flex-wrap">
        {task.due_date && (
          <span className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
            <CalIcon className="size-3" />
            {format(new Date(task.due_date), "d MMM", { locale: ptBR })}
          </span>
        )}
        {!!checklistTotal && (
          <span className="flex items-center gap-1">
            <CheckSquare className="size-3" /> {checklistDone}/{checklistTotal}
          </span>
        )}
        {task.estimated_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {task.estimated_minutes}m
          </span>
        )}
        {scheduledEvent && (
          <span className="flex items-center gap-1 text-primary">
            <CalendarClock className="size-3" />
            {format(new Date(scheduledEvent.starts_at), "HH:mm")}–{format(new Date(scheduledEvent.ends_at), "HH:mm")}
          </span>
        )}
        {plannedToday && (
          <span className="flex items-center gap-1 text-primary">
            <Sun className="size-3" /> hoje
          </span>
        )}
      </div>
      {!done && (onComplete || onPlanToday) && (
        <div className="flex gap-1.5 pl-3.5 pt-1">
          {onComplete && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => handleAction(e, onComplete)}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-1 text-[11px] font-semibold text-emerald-500 hover:bg-emerald-500/10"
            >
              <Check className="size-3" /> Concluir
            </button>
          )}
          {onPlanToday && !plannedToday && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => handleAction(e, onPlanToday)}
              className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
            >
              <Sun className="size-3" /> Hoje
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Preview no DragOverlay — sem useSortable (evita id duplicado no contexto) */
export function TaskCardDragPreview(props: TaskCardProps) {
  return (
    <TaskCardBody
      {...props}
      onClick={() => {}}
      className="shadow-lg ring-2 ring-primary/30 cursor-grabbing rotate-1"
    />
  );
}

export function TaskCard(props: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
    data: { type: "task", task: props.task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      aria-label="Arrastar tarefa"
      className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
      {...attributes}
      {...listeners}
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("hover:border-primary/50 hover:shadow-md rounded-lg", isDragging && "opacity-40")}
    >
      <TaskCardBody {...props} dragHandle={dragHandle} className="hover:border-primary/50" />
    </div>
  );
}
