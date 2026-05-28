import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Edit3, Maximize2, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import type { OfficeTheme } from "../office-themes";
import type { AvatarItem } from "@/lib/queries";

type RoomControlsProps = {
  isEditing: boolean;
  onToggleEdit: () => void;
  theme: OfficeTheme;
  themeItem?: AvatarItem | null;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
};

export function RoomControls({
  isEditing,
  onToggleEdit,
  theme,
  themeItem,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}: RoomControlsProps) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/20 bg-card/70 p-4 shadow-2xl backdrop-blur-xl sm:flex sm:items-center sm:justify-between gap-3"
      style={{ boxShadow: `0 18px 60px ${theme.shadow}18, inset 0 1px 0 #ffffff33` }}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_42%,rgba(255,255,255,0.08))]" />
      <div>
        <p className="relative text-sm font-semibold flex items-center gap-2">
          <span
            className="grid size-8 place-items-center rounded-2xl border border-white/25 shadow-lg"
            style={{ background: `${theme.glow}25`, boxShadow: `0 0 28px ${theme.glow}35` }}
          >
            <Sparkles className="size-4" style={{ color: theme.accent }} />
          </span>
          Tema: {themeItem?.name ?? theme.name}
        </p>
        <p className="relative mt-1 text-xs text-muted-foreground">
          {isEditing
            ? "Arraste a cena • Zoom com botões • Piso, parede, mesa e tapetes."
            : "Construtor de ambiente — estilo My Dream Setup."}
        </p>
      </div>
      <div className="relative flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
        <div className="flex items-center rounded-2xl border border-white/15 bg-background/50 p-0.5 shadow-inner">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-xl"
            onClick={onZoomOut}
            title="Diminuir zoom"
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="px-2 text-[10px] font-medium tabular-nums text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-xl"
            onClick={onZoomIn}
            title="Aumentar zoom"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-xl"
            onClick={onResetView}
            title="Resetar visão"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant={isEditing ? "default" : "outline"}
          onClick={onToggleEdit}
          className={cn(
            "gap-2 rounded-2xl border-white/20 shadow-lg transition-all hover:-translate-y-0.5",
          )}
        >
          {isEditing ? (
            <>
              <Check className="size-3.5" /> Concluir
            </>
          ) : (
            <>
              <Edit3 className="size-3.5" /> Editar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function EditHintsBar() {
  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
      <div className="rounded-2xl border border-white/15 bg-card/60 p-3 flex items-center gap-2 shadow-lg backdrop-blur">
        <Maximize2 className="size-3.5 shrink-0" /> Arraste o fundo para mover a cena.
      </div>
      <div className="rounded-2xl border border-white/15 bg-card/60 p-3 flex items-center gap-2 shadow-lg backdrop-blur">
        <Plus className="size-3.5 shrink-0" /> Verde = posição válida; vermelho = inválida.
      </div>
      <div className="rounded-2xl border border-white/15 bg-card/60 p-3 flex items-center gap-2 shadow-lg backdrop-blur">
        <Edit3 className="size-3.5 shrink-0" /> Selecione um item para rotacionar ou remover.
      </div>
    </div>
  );
}
