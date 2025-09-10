import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  List,
  Typography,
  Space,
  Tag,
  Divider,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  DeleteOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useGroups } from '../hooks/useGroups';
import { Creature, parseCreatureData } from '../types/creature';
import {
  CreateEncounterInput,
  calculateEncounterXP,
  calculateAdjustedXP,
  determineEncounterDifficulty,
  calculateMultiplier
} from '../types/encounter';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface EncounterCreatureSetup {
  creature: Creature;
  count: number;
}

interface EncounterCreatorProps {
  visible: boolean;
  selectedCreatures: Creature[];
  onCreateEncounter: (encounter: CreateEncounterInput) => Promise<void>;
  onCancel: () => void;
}

export const EncounterCreator: React.FC<EncounterCreatorProps> = ({
  visible,
  selectedCreatures,
  onCreateEncounter,
  onCancel
}) => {
  const [form] = Form.useForm();
  const { groups } = useGroups();
  const [creatureSetups, setCreatureSetups] = useState<EncounterCreatureSetup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // Инициализация списка существ
  useEffect(() => {
    if (visible && selectedCreatures.length > 0) {
      const setups = selectedCreatures.map(creature => ({
        creature,
        count: 1
      }));
      setCreatureSetups(setups);
    }
  }, [visible, selectedCreatures]);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCreatureSetups([]);
      setSelectedGroupId('');
      setCreating(false);
    }
  }, [visible, form]);

  // Расчет характеристик энкаунтера
  const calculateStats = () => {
    const totalCreatures = creatureSetups.reduce((sum, setup) => sum + setup.count, 0);
    const baseXP = creatureSetups.reduce((sum, setup) => {
      const data = parseCreatureData(setup.creature);
      return sum + (data.experiencePoints * setup.count);
    }, 0);

    const adjustedXP = calculateAdjustedXP(baseXP, totalCreatures);
    const multiplier = calculateMultiplier(totalCreatures);

    // Для расчета сложности нужна информация о группе
    let difficulty: string = 'неизвестно';
    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    if (selectedGroup && selectedGroup.members.length > 0) {
      // Предполагаем средний уровень группы (можно улучшить)
      const avgLevel = Math.max(1, Math.round(
        selectedGroup.members.reduce((sum: number, char) => sum + (char.level || 1), 0) / selectedGroup.members.length
      ));
      const partySize = selectedGroup.members.length;
      difficulty = determineEncounterDifficulty(adjustedXP, avgLevel, partySize);
    }

    return {
      totalCreatures,
      baseXP,
      adjustedXP,
      multiplier,
      difficulty
    };
  };

  const stats = calculateStats();

  const updateCreatureCount = (creatureId: string, count: number) => {
    setCreatureSetups(prev => 
      prev.map(setup => 
        setup.creature.id === creatureId 
          ? { ...setup, count: Math.max(0, count) }
          : setup
      ).filter(setup => setup.count > 0)
    );
  };

  const removeCreature = (creatureId: string) => {
    setCreatureSetups(prev => prev.filter(setup => setup.creature.id !== creatureId));
  };

  const handleSubmit = async () => {
    try {
      setCreating(true);
      const values = await form.validateFields();
      
      const encounterInput: CreateEncounterInput = {
        name: values.name,
        description: values.description,
        creatures: creatureSetups.map(setup => {
          const data = parseCreatureData(setup.creature);
          return {
            creatureId: setup.creature.id,
            name: data.name,
            challengeRating: data.challengeRating,
            count: setup.count
          };
        }),
        playerGroupId: selectedGroupId || undefined,
        environment: values.environment,
        notes: values.notes,
        tags: values.tags || []
      };

      await onCreateEncounter(encounterInput);
    } catch (error) {
      console.error('Ошибка при создании энкаунтера:', error);
    } finally {
      setCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'trivial': return 'green';
      case 'easy': return 'blue';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      case 'deadly': return 'purple';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'trivial': return 'Тривиальный';
      case 'easy': return 'Лёгкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Тяжёлый';
      case 'deadly': return 'Смертельный';
      default: return difficulty;
    }
  };

  return (
    <Modal
      title="Создать энкаунтер"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={creating}
          onClick={handleSubmit}
          disabled={creatureSetups.length === 0}
          icon={<ThunderboltOutlined />}
        >
          Создать энкаунтер
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Название энкаунтера"
              name="name"
              rules={[{ required: true, message: 'Введите название' }]}
            >
              <Input placeholder="Атака гоблинов" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Окружение" name="environment">
              <Select placeholder="Выберите окружение">
                <Option value="Лес">Лес</Option>
                <Option value="Пещера">Пещера</Option>
                <Option value="Город">Город</Option>
                <Option value="Подземелье">Подземелье</Option>
                <Option value="Болото">Болото</Option>
                <Option value="Горы">Горы</Option>
                <Option value="Пустыня">Пустыня</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Описание" name="description">
          <TextArea rows={2} placeholder="Краткое описание энкаунтера" />
        </Form.Item>

        <Divider>Существа в энкаунтере</Divider>

        <List
          dataSource={creatureSetups}
          renderItem={(setup) => {
            const data = parseCreatureData(setup.creature);
            return (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeCreature(setup.creature.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{data.name}</Text>
                      <Tag color="blue">УО {data.challengeRating}</Tag>
                      <Tag>{data.type}</Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {data.size} {data.type.toLowerCase()}, КД {data.armorClass}, {data.hitPoints} ХП
                    </Text>
                  }
                />
                <Space>
                  <Text>Количество:</Text>
                  <InputNumber
                    min={1}
                    max={20}
                    value={setup.count}
                    onChange={(value) => updateCreatureCount(setup.creature.id, value || 1)}
                    style={{ width: 80 }}
                  />
                </Space>
              </List.Item>
            );
          }}
        />

        <Divider>Группа персонажей</Divider>

        <Form.Item label="Против какой группы">
          <Select
            placeholder="Выберите группу персонажей"
            loading={false}
            value={selectedGroupId}
            onChange={setSelectedGroupId}
            allowClear
          >
            {groups.map(group => (
              <Option key={group.id} value={group.id}>
                <Space>
                  <TeamOutlined />
                  {group.name}
                  <Text type="secondary">({group.members.length} чел.)</Text>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Сложность энкаунтера</Divider>

        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Существ"
              value={stats.totalCreatures}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Базовый опыт"
              value={stats.baseXP}
              suffix="XP"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={`Скорректированный (×${stats.multiplier})`}
              value={stats.adjustedXP}
              suffix="XP"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Сложность"
              value={getDifficultyText(stats.difficulty)}
              valueStyle={{ color: getDifficultyColor(stats.difficulty) }}
              prefix={<TrophyOutlined />}
            />
          </Col>
        </Row>

        {stats.difficulty === 'deadly' && (
          <Alert
            message="Смертельный энкаунтер!"
            description="Этот энкаунтер может быть слишком сложным для группы. Рассмотрите возможность уменьшения количества существ."
            type="warning"
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}

        <Form.Item label="Дополнительные заметки" name="notes" style={{ marginTop: 16 }}>
          <TextArea rows={3} placeholder="Заметки о тактике, условиях победы и т.д." />
        </Form.Item>

        <Form.Item label="Теги" name="tags">
          <Select
            mode="tags"
            placeholder="Добавьте теги для категоризации"
            style={{ width: '100%' }}
          >
            <Option value="босс">Босс</Option>
            <Option value="засада">Засада</Option>
            <Option value="финальный">Финальный бой</Option>
            <Option value="случайный">Случайная встреча</Option>
            <Option value="социальный">Социальный</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
