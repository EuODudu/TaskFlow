import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useKnowledgeBacklinks } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { userId: string; noteId: string };

export function BacklinksPanel({ userId, noteId }: Props) {
  const { data: backlinks = [], isLoading } = useKnowledgeBacklinks(userId, noteId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ArrowLeft className="size-4" />
          Backlinks ({backlinks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-xs text-muted-foreground">Carregando…</p>}
        {!isLoading && backlinks.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma nota referencia esta ainda.</p>
        )}
        {backlinks.map((n) => (
          <Link
            key={n.id}
            to="/knowledge/notes/$noteId"
            params={{ noteId: n.id }}
            className="block rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">{n.title}</span>
            {n.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {(n.content ?? "").replace(/\[\[([^\]]+)\]\]/g, "$1").slice(0, 120)}
              </p>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
