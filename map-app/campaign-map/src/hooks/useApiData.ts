import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../api/client';
import {
  VisiblePointOfInterest,
  VisibleArea,
  VisibleRoute,
  LocationFilter,
  RouteFilter,
  UpdateVisibilityRequest
} from '../types/api';
import { getVisibleFields } from '../types/visibility';
import { PointOfInterest, Route, Area, PointsData, PathsData } from '../types';

// Состояние загрузки
interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Хук для работы с точками интереса
export function usePointsOfInterest(filter?: LocationFilter) {
  const [data, setData] = useState<VisiblePointOfInterest[]>([]);
  const [state, setState] = useState<LoadingState>({ loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const points = await apiClient.locations.getPointsOfInterest(filter);
      setData(points);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Ошибка при загрузке точек интереса';
      setState({ loading: false, error: errorMessage });
      return;
    }
    setState({ loading: false, error: null });
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createPoint = useCallback(async (point: Omit<VisiblePointOfInterest, 'id'>) => {
    try {
      const newPoint = await apiClient.locations.createPointOfInterest(point);
      setData(prev => [...prev, newPoint]);
      return newPoint;
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при создании точки интереса');
    }
  }, []);

  const updatePoint = useCallback(async (id: string, point: Partial<VisiblePointOfInterest>) => {
    try {
      const updatedPoint = await apiClient.locations.updatePointOfInterest(id, point);
      setData(prev => prev.map(p => p.id === id ? updatedPoint : p));
      return updatedPoint;
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при обновлении точки интереса');
    }
  }, []);

  const deletePoint = useCallback(async (id: string) => {
    try {
      await apiClient.locations.deletePointOfInterest(id);
      setData(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при удалении точки интереса');
    }
  }, []);

  // Получить только видимые поля для совместимости со старым API
  const visibleData = data.map(point => getVisibleFields(point) as PointOfInterest);

  return {
    data,
    visibleData,
    ...state,
    refetch: fetchData,
    createPoint,
    updatePoint,
    deletePoint
  };
}

// Хук для работы с областями
export function useAreas() {
  const [data, setData] = useState<VisibleArea[]>([]);
  const [state, setState] = useState<LoadingState>({ loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const areas = await apiClient.locations.getAreas();
      setData(areas);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Ошибка при загрузке областей';
      setState({ loading: false, error: errorMessage });
      return;
    }
    setState({ loading: false, error: null });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createArea = useCallback(async (area: Omit<VisibleArea, 'id'>) => {
    try {
      const newArea = await apiClient.locations.createArea(area);
      setData(prev => [...prev, newArea]);
      return newArea;
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при создании области');
    }
  }, []);

  const updateArea = useCallback(async (id: string, area: Partial<VisibleArea>) => {
    try {
      const updatedArea = await apiClient.locations.updateArea(id, area);
      setData(prev => prev.map(a => a.id === id ? updatedArea : a));
      return updatedArea;
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при обновлении области');
    }
  }, []);

  const deleteArea = useCallback(async (id: string) => {
    try {
      await apiClient.locations.deleteArea(id);
      setData(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при удалении области');
    }
  }, []);

  return {
    data,
    ...state,
    refetch: fetchData,
    createArea,
    updateArea,
    deleteArea
  };
}

// Хук для работы с маршрутами
export function useRoutes(filter?: RouteFilter) {
  const [data, setData] = useState<VisibleRoute[]>([]);
  const [state, setState] = useState<LoadingState>({ loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const routes = await apiClient.routes.getRoutes(filter);
      setData(routes);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Ошибка при загрузке маршрутов';
      setState({ loading: false, error: errorMessage });
      return;
    }
    setState({ loading: false, error: null });
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createRoute = useCallback(async (route: Omit<VisibleRoute, 'id'>) => {
    try {
      const newRoute = await apiClient.routes.createRoute(route);
      setData(prev => [...prev, newRoute]);
      return newRoute;
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при создании маршрута');
    }
  }, []);

  const updateRoute = useCallback(async (id: string, route: Partial<VisibleRoute>) => {
    try {
      const updatedRoute = await apiClient.routes.updateRoute(id, route);
      setData(prev => prev.map(r => r.id === id ? updatedRoute : r));
      return updatedRoute;
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при обновлении маршрута');
    }
  }, []);

  const deleteRoute = useCallback(async (id: string) => {
    try {
      await apiClient.routes.deleteRoute(id);
      setData(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      throw error instanceof ApiError ? error : new Error('Ошибка при удалении маршрута');
    }
  }, []);

  // Получить только видимые поля для совместимости со старым API
  const visibleData = data.map(route => getVisibleFields(route) as Route);

  return {
    data,
    visibleData,
    ...state,
    refetch: fetchData,
    createRoute,
    updateRoute,
    deleteRoute
  };
}

// Хук для работы с видимостью
export function useVisibility() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFieldVisibility = useCallback(async (request: UpdateVisibilityRequest) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.visibility.updateFieldVisibility(request);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Ошибка при обновлении видимости';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateVisibility = useCallback(async (updates: UpdateVisibilityRequest[]) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.visibility.bulkUpdateVisibility({ updates });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Ошибка при массовом обновлении видимости';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    updateFieldVisibility,
    bulkUpdateVisibility
  };
}

// Комбинированный хук для получения всех данных карты
export function useCampaignMapData() {
  const pointsQuery = usePointsOfInterest();
  const areasQuery = useAreas();
  const routesQuery = useRoutes();

  const [legacyData, setLegacyData] = useState<{
    pointsData: PointsData | null;
    pathsData: PathsData | null;
  }>({ pointsData: null, pathsData: null });

  // Преобразование в формат старого API для совместимости
  useEffect(() => {
    if (!pointsQuery.loading && !areasQuery.loading && !routesQuery.loading) {
      // Создаем структуру областей с точками интереса
      const areas: Area[] = areasQuery.data.map(area => {
        const areaName = area.area.visibility === 'visible' ? area.area.value : '';
        const pointIds = area.pointsOfInterest.visibility === 'visible' 
          ? area.pointsOfInterest.value 
          : [];
        
        const areaPoints = pointsQuery.visibleData.filter(point => 
          pointIds.includes(point.id)
        );

        return {
          area: areaName,
          pointsOfInterest: areaPoints
        };
      });

      const pointsData: PointsData = {
        schemaVersion: 2,
        notes: 'Данные загружены из API',
        areas
      };

      const pathsData: PathsData = {
        schemaVersion: 2,
        notes: 'Данные загружены из API',
        pathTypes: {}, // TODO: загрузить из API
        routes: routesQuery.visibleData
      };

      setLegacyData({ pointsData, pathsData });
    }
  }, [pointsQuery.loading, areasQuery.loading, routesQuery.loading, pointsQuery.visibleData, areasQuery.data, routesQuery.visibleData]);

  const loading = pointsQuery.loading || areasQuery.loading || routesQuery.loading;
  const error = pointsQuery.error || areasQuery.error || routesQuery.error;

  const refetch = useCallback(() => {
    pointsQuery.refetch();
    areasQuery.refetch();
    routesQuery.refetch();
  }, [pointsQuery.refetch, areasQuery.refetch, routesQuery.refetch]);

  return {
    loading,
    error,
    refetch,
    // Новые данные с поддержкой видимости
    points: pointsQuery,
    areas: areasQuery,
    routes: routesQuery,
    // Данные в формате старого API для совместимости
    legacyData
  };
}