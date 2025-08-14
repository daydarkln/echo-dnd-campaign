import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Typography, Modal, Descriptions, Tag, List, Button, Dropdown, Tooltip } from 'antd';
import LocationNode from './LocationNode';
import GroupNode from './GroupNode';
import PathLegend from './PathLegend';
import { GraphNode, GraphEdge, PointsData, PathsData, PointOfInterest } from '../types';
import { useGroups } from '../hooks/useGroups';
import { getLocationName, getAreaNameByLocationId } from '../utils/locationUtils';
import { useTrackers } from '../hooks/useTrackers';
import { applyCircularRegionLayout } from '../utils/layout';
import ObstacleTag from './ObstacleTag';

const { Title } = Typography;

interface GroupedMindMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pointsData: PointsData;
  pathsData: PathsData;
  onNodeClick: (location: PointOfInterest, area: string) => void;
  onRegionClick: (areaName: string) => void;
}

const nodeTypes = {
  locationNode: LocationNode,
  group: GroupNode,
};



const GroupedMindMap: React.FC<GroupedMindMapProps> = ({ nodes, edges, pointsData, pathsData, onNodeClick, onRegionClick }) => {
  const [graphNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [graphEdges, setEdges, onEdgesChange] = useEdgesState(edges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [blockedNodeIds, setBlockedNodeIds] = useState<Set<string>>(new Set());
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const { groups } = useGroups();
  const [jumpTarget, setJumpTarget] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { state: trackers } = useTrackers();
  const cityDesc = [
    '0 — Город дышит ровно: рынки гудят, стража вальяжна, слухи не задерживаются.',
    '1 — Лёгкая нервозность: двери закрывают пораньше, у колодцев шёпот короче.',
    '2 — Тревога растёт: в трактирах говорят полголоса, стража проверяет чаще и дольше.',
    '3 — Кризис на улицах: очереди, слёзы, ночами слышно колокольчики у храмов.',
    '4 — Порог сорван: бунты, факелы и поспешные сборы; караваны уходят на рассвете.',
  ][trackers.cityPanic];
  const ecoDesc = [
    '0 — Лес спокоен: тропы узнаваемы, зверь бережёт выводки.',
    '1 — Диссонанс: птицы меняют перелёты, цветки раскрываются не по солнцу.',
    '2 — Деградация: грибы берут верх, вода несёт горьковатый привкус.',
    '3 — Рубеж: привычные ориентиры «плывут», луга шелестят как море без ветра.',
    '4 — Коллапс: фауна прячется, корни ломают камни, рощи слышны как хор.',
  ][trackers.ecosystem];
  const swarmDesc = [
    '0 — Рой таится: редкие шепотки в глубине, следы не сводятся в узор.',
    '1 — Разведка: одиночные щупальца спор, карты «звенят» в одних и тех же точках.',
    '2 — Сбор сил: тропы обрастают спорыньей, охотники слышат унисонный такт.',
    '3 — Мобилизация: колонны в недрах, эхо шагов совпадает с пульсом.',
    '4 — Наступление: тьма движется массой, любой шум отзывается многоголосием.',
  ][trackers.swarm];

  // Применяем круговую раскладку для верхнего уровня (группы-регионы)
  useEffect(() => {
    const laidOut = applyCircularRegionLayout(nodes, {
      radius: 1300,
      centerX: 1400,
      centerY: 1100,
      startAngleRad: -Math.PI / 2,
      clockwise: true,
      spacingFactor: 1.1,
    });
    setNodes(laidOut);
  }, [nodes, setNodes]);

  // Подписка на события ховера от узлов
  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.id ?? null;
      setHoveredNodeId(id);
    };
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

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Проверяем, заблокирован ли клик по этому узлу
      if (node.type === 'locationNode' && blockedNodeIds.has(node.id)) {
        return; // Блокируем клик
      }
      
      if (node.type === 'locationNode') {
        const locationData = node.data as any;
        if (locationData.location && locationData.area) {
          onNodeClick(locationData.location, locationData.area);
        }
      }
      if (node.type === 'group' && onRegionClick) onRegionClick(node.data.area);
    },
    [onNodeClick, onRegionClick, blockedNodeIds]
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
    // Получаем индекс региона по имени области
    const areaIndex = pointsData.areas.findIndex(area => 
      area.area === node.data.area
    );
    
    // Используем ту же цветовую схему, что и для регионов
    const regionColors = [
      'rgba(255, 105, 135, 1)', // Розовый
      'rgba(50, 205, 50, 1)',   // Зелёный
      'rgba(30, 144, 255, 1)',  // Синий
      'rgba(255, 140, 0, 1)',   // Оранжевый
      'rgba(186, 85, 211, 1)',  // Фиолетовый
      'rgba(255, 215, 0, 1)',   // Жёлтый
    ];
    
    return regionColors[areaIndex % regionColors.length] || '#1890ff';
  }, [pointsData]);

  // Подсветка связей при наведении: затемняем все несвязанные с наведённой локацией
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
    // Используем исходные рёбра из пропсов, чтобы не триггерить цикл от стилизации
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
      // Проверяем, связано ли ребро с наведённым узлом
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
      
      <div style={{ height: 'calc(100vh - 160px)', border: '1px solid #d9d9d9', borderRadius: 8, position: 'relative' }}>
        {/* Кнопка Найти игроков */}
        <Dropdown
          trigger={['click']}
          menu={{
            items: groups
              .filter(g => g.isPlayers && g.currentLocation)
              .map(g => {
                const locId = g.currentLocation as string;
                return {
                  key: `grp:${g.id}::loc:${locId}`,
                  label: (
                    <div style={{ lineHeight: 1.2 }}>
                      <div style={{ fontWeight: 600 }}>
                        {g.name} <Tag color="blue">{g.members.length}</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {getLocationName(locId)} ({getAreaNameByLocationId(locId)})
                      </div>
                    </div>
                  )
                };
              }),
            onClick: ({ key }) => {
              // Извлекаем ID локации из ключа вида "grp:<gid>::loc:<locId>"
              const parts = String(key).split('::loc:');
              const locId = parts.length === 2 ? parts[1] : String(key);
              setJumpTarget(locId);
              // Находим узел через инстанс RF (с учётом вложенности/реальных позиций)
              const targetNode = rfInstance?.getNode(locId);
              if (targetNode) {
                // Событие для блокировки клика и мягкая подсветка
                window.dispatchEvent(new CustomEvent('prevent-node-click', { detail: { nodeId: locId, duration: 300 } }));
                setNodes(nds => nds.map(n => n.id === locId ? ({ ...n, style: { ...(n.style||{}), boxShadow: '0 0 0 3px #1890ff' } }) : n));
                // Точный фокус: fitView по одному узлу
                try {
                  rfInstance?.fitView({ nodes: [targetNode], duration: 800, padding: 0.2, minZoom: 0.4, maxZoom: 1.4 });
                } catch {}
                setTimeout(() => setNodes(nds => nds.map(n => n.id === locId ? ({ ...n, style: { ...(n.style||{}), boxShadow: undefined } }) : n)), 1200);
              }
            }
          }}
        >
          <Button type="primary" size="middle" style={{ position: 'absolute', zIndex: 5, top: 12, left: 12 }}>
            Найти игроков
          </Button>
        </Dropdown>
        {/* Глобальные трекеры */}
        <Card
          size="small"
          style={{ position: 'absolute', zIndex: 5, top: 56, right: 12, minWidth: 220, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          bodyStyle={{ padding: 8 }}
          title={<span style={{ fontSize: 12, color: '#555' }}>Общие трекеры</span>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'center', fontSize: 12 }}>
            <span>Городская паника</span>
            <Tooltip title={cityDesc} placement="left">
              <Tag color="blue" style={{ margin: 0, cursor: 'help' }}>{trackers.cityPanic}</Tag>
            </Tooltip>
            <span>Экосистема</span>
            <Tooltip title={ecoDesc} placement="left">
              <Tag color="green" style={{ margin: 0, cursor: 'help' }}>{trackers.ecosystem}</Tag>
            </Tooltip>
            <span>Рой</span>
            <Tooltip title={swarmDesc} placement="left">
              <Tag color="red" style={{ margin: 0, cursor: 'help' }}>{trackers.swarm}</Tag>
            </Tooltip>
          </div>
        </Card>
        <ReactFlow
          onInit={(instance) => setRfInstance(instance)}
          nodes={graphNodes}
          edges={graphEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          minZoom={0.25}
          fitView
          attributionPosition="bottom-left"
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
        >
          <Background color="#f8f9fa" gap={20} />
          <Controls />
          {/* Миникарту убираем по запросу */}
        </ReactFlow>
        
        <PathLegend pathTypes={pathsData.pathTypes} />
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

export default GroupedMindMap;