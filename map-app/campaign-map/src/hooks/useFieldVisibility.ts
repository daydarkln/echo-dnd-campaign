import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FieldVisibilityState, 
  LocationFieldVisibility, 
  RouteFieldVisibility, 
  VisibilityStatus,
  defaultLocationFieldVisibility,
  defaultRouteFieldVisibility
} from '../types/visibility';

const STORAGE_KEY = 'field-visibility';

export const useFieldVisibility = () => {
  const [visibility, setVisibility] = useState<FieldVisibilityState>({ 
    locations: {}, 
    routes: {} 
  });
  const visibilityRef = useRef(visibility);

  // Обновляем ref при изменении visibility
  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  // Загружаем сохраненные настройки видимости из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('useFieldVisibility - Загружаем из localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved) as FieldVisibilityState;
        setVisibility(parsed);
        console.log('useFieldVisibility - Парсим данные:', parsed);
      } else {
        console.log('useFieldVisibility - localStorage пуст, используем значения по умолчанию');
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки видимости полей:', error);
    }
  }, []);

  // Сохраняем настройки видимости в localStorage
  const saveVisibility = useCallback((newVisibility: FieldVisibilityState) => {
    try {
      console.log('useFieldVisibility - Сохраняем в localStorage:', newVisibility);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
    } catch (error) {
      console.error('Ошибка при сохранении настроек видимости полей:', error);
    }
  }, []);

  // Инициализируем видимость для новых локаций
  const initializeLocationFieldVisibility = useCallback((locationIds: string[]) => {
    console.log('useFieldVisibility - Инициализируем видимость полей для локаций:', locationIds);
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      locationIds.forEach(id => {
        if (!newVisibility.locations[id]) {
          newVisibility.locations[id] = { ...defaultLocationFieldVisibility };
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Инициализируем видимость для новых путей
  const initializeRouteFieldVisibility = useCallback((routeIds: string[]) => {
    console.log('useFieldVisibility - Инициализируем видимость полей для путей:', routeIds);
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      routeIds.forEach(id => {
        if (!newVisibility.routes[id]) {
          newVisibility.routes[id] = { ...defaultRouteFieldVisibility };
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Переключаем видимость поля локации
  const toggleLocationFieldVisibility = useCallback((
    locationId: string, 
    field: keyof LocationFieldVisibility
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.locations[locationId]) {
        newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
      }
      
      // Переключаем видимость
      const currentVisibility = newVisibility.locations[locationId][field];
      newVisibility.locations[locationId][field] = currentVisibility === 'visible' ? 'hidden' : 'visible';
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Переключаем видимость поля пути
  const toggleRouteFieldVisibility = useCallback((
    routeId: string, 
    field: keyof RouteFieldVisibility
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.routes[routeId]) {
        newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
      }
      
      // Переключаем видимость
      const currentVisibility = newVisibility.routes[routeId][field];
      newVisibility.routes[routeId][field] = currentVisibility === 'visible' ? 'hidden' : 'visible';
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Устанавливаем видимость поля локации
  const setLocationFieldVisibility = useCallback((
    locationId: string, 
    field: keyof LocationFieldVisibility,
    isVisible: VisibilityStatus
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.locations[locationId]) {
        newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
      }
      
      newVisibility.locations[locationId][field] = isVisible;
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Устанавливаем видимость поля пути
  const setRouteFieldVisibility = useCallback((
    routeId: string, 
    field: keyof RouteFieldVisibility,
    isVisible: VisibilityStatus
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.routes[routeId]) {
        newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
      }
      
      newVisibility.routes[routeId][field] = isVisible;
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Проверяем, видимо ли поле локации
  const isLocationFieldVisible = useCallback((
    locationId: string, 
    field: keyof LocationFieldVisibility
  ): boolean => {
    const locationVisibility = visibilityRef.current.locations[locationId];
    if (!locationVisibility) {
      return defaultLocationFieldVisibility[field] === 'visible';
    }
    return locationVisibility[field] === 'visible';
  }, []);

  // Проверяем, видимо ли поле пути
  const isRouteFieldVisible = useCallback((
    routeId: string, 
    field: keyof RouteFieldVisibility
  ): boolean => {
    const routeVisibility = visibilityRef.current.routes[routeId];
    if (!routeVisibility) {
      return defaultRouteFieldVisibility[field] === 'visible';
    }
    return routeVisibility[field] === 'visible';
  }, []);

  // Получаем настройки видимости для локации
  const getLocationFieldVisibility = useCallback((locationId: string): LocationFieldVisibility => {
    const locationVisibility = visibilityRef.current.locations[locationId];
    return locationVisibility || { ...defaultLocationFieldVisibility };
  }, []);

  // Получаем настройки видимости для пути
  const getRouteFieldVisibility = useCallback((routeId: string): RouteFieldVisibility => {
    const routeVisibility = visibilityRef.current.routes[routeId];
    return routeVisibility || { ...defaultRouteFieldVisibility };
  }, []);

  // Показать все поля для всех локаций
  const showAllLocationFields = useCallback((locationIds: string[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      locationIds.forEach(locationId => {
        if (!newVisibility.locations[locationId]) {
          newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
        }
        
        Object.keys(defaultLocationFieldVisibility).forEach(field => {
          const fieldKey = field as keyof LocationFieldVisibility;
          if (newVisibility.locations[locationId][fieldKey] !== 'visible') {
            newVisibility.locations[locationId][fieldKey] = 'visible';
            hasChanges = true;
          }
        });
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Скрыть все поля для всех локаций
  const hideAllLocationFields = useCallback((locationIds: string[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      locationIds.forEach(locationId => {
        if (!newVisibility.locations[locationId]) {
          newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
        }
        
        Object.keys(defaultLocationFieldVisibility).forEach(field => {
          const fieldKey = field as keyof LocationFieldVisibility;
          if (newVisibility.locations[locationId][fieldKey] !== 'hidden') {
            newVisibility.locations[locationId][fieldKey] = 'hidden';
            hasChanges = true;
          }
        });
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Показать все поля для всех путей
  const showAllRouteFields = useCallback((routeIds: string[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      routeIds.forEach(routeId => {
        if (!newVisibility.routes[routeId]) {
          newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
        }
        
        Object.keys(defaultRouteFieldVisibility).forEach(field => {
          const fieldKey = field as keyof RouteFieldVisibility;
          if (newVisibility.routes[routeId][fieldKey] !== 'visible') {
            newVisibility.routes[routeId][fieldKey] = 'visible';
            hasChanges = true;
          }
        });
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Скрыть все поля для всех путей
  const hideAllRouteFields = useCallback((routeIds: string[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      routeIds.forEach(routeId => {
        if (!newVisibility.routes[routeId]) {
          newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
        }
        
        Object.keys(defaultRouteFieldVisibility).forEach(field => {
          const fieldKey = field as keyof RouteFieldVisibility;
          if (newVisibility.routes[routeId][fieldKey] !== 'hidden') {
            newVisibility.routes[routeId][fieldKey] = 'hidden';
            hasChanges = true;
          }
        });
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Получаем текущее состояние видимости
  const getCurrentFieldVisibility = useCallback(() => {
    return visibilityRef.current;
  }, []);

  return {
    visibility,
    initializeLocationFieldVisibility,
    initializeRouteFieldVisibility,
    toggleLocationFieldVisibility,
    toggleRouteFieldVisibility,
    setLocationFieldVisibility,
    setRouteFieldVisibility,
    isLocationFieldVisible,
    isRouteFieldVisible,
    getLocationFieldVisibility,
    getRouteFieldVisibility,
    showAllLocationFields,
    hideAllLocationFields,
    showAllRouteFields,
    hideAllRouteFields,
    getCurrentFieldVisibility
  };
};