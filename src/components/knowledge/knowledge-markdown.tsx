import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
  noteIdByTitle?: Map<string, string>;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text: string, noteIdByTitle?: Map<string, string>) {
  const parts: ReactNode[] = [];
  const re = /(\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(escapeHtml(text.slice(last, m.index)));
    if (m[0].startsWith("[[")) {
      const title = m[2].trim();
      const label = m[3]?.trim() || title;
      const id = noteIdByTitle?.get(title.toLowerCase());
      if (id) {
        parts.push(
          <Link
            key={`${m.index}-${title}`}
            to="/knowledge/notes/$noteId"
            params={{ noteId: id }}
            className="text-primary underline-offset-2 hover:underline font-medium"
          >
            {label}
          </Link>,
        );
      } else {
        parts.push(
          <span key={`${m.index}-${title}`} className="text-primary/80">
            [[{label}]]
          </span>,
        );
      }
    } else if (m[4]) {
      parts.push(<strong key={m.index}>{m[4]}</strong>);
    } else if (m[5]) {
      parts.push(
        <code key={m.index} className="rounded bg-muted px-1 py-0.5 text-xs">
          {m[5]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(escapeHtml(text.slice(last)));
  return parts;
}

export function KnowledgeMarkdown({ content, className, noteIdByTitle }: Props) {
  const lines = content.split("\n");
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none space-y-2", className)}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-semibold mt-3">
              {renderInline(trimmed.slice(4), noteIdByTitle)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-semibold mt-4">
              {renderInline(trimmed.slice(3), noteIdByTitle)}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-bold mt-4">
              {renderInline(trimmed.slice(2), noteIdByTitle)}
            </h1>
          );
        }
        if (trimmed.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {renderInline(trimmed.slice(2), noteIdByTitle)}
            </li>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderInline(line, noteIdByTitle)}
          </p>
        );
      })}
    </div>
  );
}
