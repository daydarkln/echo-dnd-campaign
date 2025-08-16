import React from 'react';
import { Card, Button, Space, Typography, Switch, Divider, Alert } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface LocationVisibilityManagerProps {
  visibility: { [locationId: string]: boolean };
  onToggleVisibility: (locationId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  hasVisibleLocations: () => boolean;
  getCurrentVisibility: () => { [locationId: string]: boolean };
}

const LocationVisibilityManager: React.FC<LocationVisibilityManagerProps> = ({
  visibility,
  onToggleVisibility,
  onShowAll,
  onHideAll,
  hasVisibleLocations,
  getCurrentVisibility,
}) => {
  const visibleCount = Object.values(visibility).filter(v => v).length;
  const totalCount = Object.keys(visibility).length;

  return (
    <Card 
      title="Управление видимостью локаций" 
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>
            Открыто локаций: <Text strong>{visibleCount}</Text> из <Text strong>{totalCount}</Text>
          </Text>
          <Space>
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={onShowAll}
              disabled={visibleCount === totalCount}
            >
              Открыть все
            </Button>
            <Button 
              icon={<EyeInvisibleOutlined />} 
              size="small"
              onClick={onHideAll}
              disabled={visibleCount === 0}
            >
              Скрыть все
            </Button>
          </Space>
        </div>

        {!hasVisibleLocations() && (
          <Alert
            message="Нет открытых локаций"
            description="Откройте хотя бы одну локацию, чтобы увидеть её на карте"
            type="warning"
            showIcon
          />
        )}

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {Object.entries(visibility).map(([locationId, isVisible]) => (
            <div 
              key={locationId} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Text style={{ fontSize: '12px' }}>
                {locationId}
              </Text>
              <Switch
                size="small"
                checked={isVisible}
                onChange={() => onToggleVisibility(locationId)}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<EyeInvisibleOutlined />}
              />
            </div>
          ))}
        </div>

        <Text type="secondary" style={{ fontSize: '11px', textAlign: 'center', display: 'block' }}>
          Настройки сохраняются автоматически в localStorage
        </Text>
      </Space>
    </Card>
  );
};

export default LocationVisibilityManager; 