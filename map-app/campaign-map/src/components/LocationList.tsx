import React from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Row, 
  Col, 
  Tag,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { PointOfInterest } from '../types';

const { Title, Text } = Typography;

interface LocationListProps {
  areaName: string;
  locations: PointOfInterest[];
  onBack: () => void;
  onLocationClick: (locationId: string) => void;
}

const LocationList: React.FC<LocationListProps> = ({ 
  areaName, 
  locations, 
  onBack, 
  onLocationClick 
}) => {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={onBack}
          type="primary"
          size="large"
        >
          Назад к регионам
        </Button>
      </Space>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          📍 {areaName}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Найдено {locations.length} локаций в этом регионе
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {locations.map((location) => (
          <Col key={location.id} xs={24} sm={12} lg={8} xl={6}>
            <Card
              hoverable
              style={{
                height: '100%',
                borderRadius: 12,
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ padding: '16px' }}
              actions={[
                <Button
                  key="view"
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => onLocationClick(location.id)}
                  block
                >
                  Подробнее
                </Button>
              ]}
            >
              <div style={{ minHeight: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8, fontSize: 18 }} />
                  <Title level={4} style={{ margin: 0, fontSize: 16 }}>
                    {location.name}
                  </Title>
                </div>

                <div style={{ marginBottom: 12 }}>
                  {location.tags.slice(0, 3).map((tag, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                      {tag}
                    </Tag>
                  ))}
                  {location.tags.length > 3 && (
                    <Tag style={{ marginBottom: 4 }}>+{location.tags.length - 3}</Tag>
                  )}
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
                    <Text type="secondary">Энкаунтеры: {location.encounters.length}</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <GiftOutlined style={{ color: '#722ed1', marginRight: 4 }} />
                    <Text type="secondary">Лут: {location.loot.length} предметов</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SearchOutlined style={{ color: '#13c2c2', marginRight: 4 }} />
                    <Text type="secondary">Улики: {location.clues.length}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default LocationList;