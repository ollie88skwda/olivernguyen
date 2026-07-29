import React from 'react';

// A deliberately small markdown reader. The vault writes a known subset --
// `##` headings, `-`/`1.` lists, blockquote callouts, **bold**, *italic*,
// `code` -- and pulling in a full parser to render five kinds of node would be
// more dependency than the job needs.

// Alternation is ordered, so `**bold**` is claimed before the `*italic*` branch
// can see it. Written without lookbehind so older Safari still parses the file.
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

export function renderInline(text, keyBase = 'i') {
  const parts = String(text ?? '').split(INLINE_RE).filter((part) => part !== '' && part != null);
  return parts.map((part, index) => {
    const key = `${keyBase}-${index}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

// Groups raw lines into blocks so a list keeps its <ul> instead of collapsing
// into one paragraph per bullet.
function toBlocks(raw) {
  const blocks = [];
  let list = null;
  let paragraph = null;

  const flush = () => {
    if (list) blocks.push(list);
    if (paragraph) blocks.push(paragraph);
    list = null;
    paragraph = null;
  };

  for (const rawLine of String(raw ?? '').split('\n')) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flush();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flush();
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s?/, '') });
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*+]|\d+\.)\s+(.*)$/);
    if (bullet) {
      if (paragraph) {
        blocks.push(paragraph);
        paragraph = null;
      }
      const ordered = /^\d+\./.test(trimmed);
      if (!list || list.ordered !== ordered) {
        if (list) blocks.push(list);
        list = { type: 'list', ordered, items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    // Continuation of a bullet (indented) folds into the previous item.
    if (list && /^\s{2,}/.test(line)) {
      list.items[list.items.length - 1] += ` ${trimmed}`;
      continue;
    }

    if (list) {
      blocks.push(list);
      list = null;
    }
    if (paragraph) paragraph.text += ` ${trimmed}`;
    else paragraph = { type: 'paragraph', text: trimmed };
  }

  flush();
  return blocks;
}

export function Markdown({ source, className }) {
  const blocks = toBlocks(source);
  if (!blocks.length) return null;
  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        if (block.type === 'heading') {
          const Tag = `h${Math.min(block.level + 2, 6)}`;
          return (
            <Tag key={key} className="es-md-h">
              {renderInline(block.text, key)}
            </Tag>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="es-md-quote">
              {renderInline(block.text, key)}
            </blockquote>
          );
        }
        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag key={key} className="es-md-list">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={key}>{renderInline(block.text, key)}</p>;
      })}
    </div>
  );
}

// ── 00_Overview.md ───────────────────────────────────────────────────────────

function sectionsOf(raw) {
  const sections = new Map();
  let current = null;
  for (const line of String(raw ?? '').split('\n')) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      current = heading[1].trim();
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  return sections;
}

const findSection = (sections, needle) => {
  for (const [name, lines] of sections) {
    if (name.toLowerCase().includes(needle)) return lines.join('\n').trim();
  }
  return '';
};

// The vault's convention: the prompt itself is the bold line under
// "## Prompt Description", followed by an italic "*Things to consider:*" block.
export function parseOverview(raw) {
  const sections = sectionsOf(raw);
  const description = findSection(sections, 'prompt description');

  const bold = description.match(/^\*\*(.+?)\*\*\s*$/ms);
  // The vault repeats the prompt number inside the question ("1. Describe an
  // example..."), and the block already shows it as the heading.
  const question = bold ? bold[1].replace(/\s*\n\s*/g, ' ').replace(/^\d+\.\s*/, '').trim() : '';

  const considerMatch = description.match(/\*Things to consider:\*\s*([\s\S]*)$/);
  const consider = considerMatch ? considerMatch[1].trim() : '';

  return {
    question,
    consider,
    constraints: findSection(sections, 'constraints'),
    brainstorm: findSection(sections, 'brainstorm'),
    hasContent: Boolean(question || consider),
  };
}

// ── Counselor Notes.md ───────────────────────────────────────────────────────

export function parseNotes(raw) {
  const sections = sectionsOf(raw);
  const mapping = findSection(sections, 'structural');
  const actions = findSection(sections, 'action items');

  // "- **`[hook]`**: She sat in the back corner..." -> { beat, text }
  const beats = [];
  for (const line of mapping.split('\n')) {
    const match = line.match(/^\s*[-*+]\s+\*\*`?\[?([^\]`*]+)\]?`?\*\*\s*:?\s*(.*)$/);
    if (match) beats.push({ beat: match[1].trim(), text: match[2].trim() });
  }

  return { beats, mapping, actions, hasContent: Boolean(mapping || actions) };
}

export default Markdown;
