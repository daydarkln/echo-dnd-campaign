import { useState, useEffect, useCallback } from 'react';
import { 
  InitiativeTrackerState, 
  EncounterState, 
  InitiativeCharacter, 
  CharacterStatus,
  DEATH_SAVE_MAX,
  DeathSaveType
} from '../types/initiative';
import { Character, Group } from '../types/groups';
import { Encounter, EncounterCreature } from '../types/encounter';
import { Creature, parseCreatureData } from '../types/creature';

const STORAGE_KEY = 'campaign-map-initiative-tracker';

export const useInitiativeTracker = () => {
  const [state, setState] = useState<InitiativeTrackerState>({
    encounters: [],
    currentEncounterId: null
  });

  // Загрузка из localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({
          encounters: parsed.encounters.map((encounter: any) => ({
            ...encounter,
            createdAt: new Date(encounter.createdAt),
            updatedAt: new Date(encounter.updatedAt)
          })),
          currentEncounterId: parsed.currentEncounterId
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки трекера инициативы из localStorage:', error);
    }
  }, []);

  // Сохранение в localStorage
  const saveToStorage = useCallback((newState: InitiativeTrackerState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Ошибка сохранения трекера инициативы в localStorage:', error);
    }
  }, []);

  // Создание нового энкаунтера
  const createEncounter = useCallback((name: string, selectedGroups: Group[]) => {
    if (selectedGroups.length < 2) {
      throw new Error('Для создания энкаунтера необходимо выбрать минимум 2 группы');
    }

    const characters: InitiativeCharacter[] = selectedGroups.flatMap(group =>
      group.members.map(character => ({
        id: `${group.id}-${character.id}`,
        name: character.name,
        groupId: group.id,
        groupName: group.name,
        groupColor: group.color,
        initiative: null,
        status: 'active' as CharacterStatus,
        deathSaves: {
          successes: 0,
          failures: 0
        }
      }))
    );

    const newEncounter: EncounterState = {
      id: `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      characters,
      currentTurnIndex: -1,
      round: 0,
      isActive: false,
      selectedGroupIds: selectedGroups.map(g => g.id),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setState(prev => {
      const nextState: InitiativeTrackerState = {
        ...prev,
        encounters: [...prev.encounters, newEncounter],
        currentEncounterId: newEncounter.id
      };
      saveToStorage(nextState);
      return nextState;
    });
    return newEncounter;
  }, [saveToStorage]);

  // Создание боевого энкаунтера из энкаунтера бестиария
  const createEncounterFromBestiary = useCallback((
    bestiaryEncounter: Encounter, 
    creatures: Creature[], 
    playerGroup?: Group
  ) => {
    console.log('Создаём боевой энкаунтер из бестиария:', bestiaryEncounter);
    console.log('Доступные существа:', creatures);
    console.log('Группа игроков:', playerGroup);

    const initiativeCharacters: InitiativeCharacter[] = [];

    // Добавляем персонажей игроков, если группа выбрана
    if (playerGroup) {
      const playerCharacters = playerGroup.members.map(character => ({
        id: `player-${character.id}`,
        name: character.name,
        groupId: playerGroup.id,
        groupName: playerGroup.name,
        groupColor: playerGroup.color,
        initiative: null,
        status: 'active' as CharacterStatus,
        deathSaves: {
          successes: 0,
          failures: 0
        }
      }));
      initiativeCharacters.push(...playerCharacters);
    }

    // Добавляем существ из энкаунтера
    bestiaryEncounter.creatures.forEach(encounterCreature => {
      const creature = creatures.find(c => c.id === encounterCreature.creatureId);
      if (!creature) {
        console.warn(`Существо не найдено: ${encounterCreature.creatureId}`);
        return;
      }

      const creatureData = parseCreatureData(creature);
      
      // Создаем несколько экземпляров существа
      for (let i = 1; i <= encounterCreature.count; i++) {
        const instanceName = encounterCreature.count > 1 
          ? `${creatureData.name} ${i}`
          : creatureData.name;

        initiativeCharacters.push({
          id: `creature-${encounterCreature.creatureId}-${i}-${Date.now()}`,
          name: instanceName,
          groupId: 'enemies',
          groupName: 'Враги',
          groupColor: '#ff4d4f',
          initiative: null,
          status: 'active' as CharacterStatus,
          deathSaves: {
            successes: 0,
            failures: 0
          }
        });
      }
    });

    const newEncounter: EncounterState = {
      id: `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: bestiaryEncounter.name,
      characters: initiativeCharacters,
      currentTurnIndex: -1,
      round: 0,
      isActive: false,
      selectedGroupIds: playerGroup ? [playerGroup.id, 'enemies'] : ['enemies'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Создан боевой энкаунтер:', newEncounter);

    setState(prev => {
      const nextState: InitiativeTrackerState = {
        ...prev,
        encounters: [...prev.encounters, newEncounter],
        currentEncounterId: newEncounter.id
      };
      saveToStorage(nextState);
      return nextState;
    });
    return newEncounter;
  }, [saveToStorage]);

  // Удаление энкаунтера
  const deleteEncounter = useCallback((encounterId: string) => {
    setState(prev => {
      const nextState: InitiativeTrackerState = {
        encounters: prev.encounters.filter(e => e.id !== encounterId),
        currentEncounterId: prev.currentEncounterId === encounterId ? null : prev.currentEncounterId
      };
      saveToStorage(nextState);
      return nextState;
    });
  }, [saveToStorage]);

  // Обновление энкаунтера
  const updateEncounter = useCallback((encounterId: string, updates: Partial<EncounterState>) => {
    setState(prev => {
      const nextState: InitiativeTrackerState = {
        ...prev,
        encounters: prev.encounters.map(encounter =>
          encounter.id === encounterId
            ? { ...encounter, ...updates, updatedAt: new Date() }
            : encounter
        )
      };
      saveToStorage(nextState);
      return nextState;
    });
  }, [saveToStorage]);

  // Установка инициативы персонажа
  const setCharacterInitiative = useCallback((encounterId: string, characterId: string, initiative: number) => {
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter) return;

    const updatedCharacters = encounter.characters.map(char =>
      char.id === characterId
        ? { ...char, initiative }
        : char
    );

    updateEncounter(encounterId, { characters: updatedCharacters });
  }, [state.encounters, updateEncounter]);

  // Начало боя (сортировка по инициативе)
  const startCombat = useCallback((encounterId: string) => {
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter) return;

    // Проверяем, что у всех персонажей установлена инициатива
    const charactersWithoutInitiative = encounter.characters.filter(char => char.initiative === null);
    if (charactersWithoutInitiative.length > 0) {
      throw new Error('У всех персонажей должна быть установлена инициатива');
    }

    // Сортируем по инициативе (по убыванию)
    const sortedCharacters = [...encounter.characters].sort((a, b) => {
      if (a.initiative === null || b.initiative === null) return 0;
      return b.initiative - a.initiative;
    });

    updateEncounter(encounterId, {
      characters: sortedCharacters,
      isActive: true,
      currentTurnIndex: 0,
      round: 1
    });
  }, [state.encounters, updateEncounter]);

  // Следующий ход
  const nextTurn = useCallback((encounterId: string) => {
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter || !encounter.isActive) return;

    let nextIndex = encounter.currentTurnIndex + 1;
    let newRound = encounter.round;

    // Пропускаем мертвых и без сознания
    while (nextIndex < encounter.characters.length) {
      const character = encounter.characters[nextIndex];
      if (character.status !== 'dead' && character.status !== 'unconscious') {
        break;
      }
      nextIndex++;
    }

    // Если дошли до конца списка, начинаем новый раунд
    if (nextIndex >= encounter.characters.length) {
      newRound++;
      nextIndex = 0;
      
      // Снова пропускаем мертвых и без сознания с начала списка
      while (nextIndex < encounter.characters.length) {
        const character = encounter.characters[nextIndex];
        if (character.status !== 'dead' && character.status !== 'unconscious') {
          break;
        }
        nextIndex++;
      }
    }

    updateEncounter(encounterId, {
      currentTurnIndex: nextIndex,
      round: newRound
    });
  }, [state.encounters, updateEncounter]);

  // Изменение статуса персонажа
  const setCharacterStatus = useCallback((encounterId: string, characterId: string, status: CharacterStatus) => {
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter) return;

    const updatedCharacters = encounter.characters.map(char =>
      char.id === characterId
        ? { 
            ...char, 
            status,
            // Сбрасываем спасброски только при переходе в статус "мертв" или "активен"
            // При переходе в "без сознания" сохраняем прогресс
            deathSaves: (status === 'dead' || status === 'active') ? { successes: 0, failures: 0 } : char.deathSaves
          }
        : char
    );

    updateEncounter(encounterId, { characters: updatedCharacters });
  }, [state.encounters, updateEncounter]);

  // Добавление спасброска от смерти
  const addDeathSave = useCallback((encounterId: string, characterId: string, saveType: DeathSaveType) => {
    console.log('=== addDeathSave called ===');
    console.log('encounterId:', encounterId);
    console.log('characterId:', characterId);
    console.log('saveType:', saveType);
    
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter) {
      console.log('Encounter not found!');
      return;
    }

    // Проверяем, что сейчас ход этого персонажа
    const currentCharacter = encounter.characters[encounter.currentTurnIndex];
    if (!currentCharacter || currentCharacter.id !== characterId) {
      console.log('Не ваш ход для спасброска');
      return;
    }

    console.log('Current character before update:', currentCharacter);

    const updatedCharacters = encounter.characters.map(char => {
      if (char.id === characterId && char.status === 'death-saving') {
        const newDeathSaves = { 
          successes: char.deathSaves.successes, 
          failures: char.deathSaves.failures 
        };
        
        switch (saveType) {
          case 'success':
            newDeathSaves.successes = Math.min(DEATH_SAVE_MAX, newDeathSaves.successes + 1);
            console.log(`Success added. New successes: ${newDeathSaves.successes}`);
            // Если 3 успеха - персонаж стабилизируется
            if (newDeathSaves.successes >= DEATH_SAVE_MAX) {
              return {
                ...char,
                status: 'unconscious' as CharacterStatus,
                deathSaves: newDeathSaves
              };
            }
            // Персонаж остается в статусе "спасброски от смерти" до 3 успехов
            return {
              ...char,
              status: 'death-saving' as CharacterStatus,
              deathSaves: newDeathSaves
            };
            
          case 'failure':
            newDeathSaves.failures = Math.min(DEATH_SAVE_MAX, newDeathSaves.failures + 1);
            console.log(`Failure added. New failures: ${newDeathSaves.failures}`);
            // Если 3 провала - персонаж умирает
            if (newDeathSaves.failures >= DEATH_SAVE_MAX) {
              return {
                ...char,
                status: 'dead' as CharacterStatus,
                deathSaves: { successes: 0, failures: 0 }
              };
            }
            // Персонаж остается в статусе "спасброски от смерти" до 3 провалов
            return {
              ...char,
              status: 'death-saving' as CharacterStatus,
              deathSaves: newDeathSaves
            };
            
          case 'critical-success':
            console.log('Critical success - character revives');
            // Критический успех: персонаж восстанавливает 1 хит-пойнт и приходит в сознание
            return {
              ...char,
              status: 'active' as CharacterStatus,
              deathSaves: { successes: 0, failures: 0 }
            };
            
          case 'critical-failure':
            newDeathSaves.failures = Math.min(DEATH_SAVE_MAX, newDeathSaves.failures + 2);
            console.log(`Critical failure added. New failures: ${newDeathSaves.failures}`);
            // Если 3 провала - персонаж умирает
            if (newDeathSaves.failures >= DEATH_SAVE_MAX) {
              return {
                ...char,
                status: 'dead' as CharacterStatus,
                deathSaves: { successes: 0, failures: 0 }
              };
            }
            // Персонаж остается в статусе "спасброски от смерти" до 3 провалов
            return {
              ...char,
              status: 'death-saving' as CharacterStatus,
              deathSaves: newDeathSaves
            };
            
          default:
            console.log('Unknown save type:', saveType);
            return char;
        }
      }
      return char;
    });

    // Обновляем энкаунтер
    updateEncounter(encounterId, { characters: updatedCharacters });

    // НЕ делаем автоматический переход - пользователь сам нажимает "Следующий ход"
    // setTimeout(() => {
    //   nextTurn(encounterId);
    // }, 100);
  }, [state.encounters, updateEncounter, nextTurn]);

  // Завершение боя
  const endCombat = useCallback((encounterId: string) => {
    updateEncounter(encounterId, {
      isActive: false,
      currentTurnIndex: -1
    });
  }, [updateEncounter]);

  // Сброс спасбросков персонажа
  const resetDeathSaves = useCallback((encounterId: string, characterId: string) => {
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter) return;

    const updatedCharacters = encounter.characters.map(char =>
      char.id === characterId
        ? { ...char, deathSaves: { successes: 0, failures: 0 } }
        : char
    );

    updateEncounter(encounterId, { characters: updatedCharacters });
  }, [state.encounters, updateEncounter]);

  // Получение текущего энкаунтера
  const getCurrentEncounter = useCallback(() => {
    if (!state.currentEncounterId) return null;
    return state.encounters.find(e => e.id === state.currentEncounterId) || null;
  }, [state]);

  // Смена текущего энкаунтера
  const setCurrentEncounter = useCallback((encounterId: string | null) => {
    setState(prev => {
      const nextState: InitiativeTrackerState = {
        ...prev,
        currentEncounterId: encounterId
      };
      saveToStorage(nextState);
      return nextState;
    });
  }, [saveToStorage]);

  // Проверка, заблокирован ли следующий ход (если текущий персонаж кидает спасброски от смерти)
  const isNextTurnBlocked = useCallback((encounterId: string) => {
    const encounter = state.encounters.find(e => e.id === encounterId);
    if (!encounter || !encounter.isActive || encounter.currentTurnIndex < 0) return false;

    const currentCharacter = encounter.characters[encounter.currentTurnIndex];
    
    // Кнопка заблокирована только если персонаж в статусе "спасброски от смерти"
    // И у него нет накопленных спасбросков (т.е. он еще не делал спасброк в этом ходу)
    const hasMadeDeathSave = (currentCharacter?.deathSaves.successes || 0) + (currentCharacter?.deathSaves.failures || 0) > 0;
    const isBlocked = currentCharacter && 
                     currentCharacter.status === 'death-saving' && 
                     !hasMadeDeathSave;
    
    return isBlocked;
  }, [state.encounters]);

  return {
    state,
    encounters: state.encounters,
    currentEncounter: getCurrentEncounter(),
    createEncounter,
    createEncounterFromBestiary,
    deleteEncounter,
    updateEncounter,
    setCharacterInitiative,
    startCombat,
    nextTurn,
    setCharacterStatus,
    addDeathSave,
    resetDeathSaves,
    endCombat,
    setCurrentEncounter,
    isNextTurnBlocked
  };
};
