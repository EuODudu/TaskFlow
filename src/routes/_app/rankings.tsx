import { createFileRoute } from "@tanstack/react-router";
import { useLeaderboard } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { getLevelFromXP, getRankFromLevel, formatXP } from "@/lib/gamification";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rankings")({ component: RankingsPage });

function RankingsPage() {
  const { user } = useAuth();
  const { data: leaderboard = [], isLoading } = useLeaderboard();

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking Global</h1>
        <p className="text-muted-foreground text-sm mt-1">Top produtores da plataforma</p>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Carregando ranking…</div>
      )}

      {!isLoading && leaderboard.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <p className="text-3xl mb-2">🏆</p>
          <p>Nenhum usuário no ranking ainda.</p>
          <p className="text-xs mt-1">Complete tarefas para aparecer aqui!</p>
        </Card>
      )}

      <div className="space-y-2">
        {leaderboard.map((entry, i) => {
          const isMe = entry.id === user?.id;
          const rank = getRankFromLevel(getLevelFromXP(entry.xp));
          const fakeAvatar = {
            user_id: entry.id, face_emoji: entry.face_emoji, bg_color: entry.bg_color,
            accessory_emoji: null, pet_emoji: null, updated_at: "",
          };

          return (
            <Card
              key={entry.id}
              className={cn(
                "px-4 py-3 flex items-center gap-4 transition-all",
                isMe && "ring-2 ring-primary/50 bg-primary/5",
                i === 0 && "bg-amber-500/5 ring-1 ring-amber-500/30",
              )}
            >
              <span className="w-7 text-center text-lg font-bold text-muted-foreground">
                {i < 3 ? MEDALS[i] : `${i + 1}`}
              </span>
              <Avatar2D avatar={fakeAvatar as any} size="sm" animate={false} />
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm truncate", isMe && "text-primary")}>
                  {entry.full_name ?? "Usuário"} {isMe && <span className="text-xs font-normal">(você)</span>}
                </p>
                <p className="text-xs text-muted-foreground" style={{ color: rank.color }}>
                  {rank.emoji} {rank.title}
                </p>
              </div>
              <div className="text-right shrink-0">
                <LevelBadge xp={entry.xp} size="xs" />
                <p className="text-xs text-muted-foreground mt-0.5">{formatXP(entry.xp)} XP</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs font-medium">🔥 {entry.streak_days}d</p>
                <p className="text-xs text-muted-foreground">💰 {entry.coins}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {leaderboard.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Mostrando top {leaderboard.length} usuários • Atualizado em tempo real
        </p>
      )}
    </div>
  );
}
