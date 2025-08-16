import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'location-visibility';

interface LocationVisibility {
  visibleLocations: Set<string>; // Множество ID видимых локаций
}

export const useLocationVisibility = () => {
  const [visibility, setVisibility] = useState<LocationVisibility>({ visibleLocations: new Set() });
  const visibilityRef = useRef(visibility);

  // Обновляем ref при изменении visibility
  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  // Загружаем сохраненные настройки видимости из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('useLocationVisibility - Загружаем из localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Преобразуем массив обратно в Set
        const visibleLocations = new Set((parsed.visibleLocations || []) as string[]);
        setVisibility({ visibleLocations });
        console.log('useLocationVisibility - Парсим данные:', { visibleLocations: Array.from(visibleLocations) });
      } else {
        console.log('useLocationVisibility - localStorage пуст, используем значения по умолчанию');
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки видимости локаций:', error);
    }
  }, []);

  // Сохраняем настройки видимости в localStorage
  const saveVisibility = useCallback((newVisibility: LocationVisibility) => {
    try {
      // Преобразуем Set в массив для сохранения в localStorage
      const serializable = {
        visibleLocations: Array.from(newVisibility.visibleLocations)
      };
      console.log('useLocationVisibility - Сохраняем в localStorage:', serializable);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error('Ошибка при сохранении настроек видимости:', error);
    }
  }, []);

  // Переключаем видимость локации
  const toggleLocationVisibility = useCallback((locationId: string) => {
    setVisibility(prev => {
      const newVisibleLocations = new Set(prev.visibleLocations);
      if (newVisibleLocations.has(locationId)) {
        newVisibleLocations.delete(locationId);
      } else {
        newVisibleLocations.add(locationId);
      }
      const newVisibility = { visibleLocations: newVisibleLocations };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Устанавливаем видимость локации
  const setLocationVisibility = useCallback((locationId: string, isVisible: boolean) => {
    setVisibility(prev => {
      const newVisibleLocations = new Set(prev.visibleLocations);
      if (isVisible) {
        newVisibleLocations.add(locationId);
      } else {
        newVisibleLocations.delete(locationId);
      }
      const newVisibility = { visibleLocations: newVisibleLocations };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Устанавливаем видимость локации с автоматическим открытием региона
  const setLocationVisibilityWithRegionUpdate = useCallback((
    locationId: string, 
    isVisible: boolean, 
    regionName: string,
    autoOpenRegion: (regionName: string, hasVisibleLocations: boolean) => void
  ) => {
    setLocationVisibility(locationId, isVisible);
    
    // Если локация открывается, автоматически открываем регион
    if (isVisible) {
      autoOpenRegion(regionName, true);
    }
  }, [setLocationVisibility]);

  // Проверяем, видима ли локация - используем ref для стабильности
  const isLocationVisible = useCallback((locationId: string): boolean => {
    return visibilityRef.current.visibleLocations.has(locationId);
  }, []); // Пустой массив зависимостей - функция никогда не пересоздается

  // ПОКАЗАТЬ ВСЕ ЛОКАЦИИ
  const showAllLocations = useCallback((locationIds: string[]) => {
    setVisibility(prev => {
      const newVisibleLocations = new Set(prev.visibleLocations);
      locationIds.forEach(id => newVisibleLocations.add(id));
      const newVisibility = { visibleLocations: newVisibleLocations };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // СКРЫТЬ ВСЕ ЛОКАЦИИ
  const hideAllLocations = useCallback((locationIds: string[]) => {
    setVisibility(prev => {
      const newVisibleLocations = new Set(prev.visibleLocations);
      locationIds.forEach(id => newVisibleLocations.delete(id));
      const newVisibility = { visibleLocations: newVisibleLocations };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Получаем текущее состояние видимости
  const getCurrentVisibility = useCallback(() => {
    return visibilityRef.current;
  }, []);

  // Проверяем, есть ли открытые локации
  const hasVisibleLocations = useCallback(() => {
    return visibilityRef.current.visibleLocations.size > 0;
  }, []);

  // Инициализируем видимость для новых локаций
  const initializeLocationVisibility = useCallback((locationIds: string[]) => {
    console.log('useLocationVisibility - Инициализируем видимость для локаций:', locationIds);
    setVisibility(prev => {
      const newVisibleLocations = new Set(prev.visibleLocations);
      let hasChanges = false;
      
      locationIds.forEach(id => {
        if (!newVisibleLocations.has(id)) {
          // По умолчанию все локации скрыты
          hasChanges = true;
        }
      });
      
      console.log('useLocationVisibility - Новое состояние видимости:', { visibleLocations: Array.from(newVisibleLocations) });
      console.log('useLocationVisibility - Есть изменения:', hasChanges);
      
      if (hasChanges) {
        const newVisibility = { visibleLocations: newVisibleLocations };
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  return {
    visibility,
    toggleLocationVisibility,
    setLocationVisibility,
    isLocationVisible,
    showAllLocations,
    hideAllLocations,
    getCurrentVisibility,
    hasVisibleLocations,
    initializeLocationVisibility,
    setLocationVisibilityWithRegionUpdate
  };
}; 