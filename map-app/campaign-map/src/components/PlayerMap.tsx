import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  ReactFlowInstance,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Typography, Alert, Empty } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import LocationNode from './LocationNode';
import GroupNode from './GroupNode';
import PathLegend from './PathLegend';
import { GraphNode, GraphEdge, PointsData, PathsData, PointOfInterest } from '../types';
import { getLocationName, getAreaNameByLocationId } from '../utils/locationUtils';
import { applyCircularRegionLayout } from '../utils/layout';
import ObstacleTag from './ObstacleTag';
import { useNodePositions } from '../hooks/useNodePositions';


const { Title } = Typography;

interface PlayerMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pointsData: PointsData;
  pathsData: PathsData;
  onNodeClick: (location: PointOfInterest, area: string) => void;
  onRegionClick: (areaName: string) => void;
}

const PlayerMap: React.FC<PlayerMapProps> = ({ 
  nodes, 
  edges, 
  pointsData, 
  pathsData, 
  onNodeClick, 
  onRegionClick
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { nodePositions, updateNodePosition, applySavedPositions } = useNodePositions(nodes);


  // Показываем все узлы без фильтрации
  const filteredNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    
    console.log('PlayerMap - Всего узлов:', nodes.length);
    console.log('PlayerMap - Узлы локаций:', nodes.filter(n => n.type === 'locationNode').length);
    console.log('PlayerMap - Узлы регионов:', nodes.filter(n => n.type === 'regionNode').length);
    
    return nodes;
  }, [nodes]);

  // Фильтрация рёбер для карты игроков
  const filteredEdges = useMemo(() => {
    if (edges.length === 0) return [];
    
    const visibleNodeIds = new Set(filteredNodes.map(node => node.id));
    
    return edges.filter(edge => {
      return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
    });
  }, [edges, filteredNodes]);



  // Применяем позиции узлов
  useEffect(() => {
    if (filteredNodes.length > 0) {
      applySavedPositions(filteredNodes);
    }
  }, [filteredNodes, applySavedPositions]);

  // Обработчик клика по узлу
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'locationNode' && node.data.location) {
      onNodeClick(node.data.location, node.data.area);
    } else if (node.type === 'regionNode') {
      onRegionClick(node.data.area);
    }
  }, [onNodeClick, onRegionClick]);

  // Обработчик наведения на узел
  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Обработчик изменения позиции узла
  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    updateNodePosition(node.id, node.position.x, node.position.y);
  }, [updateNodePosition]);

  // Обработчик инициализации ReactFlow
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    setRfInstance(instance);
  }, []);

  // Проверяем, есть ли видимые узлы для отображения
  const hasVisibleNodes = filteredNodes.length > 0;

  // Создаем узлы для ReactFlow
  const flowNodes: Node[] = useMemo(() => {
    return filteredNodes.map(node => {
      const baseNode = {
        id: node.id,
        type: node.type,
        position: nodePositions.get(node.id) ? { x: nodePositions.get(node.id)!.x, y: nodePositions.get(node.id)!.y } : node.position,
        data: {
          ...node.data,
          onNodeClick: () => {
            if (node.type === 'locationNode' && node.data.location) {
              onNodeClick(node.data.location, node.data.area);
            } else if (node.type === 'regionNode') {
              onRegionClick(node.data.area);
            }
          }
        },
        style: {
          ...node.style,
          opacity: hoveredNodeId && hoveredNodeId !== node.id ? 0.6 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }
      };

      if (node.type === 'regionNode') {
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            onRegionClick: () => onRegionClick(node.data.area)
          }
        };
      }

      return baseNode;
    });
  }, [filteredNodes, nodePositions, hoveredNodeId, onNodeClick, onRegionClick]);

  // Создаем рёбра для ReactFlow
  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: 1,
        strokeWidth: 2
      }
    }));
  }, [filteredEdges]);

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <Title level={2}>
          <EyeOutlined style={{ marginRight: '8px' }} />
          Карта для игроков
        </Title>
        <Alert
          message="Информация"
          description="Эта карта показывает только те регионы и локации, которые открыл мастер. Используйте её для навигации по миру."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        

      </div>

      {!hasVisibleNodes ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px'
        }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Нет доступных локаций для отображения"
          >
            <Alert
              message="Карта пуста"
              description="Мастер должен открыть некоторые регионы и локации, чтобы они появились на карте игроков."
              type="info"
              showIcon
              style={{ marginTop: '20px' }}
            />
          </Empty>
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onInit={handleInit}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={{
              locationNode: LocationNode,
              regionNode: GroupNode
            }}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
            <MiniMap 
              style={{ 
                height: 120,
                backgroundColor: '#f0f2f5'
              }}
            />
          </ReactFlow>

          <div style={{ marginTop: '20px' }}>
            <PathLegend pathTypes={pathsData.pathTypes} />
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerMap; 