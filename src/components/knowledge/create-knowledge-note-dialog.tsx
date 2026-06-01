import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useInvalidate } from "@/lib/queries";
import { createKnowledgeNode } from "@/lib/knowledge/knowledge-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  trigger?: ReactNode;
  buttonLabel?: string;
  successMessage?: string;
};

export function CreateKnowledgeNoteDialog({
  trigger,
  buttonLabel = "Nova nota",
  successMessage = "Nota criada",
}: Props) {
  const { user } = useAuth();
  const userId = user?.id;
  const inv = useInvalidate();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const createNote = async () => {
    const cleanTitle = title.trim();
    if (!userId || !cleanTitle) return;
    setCreating(true);
    try {
      const node = await createKnowledgeNode(userId, { title: cleanTitle });
      inv.knowledge(userId);
      inv.profile();
      setOpen(false);
      setTitle("");
      toast.success(successMessage);
      nav({ to: "/knowledge/notes/$noteId", params: { noteId: node.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar nota");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4 mr-2" />
            {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nome da nota</DialogTitle>
          <DialogDescription>
            Defina um título claro. Ele também será usado como alvo em links do tipo [[Nome da Nota]].
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="knowledge-note-title">Título</Label>
          <Input
            id="knowledge-note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void createNote();
            }}
            placeholder="Ex: Pipeline de estudos"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={createNote} disabled={!title.trim() || creating}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
