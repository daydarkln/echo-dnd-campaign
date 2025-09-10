import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  List,
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  message,
  Radio,
  Checkbox,
  Avatar,
  Tag,
  Space,
  Typography,
  Empty
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Интерфейсы для совместимости с системой персонажей
interface CharacterInfo {
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  level: number;
  hasCharacterSheet: boolean;
  createdAt: string;
}

interface CharacterFormData {
  name: string;
  level: number;
  class?: string;
  createCharacterSheet: boolean;
}

interface CharacterSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectCharacter?: (character: { id: string; name: string; class?: string; level?: number }) => void;
  onSelectMultipleCharacters?: (characters: { id: string; name: string; class?: string; level?: number }[]) => void;
  onCreateCharacter: (character: { name: string; class?: string; level?: number }) => void;
  title?: string;
  allowMultipleSelection?: boolean;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  visible,
  onClose,
  onSelectCharacter,
  onSelectMultipleCharacters,
  onCreateCharacter,
  title = "Добавить персонажа в группу",
  allowMultipleSelection = false
}) => {
  const [activeTab, setActiveTab] = useState('select');
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [form] = Form.useForm<CharacterFormData>();

  // Загружаем персонажей при открытии модалки
  useEffect(() => {
    if (visible) {
      loadCharacters();
    }
  }, [visible]);

  const loadCharacters = async () => {
    const allCharacters: CharacterInfo[] = [];

    try {
      // Загружаем из localStorage
      const stored = localStorage.getItem('dnd-characters-collection');
      if (stored) {
        const collection = JSON.parse(stored);
        Object.entries(collection).forEach(([id, characterData]: [string, any]) => {
          if (characterData && typeof characterData === 'object') {
            const parsedData = typeof characterData.data === 'string' ? JSON.parse(characterData.data) : characterData.data;
            allCharacters.push({
              id,
              name: parsedData.name?.value || parsedData.info?.name?.value || 'Безымянный',
              playerName: parsedData.info?.playerName?.value || '',
              race: parsedData.info?.race?.value || '',
              class: parsedData.info?.charClass?.value || '',
              level: parsedData.info?.level?.value || 1,
              hasCharacterSheet: parsedData.hasCharacterSheet === true || 
                               (parsedData.stats && parsedData.skills && parsedData.vitality),
              createdAt: characterData.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Загружаем с JSON server
      try {
        const response = await fetch('http://localhost:3001/characters');
        if (response.ok) {
          const serverCharacters = await response.json();
          serverCharacters.forEach((character: any) => {
            // Проверяем, нет ли уже такого персонажа
            if (!allCharacters.find(c => c.id === character.id)) {
              const parsedData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data;
              allCharacters.push({
                id: character.id,
                name: parsedData.name?.value || parsedData.info?.name?.value || 'Безымянный',
                playerName: parsedData.info?.playerName?.value || '',
                race: parsedData.info?.race?.value || '',
                class: parsedData.info?.charClass?.value || '',
                level: parsedData.info?.level?.value || 1,
                hasCharacterSheet: parsedData.hasCharacterSheet === true || 
                                 (parsedData.stats && parsedData.skills && parsedData.vitality),
                createdAt: character.createdAt || new Date().toISOString()
              });
            }
          });
        }
      } catch (error) {
        console.warn('JSON server недоступен:', error);
      }

      setCharacters(allCharacters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Ошибка при загрузке персонажей:', error);
      message.error('Ошибка при загрузке персонажей');
    }
  };

  const handleSelectCharacter = () => {
    if (allowMultipleSelection) {
      if (selectedCharacterIds.length === 0) {
        message.error('Выберите хотя бы одного персонажа');
        return;
      }
      
      const selectedCharacters = characters.filter(c => selectedCharacterIds.includes(c.id));
      if (onSelectMultipleCharacters) {
        onSelectMultipleCharacters(selectedCharacters.map(character => ({
          id: character.id,
          name: character.name,
          class: character.class || undefined,
          level: character.level
        })));
      }
      handleClose();
    } else {
      const character = characters.find(c => c.id === selectedCharacterId);
      if (character && onSelectCharacter) {
        onSelectCharacter({
          id: character.id,
          name: character.name,
          class: character.class || undefined,
          level: character.level
        });
        handleClose();
      } else {
        message.error('Выберите персонажа');
      }
    }
  };

  const handleToggleCharacterSelection = (characterId: string) => {
    if (allowMultipleSelection) {
      setSelectedCharacterIds(prev => 
        prev.includes(characterId) 
          ? prev.filter(id => id !== characterId)
          : [...prev, characterId]
      );
    } else {
      setSelectedCharacterId(characterId);
    }
  };

  const handleCreateCharacter = async (values: CharacterFormData) => {
    try {
      onCreateCharacter({
        name: values.name,
        level: values.level,
        class: values.class
      });
      handleClose();
      message.success('Персонаж создан и добавлен в группу');
    } catch (error) {
      console.error('Ошибка создания персонажа:', error);
      message.error('Ошибка при создании персонажа');
    }
  };

  const handleClose = () => {
    setSelectedCharacterId(null);
    setSelectedCharacterIds([]);
    setActiveTab('select');
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={null}
      destroyOnClose
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'select',
            label: (
              <span>
                <TeamOutlined />
                Выбрать существующего
              </span>
            ),
            children: (
              <div style={{ minHeight: 300 }}>
                {characters.length > 0 ? (
                  <>
                    <List
                      dataSource={characters}
                      renderItem={(character) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              allowMultipleSelection ? (
                                <Checkbox
                                  checked={selectedCharacterIds.includes(character.id)}
                                  onChange={() => handleToggleCharacterSelection(character.id)}
                                >
                                  <Avatar 
                                    style={{ backgroundColor: character.hasCharacterSheet ? '#52c41a' : '#fa8c16' }}
                                    icon={<UserOutlined />}
                                  />
                                </Checkbox>
                              ) : (
                                <Radio 
                                  checked={selectedCharacterId === character.id}
                                  onChange={() => handleToggleCharacterSelection(character.id)}
                                >
                                  <Avatar 
                                    style={{ backgroundColor: character.hasCharacterSheet ? '#52c41a' : '#fa8c16' }}
                                    icon={<UserOutlined />}
                                  />
                                </Radio>
                              )
                            }
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Text strong>{character.name}</Text>
                                  {character.hasCharacterSheet ? (
                                    <Tag color="green">Лист создан</Tag>
                                  ) : (
                                    <Tag color="orange">Только базовая информация</Tag>
                                  )}
                                </div>
                              }
                              description={
                                <Space direction="vertical" size={2}>
                                  {character.playerName && (
                                    <Text type="secondary">Игрок: {character.playerName}</Text>
                                  )}
                                  {character.race && character.class ? (
                                    <Text type="secondary">
                                      {character.race} {character.class} {character.level} уровня
                                    </Text>
                                  ) : character.class ? (
                                    <Text type="secondary">
                                      {character.class} {character.level} уровня
                                    </Text>
                                  ) : (
                                    <Text type="secondary">
                                      {character.level} уровень
                                    </Text>
                                  )}
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {allowMultipleSelection && (
                        <Text type="secondary">
                          Выбрано: {selectedCharacterIds.length} персонаж{selectedCharacterIds.length !== 1 ? (selectedCharacterIds.length < 5 ? 'а' : 'ей') : ''}
                        </Text>
                      )}
                      <Button 
                        type="primary" 
                        onClick={handleSelectCharacter}
                        disabled={allowMultipleSelection ? selectedCharacterIds.length === 0 : !selectedCharacterId}
                      >
                        {allowMultipleSelection 
                          ? `Добавить ${selectedCharacterIds.length > 0 ? selectedCharacterIds.length + ' ' : ''}в группу`
                          : 'Добавить в группу'
                        }
                      </Button>
                    </div>
                  </>
                ) : (
                  <Empty 
                    description="Нет созданных персонажей"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={() => setActiveTab('create')}>
                      Создать первого персонажа
                    </Button>
                  </Empty>
                )}
              </div>
            )
          },
          {
            key: 'create',
            label: (
              <span>
                <PlusOutlined />
                Создать нового
              </span>
            ),
            children: (
              <div style={{ minHeight: 300, paddingTop: 16 }}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleCreateCharacter}
                  initialValues={{ level: 1, createCharacterSheet: false }}
                >
                  <Form.Item
                    name="name"
                    label="Имя персонажа"
                    rules={[
                      { required: true, message: 'Введите имя персонажа' },
                      { max: 50, message: 'Максимум 50 символов' }
                    ]}
                  >
                    <Input 
                      placeholder="Введите имя персонажа или NPC"
                      style={{ fontSize: '14px' }}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="level"
                        label="Уровень"
                        rules={[
                          { required: true, message: 'Укажите уровень' }
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={20}
                          style={{ width: '100%' }}
                          placeholder="Уровень персонажа"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="class"
                        label="Класс"
                      >
                        <Input 
                          placeholder="Класс персонажа (необязательно)"
                          style={{ fontSize: '14px' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Button onClick={handleClose}>
                          Отмена
                        </Button>
                      </Col>
                      <Col>
                        <Button type="primary" htmlType="submit">
                          Создать и добавить в группу
                        </Button>
                      </Col>
                    </Row>
                  </Form.Item>
                </Form>
              </div>
            )
          }
        ]}
      />
    </Modal>
  );
};
