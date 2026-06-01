import { supabase } from "@/integrations/supabase/client";
import { checkAndAwardBadges } from "@/lib/queries";
import { DOCUMENT_MIN_CHARS, KNOWLEDGE_XP, PROCESS_MIN_CHARS } from "./constants";
import { awardKnowledgeXp, maybeAwardContentMilestones } from "./knowledge-xp";
import type { KnowledgeDashboardStats, KnowledgeEdge, KnowledgeNode } from "./types";
import { parseWikiLinks, slugifyTitle, uniqueLinkTargets } from "./wiki-links";
import type { KnowledgeNodeType } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /knowledge_/i.test(error.message ?? "")
  );
}

export function parseKnowledgeNode(row: Record<string, unknown>): KnowledgeNode {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    slug: row.slug as string,
    title: row.title as string,
    content: (row.content as string | null) ?? null,
    node_type: row.node_type as KnowledgeNodeType,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    task_id: (row.task_id as string | null) ?? null,
    project_id: (row.project_id as string | null) ?? null,
    archived_at: (row.archived_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function uniqueSlug(userId: string, base: string, excludeId?: string): Promise<string> {
  let slug = slugifyTitle(base);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const { data } = await db
      .from("knowledge_nodes")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) return candidate;
    n += 1;
  }
}

export async function fetchKnowledgeNodes(userId: string): Promise<KnowledgeNode[]> {
  const { data, error } = await db
    .from("knowledge_nodes")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data ?? []).map(parseKnowledgeNode);
}

export async function fetchKnowledgeNodeById(
  userId: string,
  id: string,
): Promise<KnowledgeNode | null> {
  const { data, error } = await db
    .from("knowledge_nodes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  return data ? parseKnowledgeNode(data) : null;
}

export async function fetchKnowledgeEdges(userId: string): Promise<KnowledgeEdge[]> {
  const { data, error } = await db
    .from("knowledge_edges")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return (data ?? []) as KnowledgeEdge[];
}

export async function fetchBacklinks(
  userId: string,
  nodeId: string,
): Promise<KnowledgeNode[]> {
  const { data: edges, error: eErr } = await db
    .from("knowledge_edges")
    .select("source_id")
    .eq("user_id", userId)
    .eq("target_id", nodeId)
    .eq("edge_type", "link");
  if (eErr) {
    if (isMissingTableError(eErr)) return [];
    throw eErr;
  }
  const sourceIds = [...new Set((edges ?? []).map((e: { source_id: string }) => e.source_id))];
  if (sourceIds.length === 0) return [];
  const { data, error } = await db
    .from("knowledge_nodes")
    .select("*")
    .eq("user_id", userId)
    .in("id", sourceIds)
    .is("archived_at", null);
  if (error) throw error;
  return (data ?? []).map(parseKnowledgeNode);
}

export async function fetchKnowledgeDashboardStats(
  userId: string,
): Promise<KnowledgeDashboardStats> {
  const [nodes, edges] = await Promise.all([
    fetchKnowledgeNodes(userId),
    fetchKnowledgeEdges(userId),
  ]);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const notesThisWeek = nodes.filter((n) => new Date(n.created_at).getTime() >= weekAgo).length;
  const linkEdges = edges.filter((e) => e.edge_type === "link");
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const e of linkEdges) {
    inbound.set(e.target_id, (inbound.get(e.target_id) ?? 0) + 1);
    outbound.set(e.source_id, (outbound.get(e.source_id) ?? 0) + 1);
  }
  let topId: string | null = null;
  let topCount = 0;
  for (const n of nodes) {
    const c = (inbound.get(n.id) ?? 0) + (outbound.get(n.id) ?? 0);
    if (c > topCount) {
      topCount = c;
      topId = n.id;
    }
  }
  const topNode = topId ? nodes.find((n) => n.id === topId) : undefined;
  return {
    totalNotes: nodes.length,
    totalLinks: linkEdges.length,
    notesThisWeek,
    avgLinksPerNote: nodes.length ? Math.round((linkEdges.length / nodes.length) * 10) / 10 : 0,
    topConnected: topNode
      ? { id: topNode.id, title: topNode.title, slug: topNode.slug, count: topCount }
      : null,
  };
}

async function resolveOrCreateTarget(
  userId: string,
  linkTitle: string,
  nodesBySlug: Map<string, KnowledgeNode>,
  nodesByTitle: Map<string, KnowledgeNode>,
): Promise<string> {
  const slug = slugifyTitle(linkTitle);
  const bySlug = nodesBySlug.get(slug);
  if (bySlug) return bySlug.id;
  const byTitle = nodesByTitle.get(linkTitle.toLowerCase());
  if (byTitle) return byTitle.id;

  const newSlug = await uniqueSlug(userId, linkTitle);
  const { data, error } = await db
    .from("knowledge_nodes")
    .insert({
      user_id: userId,
      slug: newSlug,
      title: linkTitle,
      content: "",
      node_type: "note",
      metadata: { stub: true },
    })
    .select()
    .single();
  if (error) throw error;
  const node = parseKnowledgeNode(data);
  nodesBySlug.set(node.slug, node);
  nodesByTitle.set(linkTitle.toLowerCase(), node);
  return node.id;
}

async function syncWikiLinks(
  userId: string,
  sourceId: string,
  content: string | null,
  allNodes: KnowledgeNode[],
): Promise<number> {
  const refs = parseWikiLinks(content);
  const targets = uniqueLinkTargets(refs);
  const nodesBySlug = new Map(allNodes.map((n) => [n.slug, n]));
  const nodesByTitle = new Map(allNodes.map((n) => [n.title.toLowerCase(), n]));

  const { data: existing } = await db
    .from("knowledge_edges")
    .select("id, target_id")
    .eq("user_id", userId)
    .eq("source_id", sourceId)
    .eq("edge_type", "link");
  const existingTargetIds = new Set((existing ?? []).map((e: { target_id: string }) => e.target_id));

  const resolvedTargetIds: string[] = [];
  for (const title of targets) {
    const targetId = await resolveOrCreateTarget(userId, title, nodesBySlug, nodesByTitle);
    if (targetId !== sourceId) resolvedTargetIds.push(targetId);
  }

  await db
    .from("knowledge_edges")
    .delete()
    .eq("user_id", userId)
    .eq("source_id", sourceId)
    .eq("edge_type", "link");

  let newLinks = 0;
  for (const targetId of resolvedTargetIds) {
    const { error } = await db.from("knowledge_edges").insert({
      user_id: userId,
      source_id: sourceId,
      target_id: targetId,
      edge_type: "link",
    });
    if (!error && !existingTargetIds.has(targetId)) newLinks += 1;
  }
  return newLinks;
}

export async function createKnowledgeNode(
  userId: string,
  input: { title: string; content?: string; node_type?: KnowledgeNodeType },
): Promise<KnowledgeNode> {
  const slug = await uniqueSlug(userId, input.title);
  const { data, error } = await db
    .from("knowledge_nodes")
    .insert({
      user_id: userId,
      slug,
      title: input.title.trim() || "Sem título",
      content: input.content ?? "",
      node_type: input.node_type ?? "note",
      metadata: {},
    })
    .select()
    .single();
  if (error) throw error;
  const node = parseKnowledgeNode(data);
  await awardKnowledgeXp(userId, "knowledge_note_created", KNOWLEDGE_XP.note_created);

  const allNodes = await fetchKnowledgeNodes(userId);
  const newLinks = await syncWikiLinks(userId, node.id, node.content, allNodes);
  if (newLinks > 0) {
    await awardKnowledgeXp(userId, "knowledge_link_created", KNOWLEDGE_XP.link_created * newLinks);
  }
  await checkAndAwardBadges(userId);
  return (await fetchKnowledgeNodeById(userId, node.id)) ?? node;
}

export async function updateKnowledgeNode(
  userId: string,
  id: string,
  patch: {
    title?: string;
    content?: string;
    node_type?: KnowledgeNodeType;
  },
): Promise<KnowledgeNode> {
  const current = await fetchKnowledgeNodeById(userId, id);
  if (!current) throw new Error("Nota não encontrada");

  const metadata = { ...current.metadata };
  const nextContent = patch.content !== undefined ? patch.content : current.content;
  const nextType = patch.node_type ?? current.node_type;
  const len = (nextContent ?? "").trim().length;

  if (len >= DOCUMENT_MIN_CHARS && !metadata.document_xp_awarded) {
    metadata.document_xp_awarded = true;
    await awardKnowledgeXp(userId, "knowledge_document", KNOWLEDGE_XP.document_milestone);
  }
  if (nextType === "process" && len >= PROCESS_MIN_CHARS && !metadata.process_xp_awarded) {
    metadata.process_xp_awarded = true;
    await awardKnowledgeXp(userId, "knowledge_process", KNOWLEDGE_XP.process_milestone);
  }

  const updates: Record<string, unknown> = { metadata };
  if (patch.title !== undefined) {
    updates.title = patch.title.trim() || "Sem título";
    if (patch.title.trim() && slugifyTitle(patch.title) !== current.slug) {
      updates.slug = await uniqueSlug(userId, patch.title, id);
    }
  }
  if (patch.content !== undefined) updates.content = patch.content;
  if (patch.node_type !== undefined) updates.node_type = patch.node_type;

  const { error } = await db.from("knowledge_nodes").update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;

  const allNodes = await fetchKnowledgeNodes(userId);
  const newLinks = await syncWikiLinks(userId, id, nextContent, allNodes);
  if (newLinks > 0) {
    await awardKnowledgeXp(userId, "knowledge_link_created", KNOWLEDGE_XP.link_created * newLinks);
  }
  await checkAndAwardBadges(userId);
  const updated = await fetchKnowledgeNodeById(userId, id);
  if (!updated) throw new Error("Falha ao recarregar nota");
  return updated;
}

export async function archiveKnowledgeNode(userId: string, id: string): Promise<void> {
  const { error } = await db
    .from("knowledge_nodes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteKnowledgeNode(userId: string, id: string): Promise<void> {
  const { error } = await db
    .from("knowledge_nodes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function searchKnowledgeNodes(
  userId: string,
  query: string,
): Promise<KnowledgeNode[]> {
  const nodes = await fetchKnowledgeNodes(userId);
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      (n.content ?? "").toLowerCase().includes(q) ||
      n.slug.includes(q),
  );
}
