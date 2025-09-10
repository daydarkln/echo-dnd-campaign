import { useState, useEffect, useCallback } from 'react';
import { Encounter, CreateEncounterInput } from '../types/encounter';

const JSON_SERVER_URL = 'http://localhost:3001';
const STORAGE_KEY = 'dnd-encounters-collection';

interface EncountersState {
  encounters: Encounter[];
  loading: boolean;
  error: string | null;
}

export function useEncounters() {
  const [state, setState] = useState<EncountersState>({
    encounters: [],
    loading: true,
    error: null
  });

  // Загрузка из localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const collection = JSON.parse(stored);
        const encounters = Object.values(collection) as Encounter[];
        return encounters;
      }
    } catch (error) {
      console.error('Ошибка при загрузке энкаунтеров из localStorage:', error);
    }
    return [];
  }, []);

  // Сохранение в localStorage
  const saveToLocalStorage = useCallback((encounters: Encounter[]) => {
    try {
      const collection = encounters.reduce((acc, encounter) => {
        acc[encounter.id] = encounter;
        return acc;
      }, {} as Record<string, Encounter>);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (error) {
      console.error('Ошибка при сохранении энкаунтеров в localStorage:', error);
    }
  }, []);

  // Загрузка всех энкаунтеров
  const loadEncounters = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Загружаем энкаунтеры с сервера...');
      const response = await fetch(`${JSON_SERVER_URL}/encounters`);
      
      if (response.ok) {
        const encounters = await response.json();
        console.log('Загружено энкаунтеров с сервера:', encounters.length);
        setState({
          encounters,
          loading: false,
          error: null
        });
        saveToLocalStorage(encounters);
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.warn('Не удалось загрузить с сервера, используем localStorage:', error);
      
      // Fallback на localStorage
      const localEncounters = loadFromLocalStorage();
      console.log('Загружено энкаунтеров из localStorage:', localEncounters.length);
      setState({
        encounters: localEncounters,
        loading: false,
        error: null
      });
    }
  }, [loadFromLocalStorage, saveToLocalStorage]);

  // Создание нового энкаунтера
  const createEncounter = useCallback(async (input: CreateEncounterInput): Promise<Encounter> => {
    console.log('Создаем энкаунтер с данными:', input);
    
    const newEncounter: Encounter = {
      id: `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: input.name,
      description: input.description,
      creatures: input.creatures.map(c => ({
        creatureId: c.creatureId,
        name: c.name || '', // Имя из EncounterCreator
        challengeRating: c.challengeRating || '0', // УО из EncounterCreator  
        count: c.count
      })),
      playerGroupId: input.playerGroupId,
      status: 'planned',
      createdAt: new Date().toISOString(),
      environment: input.environment,
      notes: input.notes,
      tags: input.tags || []
    };

    console.log('Созданный энкаунтер:', newEncounter);

    // Сохраняем в localStorage сразу
    const updatedEncounters = [...state.encounters, newEncounter];
    console.log('Обновляем список энкаунтеров, было:', state.encounters.length, 'стало:', updatedEncounters.length);
    
    setState(prev => ({ ...prev, encounters: updatedEncounters }));
    saveToLocalStorage(updatedEncounters);

    // Пытаемся сохранить на сервер
    try {
      const response = await fetch(`${JSON_SERVER_URL}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEncounter)
      });
      
      if (response.ok) {
        console.log('Энкаунтер успешно сохранен на сервер');
      } else {
        console.warn('Ошибка сохранения на сервер:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Не удалось сохранить на сервер:', error);
    }

    return newEncounter;
  }, [state.encounters, saveToLocalStorage]);

  // Обновление энкаунтера
  const updateEncounter = useCallback(async (id: string, updates: Partial<Encounter>): Promise<Encounter | null> => {
    const existingEncounter = state.encounters.find(e => e.id === id);
    if (!existingEncounter) return null;

    const updatedEncounter: Encounter = {
      ...existingEncounter,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const updatedEncounters = state.encounters.map(e => 
      e.id === id ? updatedEncounter : e
    );
    
    setState(prev => ({ ...prev, encounters: updatedEncounters }));
    saveToLocalStorage(updatedEncounters);

    // Пытаемся обновить на сервере
    try {
      await fetch(`${JSON_SERVER_URL}/encounters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEncounter)
      });
    } catch (error) {
      console.warn('Не удалось обновить на сервере:', error);
    }

    return updatedEncounter;
  }, [state.encounters, saveToLocalStorage]);

  // Удаление энкаунтера
  const deleteEncounter = useCallback(async (id: string): Promise<boolean> => {
    const updatedEncounters = state.encounters.filter(e => e.id !== id);
    setState(prev => ({ ...prev, encounters: updatedEncounters }));
    saveToLocalStorage(updatedEncounters);

    // Пытаемся удалить с сервера
    try {
      await fetch(`${JSON_SERVER_URL}/encounters/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Не удалось удалить с сервера:', error);
    }

    return true;
  }, [state.encounters, saveToLocalStorage]);

  // Получение энкаунтера по ID
  const getEncounterById = useCallback((id: string): Encounter | null => {
    return state.encounters.find(e => e.id === id) || null;
  }, [state.encounters]);

  // Поиск энкаунтеров
  const searchEncounters = useCallback((query: string): Encounter[] => {
    if (!query.trim()) return state.encounters;
    
    const searchTerm = query.toLowerCase();
    return state.encounters.filter(encounter => 
      encounter.name.toLowerCase().includes(searchTerm) ||
      encounter.description?.toLowerCase().includes(searchTerm) ||
      encounter.environment?.toLowerCase().includes(searchTerm) ||
      encounter.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }, [state.encounters]);

  // Фильтрация по статусу
  const getEncountersByStatus = useCallback((status: Encounter['status']): Encounter[] => {
    return state.encounters.filter(encounter => encounter.status === status);
  }, [state.encounters]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadEncounters();
  }, [loadEncounters]);

  return {
    // Состояние
    encounters: state.encounters,
    loading: state.loading,
    error: state.error,
    
    // CRUD операции
    createEncounter,
    updateEncounter,
    deleteEncounter,
    getEncounterById,
    
    // Поиск и фильтрация
    searchEncounters,
    getEncountersByStatus,
    
    // Утилиты
    refreshEncounters: loadEncounters
  };
}
