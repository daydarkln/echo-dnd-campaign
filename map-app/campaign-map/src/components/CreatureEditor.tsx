import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Card,
  Button,
  Space,
  Divider,
  Switch,
  Tag,
  Typography,
  Tabs,
  List,
  Tooltip
} from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Creature,
  CreatureData,
  CreatureSize,
  CreatureType,
  CreatureAlignment,
  CreatureAction,
  CreatureTrait,
  parseCreatureData,
  createEmptyCreature,
  getCreatureModifier,
  formatModifier,
  calculateProficiencyBonus,
  getExperiencePoints
} from '../types/creature';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface CreatureEditorProps {
  visible: boolean;
  creature?: Creature | null;
  onSave: (data: CreatureData) => void;
  onCancel: () => void;
}

export const CreatureEditor: React.FC<CreatureEditorProps> = ({
  visible,
  creature,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState<CreatureData>(() => 
    creature ? parseCreatureData(creature) : JSON.parse(createEmptyCreature().data)
  );

  useEffect(() => {
    if (visible) {
      const data = creature ? parseCreatureData(creature) : JSON.parse(createEmptyCreature().data);
      setFormData(data);
      form.setFieldsValue(data);
    }
  }, [visible, creature, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const updatedData = { ...formData, ...values };
      
      // Автоматически рассчитываем некоторые поля
      updatedData.proficiencyBonus = calculateProficiencyBonus(updatedData.challengeRating);
      updatedData.experiencePoints = getExperiencePoints(updatedData.challengeRating);
      
      onSave(updatedData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
  };

  const addAction = (type: 'actions' | 'bonusActions' | 'reactions') => {
    const newAction: CreatureAction = {
      name: '',
      description: '',
      type: type === 'actions' ? 'action' : type === 'bonusActions' ? 'bonus_action' : 'reaction'
    };
    
    const currentActions = formData[type] || [];
    const updatedActions = [...currentActions, newAction];
    handleFieldChange(type, updatedActions);
    form.setFieldValue(type, updatedActions);
  };

  const removeAction = (type: 'actions' | 'bonusActions' | 'reactions', index: number) => {
    const currentActions = formData[type] || [];
    const updatedActions = currentActions.filter((_, i) => i !== index);
    handleFieldChange(type, updatedActions);
    form.setFieldValue(type, updatedActions);
  };

  const addTrait = () => {
    const newTrait: CreatureTrait = { name: '', description: '' };
    const currentTraits = formData.traits || [];
    const updatedTraits = [...currentTraits, newTrait];
    handleFieldChange('traits', updatedTraits);
    form.setFieldValue('traits', updatedTraits);
  };

  const removeTrait = (index: number) => {
    const currentTraits = formData.traits || [];
    const updatedTraits = currentTraits.filter((_, i) => i !== index);
    handleFieldChange('traits', updatedTraits);
    form.setFieldValue('traits', updatedTraits);
  };

  return (
    <Modal
      title={creature ? `Редактировать: ${formData.name}` : 'Создать существо'}
      open={visible}
      onCancel={onCancel}
      width={1200}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button key="save" type="primary" onClick={handleSubmit}>
          Сохранить
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onValuesChange={(changedValues) => {
          const updatedData = { ...formData, ...changedValues };
          setFormData(updatedData);
        }}
      >
        <Tabs defaultActiveKey="basic" >
          <TabPane tab="Основное" key="basic">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Название"
                  name="name"
                  rules={[{ required: true, message: 'Введите название' }]}
                >
                  <Input placeholder="Название существа" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Размер" name="size">
                  <Select>
                    {['Крошечный', 'Маленький', 'Средний', 'Большой', 'Огромный', 'Гигантский'].map(size => (
                      <Option key={size} value={size}>{size}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Тип" name="type">
                  <Select>
                    {['Аберрация', 'Зверь', 'Небожитель', 'Конструкт', 'Дракон', 'Элементаль', 'Фея', 'Исчадие', 'Великан', 'Гуманоид', 'Монстр', 'Нежить', 'Растение', 'Слизь'].map(type => (
                      <Option key={type} value={type}>{type}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Подтип" name="subtype">
                  <Input placeholder="Например: эльф, орк" />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="Мировоззрение" name="alignment">
                  <Select>
                    {['Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый', 'Законно-нейтральный', 'Нейтральный', 'Хаотично-нейтральный', 'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой', 'Без мировоззрения'].map(alignment => (
                      <Option key={alignment} value={alignment}>{alignment}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Класс доспеха" name="armorClass">
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Хиты" name="hitPoints">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Кости хитов" name="hitDice">
                  <Input placeholder="2d8+2" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item 
                  label={
                    <Space>
                      Уровень опасности
                      <Tooltip title="Опыт рассчитывается автоматически">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  } 
                  name="challengeRating"
                >
                  <Select>
                    {['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'].map(cr => (
                      <Option key={cr} value={cr}>УО {cr}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Описание" name="description">
              <TextArea rows={3} placeholder="Краткое описание существа" />
            </Form.Item>
          </TabPane>

          <TabPane tab="Характеристики" key="stats">
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Сила" name={['stats', 'str']}>
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">
                  {formatModifier(getCreatureModifier(formData.stats?.str || 10))}
                </Text>
              </Col>
              <Col span={4}>
                <Form.Item label="Ловкость" name={['stats', 'dex']}>
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">
                  {formatModifier(getCreatureModifier(formData.stats?.dex || 10))}
                </Text>
              </Col>
              <Col span={4}>
                <Form.Item label="Телосложение" name={['stats', 'con']}>
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">
                  {formatModifier(getCreatureModifier(formData.stats?.con || 10))}
                </Text>
              </Col>
              <Col span={4}>
                <Form.Item label="Интеллект" name={['stats', 'int']}>
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">
                  {formatModifier(getCreatureModifier(formData.stats?.int || 10))}
                </Text>
              </Col>
              <Col span={4}>
                <Form.Item label="Мудрость" name={['stats', 'wis']}>
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">
                  {formatModifier(getCreatureModifier(formData.stats?.wis || 10))}
                </Text>
              </Col>
              <Col span={4}>
                <Form.Item label="Харизма" name={['stats', 'cha']}>
                  <InputNumber min={1} max={30} style={{ width: '100%' }} />
                </Form.Item>
                <Text type="secondary">
                  {formatModifier(getCreatureModifier(formData.stats?.cha || 10))}
                </Text>
              </Col>
            </Row>

            <Divider>Скорость</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Ходьба" name={['speed', 'walk']}>
                  <InputNumber min={0} addonAfter="фт" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Полёт" name={['speed', 'fly']}>
                  <InputNumber min={0} addonAfter="фт" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Плавание" name={['speed', 'swim']}>
                  <InputNumber min={0} addonAfter="фт" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Лазание" name={['speed', 'climb']}>
                  <InputNumber min={0} addonAfter="фт" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Зарывание" name={['speed', 'burrow']}>
                  <InputNumber min={0} addonAfter="фт" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Парение" name={['speed', 'hover']} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Пассивное восприятие" name={['senses', 'passivePerception']}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Способности" key="traits">
            <Card  title="Черты" extra={
              <Button  icon={<PlusOutlined />} onClick={addTrait}>
                Добавить черту
              </Button>
            }>
              <List
                dataSource={formData.traits || []}
                renderItem={(trait, index) => (
                  <List.Item
                    actions={[
                      <Button
                        
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTrait(index)}
                      />
                    ]}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item
                        name={['traits', index, 'name']}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="Название черты" />
                      </Form.Item>
                      <Form.Item
                        name={['traits', index, 'description']}
                        style={{ margin: 0 }}
                      >
                        <TextArea placeholder="Описание черты" rows={2} />
                      </Form.Item>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          <TabPane tab="Действия" key="actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card  title="Действия" extra={
                <Button  icon={<PlusOutlined />} onClick={() => addAction('actions')}>
                  Добавить действие
                </Button>
              }>
                <List
                  dataSource={formData.actions || []}
                  renderItem={(action, index) => (
                    <List.Item
                      actions={[
                        <Button
                          
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeAction('actions', index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          name={['actions', index, 'name']}
                          style={{ margin: 0 }}
                        >
                          <Input placeholder="Название действия" />
                        </Form.Item>
                        <Form.Item
                          name={['actions', index, 'description']}
                          style={{ margin: 0 }}
                        >
                          <TextArea placeholder="Описание действия" rows={3} />
                        </Form.Item>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>

              <Card  title="Бонусные действия" extra={
                <Button  icon={<PlusOutlined />} onClick={() => addAction('bonusActions')}>
                  Добавить бонусное действие
                </Button>
              }>
                <List
                  dataSource={formData.bonusActions || []}
                  renderItem={(action, index) => (
                    <List.Item
                      actions={[
                        <Button
                          
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeAction('bonusActions', index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          name={['bonusActions', index, 'name']}
                          style={{ margin: 0 }}
                        >
                          <Input placeholder="Название бонусного действия" />
                        </Form.Item>
                        <Form.Item
                          name={['bonusActions', index, 'description']}
                          style={{ margin: 0 }}
                        >
                          <TextArea placeholder="Описание бонусного действия" rows={3} />
                        </Form.Item>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>

              <Card  title="Реакции" extra={
                <Button  icon={<PlusOutlined />} onClick={() => addAction('reactions')}>
                  Добавить реакцию
                </Button>
              }>
                <List
                  dataSource={formData.reactions || []}
                  renderItem={(action, index) => (
                    <List.Item
                      actions={[
                        <Button
                          
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeAction('reactions', index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          name={['reactions', index, 'name']}
                          style={{ margin: 0 }}
                        >
                          <Input placeholder="Название реакции" />
                        </Form.Item>
                        <Form.Item
                          name={['reactions', index, 'description']}
                          style={{ margin: 0 }}
                        >
                          <TextArea placeholder="Описание реакции" rows={3} />
                        </Form.Item>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="Дополнительно" key="extra">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Теги" name="tags">
                  <Select mode="tags" placeholder="Добавьте теги" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Источник" name="source">
                  <Input placeholder="Книга правил, модуль" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Предыстория" name="lore">
              <TextArea rows={4} placeholder="Подробная информация о существе" />
            </Form.Item>

            <Form.Item label="Окружение" name="environment">
              <Select mode="tags" placeholder="Где обитает существо">
                <Option value="Арктика">Арктика</Option>
                <Option value="Берег">Берег</Option>
                <Option value="Болото">Болото</Option>
                <Option value="Город">Город</Option>
                <Option value="Горы">Горы</Option>
                <Option value="Лес">Лес</Option>
                <Option value="Луга">Луга</Option>
                <Option value="Подземье">Подземье</Option>
                <Option value="Пустыня">Пустыня</Option>
                <Option value="Холмы">Холмы</Option>
              </Select>
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};
