import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FieldVisibilityState, 
  LocationFieldVisibility, 
  RouteFieldVisibility, 
  VisibilityStatus,
  defaultLocationFieldVisibility,
  defaultRouteFieldVisibility,
  createDefaultLocationFieldVisibility,
  createDefaultRouteFieldVisibility
} from '../types/visibility';
import { PointOfInterest, Route } from '../types';

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

  // Слушаем изменения localStorage и кастомные события для синхронизации между вкладками/компонентами
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key !== STORAGE_KEY) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as FieldVisibilityState;
          setVisibility(parsed);
        }
      } catch {}
    };
    const handleCustom = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as FieldVisibilityState;
          setVisibility(parsed);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('field-visibility-updated', handleCustom as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('field-visibility-updated', handleCustom as EventListener);
    };
  }, []);

  // Сохраняем настройки видимости в localStorage
  const saveVisibility = useCallback((newVisibility: FieldVisibilityState) => {
    try {
      console.log('useFieldVisibility - Сохраняем в localStorage:', newVisibility);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
      // Уведомляем игрока/другие вкладки о том, что состояние обновилось
      try {
        window.dispatchEvent(new Event('field-visibility-updated'));
      } catch {}
    } catch (error) {
      console.error('Ошибка при сохранении настроек видимости полей:', error);
    }
  }, []);

  // Инициализируем видимость для новых локаций
  const initializeLocationFieldVisibility = useCallback((locations: PointOfInterest[]) => {
    console.log('useFieldVisibility - Инициализируем видимость полей для локаций:', locations.map(l => l.id));
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      locations.forEach(location => {
        if (!newVisibility.locations[location.id]) {
          newVisibility.locations[location.id] = createDefaultLocationFieldVisibility(location);
          hasChanges = true;
        } else {
          // Обновляем существующую видимость для новых элементов
          const currentVisibility = newVisibility.locations[location.id];
          const defaultVisibility = createDefaultLocationFieldVisibility(location);
          
          // Проверяем каждое поле и добавляем новые элементы
          (['amplifiers', 'dampeners', 'encounters', 'loot', 'clues'] as const).forEach(fieldName => {
            const fieldArray = location[fieldName] || [];
            fieldArray.forEach((_, index) => {
              if (!(index in currentVisibility[fieldName])) {
                currentVisibility[fieldName][index] = 'visible';
                hasChanges = true;
              }
            });
          });
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
  const initializeRouteFieldVisibility = useCallback((routes: Route[]) => {
    console.log('useFieldVisibility - Инициализируем видимость полей для путей:', routes.map(r => r.id));
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      routes.forEach(route => {
        if (!newVisibility.routes[route.id]) {
          newVisibility.routes[route.id] = createDefaultRouteFieldVisibility(route);
          hasChanges = true;
        } else {
          // Обновляем существующую видимость для новых элементов
          const currentVisibility = newVisibility.routes[route.id];
          
          // Проверяем массивы и добавляем новые элементы
          (['obstacles', 'requirements'] as const).forEach(fieldName => {
            const fieldArray = route[fieldName] || [];
            fieldArray.forEach((_, index) => {
              if (!(index in currentVisibility[fieldName])) {
                currentVisibility[fieldName][index] = 'visible';
                hasChanges = true;
              }
            });
          });
          
          // Проверяем notes (одиночное значение)
          if (typeof currentVisibility.notes === 'undefined') {
            currentVisibility.notes = 'visible';
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Переключаем видимость отдельного элемента в поле локации
  const toggleLocationItemVisibility = useCallback((
    locationId: string,
    field: keyof LocationFieldVisibility,
    itemIndex: number
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.locations[locationId]) {
        newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
      }
      
      // Переключаем видимость элемента
      const currentVisibility = newVisibility.locations[locationId][field][itemIndex];
      newVisibility.locations[locationId][field][itemIndex] = currentVisibility === 'visible' ? 'hidden' : 'visible';
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Установить видимость конкретного элемента в поле локации по целевому значению
  const setLocationItemVisibility = useCallback((
    locationId: string,
    field: keyof LocationFieldVisibility,
    itemIndex: number,
    isVisible: boolean
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.locations[locationId]) {
        newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
      }
      
      newVisibility.locations[locationId][field][itemIndex] = isVisible ? 'visible' : 'hidden';
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Показать все элементы в поле локации
  const showAllLocationFieldItems = useCallback((
    locationId: string,
    field: keyof LocationFieldVisibility,
    itemCount: number
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.locations[locationId]) {
        newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
      }
      
      // Показываем все элементы
      for (let i = 0; i < itemCount; i++) {
        newVisibility.locations[locationId][field][i] = 'visible';
      }
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Скрыть все элементы в поле локации
  const hideAllLocationFieldItems = useCallback((
    locationId: string,
    field: keyof LocationFieldVisibility,
    itemCount: number
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.locations[locationId]) {
        newVisibility.locations[locationId] = { ...defaultLocationFieldVisibility };
      }
      
      // Скрываем все элементы
      for (let i = 0; i < itemCount; i++) {
        newVisibility.locations[locationId][field][i] = 'hidden';
      }
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Переключаем видимость отдельного элемента в поле пути
  const toggleRouteItemVisibility = useCallback((
    routeId: string,
    field: 'obstacles' | 'requirements',
    itemIndex: number
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.routes[routeId]) {
        newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
      }
      
      // Переключаем видимость элемента
      const currentVisibility = newVisibility.routes[routeId][field][itemIndex];
      newVisibility.routes[routeId][field][itemIndex] = currentVisibility === 'visible' ? 'hidden' : 'visible';
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Установить видимость элемента пути по целевому значению
  const setRouteItemVisibility = useCallback((
    routeId: string,
    field: 'obstacles' | 'requirements',
    itemIndex: number,
    isVisible: boolean
  ) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      if (!newVisibility.routes[routeId]) {
        newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
      }
      newVisibility.routes[routeId][field][itemIndex] = isVisible ? 'visible' : 'hidden';
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Переключаем видимость notes у пути (одиночное поле)
  const toggleRouteNotesVisibility = useCallback((routeId: string) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      
      // Инициализируем если не существует
      if (!newVisibility.routes[routeId]) {
        newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
      }
      
      // Переключаем видимость notes
      const currentVisibility = newVisibility.routes[routeId].notes;
      newVisibility.routes[routeId].notes = currentVisibility === 'visible' ? 'hidden' : 'visible';
      
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Установить видимость notes у пути по целевому значению
  const setRouteNotesVisibility = useCallback((routeId: string, isVisible: boolean) => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      if (!newVisibility.routes[routeId]) {
        newVisibility.routes[routeId] = { ...defaultRouteFieldVisibility };
      }
      newVisibility.routes[routeId].notes = isVisible ? 'visible' : 'hidden';
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Проверяем, видим ли отдельный элемент в поле локации
  const isLocationItemVisible = useCallback((
    locationId: string,
    field: keyof LocationFieldVisibility,
    itemIndex: number
  ): boolean => {
    const locationVisibility = visibilityRef.current.locations[locationId];
    if (!locationVisibility) {
      return true; // По умолчанию видимо
    }
    const fieldVisibility = locationVisibility[field][itemIndex];
    return fieldVisibility === 'visible' || fieldVisibility === undefined;
  }, []);

  // Проверяем, видим ли отдельный элемент в поле пути
  const isRouteItemVisible = useCallback((
    routeId: string,
    field: 'obstacles' | 'requirements',
    itemIndex: number
  ): boolean => {
    const routeVisibility = visibilityRef.current.routes[routeId];
    if (!routeVisibility) {
      return true; // По умолчанию видимо
    }
    const fieldVisibility = routeVisibility[field][itemIndex];
    return fieldVisibility === 'visible' || fieldVisibility === undefined;
  }, []);

  // Проверяем, видимы ли notes пути
  const isRouteNotesVisible = useCallback((routeId: string): boolean => {
    const routeVisibility = visibilityRef.current.routes[routeId];
    if (!routeVisibility) {
      return true; // По умолчанию видимо
    }
    return routeVisibility.notes === 'visible' || routeVisibility.notes === undefined;
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

  // Получаем текущее состояние видимости
  const getCurrentFieldVisibility = useCallback(() => {
    return visibilityRef.current;
  }, []);

  // Массовые операции по всей карте для локаций
  const hideAllLocationData = useCallback((locations: PointOfInterest[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, locations: { ...prev.locations } };
      locations.forEach(location => {
        const locVis = newVisibility.locations[location.id] || createDefaultLocationFieldVisibility(location);
        const result = { ...locVis };
        // Усилители/ослабители не регулируем — оставляем как есть
        // Скрываем все элементы управляемых полей
        (['encounters', 'loot', 'clues'] as const).forEach(field => {
          const count = (location[field] || []).length;
          if (!result[field]) result[field] = {} as any;
          for (let i = 0; i < count; i++) {
            result[field][i] = 'hidden';
          }
        });
        newVisibility.locations[location.id] = result;
      });
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  const showAllLocationData = useCallback((locations: PointOfInterest[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, locations: { ...prev.locations } };
      locations.forEach(location => {
        const locVis = newVisibility.locations[location.id] || createDefaultLocationFieldVisibility(location);
        const result = { ...locVis };
        (['encounters', 'loot', 'clues'] as const).forEach(field => {
          const count = (location[field] || []).length;
          if (!result[field]) result[field] = {} as any;
          for (let i = 0; i < count; i++) {
            result[field][i] = 'visible';
          }
        });
        newVisibility.locations[location.id] = result;
      });
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Массовые операции по всей карте для путей
  const hideAllRouteData = useCallback((routes: Route[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, routes: { ...prev.routes } };
      routes.forEach(route => {
        const routeVis = newVisibility.routes[route.id] || createDefaultRouteFieldVisibility(route);
        const result = { ...routeVis };
        const obsCount = (route.obstacles || []).length;
        const reqCount = (route.requirements || []).length;
        if (!result.obstacles) result.obstacles = {} as any;
        if (!result.requirements) result.requirements = {} as any;
        for (let i = 0; i < obsCount; i++) result.obstacles[i] = 'hidden';
        for (let i = 0; i < reqCount; i++) result.requirements[i] = 'hidden';
        result.notes = 'hidden';
        newVisibility.routes[route.id] = result;
      });
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  const showAllRouteData = useCallback((routes: Route[]) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, routes: { ...prev.routes } };
      routes.forEach(route => {
        const routeVis = newVisibility.routes[route.id] || createDefaultRouteFieldVisibility(route);
        const result = { ...routeVis };
        const obsCount = (route.obstacles || []).length;
        const reqCount = (route.requirements || []).length;
        if (!result.obstacles) result.obstacles = {} as any;
        if (!result.requirements) result.requirements = {} as any;
        for (let i = 0; i < obsCount; i++) result.obstacles[i] = 'visible';
        for (let i = 0; i < reqCount; i++) result.requirements[i] = 'visible';
        result.notes = 'visible';
        newVisibility.routes[route.id] = result;
      });
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  return {
    visibility,
    initializeLocationFieldVisibility,
    initializeRouteFieldVisibility,
    
    // Функции для управления видимостью отдельных элементов локаций
    toggleLocationItemVisibility,
    setLocationItemVisibility,
    showAllLocationFieldItems,
    hideAllLocationFieldItems,
    isLocationItemVisible,
    
    // Функции для управления видимостью отдельных элементов путей
    toggleRouteItemVisibility,
    toggleRouteNotesVisibility,
    setRouteItemVisibility,
    setRouteNotesVisibility,
    isRouteItemVisible,
    isRouteNotesVisible,
    
    // Массовые операции по всей карте
    hideAllLocationData,
    showAllLocationData,
    hideAllRouteData,
    showAllRouteData,

    // Функции для получения настроек видимости
    getLocationFieldVisibility,
    getRouteFieldVisibility,
    getCurrentFieldVisibility
  };
};