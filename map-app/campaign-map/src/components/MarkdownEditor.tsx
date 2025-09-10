import React, { CSSProperties, useRef } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { BoldOutlined, ItalicOutlined, OrderedListOutlined, UnorderedListOutlined, FieldNumberOutlined } from '@ant-design/icons';

interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

function wrapSelection(textarea: HTMLTextAreaElement, wrapperBefore: string, wrapperAfter: string = wrapperBefore) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end) || '';
  const before = value.slice(0, start);
  const after = value.slice(end);
  const next = `${before}${wrapperBefore}${selected}${wrapperAfter}${after}`;
  return { next, newPos: start + wrapperBefore.length + selected.length + wrapperAfter.length };
}

function toggleLinePrefix(textarea: HTMLTextAreaElement, prefix: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const lines = value.split('\n');
  // определить диапазон строк
  let charCount = 0;
  let startLine = 0;
  let endLine = lines.length - 1;
  for (let i = 0; i < lines.length; i++) {
    const lineStart = charCount;
    const lineEnd = charCount + lines[i].length;
    if (start >= lineStart && start <= lineEnd) startLine = i;
    if (end >= lineStart && end <= lineEnd) { endLine = i; break; }
    charCount = lineEnd + 1;
  }
  for (let i = startLine; i <= endLine; i++) {
    if (lines[i].startsWith(prefix)) lines[i] = lines[i].slice(prefix.length);
    else lines[i] = prefix + lines[i];
  }
  return lines.join('\n');
}

export default function MarkdownEditor({ value, onChange, placeholder, style }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const applyInline = (before: string, after?: string) => {
    const el = ref.current;
    if (!el) return;
    const { next, newPos } = wrapSelection(el, before, after ?? before);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const next = toggleLinePrefix(el, prefix);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  };

  return (
    <div>
      <Space size={8} style={{ marginBottom: 8 }}>
        <Tooltip title="Заголовок H1"><Button  onClick={() => applyLinePrefix('# ')}>H1</Button></Tooltip>
        <Tooltip title="Заголовок H2"><Button  onClick={() => applyLinePrefix('## ')}>H2</Button></Tooltip>
        <Tooltip title="Полужирный"><Button  icon={<BoldOutlined />} onClick={() => applyInline('**')} /></Tooltip>
        <Tooltip title="Курсив"><Button  icon={<ItalicOutlined />} onClick={() => applyInline('*')} /></Tooltip>
        <Tooltip title="Маркированный список"><Button  icon={<UnorderedListOutlined />} onClick={() => applyLinePrefix('- ')} /></Tooltip>
        <Tooltip title="Нумерованный список"><Button  icon={<OrderedListOutlined />} onClick={() => applyLinePrefix('1. ')} /></Tooltip>
        <Tooltip title="Цитата"><Button  onClick={() => applyLinePrefix('> ')}>&#10077;</Button></Tooltip>
        <Tooltip title="Код"><Button  onClick={() => applyInline('`')}><FieldNumberOutlined /></Button></Tooltip>
      </Space>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', minHeight: 320, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', ...style }}
      />
    </div>
  );
}


