import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useKnowledgeNodes, useInvalidate } from "@/lib/queries";
import { useUI } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteKnowledgeNode } from "@/lib/knowledge/knowledge-api";
import { NODE_TYPE_LABELS } from "@/lib/knowledge/constants";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateKnowledgeNoteDialog } from "./create-knowledge-note-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function KnowledgeNotesList() {
  const { user } = useAuth();
  const userId = user?.id;
  const searchQuery = useUI((s) => s.searchQuery);
  const { data: nodes = [], isLoading } = useKnowledgeNodes(userId);
  const inv = useInvalidate();

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content ?? "").toLowerCase().includes(q) ||
          n.slug.includes(q),
      )
    : nodes;

  const deleteNote = async (id: string) => {
    if (!userId) return;
    try {
      await deleteKnowledgeNode(userId, id);
      inv.knowledge(userId);
      toast.success("Nota apagada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Notas</h1>
        <CreateKnowledgeNoteDialog
          buttonLabel="Nova"
          trigger={
            <Button className="ml-auto" size="sm">
              <Plus className="size-4 mr-1" />
              Nova
            </Button>
          }
        />
      </div>
      {isLoading && <p className="text-muted-foreground text-sm">Carregando…</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {q ? "Nenhuma nota corresponde à busca." : "Nenhuma nota ainda."}
        </p>
      )}
      <div className="space-y-2">
        {filtered.map((n) => (
          <Card key={n.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex gap-3 items-start">
              <Link
                to="/knowledge/notes/$noteId"
                params={{ noteId: n.id }}
                className="flex-1 min-w-0"
              >
                <p className="font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {NODE_TYPE_LABELS[n.node_type]} ·{" "}
                  {formatDistanceToNow(new Date(n.updated_at), { addSuffix: true, locale: ptBR })}
                </p>
                {n.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {(n.content ?? "").replace(/\[\[([^\]]+)\]\]/g, "$1").slice(0, 160)}
                  </p>
                )}
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar nota?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é definitiva. Links e backlinks ligados a esta nota também serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteNote(n.id)}>Apagar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
