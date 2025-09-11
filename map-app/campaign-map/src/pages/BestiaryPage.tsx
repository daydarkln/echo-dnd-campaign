import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Row,
  Col,
  List,
  Tag,
  Typography,
  Modal,
  Upload,
  message,
  Divider,
  Statistic,
  Badge,
  Popconfirm,
  Tooltip,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useCreatures } from '../hooks/useCreatures';
import { 
  Creature, 
  CreatureData, 
  CreatureType, 
  parseCreatureData, 
  createEmptyCreature,
  CreatureImportData,
  calculateProficiencyBonus,
  getExperiencePoints
} from '../types/creature';
import { CreatureEditor } from '../components/CreatureEditor';
import { CreatureViewer } from '../components/CreatureViewer';
import { CreatureImporter } from '../components/CreatureImporter';
import { EncounterCreator } from '../components/EncounterCreator';
import { useEncounters } from '../hooks/useEncounters';
import { useInitiativeTracker } from '../hooks/useInitiativeTracker';
import { useGroups } from '../hooks/useGroups';
import { CreateEncounterInput } from '../types/encounter';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

export const BestiaryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    creatures,
    loading,
    createCreature,
    updateCreature,
    deleteCreature,
    searchCreatures,
    getCreaturesByType,
    getCreaturesByCR,
    importCreatures,
    exportCreatures
  } = useCreatures();

  const { createEncounter } = useEncounters();
  const { createEncounterFromBestiary } = useInitiativeTracker();
  const { groups } = useGroups();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');
  const [selectedCR, setSelectedCR] = useState<string>('all');
  const [showCreatureEditor, setShowCreatureEditor] = useState(false);
  const [showCreatureViewer, setShowCreatureViewer] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [editingCreature, setEditingCreature] = useState<Creature | null>(null);
  
  // Состояние для энкаунтеров
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<string[]>([]);
  const [showEncounterCreator, setShowEncounterCreator] = useState(false);

  // Фильтрация существ
  const filteredCreatures = useMemo(() => {
    let result = creatures;

    // Поиск по тексту
    if (searchTerm) {
      result = searchCreatures(searchTerm);
    }

    // Фильтр по типу
    if (selectedType !== 'all') {
      result = result.filter(creature => {
        const data = parseCreatureData(creature);
        return data.type === selectedType;
      });
    }

    // Фильтр по уровню опасности
    if (selectedCR !== 'all') {
      result = result.filter(creature => {
        const data = parseCreatureData(creature);
        return data.challengeRating === selectedCR;
      });
    }

    return result.sort((a, b) => {
      const dataA = parseCreatureData(a);
      const dataB = parseCreatureData(b);
      return dataA.name.localeCompare(dataB.name);
    });
  }, [creatures, searchTerm, selectedType, selectedCR, searchCreatures]);

  // Статистика
  const statistics = useMemo(() => {
    const typeStats: Record<string, number> = {};
    const crStats: Record<string, number> = {};

    creatures.forEach(creature => {
      const data = parseCreatureData(creature);
      typeStats[data.type] = (typeStats[data.type] || 0) + 1;
      crStats[data.challengeRating] = (crStats[data.challengeRating] || 0) + 1;
    });

    return { typeStats, crStats };
  }, [creatures]);

  // Обработчики
  const handleCreateCreature = () => {
    setEditingCreature(null);
    setShowCreatureEditor(true);
  };

  const handleEditCreature = (creature: Creature) => {
    setEditingCreature(creature);
    setShowCreatureEditor(true);
  };

  const handleViewCreature = (creature: Creature) => {
    setSelectedCreature(creature);
    setShowCreatureViewer(true);
  };

  const handleSaveCreature = async (data: CreatureData) => {
    try {
      if (editingCreature) {
        await updateCreature(editingCreature.id, { data });
        message.success('Существо обновлено');
      } else {
        await createCreature({ data });
        message.success('Существо создано');
      }
      setShowCreatureEditor(false);
      setEditingCreature(null);
    } catch (error) {
      message.error('Ошибка при сохранении существа');
    }
  };

  const handleDeleteCreature = async (creature: Creature) => {
    try {
      await deleteCreature(creature.id);
      message.success('Существо удалено');
    } catch (error) {
      message.error('Ошибка при удалении существа');
    }
  };

  const handleImport = async (importedData: CreatureImportData[]) => {
    try {
      console.log('Начинаем импорт:', importedData);
      
      const creaturesInput = importedData.map(data => {
        const convertedData = convertImportDataToCreatureData(data);
        console.log('Конвертированные данные:', convertedData);
        return { data: convertedData };
      });
      
      const imported = await importCreatures(creaturesInput);
      console.log('Импортированные существа:', imported);
      
      message.success(`Импортировано ${imported.length} существ`);
      setShowImporter(false);
      
      // Сбрасываем фильтры чтобы показать новые существа
      setSearchTerm('');
      setSelectedType('all');
      setSelectedCR('all');
    } catch (error) {
      console.error('Ошибка при импорте:', error);
      message.error('Ошибка при импорте существ: ' + (error as Error).message);
    }
  };

  const handleExport = () => {
    const data = exportCreatures();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bestiary-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Бестиарий экспортирован');
  };

  // Обработчики для энкаунтеров
  const handleCreatureSelect = (creatureId: string, checked: boolean) => {
    setSelectedCreatureIds(prev => 
      checked 
        ? [...prev, creatureId]
        : prev.filter(id => id !== creatureId)
    );
  };

  const handleSelectAllCreatures = (checked: boolean) => {
    setSelectedCreatureIds(
      checked ? filteredCreatures.map(c => c.id) : []
    );
  };

  const handleCreateEncounter = () => {
    setShowEncounterCreator(true);
  };

  const handleEncounterCreated = async (encounterInput: CreateEncounterInput) => {
    try {
      console.log('Создаем энкаунтер:', encounterInput);
      
      // Создаем энкаунтер в системе планирования
      const encounter = await createEncounter(encounterInput);
      console.log('Энкаунтер создан:', encounter);
      
      // Получаем группу игроков, если выбрана
      const playerGroup = encounterInput.playerGroupId 
        ? groups.find(g => g.id === encounterInput.playerGroupId)
        : undefined;
      
      console.log('Найдена группа игроков:', playerGroup);
      
      // Создаем боевой энкаунтер для трекера инициативы
      const combatEncounter = createEncounterFromBestiary(
        encounter, 
        creatures, 
        playerGroup
      );
      
      console.log('Боевой энкаунтер создан:', combatEncounter);
      
      message.success(`Энкаунтер "${encounter.name}" создан и готов к бою!`);
      setShowEncounterCreator(false);
      setSelectedCreatureIds([]);
      
      // Переходим на страницу инициативы
      navigate('/initiative');
    } catch (error) {
      console.error('Ошибка при создании энкаунтера:', error);
      message.error('Ошибка при создании энкаунтера');
    }
  };

  // Конвертация импортированных данных
  const convertImportDataToCreatureData = (importData: CreatureImportData): CreatureData => {
    console.log('Конвертируем данные:', importData);
    
    // Проверяем, не является ли это уже готовыми данными CreatureData
    if ('armorClass' in importData && 'hitPoints' in importData && 'stats' in importData) {
      console.log('Данные уже в формате CreatureData');
      const data = importData as any as CreatureData;
      
      console.log('Черты в данных:', data.traits);
      console.log('Действия в данных:', data.actions);
      
      // Проверяем и приводим числовые поля к правильному типу
      const armorClass = typeof data.armorClass === 'number' ? data.armorClass : parseInt(String(data.armorClass)) || 10;
      const hitPoints = typeof data.hitPoints === 'number' ? data.hitPoints : parseInt(String(data.hitPoints)) || 1;
      const challengeRating = String(data.challengeRating || '0');
      
      console.log('Обработанные значения:', { armorClass, hitPoints, challengeRating });
      console.log('Исходные характеристики data.stats:', data.stats);
      console.log('Тип data.stats:', typeof data.stats);
      
      // Дополняем недостающие обязательные поля если их нет
      const result: CreatureData = {
        ...data,
        armorClass,
        hitPoints,
        challengeRating,
        hitDice: data.hitDice || '1d8',
        speed: data.speed || { walk: 30 },
        stats: {
          str: Number(data.stats?.str) ?? 10,
          dex: Number(data.stats?.dex) ?? 10,
          con: Number(data.stats?.con) ?? 10,
          int: Number(data.stats?.int) ?? 10,
          wis: Number(data.stats?.wis) ?? 10,
          cha: Number(data.stats?.cha) ?? 10,
        },
        proficiencyBonus: data.proficiencyBonus || calculateProficiencyBonus(challengeRating),
        experiencePoints: data.experiencePoints || getExperiencePoints(challengeRating),
        senses: {
          ...data.senses,
          passivePerception: Number(data.senses?.passivePerception) || 10
        },
        tags: data.tags || [],
        environment: data.environment || [],
        // Обрабатываем traits и actions с правильными полями description
        traits: data.traits?.map(trait => ({
          name: trait.name,
          description: trait.description || (trait as any).desc || ''
        })) || [],
        actions: data.actions?.map(action => ({
          name: action.name,
          description: action.description || (action as any).desc || '',
          type: action.type || 'action' as const,
          attackBonus: action.attackBonus,
          damage: action.damage,
          savingThrow: action.savingThrow,
          recharge: action.recharge
        })) || [],
        // Обрабатываем legendaryActions если есть
        legendaryActions: (data.legendaryActions || (importData as any).legendary_actions) ? {
          perTurn: Number((data.legendaryActions || (importData as any).legendary_actions).perTurn) || 3,
          actions: (data.legendaryActions || (importData as any).legendary_actions).actions?.map((action: any) => ({
            name: action.name,
            description: action.description || action.desc || '',
            type: action.type || 'legendary_action' as const,
            damage: action.damage,
            attackBonus: action.attackBonus,
            savingThrow: action.savingThrow
          })) || []
        } : undefined
      };
      
      console.log('Результат конвертации (CreatureData):', result);
      console.log('Финальные характеристики:', result.stats);
      return result;
    }
    
    // Иначе конвертируем старый формат
    console.log('Конвертируем из старого формата');
    const result = {
      name: importData.name,
      size: importData.size as any,
      type: importData.type as any,
      subtype: importData.subtype,
      alignment: importData.alignment as any,
      armorClass: typeof importData.armor_class === 'number' ? importData.armor_class : 
                  (importData.armor_class ? parseInt(importData.armor_class.toString()) : 10),
      hitPoints: typeof importData.hit_points === 'number' ? importData.hit_points : 
                 (importData.hit_points ? parseInt(importData.hit_points.toString()) : 1),
      hitDice: importData.hit_dice || '1d8',
      speed: typeof importData.speed === 'object' ? importData.speed : { walk: 30 },
      stats: {
        str: importData.strength || 10,
        dex: importData.dexterity || 10,
        con: importData.constitution || 10,
        int: importData.intelligence || 10,
        wis: importData.wisdom || 10,
        cha: importData.charisma || 10
      },
      senses: {
        passivePerception: 10
      },
      challengeRating: (importData.challenge_rating || '0').toString(),
      proficiencyBonus: calculateProficiencyBonus((importData.challenge_rating || '0').toString()),
      experiencePoints: getExperiencePoints((importData.challenge_rating || '0').toString()),
      traits: importData.traits?.map(trait => ({
        name: trait.name,
        description: Array.isArray(trait.desc) ? trait.desc.join(' ') : 
                    (trait.desc || (trait as any).description || '')
      })),
      actions: importData.actions?.map(action => ({
        name: action.name,
        description: Array.isArray(action.desc) ? action.desc.join(' ') : 
                    (action.desc || (action as any).description || ''),
        type: 'action' as const
      })),
      tags: [],
      environment: []
    };
    
    console.log('Результат конвертации (старый формат):', result);
    return result;
  };

  const uniqueTypes = Array.from(new Set(creatures.map(c => parseCreatureData(c).type))).sort();
  const uniqueCRs = Array.from(new Set(creatures.map(c => parseCreatureData(c).challengeRating))).sort((a, b) => {
    const parseCR = (cr: string): number => {
      if (cr.includes('/')) {
        const [num, den] = cr.split('/');
        return parseInt(num) / parseInt(den);
      }
      return parseInt(cr);
    };
    return parseCR(a) - parseCR(b);
  });

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Бестиарий</Title>
      
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Всего существ" value={creatures.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Типов существ" value={Object.keys(statistics.typeStats).length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Самый популярный тип" 
              value={Object.keys(statistics.typeStats).length > 0 
                ? Object.entries(statistics.typeStats).sort(([,a], [,b]) => b - a)[0][0]
                : 'Нет данных'
              } 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Уровней опасности" value={Object.keys(statistics.crStats).length} />
          </Card>
        </Col>
      </Row>

      {/* Фильтры и действия */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="Поиск существ..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: 150 }}
                placeholder="Тип"
              >
                <Option value="all">Все типы</Option>
                {uniqueTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
              <Select
                value={selectedCR}
                onChange={setSelectedCR}
                style={{ width: 120 }}
                placeholder="УО"
              >
                <Option value="all">Все УО</Option>
                {uniqueCRs.map(cr => (
                  <Option key={cr} value={cr}>УО {cr}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCreature}>
                Создать существо
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => setShowImporter(true)}>
                Импорт
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                Экспорт
              </Button>
              {selectedCreatureIds.length > 0 && (
                <Button 
                  type="primary" 
                  icon={<ThunderboltOutlined />} 
                  onClick={handleCreateEncounter}
                  style={{ 
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(238, 90, 36, 0.3)'
                  }}
                >
                  Создать энкаунтер ({selectedCreatureIds.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Список существ */}
      <Card 
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Checkbox
                  checked={selectedCreatureIds.length === filteredCreatures.length && filteredCreatures.length > 0}
                  indeterminate={selectedCreatureIds.length > 0 && selectedCreatureIds.length < filteredCreatures.length}
                  onChange={(e) => handleSelectAllCreatures(e.target.checked)}
                >
                  Выбрать все
                </Checkbox>
                {selectedCreatureIds.length > 0 && (
                  <Tag color="blue">Выбрано: {selectedCreatureIds.length}</Tag>
                )}
              </Space>
            </Col>
            <Col>
              <Text type="secondary">
                Всего существ: {filteredCreatures.length}
              </Text>
            </Col>
          </Row>
        }
      >
        <List
          loading={loading}
          dataSource={filteredCreatures}
          renderItem={(creature) => {
            const data = parseCreatureData(creature);
            return (
              <List.Item
                actions={[
                  <Tooltip title="Просмотр">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      onClick={() => handleViewCreature(creature)}
                    />
                  </Tooltip>,
                  <Tooltip title="Редактировать">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEditCreature(creature)}
                    />
                  </Tooltip>,
                  <Popconfirm
                    title="Удалить существо?"
                    description="Это действие нельзя отменить"
                    onConfirm={() => handleDeleteCreature(creature)}
                    okText="Удалить"
                    cancelText="Отмена"
                  >
                    <Tooltip title="Удалить">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Checkbox
                      checked={selectedCreatureIds.includes(creature.id)}
                      onChange={(e) => handleCreatureSelect(creature.id, e.target.checked)}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{data.name}</Text>
                      <Tag color="blue">УО {data.challengeRating}</Tag>
                      <Tag>{data.type}</Tag>
                      {data.subtype && <Tag color="geekblue">{data.subtype}</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        {data.size} {data.type.toLowerCase()}, {data.alignment.toLowerCase()}
                      </Text>
                      <Text type="secondary">
                        КД {data.armorClass}, {data.hitPoints} ХП ({data.hitDice})
                      </Text>
                      {data.tags && data.tags.length > 0 && (
                        <Space size={0} wrap>
                          {data.tags.map(tag => (
                            <Tag key={tag} style={{ fontSize: '11px' }}>{tag}</Tag>
                          ))}
                        </Space>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {searchTerm || selectedType !== 'all' || selectedCR !== 'all'
                    ? 'Существа не найдены'
                    : 'Бестиарий пуст'
                  }
                </Text>
                <br />
                <br />
                {!searchTerm && selectedType === 'all' && selectedCR === 'all' && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleCreateCreature}
                  >
                    Создать первое существо
                  </Button>
                )}
              </div>
            )
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} существ`
          }}
        />
      </Card>

      {/* Модальные окна */}
      <CreatureEditor
        visible={showCreatureEditor}
        creature={editingCreature}
        onSave={handleSaveCreature}
        onCancel={() => {
          setShowCreatureEditor(false);
          setEditingCreature(null);
        }}
      />

      <CreatureViewer
        visible={showCreatureViewer}
        creature={selectedCreature}
        onClose={() => {
          setShowCreatureViewer(false);
          setSelectedCreature(null);
        }}
      />

      <CreatureImporter
        visible={showImporter}
        onImport={handleImport}
        onCancel={() => setShowImporter(false)}
      />

      <EncounterCreator
        visible={showEncounterCreator}
        selectedCreatures={selectedCreatureIds.map(id => creatures.find(c => c.id === id)!).filter(Boolean)}
        onCreateEncounter={handleEncounterCreated}
        onCancel={() => setShowEncounterCreator(false)}
      />
    </div>
  );
};
