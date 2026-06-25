import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { type Core } from "cytoscape";
import { LayoutGrid } from "lucide-react";
import type { KnowledgeEdge, KnowledgeNode } from "@/lib/knowledge/types";
import { NODE_TYPE_LABELS } from "@/lib/knowledge/constants";
import {
  clearGraphLayout,
  loadGraphLayout,
  mergeNodeMetadataPositions,
  saveGraphLayout,
} from "@/lib/knowledge/graph-layout";
import { Button } from "@/components/ui/button";

const TYPE_COLORS: Record<string, string> = {
  note: "#38bdf8",
  task: "#60a5fa",
  project: "#34d399",
  process: "#fb923c",
  area: "#c084fc",
  resource: "#2dd4bf",
  daily: "#f472b6",
  template: "#cbd5e1",
};

const NEURAL_EDGE_COLORS = ["#38bdf8", "#818cf8", "#fb7185", "#f97316"];

const COSE_LAYOUT = {
  name: "cose",
  animate: true,
  animationDuration: 900,
  padding: 70,
  nodeRepulsion: 9000,
  idealEdgeLength: 110,
  edgeElasticity: 100,
  gravity: 0.22,
  numIter: 1200,
  randomize: false,
};

type Props = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  userId?: string;
  onSelectNode?: (id: string) => void;
  height?: number;
};

function persistLayout(cy: Core, userId: string) {
  const positions: Record<string, { x: number; y: number }> = {};
  cy.nodes().forEach((node) => {
    const p = node.position();
    positions[node.id()] = { x: p.x, y: p.y };
  });
  saveGraphLayout(userId, {
    positions,
    zoom: cy.zoom(),
    pan: cy.pan(),
  });
}

function applyViewport(cy: Core, userId: string) {
  const saved = loadGraphLayout(userId);
  if (saved?.zoom != null && saved?.pan) {
    cy.zoom(saved.zoom);
    cy.pan(saved.pan);
  } else {
    cy.fit(undefined, 70);
  }
}

export function KnowledgeGraph({ nodes, edges, userId, onSelectNode, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelectNode);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layoutReset, setLayoutReset] = useState(0);

  onSelectRef.current = onSelectNode;

  const graphKey = useMemo(
    () =>
      `${nodes
        .map((n) => n.id)
        .sort()
        .join(",")}|${edges
        .filter((e) => e.edge_type === "link")
        .map((e) => e.id)
        .sort()
        .join(",")}`,
    [nodes, edges],
  );

  const scheduleSave = useCallback(
    (cy: Core) => {
      if (!userId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persistLayout(cy, userId), 400);
    },
    [userId],
  );

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0 || !userId) return;

    const linkEdges = edges.filter((e) => e.edge_type === "link");
    const elements = [
      ...nodes.map((n) => ({
        classes: "neuron",
        data: {
          id: n.id,
          label: n.title.length > 24 ? `${n.title.slice(0, 22)}…` : n.title,
          type: n.node_type,
          color: TYPE_COLORS[n.node_type] ?? "#6366f1",
        },
      })),
      ...linkEdges.flatMap((e, index) => {
        const color = NEURAL_EDGE_COLORS[index % NEURAL_EDGE_COLORS.length];
        return [
          {
            classes: "synapse-glow",
            data: { id: `${e.id}-glow`, source: e.source_id, target: e.target_id, color },
          },
          {
            classes: "synapse",
            data: { id: e.id, source: e.source_id, target: e.target_id, color },
          },
        ];
      }),
    ];

    const forceReorganize = layoutReset > 0;
    if (forceReorganize) clearGraphLayout(userId);

    cyRef.current?.destroy();
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node.neuron",
          style: {
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 9,
            "font-size": 9,
            "font-weight": 700,
            color: "#e0f2fe",
            "text-outline-width": 3,
            "text-outline-color": "#020617",
            width: 34,
            height: 34,
            "background-color": "data(color)",
            "background-opacity": 0.95,
            "border-width": 2,
            "border-color": "#f8fafc",
            "border-opacity": 0.55,
            "shadow-blur": 22,
            "shadow-color": "data(color)",
            "shadow-opacity": 0.95,
            "shadow-offset-x": 0,
            "shadow-offset-y": 0,
          },
        },
        {
          selector: "edge.synapse-glow",
          style: {
            width: 9,
            "line-color": "data(color)",
            "curve-style": "unbundled-bezier",
            "control-point-distances": "48 -42 24",
            "control-point-weights": "0.18 0.52 0.82",
            opacity: 0.18,
            "line-cap": "round",
            "line-style": "solid",
          },
        },
        {
          selector: "edge.synapse",
          style: {
            width: 2,
            "line-color": "data(color)",
            "target-arrow-color": "data(color)",
            "target-arrow-shape": "vee",
            "target-arrow-fill": "filled",
            "arrow-scale": 0.75,
            "curve-style": "unbundled-bezier",
            "control-point-distances": "48 -42 24",
            "control-point-weights": "0.18 0.52 0.82",
            opacity: 0.86,
            "line-cap": "round",
          },
        },
        {
          selector: "edge.synapse:selected",
          style: {
            width: 3.5,
            opacity: 1,
            "line-color": "#f8fafc",
            "target-arrow-color": "#f8fafc",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 4,
            "border-color": "#fbbf24",
            "shadow-blur": 34,
            "shadow-color": "#f97316",
          },
        },
      ],
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    });

    cy.nodes().grabify();

    const saved = forceReorganize ? null : loadGraphLayout(userId);
    const positions = forceReorganize ? {} : mergeNodeMetadataPositions(nodes, saved);

    cy.nodes().forEach((ele) => {
      const pos = positions[ele.id()];
      if (pos) ele.position(pos);
    });

    const unpositioned = cy.nodes().filter((node) => !positions[node.id()]);

    const runAutoLayout = () => {
      const layout = cy.layout(COSE_LAYOUT);
      layout.on("layoutstop", () => {
        persistLayout(cy, userId);
        applyViewport(cy, userId);
      });
      layout.run();
    };

    if (forceReorganize || unpositioned.length === cy.nodes().length) {
      runAutoLayout();
    } else {
      if (unpositioned.length > 0) {
        const extent = cy.extent();
        const cx = (extent.x1 + extent.x2) / 2;
        const cyCenter = (extent.y1 + extent.y2) / 2;
        unpositioned.forEach((node, index) => {
          const angle = (2 * Math.PI * index) / unpositioned.length;
          node.position({
            x: cx + 120 * Math.cos(angle),
            y: cyCenter + 120 * Math.sin(angle),
          });
        });
        persistLayout(cy, userId);
      }
      applyViewport(cy, userId);
    }

    cy.on("dragfree", "node", () => scheduleSave(cy));
    cy.on("pan zoom", () => scheduleSave(cy));
    cy.on("tap", "node", (evt) => onSelectRef.current?.(evt.target.id()));

    cyRef.current = cy;

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      cy.destroy();
      cyRef.current = null;
    };
  }, [graphKey, userId, layoutReset, nodes, edges, scheduleSave]);

  useEffect(() => {
    cyRef.current?.resize();
  }, [height]);

  const handleReorganize = () => setLayoutReset((value) => value + 1);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Arraste os nós para organizar. O layout é salvo automaticamente neste navegador.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleReorganize}>
          <LayoutGrid className="size-4 mr-1.5" />
          Reorganizar
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950 shadow-2xl shadow-cyan-950/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(248,113,113,0.34),transparent_24%),radial-gradient(circle_at_72%_18%,rgba(56,189,248,0.24),transparent_25%),radial-gradient(circle_at_50%_78%,rgba(129,140,248,0.22),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-8 size-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div ref={containerRef} className="relative z-10 w-full" style={{ height }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Legenda: {Object.entries(NODE_TYPE_LABELS)
          .slice(0, 4)
          .map(([, v]) => `${v}`)
          .join(" · ")}
        … Clique em um nó para abrir a nota.
      </p>
    </div>
  );
}
