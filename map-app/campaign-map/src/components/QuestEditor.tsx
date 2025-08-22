import React, { useMemo } from 'react';
import { Button, Card, Form, Input, Select, Space, Tag } from 'antd';
import MarkdownEditor from './MarkdownEditor';
import { Quest, QuestStatus } from '../types/quests';

interface QuestEditorProps {
  value: Quest | null;
  onChange: (next: Partial<Quest>) => void;
  onSave: () => void;
  saving?: boolean;
}

const statusOptions: { label: string; value: QuestStatus }[] = [
  { label: 'Идея', value: 'idea' },
  { label: 'Запланирован', value: 'planned' },
  { label: 'Активен', value: 'active' },
  { label: 'Завершён', value: 'completed' },
  { label: 'В архиве', value: 'archived' }
];

export default function QuestEditor({ value, onChange, onSave, saving }: QuestEditorProps) {
  // Модули не нужны для Markdown-редактора

  if (!value) {
    return (
      <Card size="small">Выберите квест из списка или создайте новый.</Card>
    );
  }

  return (
    <Card size="small" title="Редактор квеста" extra={<Tag color="blue">{value.id ? 'Редактирование' : 'Новый'}</Tag>}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Form layout="vertical">
          <Form.Item label="Название">
            <Input
              placeholder="Название квеста"
              value={value.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Статус">
            <Select
              options={statusOptions}
              value={value.status}
              onChange={(v) => onChange({ status: v })}
              style={{ maxWidth: 220 }}
            />
          </Form.Item>
          <Form.Item label="Краткое описание">
            <Input.TextArea
              placeholder="1-2 предложения для списка"
              value={value.summary}
              onChange={(e) => onChange({ summary: e.target.value })}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Теги (через запятую)">
            <Input
              placeholder="мистика, кладбище, мицелий"
              value={(value.tags || []).join(', ')}
              onChange={(e) => onChange({ tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          </Form.Item>
          <Form.Item label="Содержание (Markdown)">
            <MarkdownEditor
              value={value.content}
              onChange={(md: string) => onChange({ content: md })}
            />
          </Form.Item>
        </Form>

        <Space>
          <Button type="primary" onClick={onSave} loading={saving} disabled={!value.title || !value.content}>Сохранить</Button>
        </Space>
      </Space>
    </Card>
  );
}


