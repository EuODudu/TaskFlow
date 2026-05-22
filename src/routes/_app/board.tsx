import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUI } from "@/lib/stores";
import { useProjects } from "@/lib/queries";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/board")({ component: BoardPage });

function BoardPage() {
  const selectedProjectId = useUI((s) => s.selectedProjectId);
  const setSelectedProjectId = useUI((s) => s.setSelectedProjectId);
  const { data: projects = [], isLoading } = useProjects();

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
    if (selectedProjectId && projects.length > 0 && !projects.find((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  const project = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
        <Select value={selectedProjectId ?? ""} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: p.color }} /> {p.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {project && <p className="text-sm text-muted-foreground ml-auto">Projeto: {project.name}</p>}
      </div>
      <div className="flex-1 min-h-0">
        {isLoading && <p className="text-muted-foreground">Carregando…</p>}
        {!isLoading && !project && <p className="text-muted-foreground">Crie um projeto na barra lateral para começar.</p>}
        {project && <KanbanBoard projectId={project.id} />}
      </div>
    </div>
  );
}