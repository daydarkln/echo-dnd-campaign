import React, { useState, useEffect, createContext, useContext } from 'react';
import { Layout, Spin, Alert, FloatButton, Modal, Tabs, App as AntdApp, ConfigProvider } from 'antd';
import { TeamOutlined, PartitionOutlined, DashboardOutlined, UserOutlined, FileTextOutlined, ThunderboltOutlined, ReadOutlined } from '@ant-design/icons';
import TrackersPage from './pages/TrackersPage';
import PlayerMapPage from './pages/PlayerMapPage';
import { CharacterPage } from './pages/CharacterPage';
import InitiativeTrackerPage from './pages/InitiativeTrackerPage';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import QuestsPage from './pages/QuestsPage';
import GroupedMindMap from './components/GroupedMindMap';
import RegionFocusedMap from './components/RegionFocusedMap';
import LocationDetail from './components/LocationDetail';
import PlayerLocationDetail from './components/PlayerLocationDetail';
import PlayerMap from './components/PlayerMap';
import { GroupManager } from './components/GroupManager';

import VolumeControlPanel from './components/VolumeControlPanel';
import { WeatherTimeController } from './components/WeatherTimeController';
import GameModeToggle from './components/GameModeToggle';
import GameModeView from './components/GameModeView';
import { PointsData, PathsData, PointOfInterest, GraphNode, GraphEdge } from './types';
import { parseToSubflows } from './utils/dataParser';
import pointsData from './tochki-interesa.json';
import pathsData from './puti-mezhdu-lokaciyami.json';
import { useFieldVisibility } from './hooks/useFieldVisibility';
import { useAudioManager } from './hooks/useAudioManager';
import { GameModeProvider, useGameMode } from './contexts/GameModeContext';
import 'antd/dist/reset.css';
import './App.css';

const { Content } = Layout;

// Создаем контекст для аудио
const AudioContext = createContext<ReturnType<typeof useAudioManager> | null>(null);

// Хук для использования аудио в компонентах
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

type ViewState = 'mindmap' | 'detail' | 'region';

// Внутренний компонент, который использует хук useGameMode
function AppContent() {
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
    setLocationItemVisibility,
    toggleRouteItemVisibility,
    toggleRouteNotesVisibility,
    isLocationItemVisible,
    isRouteItemVisible,
    isRouteNotesVisible
  } = useFieldVisibility();

  // Аудио менеджер - теперь глобальный
  const audioManager = useAudioManager();

  // Хук для управления режимом игры
  const { isGameMode, isPlanningMode } = useGameMode();

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

  // Если включен режим игры, показываем упрощенный интерфейс
  if (isGameMode) {
    return (
      <AudioContext.Provider value={audioManager}>
        <ConfigProvider componentSize='small'>
          <AntdApp>
            <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
              <GameModeToggle />
              <Content>
                <GameModeView />
              </Content>
            </Layout>
            
            {/* Громкость и погода/время управляются из виджетов GameModeView */}
          </AntdApp>
        </ConfigProvider>
      </AudioContext.Provider>
    );
  }

  const renderMapView = () => {
    if (currentView === 'mindmap') {
      return (
        <div style={{ position: 'relative' }}>
          <GroupedMindMap
            nodes={nodes}
            edges={edges}
            pointsData={pointsData as PointsData}
            pathsData={pathsData as PathsData}
            onNodeClick={handleLocationClick}
            onRegionClick={(areaName) => { setFocusedRegion(areaName); setCurrentView('region'); }}
            enableDragging={true}
          />
        </div>
      );
    } else if (currentView === 'detail' && selectedLocation) {
      return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <LocationDetail
            location={selectedLocation}
            area={currentArea}
            onBack={handleBackToMindMap}
            fieldVisibility={getLocationFieldVisibility(selectedLocation.id)}
            getLocationFieldVisibility={getLocationFieldVisibility}
            toggleLocationItemVisibility={toggleLocationItemVisibility}
            setLocationItemVisibility={setLocationItemVisibility}
            isLocationItemVisible={isLocationItemVisible}
          />
        </div>
      );
    } else if (currentView === 'region' && focusedRegion) {
      return (
        <div style={{ position: 'relative' }}>
          <RegionFocusedMap
            areaName={focusedRegion}
            pointsData={pointsData as PointsData}
            pathsData={pathsData as PathsData}
            onNodeClick={handleLocationClick}
            onBack={handleBackToMindMap}
            enableDragging={true}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <AudioContext.Provider value={audioManager}>
      <AntdApp>
        <ConfigProvider componentSize='small'>

        <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
          <GameModeToggle />
          <Content style={{ padding: 24 }}>
            <Tabs
              activeKey={
                location.pathname.startsWith('/groups') ? 'groups'
                : location.pathname.startsWith('/trackers') ? 'trackers'
                : location.pathname.startsWith('/initiative') ? 'initiative'
                : location.pathname.startsWith('/player-map') ? 'player-map'
                : location.pathname.startsWith('/character') ? 'character'
                : location.pathname.startsWith('/quests') ? 'quests'
                : 'map'
              }
              onChange={(key) => {
                setActiveTab(key);
                navigate(
                  key === 'groups' ? '/groups'
                  : key === 'trackers' ? '/trackers'
                  : key === 'initiative' ? '/initiative'
                  : key === 'player-map' ? '/player-map'
                  : key === 'character' ? '/character'
                  : key === 'quests' ? '/quests'
                  : '/'
                );
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
                {
                  key: 'quests',
                  label: (
                    <span>
                      <ReadOutlined /> Квесты
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
              <Route
                path="/quests"
                element={<QuestsPage />}
              />
              <Route
                path="/quests/:id"
                element={<QuestsPage />}
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
                  fieldVisibility={getLocationFieldVisibility(selectedLocation.id)}
                  getLocationFieldVisibility={getLocationFieldVisibility}
                  toggleLocationItemVisibility={toggleLocationItemVisibility}
                  setLocationItemVisibility={setLocationItemVisibility}
                  isLocationItemVisible={isLocationItemVisible}
                />
              )
            )}
          </Modal>

          {/* Панель управления громкостью - доступна на всех страницах */}
          <VolumeControlPanel />
          
          {/* Контроллер погоды и времени суток - доступен на всех страницах */}
          <WeatherTimeController />
      
        </ConfigProvider>
      </AntdApp>
    </AudioContext.Provider>
  );
}

// Основная функция App, которая оборачивает AppContent в GameModeProvider
function App() {
  return (
    <GameModeProvider>
      <AppContent />
    </GameModeProvider>
  );
}

export default App;