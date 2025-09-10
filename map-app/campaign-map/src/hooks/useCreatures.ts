import { useState, useEffect, useCallback } from 'react';
import { Creature, CreateCreatureInput, UpdateCreatureInput, CreatureData, parseCreatureData } from '../types/creature';

const JSON_SERVER_URL = 'http://localhost:3001';
const STORAGE_KEY = 'dnd-creatures-collection';

interface CreaturesState {
  creatures: Creature[];
  loading: boolean;
  error: string | null;
}

export function useCreatures() {
  const [state, setState] = useState<CreaturesState>({
    creatures: [],
    loading: true,
    error: null
  });

  // Загрузка существ из localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const collection = JSON.parse(stored);
        const creatures = Object.values(collection) as Creature[];
        return creatures;
      }
    } catch (error) {
      console.error('Ошибка при загрузке существ из localStorage:', error);
    }
    return [];
  }, []);

  // Сохранение в localStorage
  const saveToLocalStorage = useCallback((creatures: Creature[]) => {
    try {
      const collection = creatures.reduce((acc, creature) => {
        acc[creature.id] = creature;
        return acc;
      }, {} as Record<string, Creature>);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (error) {
      console.error('Ошибка при сохранении существ в localStorage:', error);
    }
  }, []);

  // Загрузка всех существ
  const loadCreatures = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Сначала пытаемся загрузить с сервера
      console.log('Загружаем существ с сервера...');
      const response = await fetch(`${JSON_SERVER_URL}/creatures`);
      
      if (response.ok) {
        const creatures = await response.json();
        console.log('Загружено существ с сервера:', creatures.length);
        setState({
          creatures,
          loading: false,
          error: null
        });
        saveToLocalStorage(creatures);
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.warn('Не удалось загрузить с сервера, используем localStorage:', error);
      
      // Fallback на localStorage
      const localCreatures = loadFromLocalStorage();
      console.log('Загружено существ из localStorage:', localCreatures.length);
      setState({
        creatures: localCreatures,
        loading: false,
        error: null
      });
    }
  }, [loadFromLocalStorage, saveToLocalStorage]);

  // Создание нового существа
  const createCreature = useCallback(async (input: CreateCreatureInput): Promise<Creature> => {
    console.log('Создаем существо с данными:', input.data);
    
    const newCreature: Creature = {
      id: `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data: JSON.stringify(input.data),
      createdAt: new Date().toISOString(),
      name: input.data.name,
      type: input.data.type,
      challengeRating: input.data.challengeRating,
      tags: input.data.tags || []
    };

    console.log('Созданное существо:', newCreature);

    // Сохраняем в localStorage сразу
    const updatedCreatures = [...state.creatures, newCreature];
    console.log('Обновляем список существ, было:', state.creatures.length, 'стало:', updatedCreatures.length);
    
    setState(prev => ({ ...prev, creatures: updatedCreatures }));
    saveToLocalStorage(updatedCreatures);

    // Пытаемся сохранить на сервер
    try {
      const response = await fetch(`${JSON_SERVER_URL}/creatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCreature)
      });
      
      if (response.ok) {
        console.log('Существо успешно сохранено на сервер');
      } else {
        console.warn('Ошибка сохранения на сервер:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Не удалось сохранить на сервер:', error);
    }

    return newCreature;
  }, [state.creatures, saveToLocalStorage]);

  // Обновление существа
  const updateCreature = useCallback(async (id: string, input: UpdateCreatureInput): Promise<Creature | null> => {
    const existingCreature = state.creatures.find(c => c.id === id);
    if (!existingCreature) return null;

    const updatedCreature: Creature = {
      ...existingCreature,
      ...(input.data && {
        data: JSON.stringify(input.data),
        name: input.data.name,
        type: input.data.type,
        challengeRating: input.data.challengeRating,
        tags: input.data.tags || []
      }),
      updatedAt: new Date().toISOString()
    };

    const updatedCreatures = state.creatures.map(c => 
      c.id === id ? updatedCreature : c
    );
    
    setState(prev => ({ ...prev, creatures: updatedCreatures }));
    saveToLocalStorage(updatedCreatures);

    // Пытаемся обновить на сервере
    try {
      await fetch(`${JSON_SERVER_URL}/creatures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCreature)
      });
    } catch (error) {
      console.warn('Не удалось обновить на сервере:', error);
    }

    return updatedCreature;
  }, [state.creatures, saveToLocalStorage]);

  // Удаление существа
  const deleteCreature = useCallback(async (id: string): Promise<boolean> => {
    const updatedCreatures = state.creatures.filter(c => c.id !== id);
    setState(prev => ({ ...prev, creatures: updatedCreatures }));
    saveToLocalStorage(updatedCreatures);

    // Пытаемся удалить с сервера
    try {
      await fetch(`${JSON_SERVER_URL}/creatures/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Не удалось удалить с сервера:', error);
    }

    return true;
  }, [state.creatures, saveToLocalStorage]);

  // Получение существа по ID
  const getCreatureById = useCallback((id: string): Creature | null => {
    return state.creatures.find(c => c.id === id) || null;
  }, [state.creatures]);

  // Поиск существ
  const searchCreatures = useCallback((query: string): Creature[] => {
    if (!query.trim()) return state.creatures;
    
    const searchTerm = query.toLowerCase();
    return state.creatures.filter(creature => {
      const data = parseCreatureData(creature);
      return (
        data.name.toLowerCase().includes(searchTerm) ||
        data.type.toLowerCase().includes(searchTerm) ||
        data.challengeRating.includes(searchTerm) ||
        (data.tags && data.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (data.environment && data.environment.some(env => env.toLowerCase().includes(searchTerm)))
      );
    });
  }, [state.creatures]);

  // Фильтрация по типу
  const getCreaturesByType = useCallback((type: string): Creature[] => {
    return state.creatures.filter(creature => {
      const data = parseCreatureData(creature);
      return data.type === type;
    });
  }, [state.creatures]);

  // Фильтрация по уровню опасности
  const getCreaturesByCR = useCallback((minCR: string, maxCR: string): Creature[] => {
    const parseCR = (cr: string): number => {
      if (cr.includes('/')) {
        const [num, den] = cr.split('/');
        return parseInt(num) / parseInt(den);
      }
      return parseInt(cr);
    };

    const min = parseCR(minCR);
    const max = parseCR(maxCR);

    return state.creatures.filter(creature => {
      const data = parseCreatureData(creature);
      const cr = parseCR(data.challengeRating);
      return cr >= min && cr <= max;
    });
  }, [state.creatures]);

  // Импорт существ
  const importCreatures = useCallback(async (creatures: CreateCreatureInput[]): Promise<Creature[]> => {
    const importedCreatures: Creature[] = [];
    
    for (const input of creatures) {
      try {
        const creature = await createCreature(input);
        importedCreatures.push(creature);
      } catch (error) {
        console.error('Ошибка при импорте существа:', input.data.name, error);
      }
    }
    
    return importedCreatures;
  }, [createCreature]);

  // Экспорт существ
  const exportCreatures = useCallback((creatureIds?: string[]): CreatureData[] => {
    const createsToExport = creatureIds 
      ? state.creatures.filter(c => creatureIds.includes(c.id))
      : state.creatures;
    
    return createsToExport.map(creature => parseCreatureData(creature));
  }, [state.creatures]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadCreatures();
  }, [loadCreatures]);

  return {
    // Состояние
    creatures: state.creatures,
    loading: state.loading,
    error: state.error,
    
    // CRUD операции
    createCreature,
    updateCreature,
    deleteCreature,
    getCreatureById,
    
    // Поиск и фильтрация
    searchCreatures,
    getCreaturesByType,
    getCreaturesByCR,
    
    // Импорт/экспорт
    importCreatures,
    exportCreatures,
    
    // Утилиты
    refreshCreatures: loadCreatures
  };
}
