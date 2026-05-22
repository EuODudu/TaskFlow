import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/calendar/calendar-view";

export const Route = createFileRoute("/_app/calendar")({ component: CalendarPage });

function CalendarPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Organizador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planeje tarefas e reuniões por horário.
          </p>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Arraste blocos para reorganizar.
        </p>
      </div>
      <div className="flex-1 min-h-0"><CalendarView /></div>
    </div>
  );
}