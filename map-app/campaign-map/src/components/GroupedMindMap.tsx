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
import { Card, Typography, Modal, Descriptions, Tag, List, Button, Dropdown, Tooltip, message, notification, App } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, TeamOutlined, DashboardOutlined } from '@ant-design/icons';
import LocationNode from './LocationNode';
import GroupNode from './GroupNode';
import PathLegend from './PathLegend';
import { GraphNode, GraphEdge, PointsData, PathsData, PointOfInterest } from '../types';
import { useGroups } from '../hooks/useGroups';
import { getLocationName, getAreaNameByLocationId } from '../utils/locationUtils';
import { useTrackers } from '../hooks/useTrackers';
import { applyCircularRegionLayout } from '../utils/layout';
import ObstacleTag from './ObstacleTag';
import RouteDetail from './RouteDetail';
import { useNodePositions } from '../hooks/useNodePositions';
import { useLocationVisibility } from '../hooks/useLocationVisibility';
import { useRegionVisibility } from '../hooks/useRegionVisibility';
import { usePathVisibility } from '../hooks/usePathVisibility';
import { useFieldVisibility } from '../hooks/useFieldVisibility';

const { Title } = Typography;

interface GroupedMindMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pointsData: PointsData;
  pathsData: PathsData;
  onNodeClick: (location: PointOfInterest, area: string) => void;
  onRegionClick: (areaName: string) => void;
  showSavePosition?: boolean;
  enableDragging?: boolean;
  enableLocationVisibility?: boolean;
  customTitle?: string;
  customSubtitle?: string;
  showGlobalTrackers?: boolean;
  isPlayerMap?: boolean;
}

const GroupedMindMap: React.FC<GroupedMindMapProps> = ({ 
  nodes, 
  edges, 
  pointsData, 
  pathsData, 
  onNodeClick, 
  onRegionClick,
  showSavePosition = true,
  enableDragging = true,
  enableLocationVisibility = true,
  customTitle,
  customSubtitle,
  showGlobalTrackers = true,
  isPlayerMap = false
}) => {
  const { notification: appNotification } = App.useApp();
  
  // Логируем параметры для отладки
  console.log('GroupedMindMap - Параметры компонента:', {
    showSavePosition,
    enableDragging,
    isPlayerMap,
    nodesCount: nodes.length,
    edgesCount: edges.length
  });

  // Логируем рендеринг кнопки сохранения
  useEffect(() => {
    console.log('GroupedMindMap - Компонент отрендерен, showSavePosition:', showSavePosition);
  }, [showSavePosition]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [blockedNodeIds, setBlockedNodeIds] = useState<Set<string>>(new Set());
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const { groups } = useGroups();
  const [jumpTarget, setJumpTarget] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { state: trackers } = useTrackers();
  const { nodePositions, updateNodePosition, applySavedPositions, saveAllPositions } = useNodePositions(nodes);
  const { 
    isLocationVisible, 
    showAllLocations, 
    hideAllLocations, 
    initializeLocationVisibility,
    setLocationVisibilityWithRegionUpdate
  } = useLocationVisibility();
  const { 
    isRegionVisible, 
    showAllRegions, 
    hideAllRegions, 
    initializeRegionVisibility,
    autoOpenRegionIfNeeded
  } = useRegionVisibility();
  const { shouldPathBeVisible, initializePathVisibility } = usePathVisibility();
  
  // Хук для управления видимостью полей
  const {
    initializeLocationFieldVisibility,
    initializeRouteFieldVisibility,
    getRouteFieldVisibility,
    toggleRouteItemVisibility,
    toggleRouteNotesVisibility,
    isRouteItemVisible,
    isRouteNotesVisible
  } = useFieldVisibility();

  // Фильтрация узлов для карты игроков
  const filteredNodes = useMemo(() => {
    if (!isPlayerMap) return nodes;
    
    // Для карты игроков показываем ВСЕ узлы без фильтрации
    return nodes;
  }, [nodes, isPlayerMap]);

  const filteredEdges = useMemo(() => {
    if (!isPlayerMap) return edges;
    
    // Для карты игроков показываем ВСЕ рёбра без фильтрации
    return edges;
  }, [edges, isPlayerMap]);

  const [graphNodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [graphEdges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Автоматическое открытие региона при открытии локации
  const handleLocationToggle = useCallback((locationId: string, isVisible: boolean, regionName: string) => {
    setLocationVisibilityWithRegionUpdate(
      locationId, 
      isVisible, 
      regionName,
      autoOpenRegionIfNeeded
    );
  }, [setLocationVisibilityWithRegionUpdate, autoOpenRegionIfNeeded]);

  const nodeTypes = useMemo(() => ({
    locationNode: (props: any) => <LocationNode {...props} data={{ ...props.data, enableLocationVisibility: enableLocationVisibility && !isPlayerMap }} onLocationToggle={handleLocationToggle} />,
    group: (props: any) => <GroupNode {...props} data={{ ...props.data, enableLocationVisibility: enableLocationVisibility && !isPlayerMap }} />,
  }), [enableLocationVisibility, isPlayerMap, handleLocationToggle]);
  
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSaveAllPositions = useCallback(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(() => {
      try {
        console.log('GroupedMindMap - Начинаем сохранение позиций...');
        const savedCount = nodePositions.size;
        console.log('GroupedMindMap - Количество узлов для сохранения:', savedCount);
        
        saveAllPositions();
        
        // Показываем дополнительное уведомление для гарантии
        appNotification.success({
          message: 'Успешное сохранение',
          description: `Позиции ${savedCount} узлов успешно сохранены!`,
          duration: 2
        });
        console.log('GroupedMindMap - Уведомление об успешном сохранении показано');
      } catch (error) {
        console.error('GroupedMindMap - Ошибка при сохранении позиций:', error);
        appNotification.error({
          message: 'Ошибка сохранения',
          description: 'Не удалось сохранить позиции узлов',
          duration: 2
        });
      }
      setSaveTimeout(null);
    }, 300);
    setSaveTimeout(timeout);
  }, [saveAllPositions, saveTimeout, nodePositions]);

  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [saveTimeout]);

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);
  
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

  useEffect(() => {
    const locationIds = nodes
      .filter(node => node.type === 'locationNode')
      .map(node => node.id);
    
    const regionNames = nodes
      .filter(node => node.type === 'group')
      .map(node => node.data.area);
    
    const pathIds = edges.map(edge => edge.id);
    
    initializeLocationVisibility(locationIds);
    initializeRegionVisibility(regionNames);
    initializePathVisibility(pathIds);
    
    // Получаем объекты локаций и путей для инициализации видимости полей
    const allLocations: PointOfInterest[] = [];
    pointsData.areas.forEach(area => {
      allLocations.push(...area.pointsOfInterest);
    });
    
    const allRoutes = pathsData.routes;
    
    initializeLocationFieldVisibility(allLocations);
    initializeRouteFieldVisibility(allRoutes);

    // Для карты игроков показываем все узлы и рёбра без фильтрации
    if (isPlayerMap) {
      // Карта игроков показывает все узлы и рёбра без фильтрации
    }
  }, [nodes, edges, initializeLocationVisibility, initializeRegionVisibility, initializePathVisibility, initializeLocationFieldVisibility, initializeRouteFieldVisibility, isPlayerMap]);

  useEffect(() => {
    const nodesToProcess = isPlayerMap ? filteredNodes : nodes;
    
    const laidOut = applyCircularRegionLayout(nodesToProcess, {
      radius: 1300,
      centerX: 1400,
      centerY: 1100,
      startAngleRad: -Math.PI / 2,
      clockwise: true,
      spacingFactor: 1.1,
    });
    
    const nodesWithSavedPositions = laidOut.map(node => {
      const savedPosition = nodePositions.get(node.id);
      return savedPosition ? { ...node, position: savedPosition } : node;
    });
    
    const nodesWithDraggable = nodesWithSavedPositions.map(node => ({
      ...node,
      draggable: enableDragging && !isPlayerMap, // Разрешаем перетаскивание всех узлов (кроме карты игроков)
      type: node.type || 'default'
    }));
    
    // Отладочная информация о перетаскиваемых узлах
    if (enableDragging && !isPlayerMap) {
      const draggableNodes = nodesWithDraggable.filter(n => n.draggable);
      console.log('GroupedMindMap - Настройка перетаскивания узлов:', {
        totalNodes: nodesWithDraggable.length,
        draggableNodes: draggableNodes.length,
        draggableTypes: draggableNodes.map(n => ({ id: n.id, type: n.type, area: n.data?.area }))
      });
    }
    
    setNodes(nodesWithDraggable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredNodes, isPlayerMap, nodePositions, enableDragging]);

  useEffect(() => {
    const hoverHandler = (e: any) => setHoveredNodeId(e.detail?.id ?? null);
    window.addEventListener('location-node-hover', hoverHandler as EventListener);
    return () => window.removeEventListener('location-node-hover', hoverHandler as EventListener);
  }, []);

  useEffect(() => {
    const blockHandler = (e: any) => {
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
    window.addEventListener('prevent-node-click', blockHandler as EventListener);
    return () => window.removeEventListener('prevent-node-click', blockHandler as EventListener);
  }, []);

  // Функции для сброса стилей
  const resetNodeStyles = useCallback((nds: Node[]) => {
    return nds.map(n => ({
      ...n, 
      style: { ...(n.style || {}), opacity: 1, filter: undefined, boxShadow: undefined }
    }));
  }, []);

  const resetEdgeStyles = useCallback((eds: Edge[]) => {
    return eds.map(e => ({
      ...e,
      style: { ...(e.style || {}), opacity: 1, display: 'block' },
      label: (e.data as any)?.route?.travelTime ?? e.label,
    }));
  }, []);

  // Эффект подсветки связей
  useEffect(() => {
    if (!hoveredNodeId) {
      setNodes(nds => resetNodeStyles(nds));
      setEdges(eds => resetEdgeStyles(eds));
      return;
    }

    // Проверяем существование узла в отфильтрованных данных
    const hoveredNodeExists = filteredNodes.some(n => n.id === hoveredNodeId);
    if (!hoveredNodeExists) return;

    const connected = new Set<string>([hoveredNodeId]);
    filteredEdges.forEach((e) => {
      if (e.source === hoveredNodeId) connected.add(e.target);
      if (e.target === hoveredNodeId) connected.add(e.source);
    });

    // Применяем стили к узлам
    setNodes(nds => nds.map(n => {
      const isLocation = n.type === 'locationNode';
      const keep = connected.has(n.id);
      const dim = isLocation && !keep;
      return { 
        ...n, 
        style: { 
          ...(n.style || {}), 
          opacity: dim ? 0.25 : 1, 
          filter: dim ? 'grayscale(40%)' : undefined 
        } 
      };
    }));

    // Применяем стили к ребрам
    setEdges(eds => eds.map(e => {
      const isConnected = (e.source === hoveredNodeId || e.target === hoveredNodeId);
      return {
        ...e,
        style: { 
          ...(e.style || {}), 
          opacity: isConnected ? 1 : 0,
          display: isConnected ? 'block' : 'none'
        },
        label: isConnected ? ((e.data as any)?.route?.travelTime ?? e.label) : undefined,
      };
    }));
  }, [hoveredNodeId, filteredEdges, filteredNodes, setNodes, setEdges, resetNodeStyles, resetEdgeStyles]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === 'locationNode' && blockedNodeIds.has(node.id)) return;
      if (!filteredNodes.some(n => n.id === node.id)) return;
      
      if (node.type === 'locationNode') {
        const locationData = node.data as any;
        if (locationData.location && locationData.area) {
          onNodeClick(locationData.location, locationData.area);
        }
      }
      if (node.type === 'group' && onRegionClick) onRegionClick(node.data.area);
    },
    [onNodeClick, onRegionClick, blockedNodeIds, filteredNodes]
  );

  const handleNodeDragStop = useCallback(
    (event: any, node: Node) => {
      if (isPlayerMap) return;
      if (!filteredNodes.some(n => n.id === node.id)) return;
      
      if (enableDragging) {
        // Обновляем локальное состояние позиций без автоматического сохранения
        const currentSavedPosition = nodePositions.get(node.id);
        if (!currentSavedPosition || 
            Math.abs(currentSavedPosition.x - node.position.x) > 1 || 
            Math.abs(currentSavedPosition.y - node.position.y) > 1) {
          updateNodePosition(node.id, node.position.x, node.position.y);
          // Убираем автоматическое сохранение: debouncedSaveAllPositions();
        }
      }
    },
    [updateNodePosition, nodePositions, enableDragging, isPlayerMap, filteredNodes]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      if (!filteredEdges.some(e => e.id === edge.id)) return;
      
      const route = edge.data?.route;
      if (route) {
        setSelectedRoute(route);
        setShowRouteModal(true);
      }
    },
    [filteredEdges]
  );

  const minimapNodeColor = useCallback((node: Node) => {
    const areaIndex = pointsData.areas.findIndex(area => 
      area.area === node.data.area
    );
    
    const regionColors = [
      'rgba(255, 105, 135, 1)',
      'rgba(50, 205, 50, 1)',
      'rgba(30, 144, 255, 1)',
      'rgba(255, 140, 0, 1)',
      'rgba(186, 85, 211, 1)',
      'rgba(255, 215, 0, 1)',
    ];
    
    return regionColors[areaIndex % regionColors.length] || '#1890ff';
  }, [pointsData]);

  return (
    <Card style={{ height: '100%', border: 'none' }}>
      <div style={{ marginBottom: 16, textAlign: 'center', position: 'relative' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          {customTitle || '🗺️ Карта регионов кампании'}
        </Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          {customSubtitle || 'Выберите регион для просмотра локаций'}
        </Typography.Text>
        {enableDragging && !isPlayerMap && (
          <div style={{ marginTop: '8px' }}>
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              💡 <strong>Подсказка:</strong> Перетаскивайте узлы для изменения их расположения. Не забудьте сохранить позиции кнопкой "Сохранить позиции узлов".
            </Typography.Text>
          </div>
        )}
        
        {/* Единый дропдаун управления картой */}
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              // Поиск игроков
              {
                key: 'find-players',
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamOutlined />
                    <span>Найти игроков</span>
                  </div>
                ),
                children: groups
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
                      ),
                      onClick: () => {
                        setJumpTarget(locId);
                        
                        if (!filteredNodes.some(n => n.id === locId)) return;
                        
                        const targetNode = rfInstance?.getNode(locId);
                        if (targetNode) {
                          window.dispatchEvent(new CustomEvent('prevent-node-click', { 
                            detail: { nodeId: locId, duration: 300 } 
                          }));
                          
                          setNodes(nds => nds.map(n => 
                            n.id === locId 
                              ? { ...n, style: { ...n.style, boxShadow: '0 0 0 3px #1890ff' } } 
                              : n
                          ));
                          
                          setTimeout(() => {
                            try {
                              rfInstance?.fitView({ 
                                nodes: [targetNode], 
                                duration: 800, 
                                padding: 0.2, 
                                minZoom: 0.4, 
                                maxZoom: 1.4 
                              });
                            } catch (e) {
                              console.error("FitView error:", e);
                            }
                          }, 100);
                          
                          setTimeout(() => setNodes(nds => nds.map(n => 
                            n.id === locId 
                              ? { ...n, style: { ...n.style, boxShadow: undefined } } 
                              : n
                          )), 1200);
                        }
                      }
                    };
                  })
              },
              // Сохранение позиций
              ...(showSavePosition ? [{
                key: 'save-positions',
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    💾
                    <span>Сохранить позиции узлов</span>
                  </div>
                ),
                onClick: () => {
                  console.log('GroupedMindMap - Кнопка "Сохранить позиции узлов" нажата');
                  console.log('GroupedMindMap - showSavePosition:', showSavePosition);
                  debouncedSaveAllPositions();
                }
              }] : []),
              // Общие трекеры
              ...(showGlobalTrackers ? [{
                key: 'global-trackers',
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DashboardOutlined />
                    <span>Общие трекеры</span>
                  </div>
                ),
                children: [
                  {
                    key: 'city-panic',
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 200 }}>
                        <span>Городская паника</span>
                        <Tooltip title={cityDesc} placement="left">
                          <Tag color="blue" style={{ margin: 0, cursor: 'help' }}>{trackers.cityPanic}</Tag>
                        </Tooltip>
                      </div>
                    )
                  },
                  {
                    key: 'ecosystem',
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 200 }}>
                        <span>Экосистема</span>
                        <Tooltip title={ecoDesc} placement="left">
                          <Tag color="green" style={{ margin: 0, cursor: 'help' }}>{trackers.ecosystem}</Tag>
                        </Tooltip>
                      </div>
                    )
                  },
                  {
                    key: 'swarm',
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 200 }}>
                        <span>Рой</span>
                        <Tooltip title={swarmDesc} placement="left">
                          <Tag color="red" style={{ margin: 0, cursor: 'help' }}>{trackers.swarm}</Tag>
                        </Tooltip>
                      </div>
                    )
                  }
                ]
              }] : [])
            ]
          }}
        >
          <Button 
            type="default" 
            size="middle" 
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <DashboardOutlined />
            Управление картой
          </Button>
        </Dropdown>
      </div>
      
      <div style={{ height: 'calc(100vh - 160px)', border: '1px solid #d9d9d9', borderRadius: 8, position: 'relative' }}>
        
        <ReactFlow
          onInit={setRfInstance}
          nodes={graphNodes}
          edges={graphEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStop={handleNodeDragStop}
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
        </ReactFlow>
        
        <PathLegend pathTypes={pathsData.pathTypes} />
      </div>
      
      <Modal
        title="🛣️ Информация о маршруте"
        open={showRouteModal}
        onCancel={() => setShowRouteModal(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {selectedRoute && (
          <RouteDetail
            route={selectedRoute}
            onBack={() => setShowRouteModal(false)}
            isModal={true}
            isPlayerView={isPlayerMap}
            getRouteFieldVisibility={getRouteFieldVisibility}
            toggleRouteItemVisibility={!isPlayerMap ? toggleRouteItemVisibility : undefined}
            toggleRouteNotesVisibility={!isPlayerMap ? toggleRouteNotesVisibility : undefined}
            isRouteItemVisible={isRouteItemVisible}
            isRouteNotesVisible={isRouteNotesVisible}
          />
        )}
      </Modal>
    </Card>
  );
};

export default GroupedMindMap;