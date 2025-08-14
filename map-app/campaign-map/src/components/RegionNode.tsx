import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Badge, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface RegionNodeData {
  label: string;
  area: string;
  locationCount: number;
  locations: any[];
}

const RegionNode: React.FC<NodeProps<RegionNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ minWidth: 250 }}>      
      <Card
        className="region-card"
        hoverable
        style={{
          border: selected ? '3px solid #1890ff' : '2px solid #52c41a',
          borderRadius: 12,
          backgroundColor: '#f6ffed',
          boxShadow: selected ? '0 6px 16px rgba(24, 144, 255, 0.4)' : '0 4px 12px rgba(82, 196, 26, 0.2)',
          transition: 'all 0.3s ease',
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <GlobalOutlined 
            style={{ 
              fontSize: 32, 
              color: '#52c41a', 
              marginBottom: 8,
              display: 'block' 
            }} 
          />
          
          <Text strong style={{ fontSize: 16, color: '#262626', display: 'block', marginBottom: 8 }}>
            {data.label}
          </Text>
          
          <Badge 
            count={data.locationCount} 
            style={{ 
              backgroundColor: '#52c41a',
              fontSize: 12,
            }}
            title="Количество локаций"
          />
          
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Кликните для просмотра локаций
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RegionNode;