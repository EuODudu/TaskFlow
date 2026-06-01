import { Link } from "@tanstack/react-router";
import { BookOpen, GitBranch, Network, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useKnowledgeNodes, useKnowledgeStats } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateKnowledgeNoteDialog } from "./create-knowledge-note-dialog";

export function KnowledgeDashboard() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: stats } = useKnowledgeStats(userId);
  const { data: nodes = [] } = useKnowledgeNodes(userId);

  const recent = nodes.slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Segundo cérebro com [[wiki links]], backlinks e grafo.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/knowledge/graph">
              <Network className="size-4 mr-2" />
              Grafo
            </Link>
          </Button>
          <CreateKnowledgeNoteDialog successMessage="+20 XP — nota criada" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalNotes ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalLinks ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.notesThisWeek ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média links/nota</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.avgLinksPerNote ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {stats?.topConnected && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 flex items-center gap-3">
            <GitBranch className="size-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Hub mais conectado</p>
              <Link
                to="/knowledge/notes/$noteId"
                params={{ noteId: stats.topConnected.id }}
                className="text-primary hover:underline truncate block"
              >
                {stats.topConnected.title} ({stats.topConnected.count} conexões)
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="size-4" />
            Notas recentes
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/knowledge/notes">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Comece com uma nota. Use <code className="text-xs bg-muted px-1 rounded">[[Outra Nota]]</code> para
              conectar ideias (+5 XP por link novo).
            </p>
          )}
          {recent.map((n) => (
            <Link
              key={n.id}
              to="/knowledge/notes/$noteId"
              params={{ noteId: n.id }}
              className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/40 text-sm"
            >
              <span className="font-medium truncate">{n.title}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {formatDistanceToNow(new Date(n.updated_at), { addSuffix: true, locale: ptBR })}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-lg border p-4 flex gap-3 bg-muted/30">
        <Sparkles className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Gamificação</p>
          <p>+20 XP nova nota · +5 XP por link · +50 doc longo · +100 processo documentado</p>
          <p>Conquistas: Arquivista, Bibliotecário, Conector, Tecelão</p>
        </div>
      </div>
    </div>
  );
}
