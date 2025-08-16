import React from 'react';
import { NodeProps } from 'reactflow';
import { GlobalOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useRegionVisibility } from '../hooks/useRegionVisibility';

interface GroupNodeData {
  label: string;
  area: string;
  locationCount: number;
  color: string;
  enableLocationVisibility?: boolean;
}

const GroupNode: React.FC<NodeProps<GroupNodeData>> = ({ data, selected }) => {
  const { isRegionVisible, toggleRegionVisibility, autoOpenRegionIfNeeded } = useRegionVisibility();
  
  return (
    <div
      className="group-node"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        border: 'none',
        outline: `3px solid ${data.color}`,
        outlineOffset: 6,
        borderRadius: 20,
        background: 'transparent',
        boxShadow: selected
          ? `0 6px 20px ${data.color}60`
          : `0 4px 12px ${data.color}30`,
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Заголовок региона */}
      <div
        style={{
          position: 'absolute',
          top: -15,
          left: 20,
          backgroundColor: data.color,
          color: 'white',
          padding: '8px 20px',
          borderRadius: 20,
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <GlobalOutlined />
        {data.label}
        <span
          style={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            padding: '2px 8px',
            borderRadius: 10,
            fontSize: 12,
            marginLeft: 8,
          }}
        >
          {data.locationCount}
        </span>
        
      </div>

      {/* Дочерние узлы рендерятся React Flow внутри extent: 'parent' */}
    </div>
  );
};

export default GroupNode;