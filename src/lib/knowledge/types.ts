import type { KnowledgeNodeType } from "./constants";

export type KnowledgeNode = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  content: string | null;
  node_type: KnowledgeNodeType;
  metadata: Record<string, unknown>;
  task_id: string | null;
  project_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeEdge = {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  edge_type: "link" | "parent" | "related";
  created_at: string;
};

export type KnowledgeDashboardStats = {
  totalNotes: number;
  totalLinks: number;
  notesThisWeek: number;
  avgLinksPerNote: number;
  topConnected: { id: string; title: string; slug: string; count: number } | null;
};
