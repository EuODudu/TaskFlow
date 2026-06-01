import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeDashboard } from "@/components/knowledge/knowledge-dashboard";

export const Route = createFileRoute("/_app/knowledge/")({
  component: KnowledgeDashboard,
});
