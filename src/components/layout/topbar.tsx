import { useAuth } from "@/lib/auth";
import { useProfile, useUserAvatar } from "@/lib/queries";
import { useTheme } from "@/lib/theme";
import { useUI } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Moon, Sun, LogOut, Settings as SettingsIcon, Trophy, User as UserIcon, ShoppingBag } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Avatar2D } from "@/components/gamification/avatar-2d";

export function Topbar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: avatar } = useUserAvatar(user?.id);
  const { theme, toggle } = useTheme();
  const searchQuery = useUI((s) => s.searchQuery);
  const setSearchQuery = useUI((s) => s.setSearchQuery);
  const nav = useNavigate();

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3 px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar tarefas, notas, eventos…"
          className="pl-10 bg-muted/40 border-transparent focus-visible:bg-background"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {profile && (
          <Link to="/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors">
            <LevelBadge xp={profile.xp} size="xs" />
            <span className="text-xs text-muted-foreground">💰 {profile.coins}</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} title="Alternar tema">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl hover:bg-accent p-1.5 pr-3 transition-colors border border-transparent hover:border-border">
              <div className="size-8 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                <Avatar2D avatar={avatar as any} size="xs" animate={false} />
              </div>
              <span className="hidden md:inline text-sm font-medium">{profile?.full_name ?? user?.email}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile"><UserIcon className="size-4 mr-2" /> Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/rankings"><Trophy className="size-4 mr-2" /> Ranking</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/store"><ShoppingBag className="size-4 mr-2" /> Loja</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings"><SettingsIcon className="size-4 mr-2" /> Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); nav({ to: "/auth" }); }}>
              <LogOut className="size-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}