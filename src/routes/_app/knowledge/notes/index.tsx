import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeNotesList } from "@/components/knowledge/knowledge-notes-list";

export const Route = createFileRoute("/_app/knowledge/notes/")({
  component: KnowledgeNotesList,
});
