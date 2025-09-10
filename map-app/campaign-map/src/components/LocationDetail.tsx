import React from 'react';
import { 
  Card, 
  Typography, 
  Tag, 
  Divider, 
  List, 
  Space, 
  Row, 
  Col,
  Badge,
  Descriptions,
  Button,
  Checkbox
} from 'antd';
import { 
  CarOutlined,
  ExclamationCircleOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  AudioOutlined,
  QrcodeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PointOfInterest } from '../types';
import { LocationFieldVisibility } from '../types/visibility';
import { LocationEffectButtons } from './LocationEffectButtons';
import { useAudio } from '../App';
import { useQuests } from '../hooks/useQuests';

const { Title, Text, Paragraph } = Typography;

interface LocationDetailProps {
  location: PointOfInterest;
  area: string;
  onBack: () => void;
  isModal?: boolean;
  isPlayerView?: boolean;
  fieldVisibility?: LocationFieldVisibility;
  getLocationFieldVisibility?: (locationId: string) => LocationFieldVisibility;
  toggleLocationItemVisibility?: (locationId: string, field: 'encounters' | 'loot' | 'clues', itemIndex: number) => void;
  setLocationItemVisibility?: (locationId: string, field: 'encounters' | 'loot' | 'clues', itemIndex: number, isVisible: boolean) => void;
  isLocationItemVisible?: (locationId: string, field: 'encounters' | 'loot' | 'clues', itemIndex: number) => boolean;
}

const LocationDetail: React.FC<LocationDetailProps> = ({ 
  location, 
  area, 
  onBack, 
  isModal = false,
  isPlayerView = false,
  fieldVisibility,
  getLocationFieldVisibility,
  toggleLocationItemVisibility,
  setLocationItemVisibility,
  isLocationItemVisible
}) => {
  const { bindings, changeLocation } = useAudio();
  const { data: quests } = useQuests();
  const navigate = useNavigate();

  // Получаем настройки видимости полей
  const visibility = fieldVisibility || getLocationFieldVisibility?.(location.id) || {
    encounters: {},
    loot: {},
    clues: {}
  };

  // Проверяем видимость отдельного элемента
  const shouldShowItem = (field: 'encounters' | 'loot' | 'clues', itemIndex: number): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    if (isLocationItemVisible) {
      return isLocationItemVisible(location.id, field, itemIndex);
    }
    
    // Фоллбэк для случая когда функция не передана
    const fieldVisibility = visibility[field];
    if (typeof fieldVisibility === 'object' && fieldVisibility !== null) {
      return (fieldVisibility as Record<number, string>)[itemIndex] !== 'hidden';
    }
    return true;
  };

  // Проверяем нужно ли показывать секцию вообще (если есть хотя бы один видимый элемент)
  const shouldShowSection = (field: 'encounters' | 'loot' | 'clues'): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    const fieldArray = location[field] || [];
    return fieldArray.some((_, index) => shouldShowItem(field, index));
  };

  // При открытии локации автоматически меняем аудио
  React.useEffect(() => {
    if (bindings && location.id) {
      changeLocation(location.id);
    }
  }, [location.id, bindings, changeLocation]);

  // Находим квесты, связанные с данной локацией
  const relatedQuests = quests.filter(quest => 
    quest.relatedLocations?.includes(location.id)
  );

  // Обработчик клика на квест
  const handleQuestClick = (questId: string) => {
    navigate(`/quests/${questId}`);
  };

  return (
    <div>
      {/* Заголовок */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBack}
            
          >
            Назад
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {location.name}
          </Title>
          <Tag color="blue">{area}</Tag>
        </Space>
      </div>

      {/* Основная информация */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Теги */}
          {location.tags && location.tags.length > 0 && (
            <Card  style={{ marginBottom: 16 }}>
              <Space wrap>
                {location.tags.map((tag, index) => (
                  <Tag key={index} color="green">{tag}</Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* Усилители */}
          {location.amplifiers && location.amplifiers.length > 0 && (
            <Card  title="Усилители" style={{ marginBottom: 16 }}>
              <List
                
                dataSource={location.amplifiers}
                renderItem={(amplifier, index) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{amplifier.effect}</Text>
                      <Space wrap>
                        {amplifier.mechanics.map((mechanic, mechIndex) => (
                          <Tag key={mechIndex} color="orange">{mechanic}</Tag>
                        ))}
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Ослабители */}
          {location.dampeners && location.dampeners.length > 0 && (
            <Card  title="Ослабители" style={{ marginBottom: 16 }}>
              <List
                
                dataSource={location.dampeners}
                renderItem={(dampener, index) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{dampener.effect}</Text>
                      <Space wrap>
                        {dampener.mechanics.map((mechanic, mechIndex) => (
                          <Tag key={mechIndex} color="red">{mechanic}</Tag>
                        ))}
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Энкаунтеры */}
          {shouldShowSection('encounters') && (
            <Card  title="Энкаунтеры" style={{ marginBottom: 16 }}>
              <List
                
                dataSource={location.encounters}
                renderItem={(encounter, index) => {
                  if (!shouldShowItem('encounters', index)) return null;
                  
                  return (
                    <List.Item>
                      <Space>
                        <Badge 
                          count={encounter.count} 
                          style={{ backgroundColor: '#52c41a' }}
                        />
                        <Text strong>{encounter.name}</Text>
                        <Tag color="purple">Ур. {encounter.level}</Tag>
                        {encounter.notes && (
                          <Text type="secondary">({encounter.notes})</Text>
                        )}
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

          {/* Лут */}
          {shouldShowSection('loot') && (
            <Card  title="Лут" style={{ marginBottom: 16 }}>
              <List
                
                dataSource={location.loot}
                renderItem={(item, index) => {
                  if (!shouldShowItem('loot', index)) return null;
                  
                  return (
                    <List.Item>
                      <Text>{item}</Text>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

          {/* Подсказки */}
          {shouldShowSection('clues') && (
            <Card  title="Подсказки" style={{ marginBottom: 16 }}>
              <List
                
                dataSource={location.clues}
                renderItem={(clue, index) => {
                  if (!shouldShowItem('clues', index)) return null;
                  
                  return (
                    <List.Item>
                      <Text>{clue}</Text>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {/* Аудио эффекты */}
          {bindings?.locations[location.id] && (
            <Card 
               
              title={
                <Space>
                  <AudioOutlined />
                  Звуковые эффекты
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <LocationEffectButtons
                locationId={location.id}
                locationConfig={bindings.locations[location.id]}
                isLocationTransition={true}
              />
            </Card>
          )}

          {/* Участвует в квестах */}
          {relatedQuests.length > 0 && (
            <Card 
               
              title={
                <Space>
                  <QrcodeOutlined />
                  Участвует в квестах
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <List
                
                dataSource={relatedQuests}
                renderItem={(quest) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={() => handleQuestClick(quest.id)}
                  >
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space>
                        <Typography.Text strong style={{ color: '#1890ff' }}>
                          {quest.title}
                        </Typography.Text>
                        <Tag color={
                          quest.status === 'active' ? 'green' :
                          quest.status === 'completed' ? 'blue' :
                          quest.status === 'idea' ? 'orange' :
                          quest.status === 'planned' ? 'cyan' :
                          'default'
                        }>
                          {quest.status === 'idea' ? 'Идея' :
                           quest.status === 'planned' ? 'Запланирован' :
                           quest.status === 'active' ? 'Активен' :
                           quest.status === 'completed' ? 'Завершён' :
                           'В архиве'}
                        </Tag>
                      </Space>
                      {quest.summary && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {quest.summary}
                        </Typography.Text>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Статистика */}
          <Card  title="Статистика">
            <Descriptions  column={1}>
              <Descriptions.Item label="Теги">
                {location.tags?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Энкаунтеры">
                {location.encounters?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Лут">
                {location.loot?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Подсказки">
                {location.clues?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Квесты">
                {relatedQuests.length}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LocationDetail;
