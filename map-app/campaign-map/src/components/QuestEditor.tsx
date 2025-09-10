import React, { useState, useCallback } from 'react';
import { Button, Card, Form, Input, Select, Space, Tag, List, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import MarkdownEditor from './MarkdownEditor';
import { Quest, QuestStatus } from '../types/quests';
import { CharacterSelector } from './CharacterSelector';
import { LocationSelector } from './LocationSelector';
import { createEmptyCharacter, CharacterData } from '../types/character';
import { useDataSource } from '../hooks/useDataSource';

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
  const [newSolutionPath, setNewSolutionPath] = useState('');
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const { pointsData } = useDataSource();
  // Получение информации о локации по ID
  const getLocationById = useCallback((locationId: string) => {
    if (!pointsData) return null;
    
    for (const area of pointsData.areas) {
      const location = area.pointsOfInterest.find(poi => poi.id === locationId);
      if (location) {
        return { location, area: area.area };
      }
    }
    
    return null;
  }, [pointsData]);

  if (!value) {
    return (
      <Card >Выберите квест из списка или создайте новый.</Card>
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


  // Создание нового персонажа для главной системы
  const createCharacterInMainSystem = async (characterData: { name: string; class?: string; level?: number }) => {
    const characterId = `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Создаем полный лист персонажа если указан класс
    const hasFullSheet = Boolean(characterData.class);
    let fullCharacterData: CharacterData;
    
    if (hasFullSheet) {
      const emptyCharacter = createEmptyCharacter();
      fullCharacterData = JSON.parse(emptyCharacter.data);
      fullCharacterData.name.value = characterData.name;
      fullCharacterData.info.charClass.value = characterData.class || '';
      fullCharacterData.info.level.value = characterData.level || 1;
      fullCharacterData.hasCharacterSheet = true;
    } else {
      // Создаем базовые данные, используя пустой персонаж как шаблон
      const emptyCharacter = createEmptyCharacter();
      fullCharacterData = JSON.parse(emptyCharacter.data);
      fullCharacterData.name.value = characterData.name;
      fullCharacterData.info.charClass.value = characterData.class || '';
      fullCharacterData.info.level.value = characterData.level || 1;
      fullCharacterData.hasCharacterSheet = false;
    }

    const character = {
      id: characterId,
      data: JSON.stringify(fullCharacterData),
      createdAt: new Date().toISOString()
    };

    // Сохраняем в localStorage
    const collection = JSON.parse(localStorage.getItem('dnd-characters-collection') || '{}');
    collection[characterId] = character;
    localStorage.setItem('dnd-characters-collection', JSON.stringify(collection));

    // Пытаемся сохранить на JSON server
    try {
      await fetch('http://localhost:3001/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });
    } catch (error) {
      console.warn('Не удалось сохранить на JSON server:', error);
    }

    return characterId;
  };

  // Обработка выбора существующих персонажей (множественный выбор)
  const handleSelectMultipleCharacters = async (characters: { id: string; name: string; class?: string; level?: number }[]) => {
    let addedCount = 0;
    let skippedCount = 0;
    const newNPCIds: string[] = [];

    for (const character of characters) {
      // Проверяем, есть ли персонаж уже в квесте
      const currentNPCs = value.relatedNPCs || [];
      if (currentNPCs.includes(character.id)) {
        skippedCount++;
        continue;
      }

      // Просто добавляем ID персонажа из главной системы
      newNPCIds.push(character.id);
      addedCount++;
    }

    // Обновляем квест одним вызовом, добавляя всех новых персонажей
    if (newNPCIds.length > 0) {
      const currentNPCs = value.relatedNPCs || [];
      const updatedNPCs = [...currentNPCs, ...newNPCIds];
      
      onChange({ 
        relatedNPCs: updatedNPCs 
      });
    }
    
    setShowCharacterSelector(false);
    
    if (addedCount > 0 && skippedCount > 0) {
      message.success(`Добавлено ${addedCount} персонажей в квест. ${skippedCount} персонажей уже в квесте.`);
    } else if (addedCount > 0) {
      message.success(`Добавлено ${addedCount} персонаж${addedCount < 5 ? (addedCount === 1 ? '' : 'а') : 'ей'} в квест`);
    } else {
      message.warning('Все выбранные персонажи уже находятся в квесте');
    }
  };

  // Обработка выбора одного существующего персонажа
  const handleSelectExistingCharacter = async (character: { id: string; name: string; class?: string; level?: number }) => {
    // Проверяем, есть ли персонаж уже в квесте
    const currentNPCs = value.relatedNPCs || [];
    if (currentNPCs.includes(character.id)) {
      message.warning(`Персонаж "${character.name}" уже добавлен в квест`);
      setShowCharacterSelector(false);
      return;
    }

    // Просто добавляем ID персонажа из главной системы
    onChange({ 
      relatedNPCs: [...currentNPCs, character.id] 
    });
    
    setShowCharacterSelector(false);
    message.success(`Персонаж "${character.name}" добавлен в квест`);
  };

  // Обработка создания нового персонажа
  const handleCreateNewCharacter = async (character: { name: string; class?: string; level?: number }) => {
    // Проверяем, нет ли персонажа с таким именем уже в квесте
    const currentNPCs = value.relatedNPCs || [];
    
    // Проверяем имена существующих персонажей в квесте
    let duplicateName = false;
    for (const npcId of currentNPCs) {
      const npcInfo = getNPCById(npcId);
      if (npcInfo && npcInfo.character.name === character.name) {
        duplicateName = true;
        break;
      }
    }
    
    if (duplicateName) {
      message.warning(`Персонаж с именем "${character.name}" уже существует в квесте`);
      return;
    }

    try {
      // Создаем персонажа в главной системе
      const mainCharacterId = await createCharacterInMainSystem(character);

      // Добавляем ID персонажа в квест
      onChange({ 
        relatedNPCs: [...currentNPCs, mainCharacterId] 
      });
      
      setShowCharacterSelector(false);
      message.success(`Персонаж "${character.name}" создан и добавлен в квест`);
    } catch (error) {
      console.error('Ошибка при создании персонажа:', error);
      message.error('Ошибка при создании персонажа');
    }
  };

  // Удаление NPC из квеста
  const handleRemoveNPC = (npcId: string) => {
    const currentNPCs = value.relatedNPCs || [];
    onChange({ 
      relatedNPCs: currentNPCs.filter(id => id !== npcId) 
    });
  };

  // Обработка выбора одной локации
  const handleSelectLocation = (location: { id: string; name: string; area: string }) => {
    const currentLocations = value.relatedLocations || [];
    if (currentLocations.includes(location.id)) {
      message.warning(`Локация "${location.name}" уже добавлена в квест`);
      setShowLocationSelector(false);
      return;
    }

    onChange({ 
      relatedLocations: [...currentLocations, location.id] 
    });
    
    setShowLocationSelector(false);
    message.success(`Локация "${location.name}" добавлена в квест`);
  };

  // Обработка выбора нескольких локаций
  const handleSelectMultipleLocations = (locations: { id: string; name: string; area: string }[]) => {
    let addedCount = 0;
    let skippedCount = 0;
    const newLocationIds: string[] = [];

    for (const location of locations) {
      const currentLocations = value.relatedLocations || [];
      if (currentLocations.includes(location.id)) {
        skippedCount++;
        continue;
      }

      newLocationIds.push(location.id);
      addedCount++;
    }

    if (newLocationIds.length > 0) {
      const currentLocations = value.relatedLocations || [];
      const updatedLocations = [...currentLocations, ...newLocationIds];
      
      onChange({ 
        relatedLocations: updatedLocations 
      });
    }
    
    setShowLocationSelector(false);
    
    if (addedCount > 0 && skippedCount > 0) {
      message.success(`Добавлено ${addedCount} локаций в квест. ${skippedCount} локаций уже в квесте.`);
    } else if (addedCount > 0) {
      message.success(`Добавлено ${addedCount} локаци${addedCount < 5 ? (addedCount === 1 ? 'я' : 'и') : 'й'} в квест`);
    } else {
      message.warning('Все выбранные локации уже находятся в квесте');
    }
  };

  // Удаление локации из квеста
  const handleRemoveLocation = (locationId: string) => {
    const currentLocations = value.relatedLocations || [];
    onChange({ 
      relatedLocations: currentLocations.filter(id => id !== locationId) 
    });
  };

  // Получение информации о NPC по ID из главной системы персонажей
  const getNPCById = (npcId: string) => {
    try {
      // Ищем персонажа в главной системе персонажей
      const stored = localStorage.getItem('dnd-characters-collection');
      if (stored) {
        const collection = JSON.parse(stored);
        const characterData = collection[npcId];
        
        if (characterData && typeof characterData === 'object') {
          const parsedData = typeof characterData.data === 'string' ? JSON.parse(characterData.data) : characterData.data;
          
          const character = {
            id: npcId,
            name: parsedData.name?.value || parsedData.info?.name?.value || 'Безымянный',
            class: parsedData.info?.charClass?.value || '',
            level: parsedData.info?.level?.value || 1,
            playerName: parsedData.info?.playerName?.value || ''
          };
          
          return { character, groupName: 'Главная система персонажей' };
        }
      }
      
    } catch (error) {
      console.error('Ошибка при поиске персонажа:', error);
    }
    
    return null;
  };

  return (
    <Card  title="Редактор квеста" extra={<Tag color="blue">{value.id ? 'Редактирование' : 'Новый'}</Tag>}>
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
                  
                  bordered
                  dataSource={value.solutionPaths}
                  renderItem={(path, index) => (
                    <List.Item
                      actions={[
                        <Button 
                          key="delete"
                          type="text" 
                          danger 
                          
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
                onClick={() => setShowCharacterSelector(true)}
                style={{ width: '100%' }}
              >
                Добавить персонажей
              </Button>
              
              {value.relatedNPCs && value.relatedNPCs.length > 0 && (
                <List
                  
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
                            }
                          </Typography.Text>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Space>
          </Form.Item>

          {/* Связанные локации */}
          <Form.Item label="Связанные локации">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="dashed" 
                icon={<EnvironmentOutlined />}
                onClick={() => setShowLocationSelector(true)}
                style={{ width: '100%' }}
              >
                Добавить локации
              </Button>
              
              {value.relatedLocations && value.relatedLocations.length > 0 && (
                <List
                  
                  bordered
                  dataSource={value.relatedLocations}
                  renderItem={(locationId) => {
                    const locationInfo = getLocationById(locationId);
                    if (!locationInfo) {
                      return (
                        <List.Item
                          actions={[
                            <Button 
                              key="delete"
                              type="text" 
                              danger 
                              
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveLocation(locationId)}
                            />
                          ]}
                        >
                          <Typography.Text type="secondary">Локация не найдена (ID: {locationId})</Typography.Text>
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
                            
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveLocation(locationId)}
                          />
                        ]}
                      >
                        <Space direction="vertical" size={0}>
                          <Typography.Text strong>{locationInfo.location.name}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Регион: {locationInfo.area}
                          </Typography.Text>
                          <Space size={0} wrap>
                            {locationInfo.location.tags.slice(0, 3).map(tag => (
                              <Tag key={tag} color="geekblue" style={{ fontSize: '11px' }}>{tag}</Tag>
                            ))}
                            {locationInfo.location.tags.length > 3 && (
                              <Tag color="default" style={{ fontSize: '11px' }}>+{locationInfo.location.tags.length - 3}</Tag>
                            )}
                          </Space>
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

      {/* Селектор персонажей */}
      <CharacterSelector
        visible={showCharacterSelector}
        onClose={() => setShowCharacterSelector(false)}
        onSelectCharacter={handleSelectExistingCharacter}
        onSelectMultipleCharacters={handleSelectMultipleCharacters}
        onCreateCharacter={handleCreateNewCharacter}
        title={`Добавить персонажей в квест "${value.title}"`}
        allowMultipleSelection={true}
      />

      {/* Селектор локаций */}
      <LocationSelector
        visible={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onSelectLocation={handleSelectLocation}
        onSelectMultipleLocations={handleSelectMultipleLocations}
        title={`Добавить локации в квест "${value.title}"`}
        allowMultipleSelection={true}
      />
    </Card>
  );
}


