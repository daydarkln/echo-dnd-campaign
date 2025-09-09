import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Tag, List, Typography, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import MarkdownEditor from './MarkdownEditor';
import { Quest, QuestStatus } from '../types/quests';
import { useGroups } from '../hooks/useGroups';

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
  const { groups, createGroup, addCharacterToGroup } = useGroups();
  const [newSolutionPath, setNewSolutionPath] = useState('');
  const [newNPCName, setNewNPCName] = useState('');
  const [newNPCClass, setNewNPCClass] = useState('');
  const [newNPCLevel, setNewNPCLevel] = useState<number>(1);
  const [isNPCModalVisible, setIsNPCModalVisible] = useState(false);

  if (!value) {
    return (
      <Card size="small">Выберите квест из списка или создайте новый.</Card>
    );
  }

  // Добавление нового пути решения (крючка)
  const handleAddSolutionPath = () => {
    if (!newSolutionPath.trim()) return;
    
    const currentPaths = value.solutionPaths || [];
    onChange({ 
      solutionPaths: [...currentPaths, newSolutionPath.trim()] 
    });
    setNewSolutionPath('');
  };

  // Удаление пути решения
  const handleRemoveSolutionPath = (index: number) => {
    const currentPaths = value.solutionPaths || [];
    onChange({ 
      solutionPaths: currentPaths.filter((_, i) => i !== index) 
    });
  };

  // Добавление нового NPC
  const handleAddNPC = () => {
    if (!newNPCName.trim()) {
      message.error('Введите имя NPC');
      return;
    }

    // Находим или создаем группу для квеста
    const questGroupName = `Квест "${value.title}"`;
    let questGroup = groups.find(g => g.name === questGroupName);
    
    if (!questGroup) {
      questGroup = createGroup(questGroupName, '#9254de', false);
    }

    // Добавляем персонажа в группу
    const newCharacter = addCharacterToGroup(questGroup.id, {
      name: newNPCName.trim(),
      class: newNPCClass.trim() || undefined,
      level: newNPCLevel
    });

    // Добавляем ID персонажа в квест
    const currentNPCs = value.relatedNPCs || [];
    onChange({ 
      relatedNPCs: [...currentNPCs, newCharacter.id] 
    });

    // Очищаем форму
    setNewNPCName('');
    setNewNPCClass('');
    setNewNPCLevel(1);
    setIsNPCModalVisible(false);
    
    message.success(`NPC "${newCharacter.name}" добавлен в группу "${questGroupName}"`);
  };

  // Удаление NPC из квеста
  const handleRemoveNPC = (npcId: string) => {
    const currentNPCs = value.relatedNPCs || [];
    onChange({ 
      relatedNPCs: currentNPCs.filter(id => id !== npcId) 
    });
  };

  // Получение информации о NPC по ID
  const getNPCById = (npcId: string) => {
    for (const group of groups) {
      const character = group.members.find(member => member.id === npcId);
      if (character) {
        return { character, groupName: group.name };
      }
    }
    return null;
  };

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
          
          {/* Пути решения (крючки) */}
          <Form.Item label="Пути решения (крючки)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Введите путь решения и нажмите Enter"
                  value={newSolutionPath}
                  onChange={(e) => setNewSolutionPath(e.target.value)}
                  onPressEnter={handleAddSolutionPath}
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddSolutionPath}
                >
                  Добавить
                </Button>
              </Space.Compact>
              
              {value.solutionPaths && value.solutionPaths.length > 0 && (
                <List
                  size="small"
                  bordered
                  dataSource={value.solutionPaths}
                  renderItem={(path, index) => (
                    <List.Item
                      actions={[
                        <Button 
                          key="delete"
                          type="text" 
                          danger 
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveSolutionPath(index)}
                        />
                      ]}
                    >
                      <Typography.Text>{path}</Typography.Text>
                    </List.Item>
                  )}
                />
              )}
            </Space>
          </Form.Item>

          {/* Связанные NPC */}
          <Form.Item label="Связанные NPC">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={() => setIsNPCModalVisible(true)}
                style={{ width: '100%' }}
              >
                Добавить NPC
              </Button>
              
              {value.relatedNPCs && value.relatedNPCs.length > 0 && (
                <List
                  size="small"
                  bordered
                  dataSource={value.relatedNPCs}
                  renderItem={(npcId) => {
                    const npcInfo = getNPCById(npcId);
                    if (!npcInfo) {
                      return (
                        <List.Item
                          actions={[
                            <Button 
                              key="delete"
                              type="text" 
                              danger 
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveNPC(npcId)}
                            />
                          ]}
                        >
                          <Typography.Text type="secondary">NPC не найден (ID: {npcId})</Typography.Text>
                        </List.Item>
                      );
                    }

                    return (
                      <List.Item
                        actions={[
                          <Button 
                            key="delete"
                            type="text" 
                            danger 
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveNPC(npcId)}
                          />
                        ]}
                      >
                        <Space direction="vertical" size={0}>
                          <Typography.Text strong>{npcInfo.character.name}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {npcInfo.character.class && npcInfo.character.level 
                              ? `${npcInfo.character.class} ${npcInfo.character.level} ур.`
                              : npcInfo.character.class || ''
                            } · {npcInfo.groupName}
                          </Typography.Text>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Space>
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

      {/* Модальное окно для добавления NPC */}
      <Modal
        title="Добавить NPC"
        open={isNPCModalVisible}
        onOk={handleAddNPC}
        onCancel={() => {
          setIsNPCModalVisible(false);
          setNewNPCName('');
          setNewNPCClass('');
          setNewNPCLevel(1);
        }}
        okText="Добавить"
        cancelText="Отмена"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form layout="vertical">
            <Form.Item label="Имя NPC" required>
              <Input
                placeholder="Введите имя персонажа"
                value={newNPCName}
                onChange={(e) => setNewNPCName(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Класс">
              <Input
                placeholder="Класс персонажа (необязательно)"
                value={newNPCClass}
                onChange={(e) => setNewNPCClass(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Уровень">
              <Input
                type="number"
                min={1}
                max={20}
                value={newNPCLevel}
                onChange={(e) => setNewNPCLevel(parseInt(e.target.value) || 1)}
              />
            </Form.Item>
          </Form>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            NPC будет добавлен в группу "Квест \"{value.title}\""
          </Typography.Text>
        </Space>
      </Modal>
    </Card>
  );
}


