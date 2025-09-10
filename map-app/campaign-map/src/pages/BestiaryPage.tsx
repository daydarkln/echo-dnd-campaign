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
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined
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

const { Title, Text } = Typography;
const { Option } = Select;

export const BestiaryPage: React.FC = () => {
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');
  const [selectedCR, setSelectedCR] = useState<string>('all');
  const [showCreatureEditor, setShowCreatureEditor] = useState(false);
  const [showCreatureViewer, setShowCreatureViewer] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [editingCreature, setEditingCreature] = useState<Creature | null>(null);

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

  // Конвертация импортированных данных
  const convertImportDataToCreatureData = (importData: CreatureImportData): CreatureData => {
    console.log('Конвертируем данные:', importData);
    
    // Проверяем, не является ли это уже готовыми данными CreatureData
    if ('armorClass' in importData && 'hitPoints' in importData && 'stats' in importData) {
      console.log('Данные уже в формате CreatureData');
      // Это уже CreatureData, просто приводим к правильному типу
      const data = importData as any as CreatureData;
      
      console.log('Черты в данных:', data.traits);
      console.log('Действия в данных:', data.actions);
      
      // Дополняем недостающие обязательные поля если их нет
      const result = {
        ...data,
        proficiencyBonus: data.proficiencyBonus || calculateProficiencyBonus(data.challengeRating),
        experiencePoints: data.experiencePoints || getExperiencePoints(data.challengeRating),
        senses: data.senses || { passivePerception: 10 },
        tags: data.tags || [],
        environment: data.environment || []
      };
      
      console.log('Результат конвертации (CreatureData):', result);
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
      armorClass: typeof importData.armor_class === 'number' ? importData.armor_class : parseInt(importData.armor_class.toString()),
      hitPoints: typeof importData.hit_points === 'number' ? importData.hit_points : parseInt(importData.hit_points.toString()),
      hitDice: importData.hit_dice || '1d8',
      speed: typeof importData.speed === 'object' ? importData.speed : { walk: 30 },
      stats: {
        str: importData.strength,
        dex: importData.dexterity,
        con: importData.constitution,
        int: importData.intelligence,
        wis: importData.wisdom,
        cha: importData.charisma
      },
      senses: {
        passivePerception: 10
      },
      challengeRating: importData.challenge_rating.toString(),
      proficiencyBonus: calculateProficiencyBonus(importData.challenge_rating.toString()),
      experiencePoints: getExperiencePoints(importData.challenge_rating.toString()),
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
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Список существ */}
      <Card>
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
                            <Tag key={tag} >{tag}</Tag>
                          ))}
                        </Space>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
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
    </div>
  );
};
