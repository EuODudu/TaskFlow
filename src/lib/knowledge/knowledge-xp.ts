import { supabase } from "@/integrations/supabase/client";
import { KNOWLEDGE_XP } from "./constants";

const COINS_PER_XP = 0.5;

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /knowledge_/i.test(error.message ?? "")
  );
}

export async function awardKnowledgeXp(
  userId: string,
  reason: string,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  const coins = Math.max(1, Math.floor(amount * COINS_PER_XP));

  const { error: xpErr } = await supabase.from("xp_events").insert({
    user_id: userId,
    amount,
    reason,
  });
  if (xpErr && !isMissingTableError(xpErr)) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, coins")
    .eq("id", userId)
    .single();
  if (!profile) return;

  await supabase
    .from("profiles")
    .update({ xp: profile.xp + amount, coins: profile.coins + coins })
    .eq("id", userId);
}

export async function maybeAwardContentMilestones(
  userId: string,
  nodeType: string,
  content: string | null | undefined,
  metadata: Record<string, unknown>,
): Promise<void> {
  const len = (content ?? "").trim().length;
  if (len >= 500 && !metadata.document_xp_awarded) {
    await awardKnowledgeXp(userId, "knowledge_document", KNOWLEDGE_XP.document_milestone);
  }
  if (nodeType === "process" && len >= 200 && !metadata.process_xp_awarded) {
    await awardKnowledgeXp(userId, "knowledge_process", KNOWLEDGE_XP.process_milestone);
  }
}
