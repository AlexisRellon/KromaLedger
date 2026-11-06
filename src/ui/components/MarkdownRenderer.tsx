import { useState, type ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`space-y-3 leading-relaxed text-sm text-neutral-900 max-w-[65ch] ${className}`}>
      {blocks.map((block, idx) => (
        <BlockComponent key={idx} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "code_block"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Code fences
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // skip closing fence
      blocks.push({
        type: "code_block",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i]!.trim().startsWith(">") || (lines[i]!.trim() && !lines[i]!.trim().startsWith("#")))) {
        quoteLines.push(lines[i]!.trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    // Table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) {
        tableLines.push(lines[i]!.trim());
        i++;
      }
      const tableBlock = parseTable(tableLines);
      if (tableBlock) {
        blocks.push(tableBlock);
        continue;
      }
    }

    // Bullet lists (*, -, +)
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "bullet_list", items });
      continue;
    }

    // Numbered lists (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "numbered_list", items });
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !lines[i]!.trim().startsWith("```") &&
      !lines[i]!.trim().startsWith("#") &&
      !/^[-*+]\s+/.test(lines[i]!.trim()) &&
      !/^\d+\.\s+/.test(lines[i]!.trim()) &&
      !lines[i]!.trim().startsWith(">")
    ) {
      paraLines.push(lines[i]!.trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

function parseTable(lines: string[]): Block | null {
  if (lines.length < 2) return null;
  const parseRow = (line: string) =>
    line
      .slice(1, -1)
      .split("|")
      .map((s) => s.trim());

  const headers = parseRow(lines[0]!);
  // line 1 is usually separator |---|---|
  const contentRows = lines.slice(2).map(parseRow);

  return {
    type: "table",
    headers,
    rows: contentRows,
  };
}

function BlockComponent({ block }: { block: Block }) {
  if (block.type === "h1") {
    return (
      <h3 className="font-display text-base font-extrabold text-neutral-900 tracking-tight pt-2 border-b-2 border-neutral-900 pb-1.5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#4A154B] border border-neutral-900 shrink-0" />
        <InlineContent text={block.text} />
      </h3>
    );
  }

  if (block.type === "h2") {
    return (
      <h3 className="font-display text-sm font-extrabold text-[#4A154B] tracking-wide pt-2 pb-0.5">
        <InlineContent text={block.text} />
      </h3>
    );
  }

  if (block.type === "h3") {
    return (
      <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neutral-800 pt-1">
        <InlineContent text={block.text} />
      </h3>
    );
  }

  if (block.type === "blockquote") {
    return (
      <blockquote className="border-l-3 border-[#4A154B] bg-[#EDE9FE]/50 pl-3.5 py-1.5 text-sm text-neutral-800 italic rounded-r-xl">
        <InlineContent text={block.text} />
      </blockquote>
    );
  }

  if (block.type === "code_block") {
    return <CodeBlock language={block.language} code={block.code} />;
  }

  if (block.type === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border-2 border-neutral-900 bg-white shadow-[2px_2px_0px_#18181B] my-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#FAF8F5] text-neutral-900 border-b-2 border-neutral-900">
            <tr>
              {block.headers.map((h, idx) => (
                <th key={idx} className="px-3 py-2 text-xs font-mono font-bold uppercase tracking-[0.15em] text-neutral-900">
                  <InlineContent text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {block.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#FAF8F5]">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-neutral-900 font-mono tabular-nums text-sm">
                    <InlineContent text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "bullet_list") {
    return (
      <ul className="space-y-1.5 my-1.5">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-900">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4A154B]" />
            <div className="flex-1 leading-relaxed">
              <InlineContent text={item} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "numbered_list") {
    return (
      <ol className="space-y-1.5 my-1.5">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-neutral-900">
            <span className="font-mono text-xs text-[#4A154B] font-black min-w-[1.2rem] pt-0.5">
              {idx + 1}.
            </span>
            <div className="flex-1 leading-relaxed max-w-[65ch]">
              <InlineContent text={item} />
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-neutral-900 max-w-[65ch]">
      <InlineContent text={block.text} />
    </p>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write failed
    }
  };

  return (
    <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] shadow-[2px_2px_0px_var(--shadow-ink)] overflow-hidden my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-card)] border-b-2 border-[var(--border-ink)] text-xs font-mono font-bold text-[var(--text-secondary)]">
        <span className="uppercase tracking-wider">{language || "text"}</span>
        <button
          onClick={handleCopy}
          className="text-[var(--text-primary)] hover:text-[var(--text-primary)] font-bold transition px-2 py-0.5 rounded-lg border border-[var(--border-ink)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] shadow-[1px_1px_0px_var(--shadow-ink)] cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-3 font-mono text-xs text-[var(--text-primary)] overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Parses inline formatting:
 * **bold**, *italic*, `code`, and currency highlights (e.g. PHP 1,234.56).
 */
function InlineContent({ text }: { text: string }) {
  // Tokenize string for code, bold, italics, and financial amounts
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Inline code `...`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch && codeMatch[1]) {
      parts.push(
        <code
          key={keyIndex++}
          className="rounded-md bg-neutral-200/80 px-1.5 py-0.5 font-mono text-xs font-semibold text-neutral-900 border border-neutral-900/30"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold **...**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch[1]) {
      parts.push(
        <strong key={keyIndex++} className="font-extrabold text-neutral-950">
          <InlineContent text={boldMatch[1]} />
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *...*
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch && italicMatch[1]) {
      parts.push(
        <em key={keyIndex++} className="italic text-neutral-800">
          <InlineContent text={italicMatch[1]} />
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Highlight financial amounts: e.g. PHP 20,000.00 or ₱15,000 or $500
    const currencyMatch = remaining.match(/^(?:PHP|₱|\$|€|£)\s?[\d,]+(?:\.\d{2})?/i);
    if (currencyMatch && currencyMatch[0]) {
      parts.push(
        <span
          key={keyIndex++}
          className="inline-flex items-center rounded-md bg-[#FEF3C7] px-1.5 py-0.5 font-mono text-xs font-bold text-neutral-950 border border-neutral-900/30 shadow-[1px_1px_0px_#18181B]"
        >
          {currencyMatch[0]}
        </span>
      );
      remaining = remaining.slice(currencyMatch[0].length);
      continue;
    }

    // Find next special delimiter
    const nextSpecial = remaining.search(/[`*]|(?:PHP|₱|\$|€|£)\s?[\d,]/i);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    }

    if (nextSpecial > 0) {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{parts}</>;
}
