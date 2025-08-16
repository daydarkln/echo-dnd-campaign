import React from 'react';
import { 
  Card, 
  Typography, 
  Tag, 
  Divider, 
  Space, 
  Row, 
  Col,
  Button
} from 'antd';
import { 
  EnvironmentOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { PointOfInterest } from '../types';

const { Title, Text } = Typography;

interface PlayerLocationDetailProps {
  location: PointOfInterest;
  area: string;
  onBack: () => void;
  isModal?: boolean;
}

const PlayerLocationDetail: React.FC<PlayerLocationDetailProps> = ({ location, area, onBack, isModal = false }) => {
  // Фильтруем теги, оставляя только безопасные для игроков
  const safeTags = location.tags.filter(tag => 
    !tag.toLowerCase().includes('лут') &&
    !tag.toLowerCase().includes('сокровище') &&
    !tag.toLowerCase().includes('опасность') &&
    !tag.toLowerCase().includes('ловушка') &&
    !tag.toLowerCase().includes('секрет') &&
    !tag.toLowerCase().includes('энкаунтер') &&
    !tag.toLowerCase().includes('улика')
  );

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

            {safeTags.length > 0 && (
              <Space wrap>
                {safeTags.map((tag, index) => (
                  <Tag key={index} color="blue">
                    {tag}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        {/* Убираем все карточки с чувствительной информацией для игроков */}
        <Col span={24}>
          <Card>
            <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
              Исследуйте локацию, чтобы узнать больше деталей
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlayerLocationDetail; 