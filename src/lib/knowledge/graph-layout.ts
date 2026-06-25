import type { KnowledgeNode } from "./types";

const STORAGE_PREFIX = "tf-knowledge-graph-layout:";

export type GraphLayoutState = {
  positions: Record<string, { x: number; y: number }>;
  zoom?: number;
  pan?: { x: number; y: number };
};

export function loadGraphLayout(userId: string): GraphLayoutState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GraphLayoutState;
    if (!parsed?.positions || typeof parsed.positions !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGraphLayout(userId: string, state: GraphLayoutState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(state));
  } catch {
    // quota / private mode
  }
}

export function clearGraphLayout(userId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch {
    // ignore
  }
}

export function mergeNodeMetadataPositions(
  nodes: KnowledgeNode[],
  saved: GraphLayoutState | null,
): Record<string, { x: number; y: number }> {
  const positions = { ...(saved?.positions ?? {}) };
  for (const node of nodes) {
    if (positions[node.id]) continue;
    const x = node.metadata?.graph_x;
    const y = node.metadata?.graph_y;
    if (typeof x === "number" && typeof y === "number") {
      positions[node.id] = { x, y };
    }
  }
  return positions;
}
