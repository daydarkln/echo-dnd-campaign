import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Input, 
  Space, 
  Card, 
  Avatar, 
  List, 
  Popconfirm, 
  InputNumber, 
  Tag, 
  Divider,
  Typography,
  Row,
  Col,
  Empty,
  Checkbox,
  message,
  Tooltip,
  Dropdown
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  UserAddOutlined,
  TeamOutlined,
  UserDeleteOutlined,
  SplitCellsOutlined,
  FileTextOutlined,
  MoreOutlined,
  FundOutlined,
  BarsOutlined,
  DashboardOutlined,
  SafetyOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useGroups } from '../hooks/useGroups';
import { useCharacters } from '../hooks/useCharacters';
import { Character } from '../types/groups';
import { getLocationName } from '../utils/locationUtils';
import { CharacterSheetModal } from './CharacterSheetModal';
import { CharacterSelector } from './CharacterSelector';
import { useTrackers } from '../hooks/useTrackers';

const { Text } = Typography;

interface GroupManagerProps {
  visible: boolean;
  onClose: () => void;
  asPanel?: boolean;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ visible, onClose, asPanel = false }) => {
  const {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    addCharacterToGroup,
    removeCharacterFromGroup,
    updateCharacter,
    splitGroup,
    defaultColors
  } = useGroups();

  const {
    createCharacterFromGroup,
    hasCharacter,
    syncWithGroupCharacter,
    getGroupCharacterUpdate
  } = useCharacters();
  const { getCharacterData } = useCharacters();
  const { getCharacterStages, incCharacterStage, decCharacterStage } = useTrackers();

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCharacterForm, setShowCharacterForm] = useState<string | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<{ groupId: string; characterId: string } | null>(null);
  const [showSplitModal, setShowSplitModal] = useState<string | null>(null);
  const [selectedMembersForSplit, setSelectedMembersForSplit] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showCharacterSheet, setShowCharacterSheet] = useState<{ characterId: string; characterName: string } | null>(null);
  const [showCharacterSelector, setShowCharacterSelector] = useState<string | null>(null);
  
  const [groupForm] = Form.useForm();
  const [characterForm] = Form.useForm();
  const [groupEditForm] = Form.useForm();

  // Рефы для актуальных значений
  const groupsRef = useRef(groups);
  const hasCharacterRef = useRef(hasCharacter);
  const getGroupCharacterUpdateRef = useRef(getGroupCharacterUpdate);
  const updateCharacterRef = useRef(updateCharacter);

  // Обновляем рефы при изменении значений
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    hasCharacterRef.current = hasCharacter;
  }, [hasCharacter]);

  useEffect(() => {
    getGroupCharacterUpdateRef.current = getGroupCharacterUpdate;
  }, [getGroupCharacterUpdate]);

  useEffect(() => {
    updateCharacterRef.current = updateCharacter;
  }, [updateCharacter]);

  // Синхронизация данных из листов персонажей обратно в группы
  useEffect(() => {
    const syncCharacterSheetsToGroups = () => {
      groupsRef.current.forEach(group => {
        group.members.forEach(character => {
          const characterId = `${group.id}-${character.id}`;
          
          // Проверяем, есть ли лист персонажа
          if (hasCharacterRef.current(characterId)) {
            // Получаем обновленные данные из листа
            const updatedData = getGroupCharacterUpdateRef.current(characterId);
            
            if (updatedData) {
              // Проверяем, есть ли изменения
              const needsUpdate = 
                updatedData.name !== character.name ||
                updatedData.class !== character.class ||
                updatedData.level !== character.level;
              
              if (needsUpdate) {
                // Обновляем персонажа в группе без лишних сообщений
                updateCharacterRef.current(group.id, character.id, {
                  name: updatedData.name || character.name,
                  class: updatedData.class,
                  level: updatedData.level
                });
              }
            }
          }
        });
      });
    };

    // Устанавливаем интервал для периодической синхронизации
    const interval = setInterval(syncCharacterSheetsToGroups, 2000); // каждые 2 секунды

    // Очищаем интервал при размонтировании
    return () => {
      clearInterval(interval);
    };
  }, []); // Пустой массив зависимостей

  const handleCreateGroup = (values: { name: string; color: string; isPlayers: boolean }) => {
    createGroup(values.name, values.color, values.isPlayers);
    setShowGroupForm(false);
    groupForm.resetFields();
  };

  const handleOpenEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    groupEditForm.setFieldsValue({ name: group.name, color: group.color });
    setEditingGroupId(groupId);
  };

  const handleSubmitEditGroup = () => {
    if (!editingGroupId) return;
    groupEditForm.validateFields().then(values => {
      updateGroup(editingGroupId, { name: values.name, color: values.color });
      setEditingGroupId(null);
      groupEditForm.resetFields();
    });
  };

  const handleAddCharacter = (groupId: string) => {
    characterForm.validateFields().then((values) => {
      const character: Omit<Character, 'id'> = {
        name: values.name,
        class: values.class || undefined,
        level: values.level || undefined
      };
      
      addCharacterToGroup(groupId, character);
      setShowCharacterForm(null);
      characterForm.resetFields();
      
      message.success(`Персонаж "${character.name}" добавлен в группу`);
    });
  };

  // Обработчик выбора существующего персонажа
  const handleSelectExistingCharacter = async (character: { id: string; name: string; class?: string; level?: number }) => {
    if (!showCharacterSelector) return;

    try {
      // Добавляем персонажа в группу
      const groupCharacter: Omit<Character, 'id'> = {
        name: character.name,
        class: character.class,
        level: character.level
      };
      
      const addedCharacter = addCharacterToGroup(showCharacterSelector, groupCharacter);
      
      // Сохраняем связь между персонажем из системы персонажей и персонажем в группе
      // Это позволит синхронизировать данные в будущем
      const metadata = {
        originalCharacterId: character.id,
        groupId: showCharacterSelector,
        groupCharacterId: addedCharacter.id
      };
      
      // Сохраняем метаданные в localStorage для возможной синхронизации
      const existingMappings = JSON.parse(localStorage.getItem('character-group-mappings') || '{}');
      existingMappings[addedCharacter.id] = metadata;
      localStorage.setItem('character-group-mappings', JSON.stringify(existingMappings));
      
      setShowCharacterSelector(null);
      message.success(`Персонаж "${character.name}" добавлен в группу`);
    } catch (error) {
      console.error('Ошибка при добавлении персонажа:', error);
      message.error('Ошибка при добавлении персонажа в группу');
    }
  };

  // Обработчик создания нового персонажа
  const handleCreateNewCharacter = async (character: { name: string; class?: string; level?: number }) => {
    if (!showCharacterSelector) return;

    try {
      // Создаем персонажа в системе персонажей
      const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const characterData = {
        id: characterId,
        name: character.name,
        level: character.level || 1,
        hasCharacterSheet: false,
        createdAt: new Date().toISOString(),
        data: JSON.stringify({
          name: { value: character.name },
          info: {
            level: { value: character.level || 1 },
            charClass: { value: character.class || '' }
          },
          hasCharacterSheet: false
        })
      };

      // Сохраняем в localStorage
      const stored = localStorage.getItem('dnd-characters-collection') || '{}';
      const collection = JSON.parse(stored);
      collection[characterId] = characterData;
      localStorage.setItem('dnd-characters-collection', JSON.stringify(collection));

      // Пытаемся сохранить на JSON server
      try {
        await fetch('http://localhost:3001/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(characterData)
        });
      } catch (error) {
        console.warn('JSON server недоступен:', error);
      }

      // Добавляем персонажа в группу
      const groupCharacter: Omit<Character, 'id'> = {
        name: character.name,
        class: character.class,
        level: character.level
      };
      
      const addedCharacter = addCharacterToGroup(showCharacterSelector, groupCharacter);
      
      // Сохраняем связь
      const metadata = {
        originalCharacterId: characterId,
        groupId: showCharacterSelector,
        groupCharacterId: addedCharacter.id
      };
      
      const existingMappings = JSON.parse(localStorage.getItem('character-group-mappings') || '{}');
      existingMappings[addedCharacter.id] = metadata;
      localStorage.setItem('character-group-mappings', JSON.stringify(existingMappings));
      
      setShowCharacterSelector(null);
      message.success(`Персонаж "${character.name}" создан и добавлен в группу`);
    } catch (error) {
      console.error('Ошибка при создании персонажа:', error);
      message.error('Ошибка при создании персонажа');
    }
  };

  const handleEditCharacter = (groupId: string, characterId: string) => {
    const group = groups.find(g => g.id === groupId);
    const character = group?.members.find(c => c.id === characterId);
    
    if (character) {
      characterForm.setFieldsValue({
        name: character.name,
        class: character.class,
        level: character.level
      });
      setEditingCharacter({ groupId, characterId });
      setShowCharacterForm(groupId);
    }
  };

  const handleUpdateCharacter = (groupId: string, characterId: string) => {
    characterForm.validateFields().then((values) => {
      const updatedCharacter = {
        name: values.name,
        class: values.class || undefined,
        level: values.level || undefined
      };
      
      updateCharacter(groupId, characterId, updatedCharacter);
      
      // Синхронизируем с листом персонажа, если он существует
      const sheetCharacterId = `${groupId}-${characterId}`;
      if (hasCharacter(sheetCharacterId)) {
        // Получаем обновленного персонажа из группы
        const group = groups.find(g => g.id === groupId);
        const character = group?.members.find(c => c.id === characterId);
        if (character) {
          syncWithGroupCharacter(sheetCharacterId, character);
        }
      }
      
      setEditingCharacter(null);
      setShowCharacterForm(null);
      characterForm.resetFields();
    });
  };

  // Обработчик создания и открытия листа персонажа
  const handleOpenCharacterSheet = (groupId: string, character: Character) => {
    const characterId = `${groupId}-${character.id}`;
    
    // Создаем лист персонажа, если его еще нет
    if (!hasCharacter(characterId)) {
      createCharacterFromGroup(character, groupId);
      message.success(`Создан лист для персонажа "${character.name}"`);
    } else {
      // Синхронизируем данные, если лист уже существует
      syncWithGroupCharacter(characterId, character);
    }
    
    // Открываем модальное окно
    setShowCharacterSheet({
      characterId,
      characterName: character.name
    });
  };

  const handleSplitGroup = (groupId: string) => {
    if (selectedMembersForSplit.length === 0) {
      message.error('Выберите участников для новой группы');
      return;
    }

    const originalGroup = groups.find(g => g.id === groupId);
    if (!originalGroup) return;

    if (selectedMembersForSplit.length >= originalGroup.members.length) {
      message.error('Нельзя переместить всех участников в новую группу');
      return;
    }

    const newGroup = splitGroup(groupId, selectedMembersForSplit);
    if (newGroup) {
      message.success(`Создана новая группа "${newGroup.name}"`);
      setShowSplitModal(null);
      setSelectedMembersForSplit([]);
    } else {
      message.error('Ошибка при разделении группы');
    }
  };

  const ColorSelector = ({ value, onChange }: { value?: string; onChange?: (color: string) => void }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {defaultColors.map((color) => (
        <div
          key={color}
          onClick={() => onChange?.(color)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: color,
            border: value === color ? '3px solid #1890ff' : '2px solid #d9d9d9',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
        />
      ))}
    </div>
  );

  const header = (
    <Space>
      <TeamOutlined />
      <span>Управление группами</span>
    </Space>
  );

  const mainContent = (
    <>
      {/* Кнопка создания новой группы */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowGroupForm(true)}
        >
          Создать группу
        </Button>
      </div>

      {/* Список групп */}
      {groups.length === 0 ? (
        <Empty
          description="Нет созданных групп"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={groups}
          renderItem={(group) => (
            <List.Item style={{ padding: 0, marginBottom: 16 }}>
              <Card
                style={{ 
                  width: '100%'
                }}
                title={
                  <Space>
                    <Avatar
                      
                      style={{ backgroundColor: group.color }}
                      icon={<TeamOutlined />}
                    />
                    <span>{group.name}</span>
                  </Space>
                }
                extra={
                  (() => {
                    const hasAnySheets = group.members.some(m => hasCharacter(`${group.id}-${m.id}`));

                    const actionItems = [
                      {
                        key: 'edit',
                        label: <span onClick={() => handleOpenEditGroup(group.id)}><EditOutlined /> Редактировать</span>
                      },
                      {
                        key: 'players',
                        label: <span onClick={() => updateGroup(group.id, { isPlayers: !group.isPlayers })}><TeamOutlined /> {group.isPlayers ? 'Сделать NPC' : 'Отметить как игроков'}</span>
                      },
                      ...(group.members.length > 1 ? [{
                        key: 'split',
                        label: <span onClick={() => setShowSplitModal(group.id)}><SplitCellsOutlined /> Разделить группу</span>
                      }] : []),
                      {
                        key: 'delete',
                        danger: true,
                        label: (
                          <Popconfirm title="Удалить группу?" description="Это действие нельзя отменить" onConfirm={() => deleteGroup(group.id)} okText="Да" cancelText="Нет">
                            <span style={{ color: '#ff4d4f' }}><DeleteOutlined /> Удалить</span>
                          </Popconfirm>
                        )
                      }
                    ];

                    const trackerItems = [
                      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Трекеры заражения</div>, type: 'group' as const },
                      ...group.members.map(m => {
                        const id = `${group.id}-${m.id}`;
                        const st = getCharacterStages(id);
                        return { 
                          key: id, 
                          label: (
                            <div style={{ minWidth: '200px' }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{m.name.split(' ')[0]}</div>
                              <Space direction="vertical" size={4}>
                                <Space style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Споры:</Text>
                                  <Space size={4}>
                                    <Button 
                                       
                                      type="text" 
                                      style={{ minWidth: 18, height: 18, padding: 0, fontSize: 10 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        decCharacterStage(id, 'sporesStage');
                                      }}
                                    >-</Button>
                                    <Tag 
                                      color={st.sporesStage > 2 ? 'red' : 'blue'} 
                                      style={{ margin: 0, fontSize: 10, padding: '0 4px', minWidth: 20, textAlign: 'center' }}
                                    >
                                      {st.sporesStage}
                                    </Tag>
                                    <Button 
                                       
                                      type="text" 
                                      style={{ minWidth: 18, height: 18, padding: 0, fontSize: 10 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        incCharacterStage(id, 'sporesStage');
                                      }}
                                    >+</Button>
                                  </Space>
                                </Space>
                                <Space style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Тень:</Text>
                                  <Space size={4}>
                                    <Button 
                                       
                                      type="text" 
                                      style={{ minWidth: 18, height: 18, padding: 0, fontSize: 10 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        decCharacterStage(id, 'shadowStage');
                                      }}
                                    >-</Button>
                                    <Tag 
                                      color={st.shadowStage > 2 ? 'red' : 'purple'} 
                                      style={{ margin: 0, fontSize: 10, padding: '0 4px', minWidth: 20, textAlign: 'center' }}
                                    >
                                      {st.shadowStage}
                                    </Tag>
                                    <Button 
                                       
                                      type="text" 
                                      style={{ minWidth: 18, height: 18, padding: 0, fontSize: 10 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        incCharacterStage(id, 'shadowStage');
                                      }}
                                    >+</Button>
                                  </Space>
                                </Space>
                              </Space>
                            </div>
                          )
                        };
                      })
                    ];

                    const skillsItems = [
                      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Владение навыками</div>, type: 'group' as const },
                      ...group.members.map(m => {
                        const id = `${group.id}-${m.id}`;
                        const cd = getCharacterData(id);
                        const prof = cd ? Object.values(cd.skills || {}).filter((s: any) => (s.isProf || 0) > 0).map((s: any) => s.label).join(', ') : '—';
                        return { 
                          key: id, 
                          label: (
                            <div style={{ minWidth: '250px' }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{m.name.split(' ')[0]}</div>
                              <div style={{ fontWeight: 'bold', textAlign: 'left', maxWidth: '200px' }}>
                                {prof || '—'}
                              </div>
                            </div>
                          )
                        };
                      })
                    ];

                    const savesItems = [
                      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Владение спасбросками</div>, type: 'group' as const },
                      ...group.members.map(m => {
                        const id = `${group.id}-${m.id}`;
                        const cd = getCharacterData(id);
                        const list = cd ? Object.entries(cd.saves || {})
                          .filter(([, s]: any) => s.isProf)
                          .map(([k]: any) => {
                            const statKey = k as keyof typeof cd.stats;
                            return cd.stats?.[statKey]?.label || String(k).toUpperCase();
                          })
                          .join(', ') : '—';
                        return { 
                          key: id, 
                          label: (
                            <div style={{ minWidth: '200px' }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{m.name.split(' ')[0]}</div>
                              <div style={{ fontWeight: 'bold', textAlign: 'left' }}>
                                {list || '—'}
                              </div>
                            </div>
                          )
                        };
                      })
                    ];

                    const acItems = [
                      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Класс Доспеха (КД)</div>, type: 'group' as const },
                      ...group.members.map(m => {
                        const id = `${group.id}-${m.id}`;
                        const cd = getCharacterData(id);
                        const ac = cd?.vitality?.ac?.value ?? '—';
                        return { 
                          key: id, 
                          label: (
                            <div style={{ minWidth: '120px' }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{m.name.split(' ')[0]}</div>
                              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                                {ac}
                              </div>
                            </div>
                          )
                        };
                      })
                    ];

                    const ppItems = [
                      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Пассивная Внимательность</div>, type: 'group' as const },
                      ...group.members.map(m => {
                        const id = `${group.id}-${m.id}`;
                        const cd = getCharacterData(id);
                        if (!cd) return { 
                          key: id, 
                          label: (
                            <div style={{ minWidth: '120px' }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{m.name.split(' ')[0]}</div>
                              <div style={{ fontWeight: 'bold' }}>—</div>
                            </div>
                          )
                        };
                        const wisMod = (cd.stats?.wis as any)?.modifier ?? 0;
                        const level = Number((cd.info?.level as any)?.value ?? 1);
                        const proficiency = Math.floor((level - 1) / 4) + 2;
                        const percProf = (cd.skills?.perception as any)?.isProf || 0;
                        const profBonus = percProf ? proficiency * (percProf === 2 ? 2 : 1) : 0;
                        const pp = 10 + wisMod + profBonus;
                        return { 
                          key: id, 
                          label: (
                            <div style={{ minWidth: '120px' }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{m.name.split(' ')[0]}</div>
                              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#52c41a' }}>
                                {pp}
                              </div>
                            </div>
                          )
                        };
                      })
                    ];

                    return (
                      <Space size={8}>
                        {hasAnySheets && (
                          <>
                            <Dropdown trigger={["hover"]} menu={{ items: trackerItems }} placement="bottomRight">
                              <Button type="text" icon={<FundOutlined />} />
                            </Dropdown>
                            <Dropdown trigger={["hover"]} menu={{ items: skillsItems }} placement="bottomRight">
                              <Button type="text" icon={<BarsOutlined />} />
                            </Dropdown>
                            <Dropdown trigger={["hover"]} menu={{ items: savesItems }} placement="bottomRight">
                              <Button type="text" icon={<DashboardOutlined />} />
                            </Dropdown>
                            <Dropdown trigger={["hover"]} menu={{ items: acItems }} placement="bottomRight">
                              <Button type="text" icon={<SafetyOutlined />} />
                            </Dropdown>
                            <Dropdown trigger={["hover"]} menu={{ items: ppItems }} placement="bottomRight">
                              <Button type="text" icon={<EyeOutlined />} />
                            </Dropdown>
                          </>
                        )}
                        <Dropdown placement="bottomRight" menu={{ items: actionItems }} trigger={["click"]}>
                          <Button icon={<MoreOutlined />} />
                        </Dropdown>
                      </Space>
                    );
                  })()
                }
              >
                  <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Text type="secondary">
                    Участников: {group.members.length}
                    {group.currentLocation && ` • Локация: ${getLocationName(group.currentLocation)}`}
                  </Text>
                    {group.isPlayers && <Tag color="gold">Игроки</Tag>}
                </div>

                {/* Список участников */}
                {group.members.length > 0 && (
                  <List
                    
                    dataSource={group.members}
                    renderItem={(character) => (
                      <List.Item
                        actions={[
                          <Tooltip key="sheet" title="Создать/открыть лист персонажа">
                            <Button
                              type="link"
                              icon={<FileTextOutlined />}
                              onClick={() => handleOpenCharacterSheet(group.id, character)}
                              style={{ 
                                color: hasCharacter(`${group.id}-${character.id}`) ? '#52c41a' : '#1890ff'
                              }}
                            />
                          </Tooltip>,
                          <Tooltip key="edit" title="Редактировать персонажа в группе">
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              onClick={() => handleEditCharacter(group.id, character.id)}
                            />
                          </Tooltip>,
                          <Popconfirm
                            key="delete"
                            title="Удалить персонажа?"
                            onConfirm={() => removeCharacterFromGroup(group.id, character.id)}
                            okText="Да"
                            cancelText="Нет"
                          >
                            <Button
                              type="link"
                              danger
                              icon={<UserDeleteOutlined />}
                            />
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar >{character.name.charAt(0).toUpperCase()}</Avatar>}
                          title={character.name}
                          description={
                            <Space direction="vertical" size={4}>
                              <Space size={4}>
                                {character.class && <Tag color="blue">{character.class}</Tag>}
                                {character.level && <Tag color="green">Ур. {character.level}</Tag>}
                              </Space>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}

                <Divider style={{ margin: '12px 0' }} />
                
                <Button
                  type="dashed"
                  icon={<UserAddOutlined />}
                  onClick={() => setShowCharacterSelector(group.id)}
                  style={{ width: '100%' }}
                >
                  Добавить участника
                </Button>
              </Card>
            </List.Item>
          )}
        />
      )}
    </>
  );

  return (
    <>
      {asPanel ? (
        <Card title={header} style={{ width: '100%' }}>
          {mainContent}
        </Card>
      ) : (
        <Modal
          title={header}
          open={visible}
          onCancel={onClose}
          footer={null}
          width={800}
          style={{ top: 20 }}
          bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
        >
          {mainContent}
        </Modal>
      )}

      {/* Модалка создания группы */}
      <Modal
        title="Создать новую группу"
        open={showGroupForm}
        onCancel={() => {
          setShowGroupForm(false);
          groupForm.resetFields();
        }}
        onOk={() => groupForm.submit()}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleCreateGroup}
          initialValues={{ color: defaultColors[0], isPlayers: false }}
        >
          <Form.Item
            name="name"
            label="Название группы"
            rules={[
              { required: true, message: 'Введите название группы' },
              { max: 50, message: 'Максимум 50 символов' }
            ]}
          >
            <Input placeholder="Введите название группы" />
          </Form.Item>
          
          <Form.Item
            name="color"
            label="Цвет группы"
            rules={[{ required: true }]}
          >
            <ColorSelector />
          </Form.Item>

          <Form.Item
            name="isPlayers"
            valuePropName="checked"
            tooltip="Можно иметь несколько групп игроков и группы NPC"
          >
            <Checkbox>Это группа игроков</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка редактирования группы */}
      <Modal
        title="Редактировать группу"
        open={editingGroupId !== null}
        onCancel={() => {
          setEditingGroupId(null);
          groupEditForm.resetFields();
        }}
        onOk={handleSubmitEditGroup}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={groupEditForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Название группы"
            rules={[
              { required: true, message: 'Введите название группы' },
              { max: 50, message: 'Максимум 50 символов' }
            ]}
          >
            <Input placeholder="Название группы" />
          </Form.Item>

          <Form.Item
            name="color"
            label="Цвет группы"
            rules={[{ required: true }]}
          >
            <ColorSelector />
          </Form.Item>
        </Form>
      </Modal>
      {/* Модалка добавления/редактирования персонажа */}
      <Modal
        title={editingCharacter ? "Редактировать персонажа" : "Добавить персонажа"}
        open={showCharacterForm !== null}
        onCancel={() => {
          setShowCharacterForm(null);
          setEditingCharacter(null);
          characterForm.resetFields();
        }}
        onOk={() => {
          if (editingCharacter) {
            handleUpdateCharacter(editingCharacter.groupId, editingCharacter.characterId);
          } else if (showCharacterForm) {
            handleAddCharacter(showCharacterForm);
          }
        }}
        okText={editingCharacter ? "Сохранить" : "Добавить"}
        cancelText="Отмена"
      >
        <Form
          form={characterForm}
          layout="vertical"
          initialValues={{ level: 1 }}
        >
          <Form.Item
            name="name"
            label="Имя персонажа"
            rules={[
              { required: true, message: 'Введите имя персонажа' },
              { max: 30, message: 'Максимум 30 символов' }
            ]}
          >
            <Input placeholder="Введите имя персонажа" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="class"
                label="Класс"
                rules={[{ max: 20, message: 'Максимум 20 символов' }]}
              >
                <Input placeholder="Класс (необязательно)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="level"
                label="Уровень"
                rules={[
                  { type: 'number', min: 1, max: 20, message: 'Уровень от 1 до 20' }
                ]}
              >
                <InputNumber
                  placeholder="Уровень"
                  min={1}
                  max={20}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Модалка разделения группы */}
      <Modal
        title="Разделить группу"
        open={showSplitModal !== null}
        onCancel={() => {
          setShowSplitModal(null);
          setSelectedMembersForSplit([]);
        }}
        onOk={() => showSplitModal && handleSplitGroup(showSplitModal)}
        okText="Разделить группу"
        cancelText="Отмена"
        okButtonProps={{
          disabled: selectedMembersForSplit.length === 0
        }}
      >
        {showSplitModal && (
          <div>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              Выберите участников для новой группы. Остальные останутся в текущей группе.
            </Text>
            
            {(() => {
              const group = groups.find(g => g.id === showSplitModal);
              if (!group) return null;

              return (
                <Checkbox.Group
                  value={selectedMembersForSplit}
                  onChange={setSelectedMembersForSplit}
                  style={{ width: '100%' }}
                >
                  <List
                    
                    dataSource={group.members}
                    renderItem={(character) => (
                      <List.Item>
                        <Checkbox value={character.id} style={{ marginRight: 12 }}>
                          <List.Item.Meta
                            avatar={<Avatar >{character.name.charAt(0).toUpperCase()}</Avatar>}
                            title={character.name}
                            description={
                              <Space size={4}>
                                {character.class && <Tag color="blue">{character.class}</Tag>}
                                {character.level && <Tag color="green">Ур. {character.level}</Tag>}
                              </Space>
                            }
                          />
                        </Checkbox>
                      </List.Item>
                    )}
                  />
                </Checkbox.Group>
              );
            })()}

            {selectedMembersForSplit.length > 0 && (
              <div className="split-group-preview">
                <Text strong>Предварительный результат:</Text>
                <div style={{ marginTop: 8 }}>
                  {(() => {
                    const group = groups.find(g => g.id === showSplitModal);
                    if (!group) return null;

                    const baseName = group.name;
                    const existingNumbers = groups
                      .filter(g => g.name.startsWith(baseName))
                      .map(g => {
                        const match = g.name.match(/\((\d+)\)$/);
                        return match ? parseInt(match[1]) : 0;
                      })
                      .sort((a, b) => a - b);
                    
                    let newNumber = 1;
                    for (const num of existingNumbers) {
                      if (num >= newNumber) {
                        newNumber = num + 1;
                      }
                    }

                    const newGroupName = `${baseName}(${newNumber})`;
                    const remainingCount = group.members.length - selectedMembersForSplit.length;

                    return (
                      <div>
                        <Text>• {group.name}: {remainingCount} участник{remainingCount !== 1 ? (remainingCount < 5 ? 'а' : 'ов') : ''}</Text>
                        <br />
                        <Text>• {newGroupName}: {selectedMembersForSplit.length} участник{selectedMembersForSplit.length !== 1 ? (selectedMembersForSplit.length < 5 ? 'а' : 'ов') : ''}</Text>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно листа персонажа */}
      <CharacterSheetModal
        visible={showCharacterSheet !== null}
        onClose={() => setShowCharacterSheet(null)}
        characterId={showCharacterSheet?.characterId || null}
        characterName={showCharacterSheet?.characterName}
      />

      <CharacterSelector
        visible={showCharacterSelector !== null}
        onClose={() => setShowCharacterSelector(null)}
        onSelectCharacter={handleSelectExistingCharacter}
        onCreateCharacter={handleCreateNewCharacter}
        title="Добавить персонажа в группу"
      />
    </>
  );
};