import React, { useState } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Input, 
  Select, 
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
  Switch,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  UserAddOutlined,
  TeamOutlined,
  UserDeleteOutlined,
  SplitCellsOutlined
} from '@ant-design/icons';
import { useGroups } from '../hooks/useGroups';
import { Character } from '../types/groups';
import { getLocationName } from '../utils/locationUtils';

const { Title, Text } = Typography;
const { Option } = Select;

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

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCharacterForm, setShowCharacterForm] = useState<string | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<{ groupId: string; characterId: string } | null>(null);
  const [showSplitModal, setShowSplitModal] = useState<string | null>(null);
  const [selectedMembersForSplit, setSelectedMembersForSplit] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  
  const [groupForm] = Form.useForm();
  const [characterForm] = Form.useForm();
  const [groupEditForm] = Form.useForm();

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
    });
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
      updateCharacter(groupId, characterId, {
        name: values.name,
        class: values.class || undefined,
        level: values.level || undefined
      });
      setEditingCharacter(null);
      setShowCharacterForm(null);
      characterForm.resetFields();
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
                      size="small"
                      style={{ backgroundColor: group.color }}
                      icon={<TeamOutlined />}
                    />
                    <span>{group.name}</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenEditGroup(group.id)}
                    >
                      Редактировать
                    </Button>
                    <Space size={6}>
                      <span style={{ fontSize: 12, color: '#999' }}>Игроки</span>
                      <Switch
                        size="small"
                        checked={group.isPlayers}
                        onChange={(checked) => updateGroup(group.id, { isPlayers: checked })}
                      />
                    </Space>
                    {group.members.length > 1 && (
                      <Button
                        size="small"
                        className="split-button"
                        icon={<SplitCellsOutlined />}
                        onClick={() => setShowSplitModal(group.id)}
                      >
                        Разделить
                      </Button>
                    )}
                    <Popconfirm
                      title="Удалить группу?"
                      description="Это действие нельзя отменить"
                      onConfirm={() => deleteGroup(group.id)}
                      okText="Да"
                      cancelText="Нет"
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        Удалить
                      </Button>
                    </Popconfirm>
                  </Space>
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
                    size="small"
                    dataSource={group.members}
                    renderItem={(character) => (
                      <List.Item
                        actions={[
                          <Button
                            key="edit"
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditCharacter(group.id, character.id)}
                          />,
                          <Popconfirm
                            key="delete"
                            title="Удалить персонажа?"
                            onConfirm={() => removeCharacterFromGroup(group.id, character.id)}
                            okText="Да"
                            cancelText="Нет"
                          >
                            <Button
                              type="link"
                              size="small"
                              danger
                              icon={<UserDeleteOutlined />}
                            />
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar size="small">{character.name.charAt(0).toUpperCase()}</Avatar>}
                          title={character.name}
                          description={
                            <Space size={4}>
                              {character.class && <Tag color="blue">{character.class}</Tag>}
                              {character.level && <Tag color="green">Ур. {character.level}</Tag>}
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
                  onClick={() => setShowCharacterForm(group.id)}
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
                    size="small"
                    dataSource={group.members}
                    renderItem={(character) => (
                      <List.Item>
                        <Checkbox value={character.id} style={{ marginRight: 12 }}>
                          <List.Item.Meta
                            avatar={<Avatar size="small">{character.name.charAt(0).toUpperCase()}</Avatar>}
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
    </>
  );
};