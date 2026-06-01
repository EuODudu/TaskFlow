import { useEffect, useRef } from "react";
import cytoscape, { type Core } from "cytoscape";
import type { KnowledgeEdge, KnowledgeNode } from "@/lib/knowledge/types";
import { NODE_TYPE_LABELS } from "@/lib/knowledge/constants";

const TYPE_COLORS: Record<string, string> = {
  note: "#6366f1",
  task: "#3b82f6",
  project: "#10b981",
  process: "#f59e0b",
  area: "#a855f7",
  resource: "#14b8a6",
  daily: "#ec4899",
  template: "#94a3b8",
};

type Props = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onSelectNode?: (id: string) => void;
  height?: number;
};

export function KnowledgeGraph({ nodes, edges, onSelectNode, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const linkEdges = edges.filter((e) => e.edge_type === "link");
    const elements = [
      ...nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.title.length > 24 ? `${n.title.slice(0, 22)}…` : n.title,
          type: n.node_type,
          color: TYPE_COLORS[n.node_type] ?? "#6366f1",
        },
      })),
      ...linkEdges.map((e) => ({
        data: { id: e.id, source: e.source_id, target: e.target_id },
      })),
    ];

    cyRef.current?.destroy();
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 10,
            color: "#fff",
            "text-outline-width": 2,
            "text-outline-color": "#1e293b",
            width: 36,
            height: 36,
            "background-color": "data(color)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.7,
          },
        },
        { selector: "node:selected", style: { "border-width": 3, "border-color": "#fbbf24" } },
      ],
      layout: { name: "cose", animate: true, padding: 40, nodeRepulsion: 8000 },
      minZoom: 0.2,
      maxZoom: 3,
    });

    cy.on("tap", "node", (evt) => {
      const id = evt.target.id();
      onSelectNode?.(id);
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [nodes, edges, onSelectNode]);

  if (nodes.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Crie notas com [[links]] para visualizar o grafo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="rounded-lg border bg-muted/20 w-full" style={{ height }} />
      <p className="text-xs text-muted-foreground">
        Legenda: {Object.entries(NODE_TYPE_LABELS)
          .slice(0, 4)
          .map(([k, v]) => `${v}`)
          .join(" · ")}
        … Clique em um nó para abrir a nota.
      </p>
    </div>
  );
}
