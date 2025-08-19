import React, { useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Select,
  Input,
  InputNumber,
  Badge,
  Dropdown,
  MenuProps,
  Tag,
  Alert,
  Modal,
  message,
  Divider,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  UserOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  HeartOutlined,
  StopOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useInitiativeTracker } from '../hooks/useInitiativeTracker';
import { useGroups } from '../hooks/useGroups';
import { CharacterStatus, InitiativeCharacter, DeathSaveType, DEATH_SAVE_MAX } from '../types/initiative';
import DeathSaveTracker from './DeathSaveTracker';

const { Title, Text } = Typography;
const { Option } = Select;

const statusConfig = {
  active: { label: 'Активен', color: 'green', icon: '💚' },
  unconscious: { label: 'Без сознания', color: 'orange', icon: '😵' },
  dead: { label: 'Мертв', color: 'red', icon: '💀' },
  'death-saving': { label: 'Спасброски от смерти', color: 'volcano', icon: '⚡' }
};

const InitiativeTracker: React.FC = () => {
  const {
    encounters,
    currentEncounter,
    createEncounter,
    deleteEncounter,
    setCharacterInitiative,
    startCombat,
    nextTurn,
    setCharacterStatus,
    addDeathSave,
    resetDeathSaves,
    endCombat,
    setCurrentEncounter,
    isNextTurnBlocked
  } = useInitiativeTracker();

  const { groups } = useGroups();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [encounterName, setEncounterName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [editingInitiatives, setEditingInitiatives] = useState<Record<string, number>>({});

  // Группы для выбора
  const availableGroups = useMemo(() => {
    return groups.filter(group => group.members.length > 0);
  }, [groups]);

  // Создание нового энкаунтера
  const handleCreateEncounter = () => {
    if (!encounterName.trim()) {
      message.error('Введите название энкаунтера');
      return;
    }

    if (selectedGroupIds.length < 2) {
      message.error('Выберите минимум 2 группы');
      return;
    }

    const selectedGroups = groups.filter(g => selectedGroupIds.includes(g.id));
    
    try {
      createEncounter(encounterName.trim(), selectedGroups);
      setShowCreateForm(false);
      setEncounterName('');
      setSelectedGroupIds([]);
      message.success('Энкаунтер создан!');
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  // Обновление инициативы персонажа
  const handleInitiativeChange = (characterId: string, value: number | null) => {
    if (!currentEncounter || value === null) return;
    
    setCharacterInitiative(currentEncounter.id, characterId, value);
  };

  // Обработка спасброска от смерти с автоматическим переходом хода
  const handleDeathSave = (characterId: string, saveType: DeathSaveType) => {
    if (!currentEncounter) return;
    
    // Проверяем, что сейчас ход этого персонажа
    const currentCharacterInTurn = currentEncounter.characters[currentEncounter.currentTurnIndex];
    if (!currentCharacterInTurn || currentCharacterInTurn.id !== characterId) {
      const character = currentEncounter.characters.find(c => c.id === characterId);
      message.warning(`Сейчас не ход персонажа ${character?.name}! Дождитесь своей очереди.`);
      return;
    }
    
    addDeathSave(currentEncounter.id, characterId, saveType);
    
    // Показываем уведомление о переходе хода
    const character = currentEncounter.characters.find(c => c.id === characterId);
    if (character) {
      const saveTypeLabels = {
        'success': 'успех',
        'failure': 'провал', 
        'critical-success': 'критический успех',
        'critical-failure': 'критический провал'
      };
      
      message.success(`${character.name}: ${saveTypeLabels[saveType]}! Кнопка "Следующий ход" разблокирована.`);
    }
  };

  // Начало боя
  const handleStartCombat = () => {
    if (!currentEncounter) return;

    try {
      startCombat(currentEncounter.id);
      message.success('Бой начался!');
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  // Следующий ход
  const handleNextTurn = () => {
    if (!currentEncounter) return;
    nextTurn(currentEncounter.id);
  };

  // Завершение боя
  const handleEndCombat = () => {
    if (!currentEncounter) return;
    endCombat(currentEncounter.id);
    message.success('Бой завершен!');
  };

  // Действия персонажа
  const getCharacterActions = (character: InitiativeCharacter): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'active',
        label: (
          <Space>
            <span style={{ color: statusConfig.active.color }}>💚</span>
            Активен
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'active')
      },
      {
        key: 'unconscious',
        label: (
          <Space>
            <span style={{ color: statusConfig.unconscious.color }}>😵</span>
            Без сознания
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'unconscious')
      },
      {
        key: 'death-saving',
        label: (
          <Space>
            <span style={{ color: statusConfig['death-saving'].color }}>⚡</span>
            Спасброски от смерти
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'death-saving')
      },
      {
        key: 'dead',
        label: (
          <Space>
            <span style={{ color: statusConfig.dead.color }}>💀</span>
            Мертв
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'dead')
      }
    ];

    return items;
  };

  // Рендер карточки персонажа
  const renderCharacterCard = (character: InitiativeCharacter, index: number) => {
    const isCurrentTurn = Boolean(currentEncounter?.isActive && currentEncounter.currentTurnIndex === index);
    const statusInfo = statusConfig[character.status];
    
    // Логирование для отладки спасбросков
    if (character.deathSaves.successes > 0 || character.deathSaves.failures > 0) {
      console.log(`Character ${character.name} death saves:`, character.deathSaves);
    }

    return (
      <Card
        key={character.id}
        size="small"
        style={{
          marginBottom: 8,
          border: isCurrentTurn ? '2px solid #1890ff' : '1px solid #d9d9d9',
          backgroundColor: isCurrentTurn ? '#f0f8ff' : 'white'
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Row align="middle" gutter={[8, 8]}>
          <Col flex="auto">
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space>
                <Badge
                  color={character.groupColor}
                  text={
                    <Text strong style={{ fontSize: 14 }}>
                      {character.name}
                    </Text>
                  }
                />
                {isCurrentTurn && <Tag color="blue">ХОД</Tag>}
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {character.groupName}
              </Text>
            </Space>
          </Col>

          <Col>
            {!currentEncounter?.isActive ? (
              <InputNumber
                size="small"
                placeholder="Инициатива"
                value={character.initiative}
                onChange={(value) => handleInitiativeChange(character.id, value)}
                style={{ width: 80 }}
                min={1}
                max={30}
              />
            ) : (
              <Tag color="geekblue" style={{ minWidth: 60, textAlign: 'center' }}>
                {character.initiative}
              </Tag>
            )}
          </Col>

          <Col>
            <Space>
              <Tag color={statusInfo.color} style={{ margin: 0 }}>
                {statusInfo.icon} {statusInfo.label}
              </Tag>
              <Dropdown
                menu={{ items: getCharacterActions(character) }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </Col>
        </Row>

        {character.status === 'death-saving' && (
          <div style={{ marginTop: 8 }}>
            <DeathSaveTracker
              successes={character.deathSaves.successes}
              failures={character.deathSaves.failures}
              onDeathSave={(saveType: DeathSaveType) => handleDeathSave(character.id, saveType)}
              onReset={() => resetDeathSaves(currentEncounter!.id, character.id)}
              isCurrentTurn={isCurrentTurn || false}
            />
          </div>
        )}
        
        {/* Показываем прогресс спасбросков для персонажей в статусе "без сознания" */}
        {/* Спасброски сохраняются до смерти или полного восстановления */}
        {(character.deathSaves.successes > 0 || character.deathSaves.failures > 0) && 
         character.status === 'unconscious' && (
          <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
            <Text style={{ fontSize: 11, color: '#52c41a', display: 'block', textAlign: 'center', marginBottom: 4 }}>
              📊 Накопленные спасброски:
            </Text>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10, color: '#52c41a' }}>Успехи:</Text>
                {Array.from({ length: DEATH_SAVE_MAX }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: index < character.deathSaves.successes ? '#52c41a' : '#f0f0f0',
                      border: `1px solid #52c41a`
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10, color: '#ff4d4f' }}>Провалы:</Text>
                {Array.from({ length: DEATH_SAVE_MAX }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: index < character.deathSaves.failures ? '#ff4d4f' : '#f0f0f0',
                      border: `1px solid #ff4d4f`
                    }}
                  />
                  ))}
              </div>
            </div>
            <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', display: 'block', marginTop: 4 }}>
              Прогресс сохранится при повторном падении
            </Text>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
            ⚔️ Трекер инициативы
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            Управление боевыми энкаунтерами
          </Text>
        </div>

        {/* Управление энкаунтерами */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col flex="auto">
            <Select
              placeholder="Выберите энкаунтер"
              value={currentEncounter?.id}
              onChange={setCurrentEncounter}
              style={{ width: '100%' }}
              allowClear
            >
              {encounters.map(encounter => (
                <Option key={encounter.id} value={encounter.id}>
                  <Space>
                    <Text>{encounter.name}</Text>
                    {encounter.isActive && <Tag color="green">АКТИВЕН</Tag>}
                    <Text type="secondary">
                      ({encounter.characters.length} персонажей)
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateForm(true)}
            >
              Создать энкаунтер
            </Button>
          </Col>
          {currentEncounter && (
            <Col>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Удалить энкаунтер?',
                    content: 'Это действие нельзя отменить',
                    onOk: () => deleteEncounter(currentEncounter.id)
                  });
                }}
              >
                Удалить
              </Button>
            </Col>
          )}
        </Row>

        {/* Контролы боя */}
        {currentEncounter && (
          <Card size="small" style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Text strong>{currentEncounter.name}</Text>
                  {currentEncounter.isActive && (
                    <Tag color="green">
                      Раунд {currentEncounter.round}
                    </Tag>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  {!currentEncounter.isActive ? (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={handleStartCombat}
                      disabled={currentEncounter.characters.some(c => c.initiative === null)}
                    >
                      Начать бой
                    </Button>
                  ) : (
                    <>
                      <Button
                        icon={<StepForwardOutlined />}
                        onClick={handleNextTurn}
                        disabled={isNextTurnBlocked(currentEncounter.id)}
                      >
                        Следующий ход
                      </Button>
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        {isNextTurnBlocked(currentEncounter.id) ? 
                          '(заблокировано - сделайте спасброк)' : 
                          '(нажмите для следующего хода)'
                        }
                      </Text>
                      <Button
                        icon={<StopOutlined />}
                        onClick={handleEndCombat}
                      >
                        Завершить бой
                      </Button>
                    </>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Список персонажей */}
        {currentEncounter ? (
          <div>
            {currentEncounter.characters.length === 0 ? (
              <Empty description="Нет персонажей в энкаунтере" />
            ) : (
              <div>
                {!currentEncounter.isActive && (
                  <Alert
                    message="Установите инициативу всем персонажам перед началом боя"
                    type="info"
                    style={{ marginBottom: 16 }}
                    showIcon
                  />
                )}
                {currentEncounter.characters.map((character, index) =>
                  renderCharacterCard(character, index)
                )}
              </div>
            )}
          </div>
        ) : (
          <Empty description="Выберите или создайте энкаунтер" />
        )}
      </Card>

      {/* Модальное окно создания энкаунтера */}
      <Modal
        title="Создать новый энкаунтер"
        open={showCreateForm}
        onOk={handleCreateEncounter}
        onCancel={() => {
          setShowCreateForm(false);
          setEncounterName('');
          setSelectedGroupIds([]);
        }}
        okText="Создать"
        cancelText="Отмена"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Название энкаунтера:</Text>
            <Input
              placeholder="Введите название"
              value={encounterName}
              onChange={(e) => setEncounterName(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          
          <div>
            <Text>Выберите группы (минимум 2):</Text>
            <Select
              mode="multiple"
              placeholder="Выберите группы"
              value={selectedGroupIds}
              onChange={setSelectedGroupIds}
              style={{ width: '100%', marginTop: 4 }}
            >
              {availableGroups.map(group => (
                <Option key={group.id} value={group.id}>
                  <Space>
                    <Badge color={group.color} />
                    <Text>{group.name}</Text>
                    <Text type="secondary">({group.members.length} персонажей)</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </div>

          {selectedGroupIds.length > 0 && (
            <div>
              <Text type="secondary">Персонажи в энкаунтере:</Text>
              <div style={{ marginTop: 8 }}>
                {selectedGroupIds.map(groupId => {
                  const group = groups.find(g => g.id === groupId);
                  if (!group) return null;
                  
                  return (
                    <div key={groupId} style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: group.color }}>
                        {group.name}:
                      </Text>{' '}
                      {group.members.map(member => member.name).join(', ')}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default InitiativeTracker;
