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
  AudioOutlined
} from '@ant-design/icons';
import { Route } from '../types';
import { RouteFieldVisibility } from '../types/visibility';
import { RouteEffectButtons } from './RouteEffectButtons';
import { useAudio } from '../App';

const { Title, Text, Paragraph } = Typography;

interface RouteDetailProps {
  route: Route;
  onBack: () => void;
  isModal?: boolean;
  isPlayerView?: boolean;
  fieldVisibility?: RouteFieldVisibility;
  getRouteFieldVisibility?: (routeId: string) => RouteFieldVisibility;
  toggleRouteItemVisibility?: (routeId: string, field: 'obstacles' | 'requirements', itemIndex: number) => void;
  toggleRouteNotesVisibility?: (routeId: string) => void;
  setRouteItemVisibility?: (routeId: string, field: 'obstacles' | 'requirements', itemIndex: number, isVisible: boolean) => void;
  setRouteNotesVisibility?: (routeId: string, isVisible: boolean) => void;
  isRouteItemVisible?: (routeId: string, field: 'obstacles' | 'requirements', itemIndex: number) => boolean;
  isRouteNotesVisible?: (routeId: string) => boolean;
}

const RouteDetail: React.FC<RouteDetailProps> = ({ 
  route, 
  onBack, 
  isModal = false,
  isPlayerView = false,
  fieldVisibility,
  getRouteFieldVisibility,
  toggleRouteItemVisibility,
  toggleRouteNotesVisibility,
  setRouteItemVisibility,
  setRouteNotesVisibility,
  isRouteItemVisible,
  isRouteNotesVisible
}) => {
  const { bindings } = useAudio();

  // Получаем настройки видимости полей
  const visibility = fieldVisibility || getRouteFieldVisibility?.(route.id) || {
    obstacles: {},
    requirements: {},
    notes: 'visible'
  };

  // Проверяем видимость отдельного элемента
  const shouldShowItem = (field: 'obstacles' | 'requirements', itemIndex: number): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    if (isRouteItemVisible) {
      return isRouteItemVisible(route.id, field, itemIndex);
    }
    
    // Фоллбэк для случая когда функция не передана
    const fieldVisibility = visibility[field];
    if (typeof fieldVisibility === 'object' && fieldVisibility !== null) {
      return (fieldVisibility as Record<number, string>)[itemIndex] !== 'hidden';
    }
    return true;
  };

  // Проверяем видимость notes
  const shouldShowNotes = (): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    if (isRouteNotesVisible) {
      return isRouteNotesVisible(route.id);
    }
    
    return visibility.notes !== 'hidden';
  };

  // Проверяем нужно ли показывать секцию вообще (если есть хотя бы один видимый элемент)
  const shouldShowSection = (field: 'obstacles' | 'requirements'): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    const fieldArray = route[field] || [];
    return fieldArray.some((_, index) => shouldShowItem(field, index));
  };

  return (
    <div>
      {/* Заголовок */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBack}
            size="small"
          >
            Назад
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Путь: {route.from} → {route.to}
          </Title>
        </Space>
      </div>

      {/* Основная информация */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Описание пути */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Тип пути">
                <Tag color="blue">{route.pathType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Время в пути">
                <Tag color="green">{route.travelTime}</Tag>
              </Descriptions.Item>
            </Descriptions>
            {route.description && (
              <Paragraph style={{ marginTop: 16 }}>
                {route.description}
              </Paragraph>
            )}
          </Card>

          {/* Препятствия */}
          {shouldShowSection('obstacles') && (
            <Card size="small" title="Препятствия" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={route.obstacles}
                renderItem={(obstacle, index) => {
                  if (!shouldShowItem('obstacles', index)) return null;
                  
                  return (
                    <List.Item>
                      <Space>
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                        <Text>{obstacle}</Text>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

          {/* Требования */}
          {shouldShowSection('requirements') && (
            <Card size="small" title="Требования" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={route.requirements}
                renderItem={(requirement, index) => {
                  if (!shouldShowItem('requirements', index)) return null;
                  
                  return (
                    <List.Item>
                      <Space>
                        <CheckSquareOutlined style={{ color: '#52c41a' }} />
                        <Text>{requirement}</Text>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

          {/* Заметки */}
          {shouldShowNotes() && route.notes && (
            <Card size="small" title="Заметки" style={{ marginBottom: 16 }}>
              <Paragraph>{route.notes}</Paragraph>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {/* Аудио эффекты */}
          {bindings?.routes && bindings.routes[route.id] && (
            <Card 
              size="small" 
              title={
                <Space>
                  <AudioOutlined />
                  Звуки пути
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <RouteEffectButtons
                routeId={route.id}
                routeConfig={bindings.routes[route.id]}
                isLocationTransition={true}
              />
            </Card>
          )}

          {/* Статистика */}
          <Card size="small" title="Статистика">
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Препятствия">
                {route.obstacles?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Требования">
                {route.requirements?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Заметки">
                {route.notes ? 'Есть' : 'Нет'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RouteDetail;