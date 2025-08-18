import { PointOfInterest, Area, PointsData, Route, PathsData } from '../types';
import { WithVisibility, VisibilityStatus } from './visibility';

// Типы для API с поддержкой видимости

// Точка интереса с видимостью
export type VisiblePointOfInterest = WithVisibility<PointOfInterest>;

// Область с видимостью
export interface VisibleArea {
  id: string;
  area: {
    value: string;
    visibility: VisibilityStatus;
  };
  pointsOfInterest: {
    value: string[]; // массив ID точек интереса
    visibility: VisibilityStatus;
  };
}

// Данные точек интереса для API
export interface ApiPointsData {
  id: string;
  schemaVersion: {
    value: number;
    visibility: VisibilityStatus;
  };
  notes: {
    value: string;
    visibility: VisibilityStatus;
  };
  areas: {
    value: string[]; // массив ID областей
    visibility: VisibilityStatus;
  };
}

// Маршрут с видимостью
export type VisibleRoute = WithVisibility<Route>;

// Типы путей для API
export interface ApiPathTypes {
  id: string;
  pathTypes: {
    value: Record<string, string>;
    visibility: VisibilityStatus;
  };
}

// Данные путей для API
export interface ApiPathsData {
  id: string;
  schemaVersion: {
    value: number;
    visibility: VisibilityStatus;
  };
  notes: {
    value: string;
    visibility: VisibilityStatus;
  };
  pathTypes: {
    value: string; // ID записи ApiPathTypes
    visibility: VisibilityStatus;
  };
  routes: {
    value: string[]; // массив ID маршрутов
    visibility: VisibilityStatus;
  };
}

// Конфигурация видимости для новых объектов
export interface VisibilityConfig {
  defaultVisibility: VisibilityStatus;
  fieldOverrides?: Record<string, VisibilityStatus>;
}

// Запросы для обновления видимости
export interface UpdateVisibilityRequest {
  id: string;
  field: string;
  visibility: VisibilityStatus;
}

export interface BulkUpdateVisibilityRequest {
  updates: UpdateVisibilityRequest[];
}

// Ответы API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

// Фильтры для запросов
export interface VisibilityFilter {
  includeHidden?: boolean;
  onlyVisible?: boolean;
  fields?: string[];
}

export interface LocationFilter extends VisibilityFilter {
  area?: string;
  tags?: string[];
  hasEncounters?: boolean;
  hasLoot?: boolean;
  hasClues?: boolean;
}

export interface RouteFilter extends VisibilityFilter {
  from?: string;
  to?: string;
  pathType?: string;
  maxTravelTime?: string;
  hasObstacles?: boolean;
  hasRequirements?: boolean;
}