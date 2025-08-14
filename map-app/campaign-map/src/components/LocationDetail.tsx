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
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { PointOfInterest } from '../types';

const { Title, Text, Paragraph } = Typography;

interface LocationDetailProps {
  location: PointOfInterest;
  area: string;
  onBack: () => void;
  isModal?: boolean;
}

const LocationDetail: React.FC<LocationDetailProps> = ({ location, area, onBack, isModal = false }) => {
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

        <Col lg={12} span={24}>
          <Card 
            className="amplifier-card"
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#f5222d' }} />
                <span>Усилители эффектов</span>
              </Space>
            }
            size="small"
          >
            <List
              dataSource={location.amplifiers}
              renderItem={(amplifier) => (
                <List.Item>
                  <List.Item.Meta
                    title={amplifier.effect}
                    description={
                      <Space wrap>
                        {amplifier.mechanics.map((mechanic, index) => (
                          <Tag key={index} color="red">
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

        <Col lg={12} span={24}>
          <Card 
            className="dampener-card"
            title={
              <Space>
                <SafetyOutlined style={{ color: '#52c41a' }} />
                <span>Ослабители эффектов</span>
              </Space>
            }
            size="small"
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

        <Col lg={8} span={24}>
          <Card 
            className="encounter-card"
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                <span>Энкаунтеры</span>
              </Space>
            }
            size="small"
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

        <Col lg={8} span={24}>
          <Card 
            className="loot-card"
            title={
              <Space>
                <GiftOutlined style={{ color: '#722ed1' }} />
                <span>Лут</span>
              </Space>
            }
            size="small"
          >
            <List
              dataSource={location.loot}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col lg={8} span={24}>
          <Card 
            className="loot-card"
            title={
              <Space>
                <SearchOutlined style={{ color: '#13c2c2' }} />
                <span>Улики</span>
              </Space>
            }
            size="small"
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
      </Row>
    </div>
  );
};

export default LocationDetail;