import { useCallback } from 'react';
import { useGroups } from './useGroups';

interface CharacterGroupMapping {
  originalCharacterId: string;
  groupId: string;
  groupCharacterId: string;
}

const MAPPINGS_STORAGE_KEY = 'character-group-mappings';

export const useCharacterGroupSync = () => {
  const { groups, updateCharacter, removeCharacterFromGroup } = useGroups();

  // Получение всех маппингов
  const getMappings = useCallback((): Record<string, CharacterGroupMapping> => {
    try {
      return JSON.parse(localStorage.getItem(MAPPINGS_STORAGE_KEY) || '{}');
    } catch (error) {
      console.error('Ошибка при загрузке маппингов персонажей:', error);
      return {};
    }
  }, []);

  // Сохранение маппинга
  const saveMapping = useCallback((groupCharacterId: string, mapping: CharacterGroupMapping) => {
    try {
      const mappings = getMappings();
      mappings[groupCharacterId] = mapping;
      localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(mappings));
    } catch (error) {
      console.error('Ошибка при сохранении маппинга персонажа:', error);
    }
  }, [getMappings]);

  // Удаление маппинга
  const removeMapping = useCallback((groupCharacterId: string) => {
    try {
      const mappings = getMappings();
      delete mappings[groupCharacterId];
      localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(mappings));
    } catch (error) {
      console.error('Ошибка при удалении маппинга персонажа:', error);
    }
  }, [getMappings]);

  // Получение маппинга по ID персонажа в группе
  const getMappingByGroupCharacterId = useCallback((groupCharacterId: string): CharacterGroupMapping | null => {
    const mappings = getMappings();
    return mappings[groupCharacterId] || null;
  }, [getMappings]);

  // Получение всех групповых персонажей, связанных с персонажем из основной системы
  const getGroupCharactersByOriginalId = useCallback((originalCharacterId: string): CharacterGroupMapping[] => {
    const mappings = getMappings();
    return Object.values(mappings).filter(mapping => mapping.originalCharacterId === originalCharacterId);
  }, [getMappings]);

  // Синхронизация данных персонажа из основной системы в группы
  const syncCharacterToGroups = useCallback(async (originalCharacterId: string) => {
    try {
      // Получаем данные персонажа из основной системы
      let characterData = null;
      
      // Сначала ищем в localStorage
      const stored = localStorage.getItem('dnd-characters-collection');
      if (stored) {
        const collection = JSON.parse(stored);
        if (collection[originalCharacterId]) {
          characterData = collection[originalCharacterId];
        }
      }

      // Если не найдено в localStorage, ищем на сервере
      if (!characterData) {
        try {
          const response = await fetch(`http://localhost:3001/characters/${originalCharacterId}`);
          if (response.ok) {
            characterData = await response.json();
          }
        } catch (error) {
          console.warn('JSON server недоступен:', error);
        }
      }

      if (!characterData) {
        console.warn(`Персонаж ${originalCharacterId} не найден`);
        return;
      }

      // Парсим данные персонажа
      const parsedData = typeof characterData.data === 'string' ? JSON.parse(characterData.data) : characterData.data;
      const characterInfo = {
        name: parsedData.name?.value || parsedData.info?.name?.value || 'Безымянный',
        class: parsedData.info?.charClass?.value || '',
        level: parsedData.info?.level?.value || 1
      };

      // Получаем все связанные групповые персонажи
      const relatedMappings = getGroupCharactersByOriginalId(originalCharacterId);

      // Обновляем каждого связанного персонажа в группах
      for (const mapping of relatedMappings) {
        try {
          updateCharacter(mapping.groupId, mapping.groupCharacterId, {
            name: characterInfo.name,
            class: characterInfo.class || undefined,
            level: characterInfo.level
          });
        } catch (error) {
          console.error(`Ошибка при обновлении персонажа ${mapping.groupCharacterId} в группе ${mapping.groupId}:`, error);
        }
      }

      console.log(`Синхронизированы ${relatedMappings.length} персонажей в группах для ${originalCharacterId}`);
    } catch (error) {
      console.error('Ошибка при синхронизации персонажа:', error);
    }
  }, [getGroupCharactersByOriginalId, updateCharacter]);

  // Удаление персонажа из всех групп при удалении из основной системы
  const removeCharacterFromAllGroups = useCallback((originalCharacterId: string) => {
    try {
      const relatedMappings = getGroupCharactersByOriginalId(originalCharacterId);
      
      for (const mapping of relatedMappings) {
        try {
          removeCharacterFromGroup(mapping.groupId, mapping.groupCharacterId);
          removeMapping(mapping.groupCharacterId);
        } catch (error) {
          console.error(`Ошибка при удалении персонажа ${mapping.groupCharacterId} из группы ${mapping.groupId}:`, error);
        }
      }

      console.log(`Удален персонаж ${originalCharacterId} из ${relatedMappings.length} групп`);
    } catch (error) {
      console.error('Ошибка при удалении персонажа из групп:', error);
    }
  }, [getGroupCharactersByOriginalId, removeCharacterFromGroup, removeMapping]);

  // Получение информации о том, в каких группах находится персонаж
  const getCharacterGroupInfo = useCallback((originalCharacterId: string) => {
    const relatedMappings = getGroupCharactersByOriginalId(originalCharacterId);
    
    return relatedMappings.map(mapping => {
      const group = groups.find(g => g.id === mapping.groupId);
      const character = group?.members.find(c => c.id === mapping.groupCharacterId);
      
      return {
        groupId: mapping.groupId,
        groupName: group?.name || 'Неизвестная группа',
        groupCharacterId: mapping.groupCharacterId,
        characterInGroup: character || null
      };
    });
  }, [getGroupCharactersByOriginalId, groups]);

  return {
    // Управление маппингами
    saveMapping,
    removeMapping,
    getMappingByGroupCharacterId,
    getGroupCharactersByOriginalId,
    
    // Синхронизация
    syncCharacterToGroups,
    removeCharacterFromAllGroups,
    getCharacterGroupInfo,
    
    // Утилиты
    getMappings
  };
};
