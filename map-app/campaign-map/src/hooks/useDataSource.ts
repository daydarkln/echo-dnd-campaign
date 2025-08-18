import { useState, useEffect, useMemo } from 'react';
import { PointsData, PathsData, GraphNode, GraphEdge } from '../types';
import { parseToSubflows } from '../utils/dataParser';
import { useCampaignMapData } from './useApiData';

// Импорт статических данных как fallback
import pointsData from '../tochki-interesa.json';
import pathsData from '../puti-mezhdu-lokaciyami.json';

export type DataSource = 'api' | 'static';

interface UseDataSourceOptions {
  source?: DataSource;
  enableFallback?: boolean; // Если API недоступен, использовать статические данные
}

interface DataSourceState {
  loading: boolean;
  error: string | null;
  source: DataSource;
  pointsData: PointsData | null;
  pathsData: PathsData | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useDataSource(options: UseDataSourceOptions = {}) {
  const { source = 'static', enableFallback = true } = options;
  
  const [currentSource, setCurrentSource] = useState<DataSource>(source);
  const [state, setState] = useState<DataSourceState>({
    loading: true,
    error: null,
    source: currentSource,
    pointsData: null,
    pathsData: null,
    nodes: [],
    edges: []
  });

  // Хук для API данных
  const apiData = useCampaignMapData();

  // Статические данные
  const staticData = useMemo(() => ({
    pointsData: pointsData as PointsData,
    pathsData: pathsData as PathsData
  }), []);

  // Обработка данных в зависимости от источника
  useEffect(() => {
    async function processData() {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        let finalPointsData: PointsData | null = null;
        let finalPathsData: PathsData | null = null;
        let actualSource = currentSource;

        if (currentSource === 'api') {
          if (apiData.loading) {
            // Ждем загрузки API данных
            return;
          }

          if (apiData.error) {
            if (enableFallback) {
              console.warn('API недоступен, используем статические данные:', apiData.error);
              finalPointsData = staticData.pointsData;
              finalPathsData = staticData.pathsData;
              actualSource = 'static';
            } else {
              setState(prev => ({
                ...prev,
                loading: false,
                error: apiData.error,
                source: actualSource
              }));
              return;
            }
          } else {
            finalPointsData = apiData.legacyData.pointsData;
            finalPathsData = apiData.legacyData.pathsData;
          }
        } else {
          // Используем статические данные
          finalPointsData = staticData.pointsData;
          finalPathsData = staticData.pathsData;
        }

        if (!finalPointsData || !finalPathsData) {
          throw new Error('Не удалось загрузить данные');
        }

        // Парсим данные в граф
        const { nodes, edges } = parseToSubflows(finalPointsData, finalPathsData);

        setState({
          loading: false,
          error: null,
          source: actualSource,
          pointsData: finalPointsData,
          pathsData: finalPathsData,
          nodes,
          edges
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          source: currentSource
        }));
      }
    }

    processData();
  }, [currentSource, apiData.loading, apiData.error, apiData.legacyData, staticData, enableFallback]);

  // Функции для управления источником данных
  const switchToApi = () => setCurrentSource('api');
  const switchToStatic = () => setCurrentSource('static');
  
  const refetch = () => {
    if (currentSource === 'api') {
      apiData.refetch();
    }
    // Для статических данных рефетч не нужен
  };

  // API для управления видимостью (только для API источника)
  const visibilityApi = currentSource === 'api' ? {
    updatePointOfInterest: apiData.points.updatePoint,
    updateRoute: apiData.routes.updateRoute,
    createPointOfInterest: apiData.points.createPoint,
    createRoute: apiData.routes.createRoute,
    deletePointOfInterest: apiData.points.deletePoint,
    deleteRoute: apiData.routes.deleteRoute
  } : null;

  return {
    ...state,
    refetch,
    switchToApi,
    switchToStatic,
    visibilityApi,
    // Информация о доступности API
    apiAvailable: !apiData.error,
    apiLoading: apiData.loading
  };
}

// Хук для проверки доступности API
export function useApiHealth() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:3001/health');
        setAvailable(response.ok);
      } catch {
        setAvailable(false);
      } finally {
        setChecking(false);
      }
    }

    checkApi();
  }, []);

  return { available, checking };
}

// Утилита для автоматического выбора источника данных
export function useAutoDataSource(): DataSource {
  const { available, checking } = useApiHealth();
  
  if (checking || available === null) {
    return 'static'; // По умолчанию используем статические данные
  }
  
  return available ? 'api' : 'static';
}