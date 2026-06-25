import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Network } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useKnowledgeEdges, useKnowledgeNodes } from "@/lib/queries";
import { KnowledgeGraph } from "@/components/knowledge/knowledge-graph";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/knowledge/graph")({
  component: GraphPage,
});

function GraphPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: nodes = [] } = useKnowledgeNodes(userId);
  const { data: edges = [] } = useKnowledgeEdges(userId);
  const nav = useNavigate();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/knowledge">
            <ArrowLeft className="size-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="size-6" />
          Grafo de conhecimento
        </h1>
      </div>
      <KnowledgeGraph
        nodes={nodes}
        edges={edges}
        userId={userId}
        height={560}
        onSelectNode={(id) => nav({ to: "/knowledge/notes/$noteId", params: { noteId: id } })}
      />
    </div>
  );
}
