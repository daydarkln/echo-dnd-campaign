import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Typography } from 'antd';
import RegionNode from './RegionNode';
import { GraphNode } from '../types';
import { applyCircularRegionLayout } from '../utils/layout';

const { Title } = Typography;

interface RegionMapProps {
  nodes: GraphNode[];
  onRegionClick: (regionId: string, areaName: string) => void;
}

const nodeTypes = {
  regionNode: RegionNode,
};

const RegionMap: React.FC<RegionMapProps> = ({ nodes, onRegionClick }) => {
  const [graphNodes, setNodes, onNodesChange] = useNodesState(nodes as unknown as Node[]);
  const [graphEdges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const laidOut = applyCircularRegionLayout(nodes, {
      radius: 3000,
      centerX: 1600,
      centerY: 1400,
      startAngleRad: -Math.PI / 2,
      clockwise: true,
      spacingFactor: 1.15,
    });
    setNodes(laidOut as unknown as Node[]);
  }, [nodes, setNodes]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === 'regionNode') {
        onRegionClick(node.id, node.data.area);
      }
    },
    [onRegionClick]
  );

  return (
    <Card style={{ height: '100%', border: 'none' }}>
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          🗺️ Карта регионов кампании
        </Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          Выберите регион для просмотра локаций
        </Typography.Text>
      </div>
      
      <div style={{ height: 'calc(100vh - 160px)', border: '1px solid #d9d9d9', borderRadius: 8 }}>
        <ReactFlow
          nodes={graphNodes}
          edges={graphEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
        >
          <Background color="#f0f2f5" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </Card>
  );
};

export default RegionMap;