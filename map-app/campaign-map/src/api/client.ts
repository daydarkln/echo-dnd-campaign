import {
  VisiblePointOfInterest,
  VisibleArea,
  ApiPointsData,
  VisibleRoute,
  ApiPathTypes,
  ApiPathsData,
  ApiResponse,
  PaginatedResponse,
  UpdateVisibilityRequest,
  BulkUpdateVisibilityRequest,
  LocationFilter,
  RouteFilter,
  VisibilityFilter
} from '../types/api';

// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Базовый класс для работы с API
class BaseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return this.request(url.pathname + url.search);
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// API для работы с точками интереса
class LocationsApi extends BaseApiClient {
  // Получить все точки интереса
  async getPointsOfInterest(filter?: LocationFilter): Promise<VisiblePointOfInterest[]> {
    return this.get('/points-of-interest', filter);
  }

  // Получить точку интереса по ID
  async getPointOfInterest(id: string): Promise<VisiblePointOfInterest> {
    return this.get(`/points-of-interest/${id}`);
  }

  // Создать новую точку интереса
  async createPointOfInterest(poi: Omit<VisiblePointOfInterest, 'id'>): Promise<VisiblePointOfInterest> {
    return this.post('/points-of-interest', poi);
  }

  // Обновить точку интереса
  async updatePointOfInterest(id: string, poi: Partial<VisiblePointOfInterest>): Promise<VisiblePointOfInterest> {
    return this.put(`/points-of-interest/${id}`, poi);
  }

  // Удалить точку интереса
  async deletePointOfInterest(id: string): Promise<void> {
    return this.delete(`/points-of-interest/${id}`);
  }

  // Получить все области
  async getAreas(filter?: VisibilityFilter): Promise<VisibleArea[]> {
    return this.get('/areas', filter);
  }

  // Получить область по ID
  async getArea(id: string): Promise<VisibleArea> {
    return this.get(`/areas/${id}`);
  }

  // Создать новую область
  async createArea(area: Omit<VisibleArea, 'id'>): Promise<VisibleArea> {
    return this.post('/areas', area);
  }

  // Обновить область
  async updateArea(id: string, area: Partial<VisibleArea>): Promise<VisibleArea> {
    return this.put(`/areas/${id}`, area);
  }

  // Удалить область
  async deleteArea(id: string): Promise<void> {
    return this.delete(`/areas/${id}`);
  }

  // Получить конфигурацию точек интереса
  async getPointsData(): Promise<ApiPointsData> {
    return this.get('/points-data/main');
  }

  // Обновить конфигурацию точек интереса
  async updatePointsData(data: Partial<ApiPointsData>): Promise<ApiPointsData> {
    return this.put('/points-data/main', data);
  }
}

// API для работы с путями
class RoutesApi extends BaseApiClient {
  // Получить все маршруты
  async getRoutes(filter?: RouteFilter): Promise<VisibleRoute[]> {
    return this.get('/routes', filter);
  }

  // Получить маршрут по ID
  async getRoute(id: string): Promise<VisibleRoute> {
    return this.get(`/routes/${id}`);
  }

  // Создать новый маршрут
  async createRoute(route: Omit<VisibleRoute, 'id'>): Promise<VisibleRoute> {
    return this.post('/routes', route);
  }

  // Обновить маршрут
  async updateRoute(id: string, route: Partial<VisibleRoute>): Promise<VisibleRoute> {
    return this.put(`/routes/${id}`, route);
  }

  // Удалить маршрут
  async deleteRoute(id: string): Promise<void> {
    return this.delete(`/routes/${id}`);
  }

  // Получить типы путей
  async getPathTypes(): Promise<ApiPathTypes> {
    return this.get('/path-types/main');
  }

  // Обновить типы путей
  async updatePathTypes(pathTypes: Partial<ApiPathTypes>): Promise<ApiPathTypes> {
    return this.put('/path-types/main', pathTypes);
  }

  // Получить конфигурацию путей
  async getPathsData(): Promise<ApiPathsData> {
    return this.get('/paths-data/main');
  }

  // Обновить конфигурацию путей
  async updatePathsData(data: Partial<ApiPathsData>): Promise<ApiPathsData> {
    return this.put('/paths-data/main', data);
  }
}

// API для управления видимостью
class VisibilityApi extends BaseApiClient {
  // Обновить видимость поля
  async updateFieldVisibility(request: UpdateVisibilityRequest): Promise<ApiResponse<void>> {
    return this.patch('/visibility/field', request);
  }

  // Массовое обновление видимости
  async bulkUpdateVisibility(request: BulkUpdateVisibilityRequest): Promise<ApiResponse<void>> {
    return this.patch('/visibility/bulk', request);
  }

  // Получить статистику видимости
  async getVisibilityStats(): Promise<{
    totalFields: number;
    visibleFields: number;
    hiddenFields: number;
    byEntity: Record<string, { visible: number; hidden: number }>;
  }> {
    return this.get('/visibility/stats');
  }
}

// Главный API клиент
export class CampaignMapApi {
  public locations: LocationsApi;
  public routes: RoutesApi;
  public visibility: VisibilityApi;

  constructor(baseUrl?: string) {
    this.locations = new LocationsApi(baseUrl);
    this.routes = new RoutesApi(baseUrl);
    this.visibility = new VisibilityApi(baseUrl);
  }
}

// Экспорт синглтона
export const apiClient = new CampaignMapApi();

// Экспорт типов ошибок
export { ApiError };