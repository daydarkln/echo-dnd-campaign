import { useState, useEffect, useCallback } from 'react';
import { Group, Character, GroupsState } from '../types/groups';

const STORAGE_KEY = 'campaign-map-groups';

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
];

export const useGroups = () => {
  const [state, setState] = useState<GroupsState>({
    groups: []
  });

  // Загрузка групп из localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({
          groups: parsed.groups.map((group: any) => ({
            ...group,
            createdAt: new Date(group.createdAt),
            updatedAt: new Date(group.updatedAt)
          }))
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки групп из localStorage:', error);
    }
  }, []);

  // Сохранение в localStorage
  const saveToStorage = useCallback((newState: GroupsState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Ошибка сохранения групп в localStorage:', error);
    }
  }, []);

  // Создание новой группы
  const createGroup = useCallback((name: string, color?: string, isPlayers: boolean = false) => {
    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color: color || defaultColors[state.groups.length % defaultColors.length],
      members: [],
      isPlayers,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newState = {
      ...state,
      groups: [...state.groups, newGroup]
    };
    
    setState(newState);
    saveToStorage(newState);
    return newGroup;
  }, [state, saveToStorage]);

  // Обновление группы
  const updateGroup = useCallback((groupId: string, updates: Partial<Omit<Group, 'id' | 'createdAt'>>) => {
    const newState = {
      ...state,
      groups: state.groups.map(group => 
        group.id === groupId 
          ? { ...group, ...updates, updatedAt: new Date() }
          : group
      )
    };
    
    setState(newState);
    saveToStorage(newState);
  }, [state, saveToStorage]);

  // Удаление группы
  const deleteGroup = useCallback((groupId: string) => {
    const newState = {
      groups: state.groups.filter(group => group.id !== groupId)
    };
    
    setState(newState);
    saveToStorage(newState);
  }, [state, saveToStorage]);

  // Добавление персонажа в группу
  const addCharacterToGroup = useCallback((groupId: string, character: Omit<Character, 'id'>) => {
    const newCharacter: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...character
    };

    updateGroup(groupId, {
      members: [...(state.groups.find(g => g.id === groupId)?.members || []), newCharacter]
    });
    
    return newCharacter;
  }, [state.groups, updateGroup]);

  // Удаление персонажа из группы
  const removeCharacterFromGroup = useCallback((groupId: string, characterId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      updateGroup(groupId, {
        members: group.members.filter(char => char.id !== characterId)
      });
    }
  }, [state.groups, updateGroup]);

  // Обновление персонажа
  const updateCharacter = useCallback((groupId: string, characterId: string, updates: Partial<Omit<Character, 'id'>>) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      updateGroup(groupId, {
        members: group.members.map(char => 
          char.id === characterId 
            ? { ...char, ...updates }
            : char
        )
      });
    }
  }, [state.groups, updateGroup]);



  // Перемещение группы в локацию
  const moveGroupToLocation = useCallback((groupId: string, locationId: string) => {
    updateGroup(groupId, { currentLocation: locationId });
  }, [updateGroup]);

  // Разделение группы
  const splitGroup = useCallback((groupId: string, selectedMemberIds: string[]) => {
    const originalGroup = state.groups.find(g => g.id === groupId);
    if (!originalGroup || selectedMemberIds.length === 0 || selectedMemberIds.length >= originalGroup.members.length) {
      return null;
    }

    // Находим номер для новой группы
    const baseName = originalGroup.name;
    const existingNumbers = state.groups
      .filter(g => g.name.startsWith(baseName))
      .map(g => {
        const match = g.name.match(/\((\d+)\)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => a - b);
    
    let newNumber = 1;
    for (const num of existingNumbers) {
      if (num >= newNumber) {
        newNumber = num + 1;
      }
    }

    const newGroupName = `${baseName}(${newNumber})`;

    // Разделяем участников
    const selectedMembers = originalGroup.members.filter(m => selectedMemberIds.includes(m.id));
    const remainingMembers = originalGroup.members.filter(m => !selectedMemberIds.includes(m.id));

    // Создаём новую группу
    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newGroupName,
      color: originalGroup.color,
      members: selectedMembers,
      isPlayers: originalGroup.isPlayers,
      currentLocation: originalGroup.currentLocation,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Обновляем оригинальную группу
    const updatedOriginalGroup = {
      ...originalGroup,
      members: remainingMembers,
      updatedAt: new Date()
    };

    const newState = {
      ...state,
      groups: [
        ...state.groups.filter(g => g.id !== groupId),
        updatedOriginalGroup,
        newGroup
      ]
    };

    setState(newState);
    saveToStorage(newState);
    return newGroup;
  }, [state, saveToStorage]);

  return {
    groups: state.groups,
    createGroup,
    updateGroup,
    deleteGroup,
    addCharacterToGroup,
    removeCharacterFromGroup,
    updateCharacter,
    moveGroupToLocation,
    splitGroup,
    defaultColors
  };
};