import React, { useState, useEffect } from 'react';
import { Layout, Spin, Alert, FloatButton, Modal, Tabs, App as AntdApp, ConfigProvider } from 'antd';
import { TeamOutlined, PartitionOutlined, DashboardOutlined, UserOutlined, FileTextOutlined, ThunderboltOutlined } from '@ant-design/icons';
import TrackersPage from './pages/TrackersPage';
import PlayerMapPage from './pages/PlayerMapPage';
import { CharacterPage } from './pages/CharacterPage';
import InitiativeTrackerPage from './pages/InitiativeTrackerPage';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import GroupedMindMap from './components/GroupedMindMap';
import RegionFocusedMap from './components/RegionFocusedMap';
import LocationDetail from './components/LocationDetail';
import PlayerLocationDetail from './components/PlayerLocationDetail';
import PlayerMap from './components/PlayerMap';
import { GroupManager } from './components/GroupManager';
import { PointsData, PathsData, PointOfInterest, GraphNode, GraphEdge } from './types';
import { parseToSubflows } from './utils/dataParser';
import pointsData from './tochki-interesa.json';
import pathsData from './puti-mezhdu-lokaciyami.json';
import { useFieldVisibility } from './hooks/useFieldVisibility';
import 'antd/dist/reset.css';
import './App.css';

const { Content } = Layout;

type ViewState = 'mindmap' | 'detail' | 'region';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('mindmap');
  const [selectedLocation, setSelectedLocation] = useState<PointOfInterest | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('');
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('map');
  const navigate = useNavigate();
  const location = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Хук для управления видимостью полей
  const {
    getLocationFieldVisibility,
    getRouteFieldVisibility,
    initializeLocationFieldVisibility,
    initializeRouteFieldVisibility,
    toggleLocationItemVisibility,
    toggleRouteItemVisibility,
    toggleRouteNotesVisibility,
    isLocationItemVisible,
    isRouteItemVisible,
    isRouteNotesVisible
  } = useFieldVisibility();

  useEffect(() => {
    try {
      // Парсим данные для subflows структуры
      const { nodes: parsedNodes, edges: parsedEdges } = parseToSubflows(
        pointsData as PointsData, 
        pathsData as PathsData
      );
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      
      // Инициализируем видимость полей
      const allLocations: PointOfInterest[] = [];
      (pointsData as PointsData).areas.forEach(area => {
        allLocations.push(...area.pointsOfInterest);
      });
      
      const allRoutes = (pathsData as PathsData).routes;
      
      initializeLocationFieldVisibility(allLocations);
      initializeRouteFieldVisibility(allRoutes);
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных: ' + (err as Error).message);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Удаляем зависимости чтобы избежать бесконечного цикла

  const handleLocationClick = (location: PointOfInterest, area: string) => {
    setSelectedLocation(location);
    setCurrentArea(area);
    setShowLocationModal(true);
  };

  const handleBackToMindMap = () => {
    setCurrentView('mindmap');
    setSelectedLocation(null);
    setCurrentArea('');
    setFocusedRegion(null);
    setShowLocationModal(false);
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Загрузка карты локаций..." />
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

  const renderMapView = () => {
    switch (currentView) {
      case 'mindmap':
        return (
          <GroupedMindMap
            nodes={nodes}
            edges={edges}
            pointsData={pointsData as PointsData}
            pathsData={pathsData as PathsData}
            onNodeClick={handleLocationClick}
            onRegionClick={(areaName) => { setFocusedRegion(areaName); setCurrentView('region'); }}
            enableDragging={true}
          />
        );
      
      case 'region':
        return focusedRegion ? (
          <RegionFocusedMap
            areaName={focusedRegion}
            pointsData={pointsData as PointsData}
            pathsData={pathsData as PathsData}
            onBack={handleBackToMindMap}
            onNodeClick={handleLocationClick}
            enableDragging={true}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <AntdApp>
      <ConfigProvider componentSize='small'>

      <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <Content style={{ padding: 24 }}>
          <Tabs
            activeKey={location.pathname.startsWith('/groups') ? 'groups' : location.pathname.startsWith('/trackers') ? 'trackers' : location.pathname.startsWith('/initiative') ? 'initiative' : location.pathname.startsWith('/player-map') ? 'player-map' : location.pathname.startsWith('/character') ? 'character' : 'map'}
            onChange={(key) => {
              setActiveTab(key);
              navigate(key === 'groups' ? '/groups' : key === 'trackers' ? '/trackers' : key === 'initiative' ? '/initiative' : key === 'player-map' ? '/player-map' : key === 'character' ? '/character' : '/');
            }}
            items={[
              {
                key: 'map',
                label: (
                  <span>
                    <PartitionOutlined /> Карта
                  </span>
                ),
              },
              {
                key: 'groups',
                label: (
                  <span>
                    <TeamOutlined /> Группы
                  </span>
                ),
              },
              {
                key: 'trackers',
                label: (
                  <span>
                    <DashboardOutlined /> Трекеры
                  </span>
                ),
              },
              {
                key: 'initiative',
                label: (
                  <span>
                    <ThunderboltOutlined /> Инициатива
                  </span>
                ),
              },
              {
                key: 'player-map',
                label: (
                  <span>
                    <UserOutlined /> Карта для игроков
                  </span>
                ),
              },
            ]}
          />

          <Routes>
            <Route
              path="/"
              element={
                <>
                  {renderMapView()}
                  <FloatButton
                    icon={<TeamOutlined />}
                    tooltip="Управление группами"
                    onClick={() => navigate('/groups')}
                    style={{ right: 24, bottom: 24 }}
                  />
                </>
              }
            />
            <Route
              path="/groups"
              element={
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                  <GroupManager visible={true} onClose={() => {}} asPanel />
                </div>
              }
            />
            <Route
              path="/trackers"
              element={<TrackersPage />}
            />
            <Route
              path="/initiative"
              element={<InitiativeTrackerPage />}
            />
            <Route
              path="/player-map"
              element={<PlayerMapPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>

        {/* Модальное окно управления группами (для плавающей кнопки на вкладке Карта) */}
        <GroupManager 
          visible={showGroupManager} 
          onClose={() => setShowGroupManager(false)} 
        />

        {/* Модальное окно с информацией о локации */}
        <Modal
          title="📍 Информация о локации"
          open={showLocationModal}
          onCancel={handleBackToMindMap}
          footer={null}
          width={1000}
          style={{ top: 20 }}
        >
          {selectedLocation && (
            location.pathname.startsWith('/player-map') ? (
              <PlayerLocationDetail
                location={selectedLocation}
                area={currentArea}
                onBack={handleBackToMindMap}
                isModal={true}
                getLocationFieldVisibility={getLocationFieldVisibility}
              />
            ) : (
              <LocationDetail
                location={selectedLocation}
                area={currentArea}
                onBack={handleBackToMindMap}
                isModal={true}
                getLocationFieldVisibility={getLocationFieldVisibility}
                toggleLocationItemVisibility={toggleLocationItemVisibility}
                isLocationItemVisible={isLocationItemVisible}
              />
            )
          )}
        </Modal>
    
      </ConfigProvider>
    </AntdApp>
  );
}

export default App;