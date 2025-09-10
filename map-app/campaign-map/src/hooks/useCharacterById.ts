import { useState, useEffect, useCallback } from 'react';
import { Character, CharacterData, calculateModifier, Spell, migrateCharacterData, createTag, Tag } from '../types/character';

const STORAGE_KEY = 'dnd-characters-collection';

export const useCharacterById = (characterId?: string) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка персонажа из localStorage или JSON server
  useEffect(() => {
    if (!characterId) {
      setIsLoading(false);
      return;
    }

    const loadCharacter = async () => {
      try {
        let loadedCharacter: Character | null = null;

        // Сначала пытаемся загрузить из localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const collection = JSON.parse(stored);
          if (collection[characterId]) {
            loadedCharacter = collection[characterId];
          }
        }

        // Если не найдено в localStorage, пытаемся загрузить с JSON server
        if (!loadedCharacter) {
          try {
            const response = await fetch(`http://localhost:3001/characters/${characterId}`);
            if (response.ok) {
              loadedCharacter = await response.json();
            }
          } catch (error) {
            console.warn('JSON server недоступен:', error);
          }
        }

        if (loadedCharacter) {
          const rawCharacterData = JSON.parse(loadedCharacter.data);
          const migratedCharacterData = migrateCharacterData(rawCharacterData);
          
          // Обновляем данные персонажа, если была выполнена миграция
          const updatedCharacter = {
            ...loadedCharacter,
            data: JSON.stringify(migratedCharacterData)
          };
          
          setCharacter(updatedCharacter);
          setCharacterData(migratedCharacterData);
          
          // Сохраняем обновленные данные обратно в localStorage
          if (JSON.stringify(rawCharacterData) !== JSON.stringify(migratedCharacterData)) {
            const collection = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            collection[characterId] = updatedCharacter;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке персонажа:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacter();
  }, [characterId]);

  // Сохранение персонажа
  const saveCharacter = useCallback(async (updatedCharacterData: CharacterData) => {
    if (!character || !characterId) return;

    const updatedCharacter = {
      ...character,
      data: JSON.stringify(updatedCharacterData)
    };

    setCharacter(updatedCharacter);
    setCharacterData(updatedCharacterData);

    // Сохраняем в localStorage
    const collection = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    collection[characterId] = updatedCharacter;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));

    // Пытаемся сохранить на JSON server
    try {
      await fetch(`http://localhost:3001/characters/${characterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCharacter),
      });
    } catch (error) {
      console.warn('Не удалось сохранить на JSON server:', error);
    }
  }, [character, characterId]);

  // Обновление информации о персонаже
  const updateInfo = useCallback((field: string, value: any) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      info: {
        ...characterData.info,
        [field]: {
          ...characterData.info[field as keyof typeof characterData.info],
          value: value
        }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление дополнительной информации
  const updateSubInfo = useCallback((field: string, value: any) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      subInfo: {
        ...characterData.subInfo,
        [field]: {
          ...characterData.subInfo[field as keyof typeof characterData.subInfo],
          value: value
        }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление характеристик
  const updateStat = useCallback((statName: string, score: number) => {
    if (!characterData) return;
    
    const modifier = calculateModifier(score);
    const updatedData = {
      ...characterData,
      stats: {
        ...characterData.stats,
        [statName]: {
          ...characterData.stats[statName as keyof typeof characterData.stats],
          score,
          modifier
        }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление спасбросков
  const updateSave = useCallback((saveName: string, isProf: boolean) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      saves: {
        ...characterData.saves,
        [saveName]: {
          ...characterData.saves[saveName as keyof typeof characterData.saves],
          isProf
        }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление навыков
  const updateSkill = useCallback((skillName: string, proficiency: 0 | 1 | 2) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      skills: {
        ...characterData.skills,
        [skillName]: {
          ...characterData.skills[skillName],
          isProf: proficiency
        }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление жизнеспособности
  const updateVitality = useCallback((field: string, value: any) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      vitality: {
        ...characterData.vitality,
        [field]: {
          ...characterData.vitality[field as keyof typeof characterData.vitality],
          value: value
        }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление оружия
  const updateWeapon = useCallback((weaponId: string, field: string, value: any) => {
    if (!characterData) return;

    const updatedWeapons = characterData.weaponsList.map(weapon => 
      weapon.id === weaponId 
        ? { ...weapon, [field]: { ...(weapon[field as keyof typeof weapon] as any), value } }
        : weapon
    );

    const updatedData = {
      ...characterData,
      weaponsList: updatedWeapons
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Добавление оружия
  const addWeapon = useCallback(() => {
    if (!characterData) return;

    const newWeapon = {
      id: `weapon-${Date.now()}`,
      name: { value: 'Новое оружие' },
      mod: { value: '+0' },
      dmg: { value: '1d4' }
    };

    const updatedData = {
      ...characterData,
      weaponsList: [...characterData.weaponsList, newWeapon]
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Удаление оружия
  const removeWeapon = useCallback((weaponId: string) => {
    if (!characterData) return;

    const updatedData = {
      ...characterData,
      weaponsList: characterData.weaponsList.filter(w => w.id !== weaponId)
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление заклинаний
  const updateSpellsByLevel = useCallback((level: number, spells: Spell[]) => {
    if (!characterData) return;

    const updatedData = {
      ...characterData,
      spellsByLevel: {
        ...characterData.spellsByLevel,
        [level]: { spells }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление текстовых полей
  const updateTextField = useCallback((field: string, value: any) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      text: {
        ...characterData.text,
        [field]: { value }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление монет
  const updateCoins = useCallback((coinType: string, value: number) => {
    if (!characterData) return;
    
    const updatedData = {
      ...characterData,
      coins: {
        ...characterData.coins,
        [coinType]: { value }
      }
    };
    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Обновление текстовых полей (упрощенная версия)
  const updateTextfield = useCallback((field: string, value: string) => {
    if (!characterData) return;

    const textContent = {
      data: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: value ? [{ type: 'text', text: value }] : []
          }
        ]
      }
    };

    const updatedData = {
      ...characterData,
      text: {
        ...characterData.text,
        [field]: { value: textContent }
      }
    };

    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Добавление заклинания
  const addSpell = useCallback((level: number, spell: Spell) => {
    if (!characterData) return;

    const updatedData = {
      ...characterData,
      spellsByLevel: {
        ...characterData.spellsByLevel,
        [level as keyof typeof characterData.spellsByLevel]: {
          spells: [...characterData.spellsByLevel[level as keyof typeof characterData.spellsByLevel].spells, spell]
        }
      }
    };

    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Удаление заклинания
  const removeSpell = useCallback((level: number, spellId: string) => {
    if (!characterData) return;

    const updatedData = {
      ...characterData,
      spellsByLevel: {
        ...characterData.spellsByLevel,
        [level as keyof typeof characterData.spellsByLevel]: {
          spells: characterData.spellsByLevel[level as keyof typeof characterData.spellsByLevel].spells.filter(s => s.id !== spellId)
        }
      }
    };

    saveCharacter(updatedData);
  }, [characterData, saveCharacter]);

  // Получение заклинаний по уровню
  const getSpellsByLevel = useCallback((level: number) => {
    if (!characterData) return [];
    return characterData.spellsByLevel[level as keyof typeof characterData.spellsByLevel]?.spells || [];
  }, [characterData]);

  // Получение содержимого текстового поля
  const getTextContent = useCallback((field: string): string => {
    if (!characterData?.text?.[field as keyof typeof characterData.text]?.value?.data?.content) return '';
    
    const content = characterData.text[field as keyof typeof characterData.text].value.data.content;
    return content.map((paragraph: any) => 
      paragraph.content?.map((text: any) => text.text || '').join('') || ''
    ).join('\n');
  }, [characterData]);

  // Получение модификатора навыка
  const getSkillModifier = useCallback((skillName: string): number => {
    if (!characterData) return 0;
    
    const skill = characterData.skills[skillName];
    if (!skill) return 0;
    
    const baseStat = characterData.stats[skill.baseStat as keyof typeof characterData.stats];
    let modifier = baseStat?.modifier || 0;
    
    // Добавляем бонус мастерства
    const proficiency = skill.isProf || 0;
    if (proficiency > 0) {
      modifier += characterData.proficiency * proficiency;
    }
    
    return modifier;
  }, [characterData]);

  // Получение модификатора спасброска
  const getSaveModifier = useCallback((saveName: string): number => {
    if (!characterData) return 0;
    
    const save = characterData.saves[saveName as keyof typeof characterData.saves];
    const baseStat = characterData.stats[saveName as keyof typeof characterData.stats];
    
    let modifier = baseStat?.modifier || 0;
    
    if (save?.isProf) {
      modifier += characterData.proficiency;
    }
    
    return modifier;
  }, [characterData]);

  const getProficiencyBonus = useCallback(() => {
    return characterData?.proficiency || 0;
  }, [characterData]);

  // Сброс персонажа (только для дефолтного hook)
  const resetCharacter = useCallback(() => {
    // Для персонажей по ID сброс не имеет смысла
    console.warn('resetCharacter не поддерживается для персонажей по ID');
  }, []);

  // Экспорт персонажа
  const exportCharacter = useCallback(() => {
    if (!character) return '';
    return JSON.stringify(character, null, 2);
  }, [character]);

  // Импорт персонажа (только для дефолтного hook)
  const importCharacter = useCallback((data: string): boolean => {
    // Для персонажей по ID импорт не имеет смысла
    console.warn('importCharacter не поддерживается для персонажей по ID');
    return false;
  }, []);

  // Управление тегами
  const addTag = useCallback((text: string) => {
    if (!characterData) return;
    
    const newTag = createTag(text);
    const updatedCharacterData = {
      ...characterData,
      tags: [...characterData.tags, newTag]
    };
    setCharacterData(updatedCharacterData);
    saveCharacter(updatedCharacterData);
  }, [characterData, saveCharacter]);

  const removeTag = useCallback((tagId: string) => {
    if (!characterData) return;
    
    const updatedCharacterData = {
      ...characterData,
      tags: characterData.tags.filter((tag: Tag) => tag.id !== tagId)
    };
    setCharacterData(updatedCharacterData);
    saveCharacter(updatedCharacterData);
  }, [characterData, saveCharacter]);

  const getTags = useCallback(() => {
    return characterData?.tags || [];
  }, [characterData]);

  return {
    character,
    characterData,
    isLoading,
    
    // Методы обновления
    updateInfo,
    updateSubInfo,
    updateStat,
    updateSave,
    updateSkill,
    updateVitality,
    updateWeapon,
    addWeapon,
    removeWeapon,
    updateSpellsByLevel,
    updateTextField,
    updateCoins,
    updateTextfield,
    addSpell,
    removeSpell,
    getSpellsByLevel,
    addTag,
    removeTag,
    getTags,
    getTextContent,
    getSkillModifier,
    getSaveModifier,
    getProficiencyBonus,
    resetCharacter,
    exportCharacter,
    importCharacter,
    saveCharacter
  };
};