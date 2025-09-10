import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Empty, 
  Row, 
  Col,
  Modal,
  message,
  Popconfirm,
  Divider,
  Tooltip
} from 'antd';
import { 
  UserAddOutlined, 
  FileTextOutlined, 
  DeleteOutlined, 
  EditOutlined,
  TeamOutlined,
  EyeOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCharacters } from '../hooks/useCharacters';
import { CharacterSheet } from '../components/CharacterSheet';
import { CharacterSheetModal } from '../components/CharacterSheetModal';
import { useCharacterGroupSync } from '../hooks/useCharacterGroupSync';

const { Title, Text } = Typography;

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

export const CharacterPage: React.FC = () => {
  const navigate = useNavigate();
  const { characters } = useCharacters();
  const { getCharacterGroupInfo, syncCharacterToGroups } = useCharacterGroupSync();
  const [charactersList, setCharactersList] = useState<CharacterInfo[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showCharacterSheetModal, setShowCharacterSheetModal] = useState<{ characterId: string; characterName: string } | null>(null);

  useEffect(() => {
    // Загружаем персонажей из localStorage и JSON server
    loadCharacters();
  }, [characters]);

  const loadCharacters = async () => {
    const charactersArray: CharacterInfo[] = [];
    
    // Загружаем из localStorage
    try {
      const localCharacters = JSON.parse(localStorage.getItem('dnd-characters-collection') || '{}');
      Object.entries(localCharacters).forEach(([id, character]: [string, any]) => {
        const characterData = JSON.parse(character.data || '{}');
        charactersArray.push({
          id,
          name: characterData.name?.value || characterData.info?.name?.value || 'Безымянный',
          playerName: characterData.info?.playerName?.value || '',
          race: characterData.info?.race?.value || '',
          class: characterData.info?.charClass?.value || '',
          level: characterData.info?.level?.value || 1,
          hasCharacterSheet: characterData.hasCharacterSheet === true || 
                           (characterData.stats && characterData.skills && characterData.vitality), // проверяем наличие листа или полной структуры
          createdAt: characterData.createdAt || new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Ошибка при загрузке персонажей из localStorage:', error);
    }

    // Также пытаемся загрузить с JSON server
    try {
      const response = await fetch('http://localhost:3001/characters');
      if (response.ok) {
        const serverCharacters = await response.json();
        serverCharacters.forEach((character: any) => {
          // Проверяем, есть ли уже такой персонаж (избегаем дублирования)
          if (!charactersArray.find(c => c.id === character.id)) {
            const characterData = JSON.parse(character.data || '{}');
            charactersArray.push({
              id: character.id,
              name: characterData.name?.value || characterData.info?.name?.value || 'Безымянный',
              playerName: characterData.info?.playerName?.value || '',
              race: characterData.info?.race?.value || '',
              class: characterData.info?.charClass?.value || '',
              level: characterData.info?.level?.value || 1,
              hasCharacterSheet: characterData.hasCharacterSheet === true || 
                               (characterData.stats && characterData.skills && characterData.vitality),
              createdAt: characterData.createdAt || new Date().toISOString()
            });
          }
        });
      }
    } catch (error) {
      console.warn('JSON server недоступен:', error);
    }

    // Сортируем по дате создания (новые сверху)
    charactersArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCharactersList(charactersArray);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      // Удаляем из localStorage
      const localCharacters = JSON.parse(localStorage.getItem('dnd-characters-collection') || '{}');
      delete localCharacters[characterId];
      localStorage.setItem('dnd-characters-collection', JSON.stringify(localCharacters));

      // Пытаемся удалить с JSON server
      try {
        await fetch(`http://localhost:3001/characters/${characterId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Не удалось удалить с JSON server:', error);
      }

      // Перезагружаем список
      loadCharacters();
      message.success('Персонаж удален');
    } catch (error) {
      console.error('Ошибка при удалении персонажа:', error);
      message.error('Ошибка при удалении персонажа');
    }
  };

  const openCharacterSheet = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setShowCharacterSheet(true);
  };

  const openCharacterSheetModal = (characterId: string, characterName: string) => {
    setShowCharacterSheetModal({ characterId, characterName });
  };

  const handleSyncCharacter = async (characterId: string) => {
    try {
      await syncCharacterToGroups(characterId);
      message.success('Персонаж синхронизирован с группами');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      message.error('Ошибка при синхронизации персонажа');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Title level={2} style={{ margin: 0 }}>
                      <TeamOutlined /> Персонажи и NPC
                    </Title>
                    <Text type="secondary">
                      Управление персонажами игроков и NPC кампании
                    </Text>
                  </div>
                  <Button 
                    type="primary" 
                    icon={<UserAddOutlined />}
                    size="large"
                    onClick={() => navigate('/character/create')}
                  >
                    Создать персонажа/NPC
                  </Button>
                </div>

                <Divider />

                {charactersList.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Персонажи не найдены"
                  >
                    <Button 
                      type="primary" 
                      icon={<UserAddOutlined />}
                      onClick={() => navigate('/character/create')}
                    >
                      Создать первый персонаж/NPC
                    </Button>
                  </Empty>
                ) : (
                  <List
                    dataSource={charactersList}
                    renderItem={(character) => {
                      const groupInfo = getCharacterGroupInfo(character.id);
                      
                      return (
                        <List.Item
                          actions={[
                            ...(character.hasCharacterSheet ? [
                              <Button
                                key="sheet"
                                type="link"
                                icon={<FileTextOutlined />}
                                onClick={() => openCharacterSheet(character.id)}
                              >
                                Лист персонажа
                              </Button>,
                              <Button
                                key="sheet-modal"
                                type="link"
                                icon={<EyeOutlined />}
                                onClick={() => openCharacterSheetModal(character.id, character.name)}
                              >
                                Быстрый просмотр
                              </Button>
                            ] : []),
                            ...(groupInfo.length > 0 ? [
                              <Tooltip key="sync" title="Синхронизировать данные с группами">
                                <Button
                                  type="link"
                                  icon={<SyncOutlined />}
                                  onClick={() => handleSyncCharacter(character.id)}
                                >
                                  Синхронизировать
                                </Button>
                              </Tooltip>
                            ] : []),
                            ...(!character.hasCharacterSheet ? [
                              <Button
                                key="edit"
                                type="link"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/character/edit/${character.id}`)}
                              >
                                Редактировать
                              </Button>
                            ] : []),
                            <Popconfirm
                              key="delete"
                              title="Удалить персонажа?"
                              description="Это действие нельзя отменить"
                              onConfirm={() => handleDeleteCharacter(character.id)}
                              okText="Да"
                              cancelText="Нет"
                            >
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                Удалить
                              </Button>
                            </Popconfirm>
                          ]}
                        >
                        <List.Item.Meta
                          avatar={
                            <Avatar size={64} style={{ backgroundColor: '#1890ff' }}>
                              {character.name.charAt(0).toUpperCase()}
                            </Avatar>
                          }
                          title={
                            <Space>
                              <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                                {character.name}
                              </span>
                              {character.hasCharacterSheet ? (
                                <Tag color="green" icon={<FileTextOutlined />}>
                                  Лист создан
                                </Tag>
                              ) : (
                                <Tag color="orange">
                                  Только базовая информация
                                </Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" >
                              <div>
                                <Text strong>Уровень:</Text> {character.level}
                                {character.playerName && (
                                  <>
                                    <Text strong> • Игрок:</Text> {character.playerName}
                                  </>
                                )}
                              </div>
                              {(character.race || character.class) && (
                                <div>
                                  {character.race && (
                                    <>
                                      <Text strong>Раса:</Text> {character.race}
                                      {character.class && ' • '}
                                    </>
                                  )}
                                  {character.class && (
                                    <>
                                      <Text strong>Класс:</Text> {character.class}
                                    </>
                                  )}
                                </div>
                              )}
                              {groupInfo.length > 0 && (
                                <div>
                                  <Text strong><TeamOutlined /> В группах:</Text>{' '}
                                  <Space wrap>
                                    {groupInfo.map((info) => (
                                      <Tag 
                                        key={info.groupId} 
                                        color="blue"
                                        style={{ margin: '2px' }}
                                      >
                                        {info.groupName}
                                      </Tag>
                                    ))}
                                  </Space>
                                </div>
                              )}
                              <div>
                                <Text type="secondary">
                                  Создан: {formatDate(character.createdAt)}
                                </Text>
                              </div>
                            </Space>
                          }
                        />
                      </List.Item>
                      );
                    }}
                  />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Модальное окно с листом персонажа */}
      <Modal
        title="Лист персонажа"
        open={showCharacterSheet}
        onCancel={() => setShowCharacterSheet(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        destroyOnClose
      >
        {selectedCharacterId && (
          <CharacterSheet characterId={selectedCharacterId} />
        )}
      </Modal>

      {/* Модальное окно быстрого просмотра листа персонажа */}
      <CharacterSheetModal
        visible={showCharacterSheetModal !== null}
        onClose={() => setShowCharacterSheetModal(null)}
        characterId={showCharacterSheetModal?.characterId || null}
        characterName={showCharacterSheetModal?.characterName}
      />
    </div>
  );
};