import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Spin, Alert, Typography, Card, Space, Button } from 'antd';
import { EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import GroupedMindMap from '../components/GroupedMindMap';
import { PointsData, PathsData, PointOfInterest, GraphNode, GraphEdge } from '../types';
import { parseToSubflows } from '../utils/dataParser';
import pointsData from '../tochki-interesa.json';
import pathsData from '../puti-mezhdu-lokaciyami.json';

const { Content } = Layout;
const { Title, Text } = Typography;

const PlayerMapPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<GraphNode[]>([]);
  const [filteredEdges, setFilteredEdges] = useState<GraphEdge[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PointOfInterest | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Функция для получения отфильтрованных узлов для карты игроков
  const getFilteredNodesForPlayers = useCallback((allNodes: GraphNode[], allEdges: GraphEdge[]) => {
    try {
      // Получаем данные о видимых локациях из localStorage
      const visibilityData = localStorage.getItem('location-visibility');
      let visibleLocationIds: string[] = [];
      
      if (visibilityData) {
        const parsed = JSON.parse(visibilityData);
        visibleLocationIds = parsed.visibleLocations || [];
      }
      
      console.log('PlayerMapPage - Видимые локации из localStorage:', visibleLocationIds);
      
      if (visibleLocationIds.length === 0) {
        // Если нет открытых локаций, возвращаем пустые массивы
        console.log('PlayerMapPage - Нет открытых локаций, показываем пустую карту');
        return { filteredNodes: [], filteredEdges: [] };
      }
      
      // Собираем ID регионов с видимыми локациями
      const regionsWithVisibleLocations = new Set<string>();
      allNodes.forEach(node => {
        if (node.type === 'locationNode' && visibleLocationIds.includes(node.id)) {
          if (node.parentId) {
            regionsWithVisibleLocations.add(node.parentId);
          }
        }
      });
      
      // Фильтруем узлы: показываем только видимые локации и их регионы
      const filtered = allNodes.filter(node => {
        if (node.type === 'locationNode') {
          return visibleLocationIds.includes(node.id);
        } else if (node.type === 'group') {
          return regionsWithVisibleLocations.has(node.id);
        }
        return false;
      });
      
      // Фильтруем рёбра: показываем только те, где оба узла видимы
      const visibleNodeIds = new Set(filtered.map(node => node.id));
      const filteredEdges = allEdges.filter(edge => {
        return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
      });
      
      console.log('PlayerMapPage - Отфильтрованные данные:', {
        totalNodes: allNodes.length,
        filteredNodes: filtered.length,
        totalEdges: allEdges.length,
        filteredEdges: filteredEdges.length,
        visibleRegions: Array.from(regionsWithVisibleLocations)
      });
      
      return { filteredNodes: filtered, filteredEdges: filteredEdges };
    } catch (error) {
      console.error('PlayerMapPage - Ошибка при фильтрации данных:', error);
      return { filteredNodes: [], filteredEdges: [] };
    }
  }, []);

  useEffect(() => {
    try {
      // Парсим данные для subflows структуры
      const { nodes: parsedNodes, edges: parsedEdges } = parseToSubflows(
        pointsData as PointsData, 
        pathsData as PathsData
      );
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      
      // Получаем отфильтрованные данные для карты игроков
      const { filteredNodes: filtered, filteredEdges: filteredEdges } = getFilteredNodesForPlayers(parsedNodes, parsedEdges);
      setFilteredNodes(filtered);
      setFilteredEdges(filteredEdges);
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных: ' + (err as Error).message);
      setLoading(false);
    }
  }, [getFilteredNodesForPlayers]);

  // Слушаем изменения в localStorage для автоматического обновления карты
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'location-visibility' && nodes.length > 0) {
        console.log('PlayerMapPage - Обнаружены изменения в localStorage, обновляем карту');
        const { filteredNodes: filtered, filteredEdges: filteredEdges } = getFilteredNodesForPlayers(nodes, edges);
        setFilteredNodes(filtered);
        setFilteredEdges(filteredEdges);
      }
    };

    // Слушаем изменения в других вкладках
    window.addEventListener('storage', handleStorageChange);
    
    // Слушаем изменения в текущей вкладке (если мастер изменил настройки)
    const handleCustomStorageChange = () => {
      if (nodes.length > 0) {
        console.log('PlayerMapPage - Обнаружены локальные изменения, обновляем карту');
        const { filteredNodes: filtered, filteredEdges: filteredEdges } = getFilteredNodesForPlayers(nodes, edges);
        setFilteredNodes(filtered);
        setFilteredEdges(filteredEdges);
      }
    };

    // Создаем кастомное событие для обновления карты
    window.addEventListener('update-player-map', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('update-player-map', handleCustomStorageChange);
    };
  }, [nodes, edges, getFilteredNodesForPlayers]);

  const handleLocationClick = (location: PointOfInterest, area: string) => {
    setSelectedLocation(location);
    setCurrentArea(area);
    setShowLocationModal(true);
  };

  const handleRegionClick = (areaName: string) => {
    // Для карты игроков просто показываем информацию о регионе
    console.log('Клик по региону:', areaName);
  };

  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setSelectedLocation(null);
    setCurrentArea('');
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Загрузка карты для игроков..." />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: 24 }}>
          <Alert
            message="Ошибка загрузки"
            description={error}
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Content style={{ padding: 24 }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={1}>
            <EyeOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            Карта для игроков
          </Title>
          
          <Card style={{ marginBottom: '16px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                <Text strong>Информация о карте</Text>
              </div>
              <Text type="secondary">
                Эта карта показывает только те регионы и локации, которые открыл мастер. 
                Используйте её для навигации по открытым территориям и планирования путешествий.
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 <strong>Подсказки:</strong> Нажмите на локацию для получения подробной информации, 
                  нажмите на регион для фокусировки на нём.
                </Text>
              </div>
            </Space>
          </Card>
        </div>

        {/* Карта мира для игроков */}
        {filteredNodes.length > 0 ? (
          <GroupedMindMap
            nodes={filteredNodes}
            edges={filteredEdges}
            pointsData={pointsData as PointsData}
            pathsData={pathsData as PathsData}
            onNodeClick={handleLocationClick}
            onRegionClick={handleRegionClick}
            showSavePosition={false}
            enableDragging={false}
            enableLocationVisibility={false}
            customTitle="🗺️ Карта мира для игроков"
            customSubtitle="Открытые локации и регионы"
            showGlobalTrackers={false}
            isPlayerMap={true}
          />
        ) : (
          <Card style={{ textAlign: 'center', padding: '48px' }}>
            <EyeOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={3} style={{ color: '#666' }}>
              Нет открытых локаций
            </Title>
            <Text type="secondary">
              Мастер еще не открыл ни одной локации для игроков. 
              Карта будет доступна, как только появятся открытые локации.
            </Text>
          </Card>
        )}

        {/* Модальное окно с информацией о локации */}
        {showLocationModal && selectedLocation && (
          <Card
            title={`📍 ${selectedLocation.name}`}
            extra={
              <button 
                onClick={handleCloseLocationModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            }
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              width: '80%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Регион:</Text> {currentArea}
            </div>
            
            {selectedLocation.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Теги:</Text>
                <div style={{ marginTop: '8px' }}>
                  {selectedLocation.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#f0f0f0',
                        padding: '4px 8px',
                        margin: '2px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedLocation.encounters.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Возможные встречи:</Text>
                <div style={{ marginTop: '8px' }}>
                  {selectedLocation.encounters.map((encounter, index) => (
                    <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                      <Text strong>{encounter.name}</Text> - {encounter.count} (уровень {encounter.level})
                      {encounter.notes && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{encounter.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLocation.clues.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Зацепки:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {selectedLocation.clues.map((clue, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{clue}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedLocation.loot.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Возможная добыча:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {selectedLocation.loot.map((item, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default PlayerMapPage; 