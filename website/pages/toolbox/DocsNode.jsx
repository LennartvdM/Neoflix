import React from 'react';
import DocsLink from './DocsLink';
import Hint from './blocks/Hint';
import Tabs from './blocks/Tabs';
import Embed from './blocks/Embed';
import FileLink from './blocks/FileLink';
import Figure from './blocks/Figure';
import Cards from './blocks/Cards';
import WorldMapEmbed from './blocks/WorldMapEmbed';

// Recursive AST renderer. Node shape matches build-docs.mjs output.
export default function DocsNode({ node }) {
  if (!node) return null;
  if (Array.isArray(node)) return <>{node.map((n, i) => <DocsNode key={i} node={n} />)}</>;

  const kids = () => (node.children || []).map((c, i) => <DocsNode key={i} node={c} />);

  switch (node.type) {
    case 'root':
      return <>{kids()}</>;

    case 'paragraph':
      return <p>{kids()}</p>;

    case 'heading': {
      const Tag = `h${Math.min(Math.max(node.depth || 2, 1), 6)}`;
      return <Tag id={node.id}>{kids()}</Tag>;
    }

    case 'text':
      return node.value;

    case 'strong':
      return <strong>{kids()}</strong>;
    case 'emphasis':
      return <em>{kids()}</em>;
    case 'delete':
      return <del>{kids()}</del>;
    case 'inlineCode':
      return <code>{node.value}</code>;
    case 'break':
      return <br />;
    case 'thematicBreak':
      return <hr />;

    case 'link':
      return (
        <DocsLink href={node.href} internal={node.internal} external={node.external}>
          {kids()}
        </DocsLink>
      );

    case 'image':
      return <img src={node.src} alt={node.alt || ''} title={node.title || undefined} loading="lazy" />;

    case 'list':
      return node.ordered ? (
        <ol start={node.start || undefined}>{kids()}</ol>
      ) : (
        <ul>{kids()}</ul>
      );
    case 'listItem':
      // A task-list item ("* [ ] …") — the library's text module turns
      // these into a checklist the reader can work through.
      return node.checked == null ? <li>{kids()}</li> : <li className="docs-task" data-task="">{kids()}</li>;

    case 'blockquote':
      return <blockquote>{kids()}</blockquote>;

    case 'code':
      return (
        <pre><code className={node.lang ? `language-${node.lang}` : undefined}>{node.value}</code></pre>
      );

    case 'table':
      return <table>{kids()}</table>;
    case 'tableRow':
      return <tr>{kids()}</tr>;
    case 'tableCell':
      return <td>{kids()}</td>;

    case 'hint':
      return <Hint style={node.style}>{kids()}</Hint>;
    case 'tabs':
      return <Tabs>{node.children || []}</Tabs>;
    case 'tab':
      // Rendered by Tabs; ignore if it leaks through
      return <div>{kids()}</div>;
    case 'embed':
      return <Embed url={node.url}>{kids()}</Embed>;
    case 'file':
      return <FileLink src={node.src} name={node.name} />;
    case 'figure':
      return <Figure src={node.src} alt={node.alt} caption={node.caption} />;
    case 'cards':
      return <Cards cards={node.cards} />;
    case 'worldmap':
      return <WorldMapEmbed city={node.city} />;

    case 'html':
      // Inline color markers etc. Safe to passthrough — content is trusted
      // (comes from our own docs repo via build-time transform).
      return <span dangerouslySetInnerHTML={{ __html: node.value }} />;

    default:
      return null;
  }
}
