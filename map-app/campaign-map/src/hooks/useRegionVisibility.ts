import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'region-visibility';

interface RegionVisibility {
  visibleRegions: Set<string>; // Множество названий видимых регионов
}

export const useRegionVisibility = () => {
  const [visibility, setVisibility] = useState<RegionVisibility>({ visibleRegions: new Set() });
  const visibilityRef = useRef(visibility);

  // Обновляем ref при изменении visibility
  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  // Загружаем сохраненные настройки видимости из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('useRegionVisibility - Загружаем из localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Преобразуем массив обратно в Set
        const visibleRegions = new Set((parsed.visibleRegions || []) as string[]);
        setVisibility({ visibleRegions });
        console.log('useRegionVisibility - Парсим данные:', { visibleRegions: Array.from(visibleRegions) });
      } else {
        console.log('useRegionVisibility - localStorage пуст, используем значения по умолчанию');
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки видимости регионов:', error);
    }
  }, []);

  // Сохраняем настройки видимости в localStorage
  const saveVisibility = useCallback((newVisibility: RegionVisibility) => {
    try {
      // Преобразуем Set в массив для сохранения в localStorage
      const serializable = {
        visibleRegions: Array.from(newVisibility.visibleRegions)
      };
      console.log('useRegionVisibility - Сохраняем в localStorage:', serializable);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error('Ошибка при сохранении настроек видимости регионов:', error);
    }
  }, []);

  // Переключаем видимость региона
  const toggleRegionVisibility = useCallback((regionName: string) => {
    setVisibility(prev => {
      const newVisibleRegions = new Set(prev.visibleRegions);
      if (newVisibleRegions.has(regionName)) {
        newVisibleRegions.delete(regionName);
      } else {
        newVisibleRegions.add(regionName);
      }
      const newVisibility = { visibleRegions: newVisibleRegions };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Устанавливаем видимость региона
  const setRegionVisibility = useCallback((regionName: string, isVisible: boolean) => {
    setVisibility(prev => {
      const newVisibleRegions = new Set(prev.visibleRegions);
      if (isVisible) {
        newVisibleRegions.add(regionName);
      } else {
        newVisibleRegions.delete(regionName);
      }
      const newVisibility = { visibleRegions: newVisibleRegions };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Проверяем, видим ли регион - используем ref для стабильности
  const isRegionVisible = useCallback((regionName: string): boolean => {
    return visibilityRef.current.visibleRegions.has(regionName);
  }, []); // Пустой массив зависимостей - функция никогда не пересоздается

  // ПОКАЗАТЬ ВСЕ РЕГИОНЫ
  const showAllRegions = useCallback((regionNames: string[]) => {
    setVisibility(prev => {
      const newVisibleRegions = new Set(prev.visibleRegions);
      regionNames.forEach(name => newVisibleRegions.add(name));
      const newVisibility = { visibleRegions: newVisibleRegions };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // СКРЫТЬ ВСЕ РЕГИОНЫ
  const hideAllRegions = useCallback((regionNames: string[]) => {
    setVisibility(prev => {
      const newVisibleRegions = new Set(prev.visibleRegions);
      regionNames.forEach(name => newVisibleRegions.delete(name));
      const newVisibility = { visibleRegions: newVisibleRegions };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Получаем текущее состояние видимости
  const getCurrentVisibility = useCallback(() => {
    return visibilityRef.current;
  }, []);

  // Проверяем, есть ли открытые регионы
  const hasVisibleRegions = useCallback(() => {
    return visibilityRef.current.visibleRegions.size > 0;
  }, []);

  // Инициализируем видимость для новых регионов
  const initializeRegionVisibility = useCallback((regionNames: string[]) => {
    console.log('useRegionVisibility - Инициализируем видимость для регионов:', regionNames);
    setVisibility(prev => {
      const newVisibleRegions = new Set(prev.visibleRegions);
      let hasChanges = false;
      
      regionNames.forEach(name => {
        if (!newVisibleRegions.has(name)) {
          // По умолчанию все регионы скрыты
          hasChanges = true;
        }
      });
      
      console.log('useRegionVisibility - Новое состояние видимости:', { visibleRegions: Array.from(newVisibleRegions) });
      console.log('useRegionVisibility - Есть изменения:', hasChanges);
      
      if (hasChanges) {
        const newVisibility = { visibleRegions: newVisibleRegions };
        saveVisibility(newVisibility);
        return newVisibility;
      }
      
      return prev;
    });
  }, [saveVisibility]);

  // Автоматически открываем регион, если в нём есть открытые локации
  const autoOpenRegionIfNeeded = useCallback((regionName: string, hasVisibleLocations: boolean) => {
    if (hasVisibleLocations && !isRegionVisible(regionName)) {
      console.log(`useRegionVisibility - Автоматически открываем регион "${regionName}" (есть открытые локации)`);
      setRegionVisibility(regionName, true);
    }
  }, [isRegionVisible, setRegionVisibility]);

  return {
    visibility,
    toggleRegionVisibility,
    setRegionVisibility,
    isRegionVisible,
    showAllRegions,
    hideAllRegions,
    getCurrentVisibility,
    hasVisibleRegions,
    initializeRegionVisibility,
    autoOpenRegionIfNeeded
  };
}; 