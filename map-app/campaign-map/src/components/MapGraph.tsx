import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Typography, Modal, Descriptions, Tag, List } from 'antd';
import LocationNode from './LocationNode';
import { GraphNode, GraphEdge } from '../types';
import { applyDagreLayout } from '../utils/layout';
import ObstacleTag from './ObstacleTag';

const { Title } = Typography;

interface MapGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (nodeId: string) => void;
}

const nodeTypes = {
  locationNode: LocationNode,
};

const MapGraph: React.FC<MapGraphProps> = ({ nodes, edges, onNodeClick }) => {
  const [graphNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [graphEdges, setEdges, onEdgesChange] = useEdgesState(edges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [blockedNodeIds, setBlockedNodeIds] = useState<Set<string>>(new Set());
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  useEffect(() => {
    const { nodes: n, edges: e } = applyDagreLayout(nodes, edges, {
      direction: 'LR',
      ranksep: 160,
      nodesep: 120,
    });
    setNodes(n);
    setEdges(e);
  }, [nodes, edges, setNodes, setEdges]);

  // Подсветка связей при наведении
  useEffect(() => {
    if (!hoveredNodeId) {
      setNodes((nds) => nds.map((n) => ({ ...n, style: { ...(n.style || {}), opacity: 1, filter: undefined } })));
      setEdges((eds) => eds.map((e) => ({
        ...e,
        style: { ...(e.style || {}), opacity: 1, display: 'block' },
        label: (e.data as any)?.route?.travelTime ?? e.label,
      })));
      return;
    }
    const connected = new Set<string>([hoveredNodeId]);
    edges.forEach((e) => {
      if (e.source === hoveredNodeId) connected.add(e.target);
      if (e.target === hoveredNodeId) connected.add(e.source);
    });
    setNodes((nds) => nds.map((n) => {
      const isLocation = n.type === 'locationNode';
      const keep = connected.has(n.id);
      const dim = isLocation && !keep;
      return { ...n, style: { ...(n.style || {}), opacity: dim ? 0.25 : 1, filter: dim ? 'grayscale(40%)' : undefined } };
    }));
    setEdges((eds) => eds.map((e) => {
      const isConnected = (e.source === hoveredNodeId || e.target === hoveredNodeId);
      return {
        ...e,
        style: { 
          ...(e.style || {}), 
          opacity: isConnected ? 1 : 0,
          strokeDasharray: isConnected ? (e.style?.strokeDasharray || 'none') : 'none',
          // Добавляем дополнительное скрытие для невидимых рёбер
          display: isConnected ? 'block' : 'none'
        },
        label: isConnected ? ((e.data as any)?.route?.travelTime ?? e.label) : undefined,
      };
    }));
  }, [hoveredNodeId]);

  useEffect(() => {
    const handler = (e: any) => setHoveredNodeId(e.detail?.id ?? null);
    window.addEventListener('location-node-hover', handler as EventListener);
    return () => window.removeEventListener('location-node-hover', handler as EventListener);
  }, []);

  // Подписка на события блокировки кликов
  useEffect(() => {
    const handler = (e: any) => {
      const { nodeId, duration } = e.detail || {};
      if (nodeId) {
        setBlockedNodeIds(prev => new Set(prev).add(nodeId));
        setTimeout(() => {
          setBlockedNodeIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(nodeId);
            return newSet;
          });
        }, duration || 200);
      }
    };
    window.addEventListener('prevent-node-click', handler as EventListener);
    return () => window.removeEventListener('prevent-node-click', handler as EventListener);
  }, []);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Проверяем, заблокирован ли клик по этому узлу
      if (blockedNodeIds.has(node.id)) {
        return; // Блокируем клик
      }
      
      onNodeClick(node.id);
    },
    [onNodeClick, blockedNodeIds]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      // Получаем информацию о маршруте из данных ребра
      const route = edge.data?.route;
      if (route) {
        setSelectedRoute(route);
        setShowRouteModal(true);
      }
    },
    []
  );

  const minimapNodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'locationNode':
        return '#1890ff';
      default:
        return '#eee';
    }
  }, []);

  return (
    <Card style={{ height: '100%', border: 'none' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, textAlign: 'center' }}>
          Карта локаций кампании
        </Title>
      </div>
      
      <div style={{ height: 'calc(100vh - 120px)', border: '1px solid #d9d9d9', borderRadius: 8 }}>
        <ReactFlow
          nodes={graphNodes}
          edges={graphEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          minZoom={0.25}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={minimapNodeColor}
            nodeStrokeWidth={3}
            position="top-right"
            style={{
              backgroundColor: '#f0f0f0',
              border: '1px solid #d9d9d9',
            }}
          />
        </ReactFlow>
      </div>
      
      {/* Модальное окно с информацией о пути */}
      <Modal
        title="🛣️ Информация о маршруте"
        open={showRouteModal}
        onCancel={() => setShowRouteModal(false)}
        footer={null}
        width={600}
      >
        {selectedRoute && (
          <div>
            <Descriptions
              title={selectedRoute.description}
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Тип пути">
                <Tag color="blue">{selectedRoute.pathType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Время в пути">
                {selectedRoute.travelTime}
              </Descriptions.Item>
              {selectedRoute.obstacles && selectedRoute.obstacles.length > 0 && (
                <Descriptions.Item label="Препятствия">
                  <List
                    size="small"
                    dataSource={selectedRoute.obstacles}
                    renderItem={(obstacle: string) => (
                      <List.Item style={{ padding: '4px 0' }}>
                        <ObstacleTag obstacleName={obstacle} />
                      </List.Item>
                    )}
                  />
                </Descriptions.Item>
              )}
              {selectedRoute.requirements && selectedRoute.requirements.length > 0 && (
                <Descriptions.Item label="Требования">
                  <List
                    size="small"
                    dataSource={selectedRoute.requirements}
                    renderItem={(requirement: string) => (
                      <List.Item style={{ padding: '4px 0' }}>
                        <Tag color="red">{requirement}</Tag>
                      </List.Item>
                    )}
                  />
                </Descriptions.Item>
              )}
              {selectedRoute.notes && (
                <Descriptions.Item label="Примечания">
                  {selectedRoute.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default MapGraph;