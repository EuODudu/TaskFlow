import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkSuggest, setLinkSuggest] = useState({
    open: false,
    query: "",
    start: 0,
    cursor: 0,
    selected: 0,
  });

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

  const linkSuggestions = useMemo(() => {
    if (!linkSuggest.open) return [];
    const q = linkSuggest.query.toLowerCase();
    return allNodes
      .filter((n) => n.id !== noteId)
      .filter((n) => n.title.toLowerCase().includes(q) || n.slug.includes(q))
      .slice(0, 8);
  }, [allNodes, linkSuggest.open, linkSuggest.query, noteId]);

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

  const updateLinkSuggestion = useCallback((value: string, cursor: number) => {
    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/\[\[([^\]\[\n]*)$/);
    if (!match) {
      setLinkSuggest((prev) => (prev.open ? { ...prev, open: false } : prev));
      return;
    }

    setLinkSuggest({
      open: true,
      query: match[1],
      start: cursor - match[0].length,
      cursor,
      selected: 0,
    });
  }, []);

  const insertWikiLink = useCallback(
    (targetTitle: string) => {
      const before = content.slice(0, linkSuggest.start);
      const after = content.slice(linkSuggest.cursor);
      const inserted = `[[${targetTitle}]]`;
      const next = `${before}${inserted}${after}`;
      const nextCursor = before.length + inserted.length;
      setContent(next);
      setLinkSuggest((prev) => ({ ...prev, open: false }));
      queueSave();
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [content, linkSuggest.cursor, linkSuggest.start, queueSave],
  );

  const handleEditorKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!linkSuggest.open || linkSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setLinkSuggest((prev) => ({
        ...prev,
        selected: (prev.selected + 1) % linkSuggestions.length,
      }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLinkSuggest((prev) => ({
        ...prev,
        selected: (prev.selected - 1 + linkSuggestions.length) % linkSuggestions.length,
      }));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertWikiLink(linkSuggestions[linkSuggest.selected]?.title ?? linkSuggestions[0].title);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLinkSuggest((prev) => ({ ...prev, open: false }));
    }
  };

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
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    const value = e.target.value;
                    setContent(value);
                    updateLinkSuggestion(value, e.target.selectionStart);
                    queueSave();
                  }}
                  onClick={(e) => updateLinkSuggestion(content, e.currentTarget.selectionStart)}
                  onKeyDown={handleEditorKeyDown}
                  className="min-h-[420px] font-mono text-sm"
                  placeholder="Markdown + [[Wiki Links]]"
                />
                {linkSuggest.open && (
                  <div className="absolute left-3 top-12 z-20 w-80 rounded-md border bg-popover p-1 shadow-lg">
                    <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      Ligar nota
                    </div>
                    {linkSuggestions.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-muted-foreground">
                        Nenhuma nota encontrada. Ao salvar, este link cria uma nota stub.
                      </div>
                    ) : (
                      linkSuggestions.map((n, index) => (
                        <button
                          key={n.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertWikiLink(n.title);
                          }}
                          className={`w-full rounded-sm px-2 py-2 text-left text-sm ${
                            index === linkSuggest.selected ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                          }`}
                        >
                          <span className="block font-medium truncate">{n.title}</span>
                          <span className="block text-xs text-muted-foreground truncate">/{n.slug}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
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
