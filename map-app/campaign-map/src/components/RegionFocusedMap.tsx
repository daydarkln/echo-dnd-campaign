import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Card, Typography, Modal, Descriptions, Tag, List, Tooltip, message } from 'antd';
import { useTrackers } from '../hooks/useTrackers';
import LocationNode from './LocationNode';
import { PointsData, PathsData, GraphNode, GraphEdge, PointOfInterest } from '../types';
import ObstacleTag from './ObstacleTag';
import { applyCircularLocationLayout } from '../utils/layout';

const { Title, Text } = Typography;

interface RegionFocusedMapProps {
  areaName: string;
  pointsData: PointsData;
  pathsData: PathsData;
  onBack: () => void;
  onNodeClick: (location: PointOfInterest, area: string) => void;
  enableDragging?: boolean;
  isPlayerMap?: boolean;
  visibleLocationIds?: string[];
}

const nodeTypes = {
  locationNode: LocationNode,
};

function buildRegionFocusedGraph(
  areaName: string,
  pointsData: PointsData,
  pathsData: PathsData,
  isPlayerMap: boolean = false,
  visibleLocationIds: string[] = []
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const area = pointsData.areas.find((a) => a.area === areaName);
  if (!area) return { nodes: [], edges: [] };

  // Фильтруем локации для карты игроков
  let filteredPointsOfInterest = area.pointsOfInterest;
  if (isPlayerMap && visibleLocationIds.length > 0) {
    filteredPointsOfInterest = area.pointsOfInterest.filter(poi => visibleLocationIds.includes(poi.id));
  }

  // Если нет видимых локаций в регионе для карты игроков, возвращаем пустой граф
  if (isPlayerMap && filteredPointsOfInterest.length === 0) {
    return { nodes: [], edges: [] };
  }

  const regionIds = new Set(filteredPointsOfInterest.map((p) => p.id));
  const allPoiIndex = new Map<string, { poi: PointOfInterest; area: string }>();
  pointsData.areas.forEach((a) => a.pointsOfInterest.forEach((p) => allPoiIndex.set(p.id, { poi: p, area: a.area })));

  // Цвета регионов (как в GroupedMindMap/dataParser)
  const regionColors = [
    'rgba(255, 105, 135, 1)',
    'rgba(50, 205, 50, 1)',
    'rgba(30, 144, 255, 1)',
    'rgba(255, 140, 0, 1)',
    'rgba(186, 85, 211, 1)',
    'rgba(255, 215, 0, 1)',
  ];
  const getRegionColor = (areaLabel: string): string => {
    const idx = pointsData.areas.findIndex((a) => a.area === areaLabel);
    if (idx < 0) return '#1890ff';
    return regionColors[idx % regionColors.length];
  };

  const neighborIds = new Set<string>();
  const edges: GraphEdge[] = [];

  pathsData.routes.forEach((r, idx) => {
    const inA = regionIds.has(r.from);
    const inB = regionIds.has(r.to);
    if (inA && inB) {
      edges.push({
        id: `edge-int-${idx}`,
        source: r.from,
        target: r.to,
        type: 'smoothstep',
        data: { route: r as any, pathType: r.pathType },
        className: `edge-${r.pathType}`,
        label: r.travelTime,
      });
    } else if (inA && !inB) {
      neighborIds.add(r.to);
      edges.push({
        id: `edge-ext-${idx}`,
        source: r.from,
        target: r.to,
        type: 'smoothstep',
        data: { route: r as any, pathType: r.pathType },
        className: `edge-${r.pathType}`,
        label: r.travelTime,
        style: { opacity: 0.8 },
      });
    } else if (!inA && inB) {
      neighborIds.add(r.from);
      edges.push({
        id: `edge-ext-${idx}`,
        source: r.from,
        target: r.to,
        type: 'smoothstep',
        data: { route: r as any, pathType: r.pathType },
        className: `edge-${r.pathType}`,
        label: r.travelTime,
        style: { opacity: 0.8 },
      });
    }
  });

  // Позиционирование: регион — центральный узел (макс. связей) в центре, остальные по окружности; соседи — по внешней окружности
  // Находим узел с наибольшим количеством внутренних связей в регионе
  const degreeMap = new Map<string, number>();
  filteredPointsOfInterest.forEach((p) => degreeMap.set(p.id, 0));
  pathsData.routes.forEach((r) => {
    const inA = regionIds.has(r.from);
    const inB = regionIds.has(r.to);
    if (inA && inB) {
      degreeMap.set(r.from, (degreeMap.get(r.from) ?? 0) + 1);
      degreeMap.set(r.to, (degreeMap.get(r.to) ?? 0) + 1);
    }
  });
  let centerNodeId: string = filteredPointsOfInterest[0]?.id;
  let maxDegree = -1;
  degreeMap.forEach((deg, id) => {
    if (deg > maxDegree) {
      maxDegree = deg;
      centerNodeId = id;
    }
  });

  const nodes: GraphNode[] = [];
  const centerX = 900;
  const centerY = 700;

  // Добавляем центральный узел
  const centerPoi = filteredPointsOfInterest.find((p) => p.id === centerNodeId);
  if (centerPoi) {
    nodes.push({
      id: centerPoi.id,
      type: 'locationNode',
      data: { label: centerPoi.name, location: centerPoi, area: area.area, color: getRegionColor(area.area) },
      position: { x: centerX, y: centerY },
      style: { zIndex: 3 },
    } as GraphNode);
  }

  // Круговое расположение остальных локаций региона
  const otherPois = filteredPointsOfInterest.filter((p) => p.id !== centerNodeId);
  const regionPositions = applyCircularLocationLayout(otherPois, {
    radius: 500,
    centerX,
    centerY,
    startAngleRad: -Math.PI / 2,
    clockwise: true,
    spacingFactor: 1.2,
  });

  // Проверяем и корректируем позиции для предотвращения наложений между внешними узлами
  const minDistance = 300; // минимальное расстояние между центрами узлов
  const adjustedPositions = regionPositions.map((pos, i) => {
    let adjustedPos = { ...pos };
    for (let j = 0; j < i; j++) {
      const prevPos = regionPositions[j];
      const distance = Math.hypot(adjustedPos.x - prevPos.x, adjustedPos.y - prevPos.y);
      if (distance < minDistance) {
        const angle = Math.atan2(adjustedPos.y - centerY, adjustedPos.x - centerX);
        const newRadius = 500 + (minDistance - distance) * 0.5;
        adjustedPos.x = centerX + newRadius * Math.cos(angle);
        adjustedPos.y = centerY + newRadius * Math.sin(angle);
      }
    }
    return adjustedPos;
  });

  otherPois.forEach((poi, i) => {
    const position = adjustedPositions[i];
    nodes.push({
      id: poi.id,
      type: 'locationNode',
      data: { label: poi.name, location: poi, area: area.area, color: getRegionColor(area.area) },
      position: { x: position.x, y: position.y },
      style: { zIndex: 2 },
    } as GraphNode);
  });

  const neighbors = Array.from(neighborIds);
  
  // Фильтруем соседние локации для карты игроков
  const filteredNeighbors = isPlayerMap && visibleLocationIds.length > 0 
    ? neighbors.filter(id => visibleLocationIds.includes(id))
    : neighbors;
  
  const radius = 700;
  const startAngle = -Math.PI / 2;
  filteredNeighbors.forEach((id, idx) => {
    const o = allPoiIndex.get(id);
    if (!o) return;
    const angle = startAngle + (2 * Math.PI * idx) / Math.max(1, filteredNeighbors.length);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodes.push({
      id: id,
      type: 'locationNode',
      data: { label: o.poi.name, location: o.poi, area: o.area, color: getRegionColor(o.area) },
      position: { x, y },
      style: { opacity: 0.85, filter: 'grayscale(15%)' },
    } as GraphNode);
  });

  return { nodes, edges };
}

const RegionFocusedMap: React.FC<RegionFocusedMapProps> = ({ areaName, pointsData, pathsData, onBack, onNodeClick, enableDragging = false, isPlayerMap = false, visibleLocationIds = [] }) => {
  // Инициализируем с пустыми массивами чтобы избежать пересоздания при каждом рендере
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Убрали лишнее логирование рендеров, оставили только важные моменты
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const edgesRef = useRef<GraphEdge[]>([]);
  const { state: trackers } = useTrackers();

  // Мемоизируем результат buildRegionFocusedGraph чтобы избежать пересоздания при каждом рендере
  const memoizedGraph = useMemo(() => {
    console.log('RegionFocusedMap - useMemo пересчитывает граф для региона:', areaName);
    return buildRegionFocusedGraph(areaName, pointsData, pathsData, isPlayerMap, visibleLocationIds);
  }, [areaName, pointsData, pathsData, isPlayerMap, visibleLocationIds]);

  // Функция для сохранения позиций узлов
  const saveNodePositions = useCallback(() => {
    if (!enableDragging) return;
    
    try {
      const positions: Record<string, { x: number; y: number }> = {};
      // Получаем актуальные nodes через rfInstance вместо зависимости от state
      const currentNodes = rfInstance?.getNodes() || [];
      currentNodes.forEach(node => {
        positions[node.id] = { x: node.position.x, y: node.position.y };
      });
      
      const storageKey = `region-${areaName}-positions`;
      localStorage.setItem(storageKey, JSON.stringify(positions));
      console.log(`RegionFocusedMap - Сохранены позиции для региона "${areaName}":`, positions);
      
      // Показываем уведомление об успешном сохранении
      const savedCount = Object.keys(positions).length;
      message.success(`Позиции ${savedCount} узлов региона "${areaName}" успешно сохранены!`, 2);
    } catch (error) {
      console.error('Ошибка при сохранении позиций:', error);
      message.error('Не удалось сохранить позиции узлов', 2);
    }
  }, [rfInstance, areaName, enableDragging]);

  // Функция loadSavedPositions удалена - логика интегрирована в основной useEffect

  // Загрузка позиций теперь интегрирована в основной useEffect выше

  // Обработчик перетаскивания узлов
  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    if (!enableDragging) return;
    
    console.log(`RegionFocusedMap - Узел "${node.id}" перетащен в позицию:`, node.position);
    
    // Обновляем локальное состояние позиций без автоматического сохранения
    // setTimeout(() => {
    //   saveNodePositions();
    // }, 100);
  }, [enableDragging]);

  // Удаляем автоматическое сохранение позиций при изменении nodes
  // так как это создает бесконечный цикл с useEffect который обновляет nodes
  // Вместо этого сохранение происходит в onNodeDragStop

  const cityDesc = [
    '0 — Город живёт обычной жизнью: рынки переполнены торговцами, стража спокойно патрулирует улицы, слухи быстро забываются. Жители чувствуют себя в безопасности.',
    '1 — Первые признаки беспокойства: некоторые двери закрываются раньше обычного, у колодцев разговоры становятся короче и тише. В воздухе витает лёгкая напряжённость.',
    '2 — Тревога нарастает: в трактирах говорят полголоса, стража проверяет документы чаще и дольше обычного. Жители начинают запасаться припасами.',
    '3 — Кризис охватывает улицы: очереди у магазинов, слёзы отчаяния, ночами слышны колокольчики у храмов. Паника начинает выходить из-под контроля.',
    '4 — Порог сорван: бунты на площадях, факелы в руках толпы, поспешные сборы. Караваны уходят на рассвете, спасаясь от надвигающейся катастрофы.',
  ][trackers.cityPanic];
  const ecoDesc = [
    '0 — Природа в равновесии: лесные тропы узнаваемы и безопасны, звери спокойно выращивают потомство. Экосистема функционирует как обычно.',
    '1 — Первые диссонансы: птицы меняют привычные маршруты перелётов, цветки раскрываются не по солнечному циклу. Природа начинает вести себя странно.',
    '2 — Деградация набирает силу: грибы стремительно распространяются, вода приобретает горьковатый привкус. Привычные места становятся опасными.',
    '3 — Критический рубеж: привычные ориентиры «плывут» и меняются, луга шелестят как море без ветра. Природа больше не подчиняется обычным законам.',
    '4 — Экологический коллапс: фауна прячется в самых глубоких убежищах, корни ломают камни, рощи звучат как единый хор. Экосистема разрушена.',
  ][trackers.ecosystem];
  const swarmDesc = [
    '0 — Рой таится в глубине: редкие шепотки доносятся из подземелий, следы не складываются в понятный узор. Угроза пока скрыта, но уже присутствует.',
    '1 — Разведка и прощупывание: одиночные щупальца спор появляются на поверхности, карты «звенят» в одних и тех же точках. Рой изучает территорию.',
    '2 — Сбор сил и концентрация: тропы обрастают спорыньей, охотники слышат унисонный такт. Рой готовится к активным действиям.',
    '3 — Мобилизация и подготовка: колонны формируются в недрах, эхо шагов совпадает с пульсом роя. Массовое наступление неизбежно.',
    '4 — Полномасштабное наступление: тьма движется единой массой, любой шум отзывается многоголосием. Рой вышел на поверхность и захватывает мир.',
  ][trackers.swarm];

  useEffect(() => {
    console.log('RegionFocusedMap - Основной useEffect сработал для региона:', areaName);
    const { nodes: newNodes, edges: newEdges } = memoizedGraph;
    console.log('RegionFocusedMap - Используем мемоизированный граф для региона:', areaName, { nodesCount: newNodes.length, edgesCount: newEdges.length });
    
    // Проверяем, изменились ли данные, чтобы избежать ненужных обновлений
    const hasChanges = newNodes.length !== nodes.length || 
                      newEdges.length !== edges.length ||
                      (newNodes.length > 0 && nodes.length > 0 && newNodes[0].id !== nodes[0].id);
    
    if (hasChanges) {
      console.log('RegionFocusedMap - Данные изменились, обновляем nodes и edges');
      setNodes(newNodes);
      setEdges(newEdges);
      edgesRef.current = newEdges;
    } else {
      console.log('RegionFocusedMap - Данные не изменились, пропускаем обновление');
      // Обновляем только ref, не state
      edgesRef.current = newEdges;
    }
    
    // Загружаем сохраненные позиции только при изменении данных
    if (enableDragging && newNodes.length > 0 && hasChanges) {
      console.log('RegionFocusedMap - Загружаем сохраненные позиции для новых nodes');
      setTimeout(() => {
        const storageKey = `region-${areaName}-positions`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const positions = JSON.parse(saved);
            setNodes(prevNodes => 
              prevNodes.map(node => {
                const savedPos = positions[node.id];
                return savedPos ? { ...node, position: savedPos } : node;
              })
            );
          } catch (error) {
            console.warn(`RegionFocusedMap - Ошибка загрузки позиций для региона "${areaName}":`, error);
          }
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedGraph, enableDragging, areaName]);

  // Миникарта отключена по запросу

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === 'locationNode') {
        const locationData = node.data as any;
        if (locationData.location && locationData.area) {
          onNodeClick(locationData.location, locationData.area);
        }
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick = (event: React.MouseEvent, edge: any) => {
    // Получаем информацию о маршруте из данных ребра
    const route = edge.data?.route;
    if (route) {
      setSelectedRoute(route);
      setShowRouteModal(true);
    }
  };

  // Подсветка связей при наведении: затемняем несвязанные
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
    edgesRef.current.forEach((e) => {
      if (e.source === hoveredNodeId) connected.add(e.target);
      if (e.target === hoveredNodeId) connected.add(e.source);
    });
    setNodes((nds) => nds.map((n) => {
      const isLocation = n.type === 'locationNode';
      const keep = connected.has(n.id);
      const dim = isLocation && !keep;
      return { ...n, style: { ...(n.style || {}), opacity: dim ? 0.25 : 1, filter: dim ? 'grayscale(40%)' : undefined } };
    }));
    setEdges((eds) => eds.map((e) => ({
      ...e,
              style: { 
          ...(e.style || {}), 
          opacity: (e.source === hoveredNodeId || e.target === hoveredNodeId) ? 1 : 0,
          strokeDasharray: (e.source === hoveredNodeId || e.target === hoveredNodeId) ? (e.style?.strokeDasharray || 'none') : 'none',
          // Добавляем дополнительное скрытие для невидимых рёбер
          display: (e.source === hoveredNodeId || e.target === hoveredNodeId) ? 'block' : 'none'
        },
      label: (e.source === hoveredNodeId || e.target === hoveredNodeId) ? ((e.data as any)?.route?.travelTime ?? e.label) : undefined,
    })));
  }, [hoveredNodeId]);

  // Подписка на события ховера от узлов
  useEffect(() => {
    const handler = (e: any) => setHoveredNodeId(e.detail?.id ?? null);
    window.addEventListener('location-node-hover', handler as EventListener);
    return () => window.removeEventListener('location-node-hover', handler as EventListener);
  }, []);

  return (
    <Card style={{ height: '100%', border: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Регион: {areaName}</Title>
          <Text type="secondary">В центре — локации региона, по краям — соседние локации, связанные маршрутами</Text>
          {enableDragging && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 <strong>Подсказка:</strong> Перетаскивайте узлы для изменения их расположения. Позиции автоматически сохраняются.
              </Text>
            </div>
          )}
        </div>
        <Button onClick={onBack} type="primary">Назад к общей карте</Button>
      </div>

      <div style={{ height: 'calc(100vh - 160px)', border: '1px solid #d9d9d9', borderRadius: 8, position: 'relative' }}>
        {/* Глобальные трекеры */}
        <Card
          
          style={{ position: 'absolute', zIndex: 5, top: 12, right: 12, minWidth: 220, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          bodyStyle={{ padding: 8 }}
          title={<span style={{ fontSize: 12, color: '#555' }}>Общие трекеры</span>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'center', fontSize: '12px' }}>
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
        
        {/* Кнопка сохранения позиций */}
        {enableDragging && (
          <Button
            type="default"
            size="middle"
            style={{ position: 'absolute', zIndex: 5, top: 12, left: 12 }}
            onClick={saveNodePositions}
          >
            💾 Сохранить позиции
          </Button>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          minZoom={0.25}
          fitView
          attributionPosition="bottom-left"
          onPaneClick={() => setHoveredNodeId(null)} // Сбрасываем hover при клике по панели
          onNodeDragStop={handleNodeDragStop} // Обработчик перетаскивания
          onInit={(reactFlowInstance) => setRfInstance(reactFlowInstance)} // Сохраняем экземпляр ReactFlow
        >
          <Background />
          <Controls />
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

export default RegionFocusedMap;

