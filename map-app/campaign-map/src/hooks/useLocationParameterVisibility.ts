import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'location-parameter-visibility';

interface LocationParameterVisibility {
  visibleClues: Set<string>; // Множество ID видимых зацепок (формат: "locationId:clueIndex")
  visibleLoot: Set<string>; // Множество ID видимых предметов добычи
  visibleEncounters: Set<string>; // Множество ID видимых встреч
}

export const useLocationParameterVisibility = () => {
  const [visibility, setVisibility] = useState<LocationParameterVisibility>({
    visibleClues: new Set(),
    visibleLoot: new Set(),
    visibleEncounters: new Set()
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
      if (saved) {
        const parsed = JSON.parse(saved);
        // Преобразуем массивы обратно в Set
        const visibleClues = new Set((parsed.visibleClues || []) as string[]);
        const visibleLoot = new Set((parsed.visibleLoot || []) as string[]);
        const visibleEncounters = new Set((parsed.visibleEncounters || []) as string[]);
        setVisibility({ visibleClues, visibleLoot, visibleEncounters });
      }
    } catch (error) {
      // Игнорируем ошибки загрузки
    }
  }, []);

  // Сохраняем настройки видимости в localStorage
  const saveVisibility = useCallback((newVisibility: LocationParameterVisibility) => {
    try {
      // Преобразуем Set в массивы для сохранения в localStorage
      const serializable = {
        visibleClues: Array.from(newVisibility.visibleClues),
        visibleLoot: Array.from(newVisibility.visibleLoot),
        visibleEncounters: Array.from(newVisibility.visibleEncounters)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      // Игнорируем ошибки сохранения
    }
  }, []);

  // Управление видимостью зацепок
  const toggleClueVisibility = useCallback((locationId: string, clueIndex: number) => {
    const clueId = `${locationId}:clue:${clueIndex}`;
    setVisibility(prev => {
      const newVisibleClues = new Set(prev.visibleClues);
      if (newVisibleClues.has(clueId)) {
        newVisibleClues.delete(clueId);
      } else {
        newVisibleClues.add(clueId);
      }
      const newVisibility = { ...prev, visibleClues: newVisibleClues };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  const setClueVisibility = useCallback((locationId: string, clueIndex: number, isVisible: boolean) => {
    const clueId = `${locationId}:clue:${clueIndex}`;
    setVisibility(prev => {
      const newVisibleClues = new Set(prev.visibleClues);
      if (isVisible) {
        newVisibleClues.add(clueId);
      } else {
        newVisibleClues.delete(clueId);
      }
      const newVisibility = { ...prev, visibleClues: newVisibleClues };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Управление видимостью добычи
  const toggleLootVisibility = useCallback((locationId: string, lootIndex: number) => {
    const lootId = `${locationId}:loot:${lootIndex}`;
    setVisibility(prev => {
      const newVisibleLoot = new Set(prev.visibleLoot);
      if (newVisibleLoot.has(lootId)) {
        newVisibleLoot.delete(lootId);
      } else {
        newVisibleLoot.add(lootId);
      }
      const newVisibility = { ...prev, visibleLoot: newVisibleLoot };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  const setLootVisibility = useCallback((locationId: string, lootIndex: number, isVisible: boolean) => {
    const lootId = `${locationId}:loot:${lootIndex}`;
    setVisibility(prev => {
      const newVisibleLoot = new Set(prev.visibleLoot);
      if (isVisible) {
        newVisibleLoot.add(lootId);
      } else {
        newVisibleLoot.delete(lootId);
      }
      const newVisibility = { ...prev, visibleLoot: newVisibleLoot };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Управление видимостью встреч
  const toggleEncounterVisibility = useCallback((locationId: string, encounterIndex: number) => {
    const encounterId = `${locationId}:encounter:${encounterIndex}`;
    setVisibility(prev => {
      const newVisibleEncounters = new Set(prev.visibleEncounters);
      if (newVisibleEncounters.has(encounterId)) {
        newVisibleEncounters.delete(encounterId);
      } else {
        newVisibleEncounters.add(encounterId);
      }
      const newVisibility = { ...prev, visibleEncounters: newVisibleEncounters };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  const setEncounterVisibility = useCallback((locationId: string, encounterIndex: number, isVisible: boolean) => {
    const encounterId = `${locationId}:encounter:${encounterIndex}`;
    setVisibility(prev => {
      const newVisibleEncounters = new Set(prev.visibleEncounters);
      if (isVisible) {
        newVisibleEncounters.add(encounterId);
      } else {
        newVisibleEncounters.delete(encounterId);
      }
      const newVisibility = { ...prev, visibleEncounters: newVisibleEncounters };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Проверка видимости параметров
  const isClueVisible = useCallback((locationId: string, clueIndex: number): boolean => {
    const clueId = `${locationId}:clue:${clueIndex}`;
    return visibilityRef.current.visibleClues.has(clueId);
  }, []);

  const isLootVisible = useCallback((locationId: string, lootIndex: number): boolean => {
    const lootId = `${locationId}:loot:${lootIndex}`;
    return visibilityRef.current.visibleLoot.has(lootId);
  }, []);

  const isEncounterVisible = useCallback((locationId: string, encounterIndex: number): boolean => {
    const encounterId = `${locationId}:encounter:${encounterIndex}`;
    return visibilityRef.current.visibleEncounters.has(encounterId);
  }, []);

  // Массовые операции
  const showAllLocationParameters = useCallback((locationId: string) => {
    setVisibility(prev => {
      const newVisibleClues = new Set(prev.visibleClues);
      const newVisibleLoot = new Set(prev.visibleLoot);
      const newVisibleEncounters = new Set(prev.visibleEncounters);
      
      // Добавляем все возможные параметры для локации
      for (let i = 0; i < 10; i++) { // Предполагаем максимум 10 элементов каждого типа
        newVisibleClues.add(`${locationId}:clue:${i}`);
        newVisibleLoot.add(`${locationId}:loot:${i}`);
        newVisibleEncounters.add(`${locationId}:encounter:${i}`);
      }
      
      const newVisibility = { 
        visibleClues: newVisibleClues, 
        visibleLoot: newVisibleLoot, 
        visibleEncounters: newVisibleEncounters 
      };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  const hideAllLocationParameters = useCallback((locationId: string) => {
    setVisibility(prev => {
      const newVisibleClues = new Set(prev.visibleClues);
      const newVisibleLoot = new Set(prev.visibleLoot);
      const newVisibleEncounters = new Set(prev.visibleEncounters);
      
      // Удаляем все параметры для локации
      for (let i = 0; i < 10; i++) {
        newVisibleClues.delete(`${locationId}:clue:${i}`);
        newVisibleLoot.delete(`${locationId}:loot:${i}`);
        newVisibleEncounters.delete(`${locationId}:encounter:${i}`);
      }
      
      const newVisibility = { 
        visibleClues: newVisibleClues, 
        visibleLoot: newVisibleLoot, 
        visibleEncounters: newVisibleEncounters 
      };
      saveVisibility(newVisibility);
      return newVisibility;
    });
  }, [saveVisibility]);

  // Получение текущего состояния
  const getCurrentVisibility = useCallback(() => {
    return visibilityRef.current;
  }, []);

  return {
    visibility,
    toggleClueVisibility,
    setClueVisibility,
    toggleLootVisibility,
    setLootVisibility,
    toggleEncounterVisibility,
    setEncounterVisibility,
    isClueVisible,
    isLootVisible,
    isEncounterVisible,
    showAllLocationParameters,
    hideAllLocationParameters,
    getCurrentVisibility
  };
}; 