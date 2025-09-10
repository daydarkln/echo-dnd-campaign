import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  message, 
  Typography, 
  Space,
  Row,
  Col,
  Divider,
  Spin
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CharacterFormData {
  name: string;
  level: number;
  description: string;
}

export const CharacterEditPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { id: characterId } = useParams();

  const loadCharacter = useCallback(async () => {
    if (!characterId) {
      message.error('ID персонажа не найден');
      navigate('/character');
      return;
    }

    try {
      let character: any = null;
      
      // Сначала ищем в localStorage
      const stored = localStorage.getItem('dnd-characters-collection');
      if (stored) {
        const collection = JSON.parse(stored);
        character = collection[characterId];
      }

      // Если не найдено, пытаемся загрузить с JSON server
      if (!character) {
        try {
          const response = await fetch(`http://localhost:3001/characters/${characterId}`);
          if (response.ok) {
            character = await response.json();
          }
        } catch (error) {
          console.warn('JSON server недоступен:', error);
        }
      }

      if (character) {
        const characterData = JSON.parse(character.data || '{}');
        
        // Заполняем форму данными персонажа
        form.setFieldsValue({
          name: characterData.name?.value || characterData.info?.name?.value || '',
          level: characterData.info?.level?.value || 1,
          description: characterData.description || ''
        });
      } else {
        message.error('Персонаж не найден');
        navigate('/character');
      }
    } catch (error) {
      console.error('Ошибка при загрузке персонажа:', error);
      message.error('Ошибка при загрузке персонажа');
    } finally {
      setInitialLoading(false);
    }
  }, [characterId, navigate, form]);

  useEffect(() => {
    if (characterId) {
      loadCharacter();
    }
  }, [characterId, loadCharacter]);

  const handleSubmit = async (values: CharacterFormData) => {
    if (!characterId) return;

    setLoading(true);
    try {
      // Загружаем текущие данные персонажа
      let character: any = null;
      const stored = localStorage.getItem('dnd-characters-collection');
      if (stored) {
        const collection = JSON.parse(stored);
        character = collection[characterId];
      }

      if (!character) {
        throw new Error('Персонаж не найден');
      }

      const characterData = JSON.parse(character.data);
      
      // Обновляем данные персонажа
      const updatedCharacterData = {
        ...characterData,
        name: { value: values.name },
        info: {
          ...characterData.info,
          name: { value: values.name },
          level: { ...characterData.info?.level, value: values.level }
        },
        description: values.description
      };

      const updatedCharacter = {
        ...character,
        data: JSON.stringify(updatedCharacterData)
      };

      // Сохраняем в localStorage
      const collection = JSON.parse(localStorage.getItem('dnd-characters-collection') || '{}');
      collection[characterId] = updatedCharacter;
      localStorage.setItem('dnd-characters-collection', JSON.stringify(collection));

      // Пытаемся сохранить на JSON server
      try {
        await fetch(`http://localhost:3001/characters/${characterId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedCharacter),
        });
      } catch (error) {
        console.warn('Не удалось сохранить на JSON server:', error);
      }

      message.success('Персонаж успешно обновлен');
      navigate('/character');
    } catch (error) {
      console.error('Ошибка при обновлении персонажа:', error);
      message.error('Ошибка при обновлении персонажа');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" />
        <div style={{ marginLeft: 16 }}>Загрузка персонажа...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/character')}
              >
                Назад к списку
              </Button>
              <div>
                <Title level={2} style={{ margin: 0 }}>Редактирование персонажа</Title>
                <Text type="secondary">
                  Базовая информация о персонаже
                </Text>
              </div>
            </div>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="name"
                    label="Имя персонажа"
                    rules={[{ required: true, message: 'Введите имя персонажа' }]}
                  >
                    <Input placeholder="Имя персонажа" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="level"
                    label="Уровень"
                    rules={[{ required: true, message: 'Введите уровень' }]}
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

              <Form.Item
                name="description"
                label="Описание"
              >
                <TextArea 
                  placeholder="Краткое описание персонажа..."
                  rows={4}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                  >
                    Сохранить изменения
                  </Button>
                  <Button 
                    size="large"
                    onClick={() => navigate('/character')}
                  >
                    Отмена
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
};