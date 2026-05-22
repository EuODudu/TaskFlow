import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProfile, useInvalidate } from "@/lib/queries";
import { useTheme } from "@/lib/theme";
import { usePomodoro } from "@/lib/stores";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const inv = useInvalidate();
  const { theme, setTheme } = useTheme();
  const pomo = usePomodoro();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setAvatar(profile.avatar_url ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: name, avatar_url: avatar || null, theme }, { onConflict: "id" });
    if (error) return toast.error(error.message);
    inv.profile();
    toast.success("Perfil atualizado");
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      <Card className="p-6 space-y-5">
        <h2 className="font-semibold">Perfil</h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-16"><AvatarImage src={avatar} /><AvatarFallback>{(name || user?.email || "?")[0]?.toUpperCase()}</AvatarFallback></Avatar>
          <div className="flex-1 space-y-2">
            <Label>URL do avatar</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <Button onClick={save}>Salvar perfil</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Aparência</h2>
        <div className="flex gap-2">
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
            <Sun className="size-4 mr-2" /> Claro
          </Button>
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
            <Moon className="size-4 mr-2" /> Escuro
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Pomodoro</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2"><Label>Foco (min)</Label><Input type="number" value={pomo.focusMinutes} onChange={(e) => pomo.setSettings({ focusMinutes: +e.target.value || 25 })} /></div>
          <div className="space-y-2"><Label>Pausa curta</Label><Input type="number" value={pomo.shortBreakMinutes} onChange={(e) => pomo.setSettings({ shortBreakMinutes: +e.target.value || 5 })} /></div>
          <div className="space-y-2"><Label>Pausa longa</Label><Input type="number" value={pomo.longBreakMinutes} onChange={(e) => pomo.setSettings({ longBreakMinutes: +e.target.value || 15 })} /></div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="sound">Som ao terminar ciclo</Label>
          <Switch id="sound" checked={pomo.soundEnabled} onCheckedChange={(v) => pomo.setSettings({ soundEnabled: v })} />
        </div>
      </Card>
    </div>
  );
}