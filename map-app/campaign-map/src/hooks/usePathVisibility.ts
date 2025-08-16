import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphNode, GraphEdge } from '../types';

const STORAGE_KEY = 'path-visibility';

interface PathVisibility {
  [pathId: string]: boolean; // true = открыто, false = скрыто
}

export const usePathVisibility = () => {
  const [visibility, setVisibility] = useState<PathVisibility>({});
  const visibilityRef = useRef(visibility);

  // Обновляем ref при изменении visibility
  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  // Загружаем сохраненные настройки видимости из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('usePathVisibility - Загружаем из localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved) as PathVisibility;
        console.log('usePathVisibility - Парсим данные:', parsed);
        setVisibility(parsed);
      } else {
        console.log('usePathVisibility - localStorage пуст, используем значения по умолчанию');
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки видимости путей:', error);
    }
  }, []);

  // Сохраняем настройки видимости в localStorage
  const saveVisibility = useCallback((newVisibility: PathVisibility) => {
    try {
      console.log('usePathVisibility - Сохраняем в localStorage:', newVisibility);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
    } catch (error) {
      console.error('Ошибка при сохранении настроек видимости путей:', error);
    }
  }, []);

  // Переключаем видимость пути
  const togglePathVisibility = useCallback((pathId: string) => {
    setVisibility(prev => {
      const newVisibility = {
        ...prev,
        [pathId]: !prev[pathId]
      };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Устанавливаем видимость пути
  const setPathVisibility = useCallback((pathId: string, isVisible: boolean) => {
    setVisibility(prev => {
      const newVisibility = {
        ...prev,
        [pathId]: isVisible
      };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Проверяем, видим ли путь - используем ref для стабильности
  const isPathVisible = useCallback((pathId: string): boolean => {
    // По умолчанию все пути скрыты (если не указано иное)
    return visibilityRef.current[pathId] === true;
  }, []); // Пустой массив зависимостей - функция никогда не пересоздается

  // ПОКАЗАТЬ ВСЕ ПУТИ
  const showAllPaths = useCallback(() => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      Object.keys(prev).forEach(id => {
        newVisibility[id] = true; // Устанавливаем все в true
      });
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // СКРЫТЬ ВСЕ ПУТИ
  const hideAllPaths = useCallback(() => {
    setVisibility(prev => {
      const newVisibility = { ...prev };
      Object.keys(prev).forEach(id => {
        newVisibility[id] = false; // Устанавливаем все в false
      });
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Получаем текущее состояние видимости
  const getCurrentVisibility = useCallback(() => {
    return visibilityRef.current;
  }, []);

  // Проверяем, есть ли открытые пути
  const hasVisiblePaths = useCallback(() => {
    return Object.values(visibilityRef.current).some(visible => visible);
  }, []);

  // Инициализируем видимость для новых путей
  const initializePathVisibility = useCallback((pathIds: string[]) => {
    console.log('usePathVisibility - Инициализируем видимость для путей:', pathIds);
    setVisibility(prev => {
      const newVisibility = { ...prev };
      let hasChanges = false;
      
      pathIds.forEach(id => {
        if (!(id in newVisibility)) {
          newVisibility[id] = false; // По умолчанию скрыты
          hasChanges = true;
        }
      });
      
      console.log('usePathVisibility - Новое состояние видимости:', newVisibility);
      console.log('usePathVisibility - Есть изменения:', hasChanges);
      
      if (hasChanges) {
        saveVisibility(newVisibility);
      }
      
      return newVisibility;
    });
  }, [saveVisibility]);

  // Проверяем, должен ли путь быть видимым на основе видимости связанных локаций
  const shouldPathBeVisible = useCallback((
    path: GraphEdge, 
    isLocationVisible: (locationId: string) => boolean
  ): boolean => {
    // Путь видим только если обе связанные локации видимы
    const sourceVisible = isLocationVisible(path.source);
    const targetVisible = isLocationVisible(path.target);
    return sourceVisible && targetVisible;
  }, []);

  return {
    visibility,
    togglePathVisibility,
    setPathVisibility,
    isPathVisible,
    showAllPaths,
    hideAllPaths,
    getCurrentVisibility,
    hasVisiblePaths,
    initializePathVisibility,
    shouldPathBeVisible
  };
}; 