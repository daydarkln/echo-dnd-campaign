import React, { useState } from 'react';
import { Card, Button, Space, Divider } from 'antd';
import { InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';

interface PathLegendProps {
  pathTypes: Record<string, string>;
}

const PathLegend: React.FC<PathLegendProps> = ({ pathTypes }) => {
  const [isVisible, setIsVisible] = useState(false);

  const pathTypeStyles = {
    main_road: { color: '#1890ff', width: 3, pattern: 'solid', description: 'Основные тракты' },
    narrow_road: { color: '#52c41a', width: 2, pattern: 'solid', description: 'Узкие дороги' },
    obstructed_road: { color: '#f5222d', width: 2, pattern: 'dashed', description: 'Дороги с препятствиями' },
    hidden_path: { color: '#fa8c16', width: 2, pattern: 'dotted', description: 'Скрытые тропы' },
  };

  if (!isVisible) {
    return (
      <Button
        type="default"
        icon={<InfoCircleOutlined />}
        onClick={() => setIsVisible(true)}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        Легенда
      </Button>
    );
  }

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <span>Типы маршрутов</span>
        </Space>
      }
      size="small"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1000,
        width: 280,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => setIsVisible(false)}
          size="small"
        />
      }
    >
      <div style={{ fontSize: 12 }}>
        {Object.entries(pathTypeStyles).map(([key, style]) => (
          <div key={key} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, height: 2, marginRight: 8 }}>
              <svg width="40" height="6" viewBox="0 0 40 6">
                <line
                  x1="0"
                  y1="3"
                  x2="40"
                  y2="3"
                  stroke={style.color}
                  strokeWidth={style.width}
                  strokeDasharray={
                    style.pattern === 'dashed' ? '8,4' :
                    style.pattern === 'dotted' ? '4,4' : 'none'
                  }
                />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: style.color }}>
                {style.description}
              </div>
              <div style={{ color: '#666', fontSize: 10 }}>
                {pathTypes[key] || key}
              </div>
            </div>
          </div>
        ))}
        
        <Divider style={{ margin: '8px 0' }} />
        
        <div style={{ color: '#666', fontSize: 10, lineHeight: 1.4 }}>
          💡 <strong>Подсказки:</strong>
          <br />• Наведите курсор на маршрут для подсветки
          <br />• Множественные пути имеют разную кривизну
          <br />• Цвет подписи соответствует типу дороги
        </div>
      </div>
    </Card>
  );
};

export default PathLegend;