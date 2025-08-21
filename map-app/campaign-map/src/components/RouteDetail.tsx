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
  ClockCircleOutlined
} from '@ant-design/icons';
import { Route } from '../types';
import { RouteFieldVisibility } from '../types/visibility';

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
    if (typeof fieldVisibility === 'object') {
      return fieldVisibility[itemIndex] !== 'hidden';
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
    <div className="route-detail-container" style={{ padding: isModal ? 0 : 24, maxWidth: isModal ? '100%' : 1200, margin: '0 auto' }}>
      {!isModal && (
        <Space style={{ marginBottom: 24 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onBack}
            type="primary"
          >
            Назад к карте
          </Button>
        </Space>
      )}

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <CarOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {route.from} → {route.to}
                </Title>
                <Text type="secondary">Путь {route.id}</Text>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Descriptions column={1} >
                  <Descriptions.Item label="Тип пути">
                    <Tag color="blue">{route.pathType}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <Descriptions column={1} >
                  <Descriptions.Item label="Время в пути">
                    <Space>
                      <ClockCircleOutlined />
                      <Text>{route.travelTime}</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <Descriptions column={1} >
                  <Descriptions.Item label="Описание">
                    <Text italic>{route.description}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Теперь управление видимостью встроено в каждый элемент */}

        {shouldShowSection('obstacles') && route.obstacles && route.obstacles.length > 0 && (
          <Col lg={8} span={24}>
            <Card 
              className="obstacles-card"
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                  <span>Препятствия</span>
                  {!isPlayerView && visibility.obstacles === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={route.obstacles.map((obstacle, index) => ({ obstacle, index }))}
                renderItem={(obstacleWithIndex) => {
                  const { index, obstacle } = obstacleWithIndex;
                  const isVisibleForPlayers = shouldShowItem('obstacles', index);
                  const isVisibleRaw = isRouteItemVisible
                    ? isRouteItemVisible(route.id, 'obstacles', index)
                    : (visibility.obstacles[index] !== 'hidden');
                  
                  if (isPlayerView && !isVisibleForPlayers) {
                    return null; // В режиме игрока скрываем невидимые элементы
                  }
                  
                  return (
                    <List.Item style={{ opacity: !isPlayerView && !isVisibleRaw ? 0.5 : 1 }}>
                      <div style={{ width: '100%' }}>
                        {!isPlayerView && toggleRouteItemVisibility && (
                          <div style={{ marginBottom: 8 }}>
                            <Checkbox
                              checked={isVisibleRaw}
                              onChange={(e) => (setRouteItemVisibility
                                ? setRouteItemVisibility(route.id, 'obstacles', index, e.target.checked)
                                : toggleRouteItemVisibility && toggleRouteItemVisibility(route.id, 'obstacles', index)
                              )}
                            >
                              Показать игрокам
                            </Checkbox>
                          </div>
                        )}
                        <Text>{obstacle}</Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        )}

        {shouldShowSection('requirements') && route.requirements && route.requirements.length > 0 && (
          <Col lg={8} span={24}>
            <Card 
              className="requirements-card"
              title={
                <Space>
                  <CheckSquareOutlined style={{ color: '#52c41a' }} />
                  <span>Требования</span>
                  {!isPlayerView && visibility.requirements === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={route.requirements.map((requirement, index) => ({ requirement, index }))}
                renderItem={(requirementWithIndex) => {
                  const { index, requirement } = requirementWithIndex;
                  const isVisibleForPlayers = shouldShowItem('requirements', index);
                  const isVisibleRaw = isRouteItemVisible
                    ? isRouteItemVisible(route.id, 'requirements', index)
                    : (visibility.requirements[index] !== 'hidden');
                  
                  if (isPlayerView && !isVisibleForPlayers) {
                    return null; // В режиме игрока скрываем невидимые элементы
                  }
                  
                  return (
                    <List.Item style={{ opacity: !isPlayerView && !isVisibleRaw ? 0.5 : 1 }}>
                      <div style={{ width: '100%' }}>
                        {!isPlayerView && toggleRouteItemVisibility && (
                          <div style={{ marginBottom: 8 }}>
                            <Checkbox
                              checked={isVisibleRaw}
                              onChange={(e) => (setRouteItemVisibility
                                ? setRouteItemVisibility(route.id, 'requirements', index, e.target.checked)
                                : toggleRouteItemVisibility && toggleRouteItemVisibility(route.id, 'requirements', index)
                              )}
                            >
                              Показать игрокам
                            </Checkbox>
                          </div>
                        )}
                        <Text>{requirement}</Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        )}

        {shouldShowNotes() && route.notes && (
          <Col lg={8} span={24}>
            <Card 
              className="notes-card"
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#722ed1' }} />
                  <span>Заметки</span>
                  {!isPlayerView && visibility.notes === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              {!isPlayerView && (
                <div style={{ marginBottom: 16 }}>
                  <Checkbox
                    checked={shouldShowNotes()}
                    onChange={(e) => (setRouteNotesVisibility
                      ? setRouteNotesVisibility(route.id, e.target.checked)
                      : toggleRouteNotesVisibility && toggleRouteNotesVisibility(route.id)
                    )}
                  >
                    Показать игрокам
                  </Checkbox>
                </div>
              )}
              <Paragraph>{route.notes}</Paragraph>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default RouteDetail;