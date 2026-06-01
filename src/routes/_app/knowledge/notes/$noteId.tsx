import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeNoteEditor } from "@/components/knowledge/knowledge-note-editor";

export const Route = createFileRoute("/_app/knowledge/notes/$noteId")({
  component: NotePage,
});

function NotePage() {
  const { noteId } = Route.useParams();
  return <KnowledgeNoteEditor noteId={noteId} />;
}
