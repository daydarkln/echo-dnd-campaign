import React from 'react';
import { Card, Space, Typography, Switch, Divider, Row, Col } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { LocationFieldVisibility, RouteFieldVisibility } from '../types/visibility';

const { Text, Title } = Typography;

interface LocationFieldVisibilitySettingsProps {
  // Информация о локации
  locationId?: string;
  locationName?: string;
  
  // Информация о пути
  routeId?: string;
  routeName?: string;
  
  // Функции управления видимостью полей локаций
  getLocationFieldVisibility?: (locationId: string) => LocationFieldVisibility;
  toggleLocationFieldVisibility?: (locationId: string, field: keyof LocationFieldVisibility) => void;
  
  // Функции управления видимостью полей путей
  getRouteFieldVisibility?: (routeId: string) => RouteFieldVisibility;
  toggleRouteFieldVisibility?: (routeId: string, field: keyof RouteFieldVisibility) => void;
}

const LocationFieldVisibilitySettings: React.FC<LocationFieldVisibilitySettingsProps> = ({
  locationId,
  locationName,
  routeId,
  routeName,
  getLocationFieldVisibility,
  toggleLocationFieldVisibility,
  getRouteFieldVisibility,
  toggleRouteFieldVisibility,
}) => {
  // Названия полей локаций для отображения
  const locationFieldLabels: Record<keyof LocationFieldVisibility, { label: string; description: string }> = {
    amplifiers: { 
      label: 'Усилители', 
      description: 'Эффекты, усиливающие влияние спор, скрытой воли или дикой магии' 
    },
    dampeners: { 
      label: 'Ослабители', 
      description: 'Эффекты, ослабляющие влияние негативных механик' 
    },
    encounters: { 
      label: 'Энкаунтеры', 
      description: 'Возможные встречи и противники в этой локации' 
    },
    loot: { 
      label: 'Лут', 
      description: 'Предметы и ресурсы, которые можно найти' 
    },
    clues: { 
      label: 'Улики', 
      description: 'Подсказки и информация для продвижения сюжета' 
    }
  };

  // Названия полей путей для отображения
  const routeFieldLabels: Record<keyof RouteFieldVisibility, { label: string; description: string }> = {
    obstacles: { 
      label: 'Препятствия', 
      description: 'Препятствия и опасности на пути' 
    },
    requirements: { 
      label: 'Требования', 
      description: 'Условия и проверки для прохождения пути' 
    },
    notes: { 
      label: 'Заметки', 
      description: 'Дополнительная информация о пути' 
    }
  };

  // Если передана локация, показываем управление полями локации
  if (locationId && getLocationFieldVisibility && toggleLocationFieldVisibility) {
    const locationVisibility = getLocationFieldVisibility(locationId);

    return (
      <Card 
        title={`Видимость полей: ${locationName || locationId}`}
        
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Управляйте видимостью отдельных категорий информации о локации для игроков
          </Text>

          <Divider style={{ margin: '12px 0' }} />

          <Row gutter={[0, 12]}>
            {Object.entries(locationFieldLabels).map(([field, info]) => {
              const fieldKey = field as keyof LocationFieldVisibility;
              const isVisible = locationVisibility[fieldKey] === 'visible';

              return (
                <Col key={field} span={24}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    backgroundColor: isVisible ? '#f6ffed' : '#fff1f0'
                  }}>
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>
                        {info.label}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {info.description}
                      </Text>
                    </div>
                    <Switch
                      checked={isVisible}
                      onChange={() => toggleLocationFieldVisibility(locationId, fieldKey)}
                      checkedChildren={<EyeOutlined />}
                      unCheckedChildren={<EyeInvisibleOutlined />}
                    />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Space>
      </Card>
    );
  }

  // Если передан путь, показываем управление полями пути
  if (routeId && getRouteFieldVisibility && toggleRouteFieldVisibility) {
    const routeVisibility = getRouteFieldVisibility(routeId);

    return (
      <Card 
        title={`Видимость полей: ${routeName || routeId}`}
        
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Управляйте видимостью отдельных категорий информации о пути для игроков
          </Text>

          <Divider style={{ margin: '12px 0' }} />

          <Row gutter={[0, 12]}>
            {Object.entries(routeFieldLabels).map(([field, info]) => {
              const fieldKey = field as keyof RouteFieldVisibility;
              const isVisible = routeVisibility[fieldKey] === 'visible';

              return (
                <Col key={field} span={24}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    backgroundColor: isVisible ? '#f6ffed' : '#fff1f0'
                  }}>
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>
                        {info.label}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {info.description}
                      </Text>
                    </div>
                    <Switch
                      checked={isVisible}
                      onChange={() => toggleRouteFieldVisibility(routeId, fieldKey)}
                      checkedChildren={<EyeOutlined />}
                      unCheckedChildren={<EyeInvisibleOutlined />}
                    />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Space>
      </Card>
    );
  }

  // Если ни локация, ни путь не переданы
  return (
    <Card title="Видимость полей" >
      <Text type="secondary">
        Выберите локацию или путь для управления видимостью полей
      </Text>
    </Card>
  );
};

export default LocationFieldVisibilitySettings;