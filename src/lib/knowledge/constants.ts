export const KNOWLEDGE_NODE_TYPES = [
  "note",
  "task",
  "project",
  "process",
  "area",
  "resource",
  "daily",
  "template",
] as const;

export type KnowledgeNodeType = (typeof KNOWLEDGE_NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<KnowledgeNodeType, string> = {
  note: "Nota",
  task: "Tarefa",
  project: "Projeto",
  process: "Processo",
  area: "Área",
  resource: "Recurso",
  daily: "Diário",
  template: "Modelo",
};

export const KNOWLEDGE_XP = {
  note_created: 20,
  link_created: 5,
  document_milestone: 50,
  process_milestone: 100,
} as const;

export const DOCUMENT_MIN_CHARS = 500;
export const PROCESS_MIN_CHARS = 200;
