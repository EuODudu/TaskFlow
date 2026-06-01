import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, Pencil, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useKnowledgeNode,
  useKnowledgeNodes,
  useInvalidate,
} from "@/lib/queries";
import { updateKnowledgeNode } from "@/lib/knowledge/knowledge-api";
import { KNOWLEDGE_NODE_TYPES, NODE_TYPE_LABELS, type KnowledgeNodeType } from "@/lib/knowledge/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeMarkdown } from "./knowledge-markdown";
import { BacklinksPanel } from "./backlinks-panel";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type Props = { noteId: string };

export function KnowledgeNoteEditor({ noteId }: Props) {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: note, isLoading } = useKnowledgeNode(userId, noteId);
  const { data: allNodes = [] } = useKnowledgeNodes(userId);
  const inv = useInvalidate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [nodeType, setNodeType] = useState<KnowledgeNodeType>("note");
  const [dirty, setDirty] = useState(false);
  const hydratedNoteIdRef = useRef<string | null>(null);
  const saveSeqRef = useRef(0);
  const draftRef = useRef({ title: "", content: "", nodeType: "note" as KnowledgeNodeType });

  draftRef.current = { title, content, nodeType };

  useEffect(() => {
    hydratedNoteIdRef.current = null;
    setDirty(false);
  }, [noteId]);

  // Hidrata só na primeira carga de cada nota — nunca após autosave (updated_at).
  useEffect(() => {
    if (!note || note.id !== noteId) return;
    if (hydratedNoteIdRef.current === note.id) return;
    hydratedNoteIdRef.current = note.id;
    setTitle(note.title);
    setContent(note.content ?? "");
    setNodeType(note.node_type);
    setDirty(false);
  }, [note, noteId]);

  const noteIdByTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of allNodes) m.set(n.title.toLowerCase(), n.id);
    return m;
  }, [allNodes]);

  const persist = useCallback(
    async (patch: { title?: string; content?: string; node_type?: KnowledgeNodeType }) => {
      if (!userId) return;
      const saveSeq = ++saveSeqRef.current;
      const snapshot = { ...draftRef.current };
      try {
        await updateKnowledgeNode(userId, noteId, patch);
        inv.knowledge(userId);
        inv.profile();
        inv.userBadges(userId);
        const latest = draftRef.current;
        const isLatestSave =
          saveSeq === saveSeqRef.current &&
          latest.title === snapshot.title &&
          latest.content === snapshot.content &&
          latest.nodeType === snapshot.nodeType;
        if (isLatestSave) setDirty(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    },
    [userId, noteId, inv],
  );

  const debouncedSave = useDebouncedCallback(() => {
    const { title: t, content: c, nodeType: nt } = draftRef.current;
    void persist({ title: t, content: c, node_type: nt });
  }, 1200);

  const queueSave = useCallback(() => {
    setDirty(true);
    debouncedSave();
  }, [debouncedSave]);

  const saveNow = async () => {
    await persist({ title, content, node_type: nodeType });
    toast.success("Salvo");
  };

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando…</p>;
  if (!note) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Nota não encontrada.</p>
        <Button variant="link" className="px-0" asChild>
          <Link to="/knowledge/notes">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/knowledge">
            <ArrowLeft className="size-4 mr-1" />
            Conhecimento
          </Link>
        </Button>
        <Select
          value={nodeType}
          onValueChange={(v) => {
            setNodeType(v as KnowledgeNodeType);
            queueSave();
          }}
        >
          <SelectTrigger className="w-36 h-8 text-xs ml-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KNOWLEDGE_NODE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {NODE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={saveNow} disabled={!dirty}>
          <Save className="size-4 mr-1" />
          Salvar
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              queueSave();
            }}
            className="text-xl font-bold border-0 px-0 shadow-none focus-visible:ring-0"
            placeholder="Título"
          />
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">
                <Pencil className="size-3.5 mr-1" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="size-3.5 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-3">
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  queueSave();
                }}
                className="min-h-[420px] font-mono text-sm"
                placeholder="Markdown + [[Wiki Links]]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dica: [[Nome da Nota]] ou [[slug|texto exibido]]
              </p>
            </TabsContent>
            <TabsContent value="preview" className="mt-3 rounded-lg border p-4 min-h-[420px]">
              <KnowledgeMarkdown content={content || "_Vazio_"} noteIdByTitle={noteIdByTitle} />
            </TabsContent>
          </Tabs>
        </div>
        {userId && <BacklinksPanel userId={userId} noteId={noteId} />}
      </div>
    </div>
  );
}
