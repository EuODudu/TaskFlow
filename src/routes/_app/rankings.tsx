import { createFileRoute } from "@tanstack/react-router";
import { useLeaderboard, type LeaderboardEntry } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { getLevelFromXP, getRankFromLevel, formatXP } from "@/lib/gamification";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Medal, RefreshCw, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/_app/rankings")({ component: RankingsPage });

function RankingsPage() {
  const { user } = useAuth();
  const { data: leaderboard = [], isLoading, isError, error, refetch, isFetching } = useLeaderboard();

  const MEDALS = ["🥇", "🥈", "🥉"];
  const currentUserEntry = leaderboard.find((entry) => entry.id === user?.id);
  const topEntries = leaderboard.filter((entry) => entry.rank_position <= 50);
  const podium = topEntries.slice(0, 3);
  const totalUsers = leaderboard[0]?.total_users ?? currentUserEntry?.total_users ?? leaderboard.length;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ranking Global</h1>
          <p className="text-muted-foreground text-sm mt-1">Top produtores da plataforma por XP acumulado.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Carregando ranking…</div>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 p-5">
          <p className="font-semibold text-destructive">Ranking indisponível</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error && /get_leaderboard/i.test(error.message)
              ? "Execute a migration de ranking no Supabase para habilitar a classificação global."
              : error instanceof Error ? error.message : "Não foi possível carregar o ranking agora."}
          </p>
        </Card>
      )}

      {!isLoading && !isError && leaderboard.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <p className="text-3xl mb-2">🏆</p>
          <p>Nenhum usuário no ranking ainda.</p>
          <p className="text-xs mt-1">Complete tarefas para aparecer aqui!</p>
        </Card>
      )}

      {!isLoading && !isError && leaderboard.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard icon={Trophy} label="Líder" value={podium[0]?.full_name ?? "Usuário"} hint={`${formatXP(podium[0]?.xp ?? 0)} XP`} />
          <SummaryCard icon={Users} label="Participantes" value={String(totalUsers)} hint="usuários ranqueados" />
          <SummaryCard
            icon={Medal}
            label="Sua posição"
            value={currentUserEntry ? `#${currentUserEntry.rank_position}` : "Fora do top"}
            hint={currentUserEntry ? `${formatXP(currentUserEntry.xp)} XP` : "Ganhe XP para entrar"}
          />
        </div>
      )}

      {currentUserEntry && currentUserEntry.rank_position > 50 && (
        <RankingRow entry={currentUserEntry} rankIndex={currentUserEntry.rank_position - 1} isMe medal={null} highlight />
      )}

      <div className="space-y-2">
        {topEntries.map((entry, i) => {
          const isMe = entry.id === user?.id;
          return (
            <RankingRow
              key={entry.id}
              entry={entry}
              rankIndex={entry.rank_position - 1}
              isMe={isMe}
              medal={i < 3 ? MEDALS[i] : null}
            />
          );
        })}
      </div>

      {!isError && leaderboard.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Mostrando top {topEntries.length} de {totalUsers} usuários • Atualiza automaticamente
        </p>
      )}
    </div>
  );
}

function RankingRow({
  entry,
  rankIndex,
  isMe,
  medal,
  highlight = false,
}: {
  entry: LeaderboardEntry;
  rankIndex: number;
  isMe: boolean;
  medal: string | null;
  highlight?: boolean;
}) {
  const rank = getRankFromLevel(getLevelFromXP(entry.xp));
  const fakeAvatar = {
    user_id: entry.id,
    face_emoji: entry.face_emoji,
    bg_color: entry.bg_color,
    accessory_emoji: null,
    pet_emoji: null,
    updated_at: "",
  };

  return (
    <Card
      className={cn(
        "px-4 py-3 flex items-center gap-4 transition-all",
        isMe && "ring-2 ring-primary/50 bg-primary/5",
        rankIndex === 0 && "bg-amber-500/5 ring-1 ring-amber-500/30",
        highlight && "border-primary/35",
      )}
    >
      <span className="w-8 text-center text-lg font-bold text-muted-foreground">
        {medal ?? `#${entry.rank_position}`}
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
        <p className="text-xs font-medium">✅ {entry.tasks_completed}</p>
        <p className="text-xs text-muted-foreground">🔥 {entry.streak_days}d • 💰 {entry.coins}</p>
      </div>
    </Card>
  );
}

function SummaryCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </Card>
  );
}
