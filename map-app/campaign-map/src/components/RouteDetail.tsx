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
  Button
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
import LocationFieldVisibilitySettings from './LocationFieldVisibilitySettings';

const { Title, Text, Paragraph } = Typography;

interface RouteDetailProps {
  route: Route;
  onBack: () => void;
  isModal?: boolean;
  isPlayerView?: boolean;
  fieldVisibility?: RouteFieldVisibility;
  getRouteFieldVisibility?: (routeId: string) => RouteFieldVisibility;
  toggleRouteFieldVisibility?: (routeId: string, field: keyof RouteFieldVisibility) => void;
}

const RouteDetail: React.FC<RouteDetailProps> = ({ 
  route, 
  onBack, 
  isModal = false,
  isPlayerView = false,
  fieldVisibility,
  getRouteFieldVisibility,
  toggleRouteFieldVisibility
}) => {
  // Получаем настройки видимости полей
  const visibility = fieldVisibility || getRouteFieldVisibility?.(route.id) || {
    obstacles: 'visible',
    requirements: 'visible',
    notes: 'visible'
  };

  // Определяем, показывать ли секцию
  const shouldShowSection = (field: keyof RouteFieldVisibility): boolean => {
    if (!isPlayerView) return true; // В master view всегда показываем все
    return visibility[field] === 'visible';
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
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Тип пути">
                    <Tag color="blue">{route.pathType}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Время в пути">
                    <Space>
                      <ClockCircleOutlined />
                      <Text>{route.travelTime}</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Описание">
                    <Text italic>{route.description}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Управление видимостью полей для мастера */}
        {!isPlayerView && getRouteFieldVisibility && toggleRouteFieldVisibility && (
          <Col span={24}>
            <LocationFieldVisibilitySettings
              routeId={route.id}
              routeName={`${route.from} → ${route.to}`}
              getRouteFieldVisibility={getRouteFieldVisibility}
              toggleRouteFieldVisibility={toggleRouteFieldVisibility}
            />
          </Col>
        )}

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
              size="small"
            >
              <List
                dataSource={route.obstacles}
                renderItem={(obstacle) => (
                  <List.Item>
                    <Text>{obstacle}</Text>
                  </List.Item>
                )}
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
              size="small"
            >
              <List
                dataSource={route.requirements}
                renderItem={(requirement) => (
                  <List.Item>
                    <Text>{requirement}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        {shouldShowSection('notes') && route.notes && (
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
              size="small"
            >
              <Paragraph>{route.notes}</Paragraph>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default RouteDetail;