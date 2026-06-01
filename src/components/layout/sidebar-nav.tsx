import { Link, useRouterState } from "@tanstack/react-router";
import {
  CheckSquare,
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Folder,
  Sparkles,
  Star,
  Trophy,
  ShoppingBag,
  Medal,
  User,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUI } from "@/lib/stores";
import { useProjects, useInvalidate, useProfile } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LevelBadge } from "@/components/gamification/level-badge";
import { getLevelProgress } from "@/lib/gamification";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { useUserAvatar } from "@/lib/queries";

const mainNav = [
  { to: "/dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { to: "/board",        label: "Kanban",          icon: KanbanSquare    },
  { to: "/calendar",     label: "Calendário",      icon: Calendar        },
  { to: "/knowledge",    label: "Conhecimento",    icon: BookOpen        },
  { to: "/settings",     label: "Configurações",   icon: Settings        },
];

const gameNav = [
  { to: "/profile",      label: "Meu Perfil",      icon: User            },
  { to: "/rankings",     label: "Ranking",          icon: Trophy          },
  { to: "/achievements", label: "Conquistas",       icon: Medal           },
  { to: "/store",        label: "Loja",             icon: ShoppingBag     },
];

export function SidebarNav() {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  const selectedProjectId = useUI((s) => s.selectedProjectId);
  const setSelectedProjectId = useUI((s) => s.setSelectedProjectId);
  const { data: projects = [] } = useProjects();
  const inv = useInvalidate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: avatar } = useUserAvatar(user?.id);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  const createProject = async () => {
    if (!name.trim() || !user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ owner_id: user.id, name: name.trim(), color, position: projects.length })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await supabase.from("board_columns").insert([
      { project_id: data.id, name: "Backlog",      position: 0, color: "#94a3b8", default_status: "backlog" },
      { project_id: data.id, name: "A Fazer",      position: 1, color: "#3b82f6", default_status: "todo" },
      { project_id: data.id, name: "Em Andamento", position: 2, color: "#f59e0b", default_status: "in_progress" },
      { project_id: data.id, name: "Em Revisão",   position: 3, color: "#a855f7", default_status: "in_review" },
      { project_id: data.id, name: "Concluído",    position: 4, color: "#10b981", default_status: "done" },
    ]);
    inv.projects();
    setSelectedProjectId(data.id);
    setName("");
    setOpen(false);
    toast.success("Projeto criado");
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200",
      )}
      style={{ width: collapsed ? 72 : 264 }}
    >
      <div className="h-16 px-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0">
          <CheckSquare className="size-5" />
        </div>
        {!collapsed && <span className="font-semibold tracking-tight">TaskFlow</span>}
        <Button variant="ghost" size="icon" className="ml-auto size-8" onClick={toggle}>
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      <nav className="p-3 space-y-1">
        {mainNav.map((item) => {
          const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Gamification nav */}
      <div className="px-3 mt-1">
        {!collapsed && (
          <span className="text-[10px] font-semibold uppercase text-sidebar-foreground/40 tracking-wider px-3">
            Progresso
          </span>
        )}
        <div className="mt-1 space-y-0.5">
          {gameNav.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Level chip + mini avatar */}
      {!collapsed && profile && (
        <div className="mx-3 mt-2 px-2 py-2 rounded-lg bg-sidebar-accent/40 flex items-center gap-2">
          <div className="shrink-0">
            <Avatar2D avatar={avatar as any} size="xs" animate={false} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <LevelBadge xp={profile.xp} size="xs" />
              <span className="text-[10px] text-amber-500 shrink-0">💰{profile.coins}</span>
            </div>
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(getLevelProgress(profile.xp) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="px-3 mt-2 flex items-center justify-between">
        {!collapsed && <span className="text-xs font-semibold uppercase text-sidebar-foreground/50 tracking-wider">Projetos</span>}
        <Button variant="ghost" size="icon" className="size-7 ml-auto" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-2 mt-1 space-y-0.5">
        {projects.map((p) => {
          const active = selectedProjectId === p.id;
          return (
            <Link
              key={p.id}
              to="/board"
              onClick={() => setSelectedProjectId(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="size-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
              {!collapsed && <span className="truncate flex-1">{p.name}</span>}
              {!collapsed && p.is_favorite && <Star className="size-3 fill-current text-amber-400" />}
            </Link>
          );
        })}
        {projects.length === 0 && !collapsed && (
          <p className="text-xs text-muted-foreground px-3 py-2">Sem projetos ainda.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Estudos" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#3b82f6", "#ec4899"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn("size-7 rounded-md border-2", color === c ? "border-foreground" : "border-transparent")}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={createProject}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}