import { useState, useEffect, useCallback } from 'react';
import { Character, CharacterData, createEmptyCharacter, calculateModifier, migrateCharacterData } from '../types/character';
import { Character as GroupCharacter } from '../types/groups';

const STORAGE_KEY = 'dnd-characters-collection';

export interface CharacterCollection {
  [characterId: string]: Character;
}

export const useCharacters = () => {
  const [characters, setCharacters] = useState<CharacterCollection>({});
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка всех персонажей из localStorage
  useEffect(() => {
    const loadCharacters = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedCharacters: CharacterCollection = JSON.parse(stored);
          setCharacters(parsedCharacters);
        }
      } catch (error) {
        console.error('Ошибка при загрузке персонажей:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, []);

  // Сохранение коллекции персонажей в localStorage
  const saveCharacters = useCallback((updatedCharacters: CharacterCollection) => {
    setCharacters(updatedCharacters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharacters));
  }, []);

  // Создание нового персонажа из данных группы
  const createCharacterFromGroup = useCallback((groupCharacter: GroupCharacter, groupId: string): string => {
    const characterId = `${groupId}-${groupCharacter.id}`;
    
    // Проверяем, существует ли уже персонаж
    if (characters[characterId]) {
      return characterId;
    }

    const newCharacter = createEmptyCharacter();
    const rawCharacterData = JSON.parse(newCharacter.data);
    const characterData = migrateCharacterData(rawCharacterData);

    // Заполняем данные из группового персонажа
    if (characterData.name) {
      characterData.name.value = groupCharacter.name;
    }
    
    if (characterData.info?.name) {
      characterData.info.name.value = groupCharacter.name;
    }
    
    if (groupCharacter.class && characterData.info?.charClass) {
      characterData.info.charClass.value = groupCharacter.class;
    }
    
    if (groupCharacter.level && characterData.info?.level) {
      characterData.info.level.value = groupCharacter.level;
    }

    // Сохраняем обновленные данные
    const updatedCharacter: Character = {
      ...newCharacter,
      data: JSON.stringify(characterData)
    };

    const updatedCharacters = {
      ...characters,
      [characterId]: updatedCharacter
    };

    saveCharacters(updatedCharacters);
    return characterId;
  }, [characters, saveCharacters]);

  // Получение персонажа по ID
  const getCharacter = useCallback((characterId: string): Character | null => {
    return characters[characterId] || null;
  }, [characters]);

  // Получение данных персонажа по ID
  const getCharacterData = useCallback((characterId: string): CharacterData | null => {
    const character = characters[characterId];
    if (!character) return null;
    
    try {
      const rawData = JSON.parse(character.data);
      return migrateCharacterData(rawData);
    } catch (error) {
      console.error('Ошибка при парсинге данных персонажа:', error);
      return null;
    }
  }, [characters]);

  // Обновление персонажа
  const updateCharacter = useCallback((characterId: string, updatedCharacterData: CharacterData) => {
    const character = characters[characterId];
    if (!character) return;

    const updatedCharacter: Character = {
      ...character,
      data: JSON.stringify(updatedCharacterData)
    };

    const updatedCharacters = {
      ...characters,
      [characterId]: updatedCharacter
    };

    saveCharacters(updatedCharacters);
  }, [characters, saveCharacters]);

  // Удаление персонажа
  const deleteCharacter = useCallback((characterId: string) => {
    const updatedCharacters = { ...characters };
    delete updatedCharacters[characterId];
    saveCharacters(updatedCharacters);
  }, [characters, saveCharacters]);

  // Проверка существования персонажа
  const hasCharacter = useCallback((characterId: string): boolean => {
    return characterId in characters;
  }, [characters]);

  // Синхронизация данных персонажа с данными группы
  const syncWithGroupCharacter = useCallback((
    characterId: string, 
    groupCharacter: GroupCharacter
  ) => {
    const characterData = getCharacterData(characterId);
    if (!characterData) return;

    // Обновляем только основные поля, если они изменились
    let hasChanges = false;
    const updatedData = { ...characterData };

    if (characterData.name?.value !== groupCharacter.name) {
      if (updatedData.name) {
        updatedData.name.value = groupCharacter.name;
      }
      if (updatedData.info?.name) {
        updatedData.info.name.value = groupCharacter.name;
      }
      hasChanges = true;
    }

    if (groupCharacter.class && characterData.info?.charClass?.value !== groupCharacter.class) {
      if (updatedData.info?.charClass) {
        updatedData.info.charClass.value = groupCharacter.class;
      }
      hasChanges = true;
    }

    if (groupCharacter.level && characterData.info?.level?.value !== groupCharacter.level) {
      if (updatedData.info?.level) {
        updatedData.info.level.value = groupCharacter.level;
      }
      hasChanges = true;
    }

    if (hasChanges) {
      updateCharacter(characterId, updatedData);
    }
  }, [getCharacterData, updateCharacter]);

  // Получение данных для обновления персонажа в группе
  const getGroupCharacterUpdate = useCallback((characterId: string): Partial<GroupCharacter> | null => {
    const characterData = getCharacterData(characterId);
    if (!characterData) return null;

    return {
      name: characterData.name?.value || '',
      class: characterData.info?.charClass?.value || undefined,
      level: characterData.info?.level?.value || undefined
    };
  }, [getCharacterData]);

  return {
    characters,
    isLoading,
    
    // Основные методы
    createCharacterFromGroup,
    getCharacter,
    getCharacterData,
    updateCharacter,
    deleteCharacter,
    hasCharacter,
    
    // Синхронизация
    syncWithGroupCharacter,
    getGroupCharacterUpdate
  };
};