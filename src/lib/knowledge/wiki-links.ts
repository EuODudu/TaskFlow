export type WikiLinkRef = {
  raw: string;
  title: string;
  alias?: string;
};

const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "nota";
}

export function parseWikiLinks(content: string | null | undefined): WikiLinkRef[] {
  if (!content) return [];
  const seen = new Set<string>();
  const refs: WikiLinkRef[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WIKI_LINK_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    const title = match[1].trim();
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    refs.push({
      raw: match[0],
      title,
      alias: match[2]?.trim() || undefined,
    });
  }
  return refs;
}

export function uniqueLinkTargets(refs: WikiLinkRef[]): string[] {
  return [...new Set(refs.map((r) => r.title))];
}
