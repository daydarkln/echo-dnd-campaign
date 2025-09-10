import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Checkbox, 
  message, 
  Typography, 
  Space,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  UserAddOutlined, 
  SaveOutlined, 
  FileTextOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createEmptyCharacter, migrateCharacterData, CharacterData } from '../types/character';

const { Title, Text } = Typography;

interface CharacterFormData {
  name: string;
  level: number;
  createCharacterSheet: boolean;
}

export const CharacterCreationPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: CharacterFormData) => {
    setLoading(true);
    try {
      // Создаем уникальный ID для персонажа
      const characterId = `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      let character;
      let characterData: CharacterData;

      if (values.createCharacterSheet) {
        // Создаем полный лист персонажа
        character = createEmptyCharacter();
        const rawCharacterData = JSON.parse(character.data);
        characterData = migrateCharacterData(rawCharacterData);

        // Заполняем данные из формы
        characterData.name.value = values.name;
        characterData.info.name.value = values.name;
        characterData.info.level.value = values.level;

        // Обновляем характеристики в зависимости от уровня
        if (values.level > 1) {
          characterData.proficiency = Math.ceil(values.level / 4) + 1;
        }

        // Устанавливаем флаг наличия листа персонажа
        (characterData as any).hasCharacterSheet = true;

        // Обновляем данные персонажа
        character.data = JSON.stringify(characterData);
      } else {
        // Создаем только базовую структуру персонажа без листа
        character = {
          disabledBlocks: {
            'info-left': [],
            'info-right': [],
            'notes-left': [],
            'notes-right': [],
            _id: characterId
          },
          spells: {
            mode: 'cards',
            prepared: [],
            book: []
          },
          data: JSON.stringify({
            name: { value: values.name },
            info: {
              name: { value: values.name },
              level: { name: 'level', label: 'уровень', value: values.level },
              experience: { name: 'experience', label: 'опыт', value: 0 }
            },
            createdAt: new Date().toISOString(),
            hasCharacterSheet: false
          }),
          jsonType: 'character',
          version: '2'
        };
      }

      // Сохраняем персонажа через API/localStorage
      // Для JSON server нужно будет отправить POST запрос
      await saveCharacterToServer(characterId, character);

      message.success(`"${values.name}" успешно создан${values.createCharacterSheet ? ' с полным листом' : ''}!`);
      // Перенаправляем на страницу персонажей
      navigate('/character');
    } catch (error) {
      console.error('Ошибка при создании персонажа:', error);
      message.error('Произошла ошибка при создании персонажа');
    } finally {
      setLoading(false);
    }
  };

  const saveCharacterToServer = async (characterId: string, character: any) => {
    try {
      // Отправляем данные на JSON server
      const response = await fetch('http://localhost:3001/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: characterId,
          ...character
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении на сервер');
      }

      // Также сохраняем в localStorage как резервную копию
      const existingCharacters = JSON.parse(localStorage.getItem('dnd-characters-collection') || '{}');
      existingCharacters[characterId] = character;
      localStorage.setItem('dnd-characters-collection', JSON.stringify(existingCharacters));

    } catch (error) {
      // Если сервер недоступен, сохраняем только в localStorage
      console.warn('JSON server недоступен, сохраняем в localStorage:', error);
      const existingCharacters = JSON.parse(localStorage.getItem('dnd-characters-collection') || '{}');
      existingCharacters[characterId] = character;
      localStorage.setItem('dnd-characters-collection', JSON.stringify(existingCharacters));
    }
  };


  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <UserAddOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={2}>Создание персонажа/NPC</Title>
              <Text type="secondary">
                Создайте персонажа игрока или NPC. Можно сразу создать полный лист с характеристиками.
              </Text>
            </div>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                level: 1,
                createCharacterSheet: false
              }}
            >
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="name"
                    label="Имя персонажа/NPC"
                    rules={[{ required: true, message: 'Введите имя персонажа' }]}
                  >
                    <Input placeholder="Введите имя персонажа или NPC" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="level"
                    label="Уровень"
                    rules={[{ required: true, message: 'Выберите уровень' }]}
                  >
                    <InputNumber 
                      min={1} 
                      max={20} 
                      placeholder="1"
                      size="large"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item
                name="createCharacterSheet"
                valuePropName="checked"
              >
                <Checkbox>
                  <Space>
                    <FileTextOutlined />
                    <span>Создать полный лист персонажа</span>
                  </Space>
                </Checkbox>
              </Form.Item>

              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Если эта опция включена, будет создан полный лист с характеристиками, 
                навыками, заклинаниями и другими деталями. Если выключена - создается только имя и уровень.
              </Text>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{ width: '100%' }}
                >
                  Создать
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
};
