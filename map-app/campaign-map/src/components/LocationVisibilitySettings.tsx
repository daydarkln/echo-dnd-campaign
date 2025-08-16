import React from 'react';
import { Card, Button, Space, Typography, Switch, Divider, Alert, Row, Col } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface LocationVisibilitySettingsProps {
  visibility: { [locationId: string]: boolean };
  onToggleVisibility: (locationId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  hasVisibleLocations: () => boolean;
  getCurrentVisibility: () => { [locationId: string]: boolean };
  onSaveSettings?: () => void;
  onResetSettings?: () => void;
}

const LocationVisibilitySettings: React.FC<LocationVisibilitySettingsProps> = ({
  visibility,
  onToggleVisibility,
  onShowAll,
  onHideAll,
  hasVisibleLocations,
  getCurrentVisibility,
  onSaveSettings,
  onResetSettings,
}) => {
  const visibleCount = Object.values(visibility).filter(v => v).length;
  const totalCount = Object.keys(visibility).length;

  // Группируем локации по регионам (если есть информация о регионах)
  const groupedLocations = React.useMemo(() => {
    const groups: { [key: string]: string[] } = {};
    
    Object.keys(visibility).forEach(locationId => {
      // Простая группировка по префиксу (можно улучшить)
      const group = locationId.split('-')[0] || 'Общие';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(locationId);
    });
    
    return groups;
  }, [visibility]);

  return (
    <Card 
      title="Настройки видимости локаций для игроков" 
      size="default"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          {onSaveSettings && (
            <Button 
              icon={<SaveOutlined />} 
              type="primary"
              onClick={onSaveSettings}
            >
              Сохранить
            </Button>
          )}
          {onResetSettings && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={onResetSettings}
            >
              Сбросить
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text>
              Открыто локаций: <Text strong>{visibleCount}</Text> из <Text strong>{totalCount}</Text>
            </Text>
          </Col>
          <Col>
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
          </Col>
        </Row>

        {!hasVisibleLocations() && (
          <Alert
            message="Нет открытых локаций"
            description="Откройте хотя бы одну локацию, чтобы игроки могли её увидеть на карте"
            type="warning"
            showIcon
          />
        )}

        <Divider style={{ margin: '16px 0' }} />

        <Text strong>Управление видимостью по группам:</Text>
        
        {Object.entries(groupedLocations).map(([groupName, locationIds]) => (
          <Card 
            key={groupName} 
            title={groupName} 
            size="small" 
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: '8px 16px' }}
          >
            <Row gutter={[16, 8]}>
              {locationIds.map((locationId) => (
                <Col key={locationId} xs={24} sm={12} md={8} lg={6}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 8px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    backgroundColor: '#fafafa'
                  }}>
                    <Text style={{ fontSize: '12px', flex: 1, marginRight: 8 }}>
                      {locationId}
                    </Text>
                    <Switch
                      size="small"
                      checked={visibility[locationId]}
                      onChange={() => onToggleVisibility(locationId)}
                      checkedChildren={<EyeOutlined />}
                      unCheckedChildren={<EyeInvisibleOutlined />}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        ))}

        <Divider style={{ margin: '16px 0' }} />

        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
          Настройки автоматически сохраняются в localStorage браузера. 
          Игроки увидят только те локации, которые отмечены как видимые.
        </Text>
      </Space>
    </Card>
  );
};

export default LocationVisibilitySettings; 