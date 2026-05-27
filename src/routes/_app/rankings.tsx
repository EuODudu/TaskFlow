import { createFileRoute } from "@tanstack/react-router";
import { useLeaderboard, type LeaderboardEntry, type UserAvatar } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { getLevelFromXP, getRankFromLevel, formatXP } from "@/lib/gamification";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import { Crown, Flame, Medal, RefreshCw, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/_app/rankings")({ component: RankingsPage });

function RankingsPage() {
  const { user } = useAuth();
  const {
    data: leaderboard = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useLeaderboard();

  const MEDALS = ["🥇", "🥈", "🥉"];
  const currentUserEntry = leaderboard.find((entry) => entry.id === user?.id);
  const topEntries = leaderboard.filter((entry) => entry.rank_position <= 50);
  const podium = topEntries.slice(0, 3);
  const remainingEntries = topEntries.slice(3);
  const totalUsers =
    leaderboard[0]?.total_users ?? currentUserEntry?.total_users ?? leaderboard.length;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
              <Sparkles className="size-3.5" />
              Ranking global
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hall da Produtividade</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Compare XP, sequência e tarefas concluídas com os usuários mais ativos.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-background/70"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {!isLoading && !isError && leaderboard.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={Crown}
              label="Líder"
              value={podium[0]?.full_name ?? "Usuário"}
              hint={`${formatXP(podium[0]?.xp ?? 0)} XP`}
            />
            <SummaryCard
              icon={Users}
              label="Participantes"
              value={String(totalUsers)}
              hint="usuários ranqueados"
            />
            <SummaryCard
              icon={Medal}
              label="Sua posição"
              value={currentUserEntry ? `#${currentUserEntry.rank_position}` : "Fora do top"}
              hint={
                currentUserEntry ? `${formatXP(currentUserEntry.xp)} XP` : "Ganhe XP para entrar"
              }
            />
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pódio</h2>
          <p className="text-muted-foreground text-sm">Os três primeiros colocados em destaque.</p>
        </div>
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
              : error instanceof Error
                ? error.message
                : "Não foi possível carregar o ranking agora."}
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
        <div className="grid gap-3 md:grid-cols-3">
          {podium.map((entry, index) => (
            <PodiumCard
              key={entry.id}
              entry={entry}
              medal={MEDALS[index]}
              isMe={entry.id === user?.id}
              featured={index === 0}
            />
          ))}
        </div>
      )}

      {currentUserEntry && currentUserEntry.rank_position > 50 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Sua colocação</p>
          <RankingRow
            entry={currentUserEntry}
            rankIndex={currentUserEntry.rank_position - 1}
            isMe
            medal={null}
            highlight
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Classificação</h2>
            <p className="text-muted-foreground text-sm">
              Demais posições do top {topEntries.length}.
            </p>
          </div>
          <div className="hidden items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:flex">
            <Flame className="size-3.5" />
            XP + sequência definem desempate
          </div>
        </div>

        {remainingEntries.map((entry) => {
          const isMe = entry.id === user?.id;
          return (
            <RankingRow
              key={entry.id}
              entry={entry}
              rankIndex={entry.rank_position - 1}
              isMe={isMe}
              medal={null}
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

type LeaderboardAvatar = UserAvatar & {
  skin_tone?: string;
  hair_color?: string;
  hair_style?: string;
  clothes_color?: string;
  accessory_head?: string | null;
  accessory_face?: string | null;
  accessory_back?: string | null;
  accessory_hand?: string | null;
  accessory_chest?: string | null;
  aura_emoji?: string | null;
  pose?: string | null;
};

function buildLeaderboardAvatar(entry: LeaderboardEntry): LeaderboardAvatar {
  return {
    user_id: entry.id,
    face_emoji: entry.face_emoji ?? "🧑",
    bg_color: entry.bg_color ?? "#6366f1",
    accessory_emoji: entry.accessory_emoji ?? null,
    pet_emoji: entry.pet_emoji ?? null,
    updated_at: "",
    skin_tone: entry.skin_tone ?? undefined,
    hair_color: entry.hair_color ?? undefined,
    hair_style: entry.hair_style ?? undefined,
    clothes_color: entry.clothes_color ?? undefined,
    accessory_head: entry.accessory_head ?? null,
    accessory_face: entry.accessory_face ?? null,
    accessory_back: entry.accessory_back ?? null,
    accessory_hand: entry.accessory_hand ?? null,
    accessory_chest: entry.accessory_chest ?? null,
    aura_emoji: entry.aura_emoji ?? null,
    pose: entry.pose ?? "idle",
  };
}

function PodiumCard({
  entry,
  medal,
  isMe,
  featured,
}: {
  entry: LeaderboardEntry;
  medal: string;
  isMe: boolean;
  featured: boolean;
}) {
  const rank = getRankFromLevel(getLevelFromXP(entry.xp));
  const avatar = buildLeaderboardAvatar(entry);

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 text-center transition-all",
        featured && "border-amber-500/40 bg-amber-500/5 shadow-sm",
        isMe && "ring-2 ring-primary/50 bg-primary/5",
      )}
    >
      <div className="absolute right-3 top-3 text-3xl">{medal}</div>
      <div className="mx-auto mb-3 grid size-24 place-items-center rounded-full bg-background/80 ring-1 ring-border">
        <Avatar2D avatar={avatar} size="lg" animate={false} />
      </div>
      <p className={cn("truncate font-semibold", isMe && "text-primary")}>
        {entry.full_name ?? "Usuário"} {isMe && <span className="text-xs font-normal">(você)</span>}
      </p>
      <p className="text-xs text-muted-foreground" style={{ color: rank.color }}>
        {rank.emoji} {rank.title}
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <LevelBadge xp={entry.xp} size="xs" />
        <span className="text-sm font-semibold">{formatXP(entry.xp)} XP</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span className="rounded-lg bg-muted/70 px-2 py-1">✅ {entry.tasks_completed} tarefas</span>
        <span className="rounded-lg bg-muted/70 px-2 py-1">🔥 {entry.streak_days} dias</span>
      </div>
    </Card>
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
  const avatar = buildLeaderboardAvatar(entry);

  return (
    <Card
      className={cn(
        "px-4 py-3 flex items-center gap-4 transition-all hover:border-primary/30 hover:bg-muted/30",
        isMe && "ring-2 ring-primary/50 bg-primary/5",
        rankIndex === 0 && "bg-amber-500/5 ring-1 ring-amber-500/30",
        highlight && "border-primary/35",
      )}
    >
      <span className="w-8 text-center text-lg font-bold text-muted-foreground">
        {medal ?? `#${entry.rank_position}`}
      </span>
      <div className="grid size-14 place-items-center rounded-full bg-muted/60">
        <Avatar2D avatar={avatar} size="sm" animate={false} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm truncate", isMe && "text-primary")}>
          {entry.full_name ?? "Usuário"}{" "}
          {isMe && <span className="text-xs font-normal">(você)</span>}
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
        <p className="text-xs text-muted-foreground">
          🔥 {entry.streak_days}d • 💰 {entry.coins}
        </p>
      </div>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-background/60 bg-background/70 p-4">
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
