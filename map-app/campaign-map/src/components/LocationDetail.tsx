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
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { PointOfInterest } from '../types';
import { LocationFieldVisibility } from '../types/visibility';

const { Title, Text, Paragraph } = Typography;

interface LocationDetailProps {
  location: PointOfInterest;
  area: string;
  onBack: () => void;
  isModal?: boolean;
  isPlayerView?: boolean;
  fieldVisibility?: LocationFieldVisibility;
  getLocationFieldVisibility?: (locationId: string) => LocationFieldVisibility;
  toggleLocationItemVisibility?: (locationId: string, field: keyof LocationFieldVisibility, itemIndex: number) => void;
  isLocationItemVisible?: (locationId: string, field: keyof LocationFieldVisibility, itemIndex: number) => boolean;
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
  isLocationItemVisible
}) => {
  // Получаем настройки видимости полей
  const visibility = fieldVisibility || getLocationFieldVisibility?.(location.id) || {
    amplifiers: {},
    dampeners: {},
    encounters: {},
    loot: {},
    clues: {}
  };

  // Проверяем видимость отдельного элемента
  const shouldShowItem = (field: keyof LocationFieldVisibility, itemIndex: number): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    if (isLocationItemVisible) {
      return isLocationItemVisible(location.id, field, itemIndex);
    }
    
    // Фоллбэк для случая когда функция не передана
    const fieldVisibility = visibility[field];
    if (typeof fieldVisibility === 'object') {
      return fieldVisibility[itemIndex] !== 'hidden';
    }
    return true;
  };

  // Проверяем нужно ли показывать секцию вообще (если есть хотя бы один видимый элемент)
  const shouldShowSection = (field: keyof LocationFieldVisibility): boolean => {
    if (!isPlayerView) return true; // В режиме мастера всегда показываем все
    
    const fieldArray = location[field] || [];
    return fieldArray.some((_, index) => shouldShowItem(field, index));
  };

  return (
    <div className="location-detail-container" style={{ padding: isModal ? 0 : 24, maxWidth: isModal ? '100%' : 1200, margin: '0 auto' }}>
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
              <EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {location.name}
                </Title>
                <Text type="secondary">{area}</Text>
              </div>
            </div>

            <Space wrap>
              {location.tags.map((tag, index) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Теперь управление видимостью встроено в каждый элемент */}

        {shouldShowSection('amplifiers') && (
          <Col lg={12} span={24}>
            <Card 
              className="amplifier-card"
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#f5222d' }} />
                  <span>Усилители эффектов</span>
                  {!isPlayerView && visibility.amplifiers === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={location.amplifiers.map((amplifier, index) => ({ ...amplifier, index }))}
                renderItem={(amplifierWithIndex) => {
                  const { index, ...amplifier } = amplifierWithIndex;
                  const isVisible = shouldShowItem('amplifiers', index);
                  
                  if (isPlayerView && !isVisible) {
                    return null; // В режиме игрока скрываем невидимые элементы
                  }
                  
                  return (
                    <List.Item style={{ opacity: !isPlayerView && !isVisible ? 0.5 : 1 }}>
                      <div style={{ width: '100%' }}>
                        {!isPlayerView && toggleLocationItemVisibility && (
                          <div style={{ marginBottom: 8 }}>
                            <Checkbox
                              checked={isVisible}
                              onChange={() => toggleLocationItemVisibility(location.id, 'amplifiers', index)}
                            >
                              Показать игрокам
                            </Checkbox>
                          </div>
                        )}
                        <List.Item.Meta
                          title={amplifier.effect}
                          description={
                            <Space wrap>
                              {amplifier.mechanics.map((mechanic, mIndex) => (
                                <Tag key={mIndex} color="red">
                                  {mechanic}
                                </Tag>
                              ))}
                            </Space>
                          }
                        />
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        )}

        {shouldShowSection('dampeners') && (
          <Col lg={12} span={24}>
            <Card 
              className="dampener-card"
              title={
                <Space>
                  <SafetyOutlined style={{ color: '#52c41a' }} />
                  <span>Ослабители эффектов</span>
                  {!isPlayerView && visibility.dampeners === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={location.dampeners}
                renderItem={(dampener) => (
                  <List.Item>
                    <List.Item.Meta
                      title={dampener.effect}
                      description={
                        <Space wrap>
                          {dampener.mechanics.map((mechanic, index) => (
                            <Tag key={index} color="green">
                              {mechanic}
                            </Tag>
                          ))}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        {shouldShowSection('encounters') && (
          <Col lg={8} span={24}>
            <Card 
              className="encounter-card"
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                  <span>Энкаунтеры</span>
                  {!isPlayerView && visibility.encounters === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={location.encounters}
                renderItem={(encounter) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{encounter.name}</Text>
                          <Badge count={encounter.count} style={{ backgroundColor: '#fa8c16' }} />
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">Уровень: {encounter.level}</Text>
                          {encounter.notes && (
                            <Paragraph style={{ margin: '4px 0 0 0', fontSize: 12 }}>
                              {encounter.notes}
                            </Paragraph>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        {shouldShowSection('loot') && (
          <Col lg={8} span={24}>
            <Card 
              className="loot-card"
              title={
                <Space>
                  <GiftOutlined style={{ color: '#722ed1' }} />
                  <span>Лут</span>
                  {!isPlayerView && visibility.loot === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={location.loot.map((item, index) => ({ item, index }))}
                renderItem={(itemWithIndex) => {
                  const { index, item } = itemWithIndex;
                  const isVisible = shouldShowItem('loot', index);
                  
                  if (isPlayerView && !isVisible) {
                    return null; // В режиме игрока скрываем невидимые элементы
                  }
                  
                  return (
                    <List.Item style={{ opacity: !isPlayerView && !isVisible ? 0.5 : 1 }}>
                      <div style={{ width: '100%' }}>
                        {!isPlayerView && toggleLocationItemVisibility && (
                          <div style={{ marginBottom: 8 }}>
                            <Checkbox
                              checked={isVisible}
                              onChange={() => toggleLocationItemVisibility(location.id, 'loot', index)}
                            >
                              Показать игрокам
                            </Checkbox>
                          </div>
                        )}
                        <Text>{item}</Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        )}

        {shouldShowSection('clues') && (
          <Col lg={8} span={24}>
            <Card 
              className="clues-card"
              title={
                <Space>
                  <SearchOutlined style={{ color: '#13c2c2' }} />
                  <span>Улики</span>
                  {!isPlayerView && visibility.clues === 'hidden' && (
                    <Tag color="red">Скрыто для игроков</Tag>
                  )}
                </Space>
              }
              
            >
              <List
                dataSource={location.clues}
                renderItem={(clue) => (
                  <List.Item>
                    <Text italic>{clue}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default LocationDetail;