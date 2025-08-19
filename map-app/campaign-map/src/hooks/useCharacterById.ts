import { useState, useEffect, useCallback } from 'react';
import { Character, CharacterData, calculateModifier, Spell, Tag, createTag, migrateCharacterData } from '../types/character';
import { useCharacters } from './useCharacters';

export const useCharacterById = (characterId: string | null) => {
  const { getCharacter, getCharacterData, updateCharacter } = useCharacters();
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка персонажа при изменении ID
  useEffect(() => {
    if (!characterId) {
      setCharacter(null);
      setCharacterData(null);
      setIsLoading(false);
      return;
    }

    const loadedCharacter = getCharacter(characterId);
    const loadedCharacterData = getCharacterData(characterId);

    setCharacter(loadedCharacter);
    setCharacterData(loadedCharacterData);
    setIsLoading(false);
  }, [characterId, getCharacter, getCharacterData]);

  // Сохранение персонажа
  const saveCharacter = useCallback((updatedCharacterData: CharacterData) => {
    if (!characterId) return;

    updateCharacter(characterId, updatedCharacterData);
    setCharacterData(updatedCharacterData);
  }, [characterId, updateCharacter]);

  // Обновление базовой информации
  const updateInfo = useCallback((field: string, value: any) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      info: {
        ...characterData.info,
        [field]: {
          ...characterData.info[field as keyof typeof characterData.info],
          value
        }
      }
    };

    // Также обновляем name.value если изменяется info.name
    if (field === 'name') {
      updated.name.value = value;
    }

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление дополнительной информации
  const updateSubInfo = useCallback((field: string, value: string) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      subInfo: {
        ...characterData.subInfo,
        [field]: {
          ...characterData.subInfo[field as keyof typeof characterData.subInfo],
          value
        }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление характеристик
  const updateStat = useCallback((statName: string, score: number) => {
    if (!characterData) return;

    const modifier = calculateModifier(score);
    
    const updated = {
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

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление спасбросков
  const updateSave = useCallback((saveName: string, isProf: boolean) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      saves: {
        ...characterData.saves,
        [saveName]: {
          ...characterData.saves[saveName as keyof typeof characterData.saves],
          isProf
        }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление навыков
  const updateSkill = useCallback((skillName: string, profLevel: 0 | 1 | 2) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      skills: {
        ...characterData.skills,
        [skillName]: {
          ...characterData.skills[skillName],
          isProf: profLevel
        }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление жизненности
  const updateVitality = useCallback((field: string, value: number | string) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      vitality: {
        ...characterData.vitality,
        [field]: { value }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление оружия
  const updateWeapon = useCallback((weaponId: string, weaponData: Partial<{ name: string; mod: string; dmg: string }>) => {
    if (!characterData) return;

    const weaponIndex = characterData.weaponsList.findIndex(w => w.id === weaponId);
    if (weaponIndex === -1) return;

    const updatedWeapons = [...characterData.weaponsList];
    updatedWeapons[weaponIndex] = {
      ...updatedWeapons[weaponIndex],
      ...(weaponData.name && { name: { value: weaponData.name } }),
      ...(weaponData.mod && { mod: { value: weaponData.mod } }),
      ...(weaponData.dmg && { dmg: { value: weaponData.dmg } })
    };

    const updated = {
      ...characterData,
      weaponsList: updatedWeapons
    };

    saveCharacter(updated);
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

    const updated = {
      ...characterData,
      weaponsList: [...characterData.weaponsList, newWeapon]
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Удаление оружия
  const removeWeapon = useCallback((weaponId: string) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      weaponsList: characterData.weaponsList.filter(w => w.id !== weaponId)
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Обновление монет
  const updateCoins = useCallback((coinType: string, value: number) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      coins: {
        ...characterData.coins,
        [coinType]: { value }
      }
    };

    saveCharacter(updated);
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

    const updated = {
      ...characterData,
      text: {
        ...characterData.text,
        [field]: { value: textContent }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Добавление заклинания
  const addSpell = useCallback((level: number, spell: Spell) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      spellsByLevel: {
        ...characterData.spellsByLevel,
        [level as keyof typeof characterData.spellsByLevel]: {
          spells: [...characterData.spellsByLevel[level as keyof typeof characterData.spellsByLevel].spells, spell]
        }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Удаление заклинания
  const removeSpell = useCallback((level: number, spellId: string) => {
    if (!characterData) return;

    const updated = {
      ...characterData,
      spellsByLevel: {
        ...characterData.spellsByLevel,
        [level as keyof typeof characterData.spellsByLevel]: {
          spells: characterData.spellsByLevel[level as keyof typeof characterData.spellsByLevel].spells.filter(s => s.id !== spellId)
        }
      }
    };

    saveCharacter(updated);
  }, [characterData, saveCharacter]);

  // Получение заклинаний по уровню
  const getSpellsByLevel = useCallback((level: number): Spell[] => {
    if (!characterData || !characterData.spellsByLevel) return [];
    const spellLevel = characterData.spellsByLevel[level as keyof typeof characterData.spellsByLevel];
    return spellLevel?.spells || [];
  }, [characterData]);

  // Добавление тега
  const addTag = useCallback((text: string) => {
    if (!characterData || !characterId) return;
    
    const newTag = createTag(text);
    const updated = {
      ...characterData,
      tags: [...(characterData.tags || []), newTag]
    };

    setCharacterData(updated);
    saveCharacter(updated);
  }, [characterData, characterId, saveCharacter]);

  // Удаление тега
  const removeTag = useCallback((tagId: string) => {
    if (!characterData || !characterId) return;

    const updated = {
      ...characterData,
      tags: characterData.tags?.filter(tag => tag.id !== tagId) || []
    };

    setCharacterData(updated);
    saveCharacter(updated);
  }, [characterData, characterId, saveCharacter]);

  // Получение всех тегов
  const getTags = useCallback((): Tag[] => {
    return characterData?.tags || [];
  }, [characterData]);

  // Получение текста из текстового поля
  const getTextContent = useCallback((field: string): string => {
    if (!characterData?.text[field as keyof typeof characterData.text]) return '';
    
    const textData = characterData.text[field as keyof typeof characterData.text].value.data;
    if (!textData.content || textData.content.length === 0) return '';
    
    const paragraph = textData.content.find((item: any) => item.type === 'paragraph');
    if (!paragraph?.content || paragraph.content.length === 0) return '';
    
    const textItem = paragraph.content.find((item: any) => item.type === 'text');
    return textItem?.text || '';
  }, [characterData]);

  // Вычисление бонуса мастерства на основе уровня
  const getProficiencyBonus = useCallback((): number => {
    if (!characterData) return 2;
    const level = characterData.info.level.value;
    return Math.floor((level - 1) / 4) + 2;
  }, [characterData]);

  // Вычисление итогового модификатора навыка
  const getSkillModifier = useCallback((skillName: string): number => {
    if (!characterData) return 0;

    const skill = characterData.skills[skillName];
    if (!skill) return 0;

    const baseStat = characterData.stats[skill.baseStat as keyof typeof characterData.stats];
    const baseModifier = baseStat.modifier;
    const proficiencyBonus = skill.isProf ? getProficiencyBonus() * (skill.isProf === 2 ? 2 : 1) : 0;

    return baseModifier + proficiencyBonus;
  }, [characterData, getProficiencyBonus]);

  // Вычисление итогового модификатора спасброска
  const getSaveModifier = useCallback((saveName: string): number => {
    if (!characterData) return 0;

    const save = characterData.saves[saveName as keyof typeof characterData.saves];
    const stat = characterData.stats[saveName as keyof typeof characterData.stats];
    
    if (!save || !stat) return 0;

    const baseModifier = stat.modifier;
    const proficiencyBonus = save.isProf ? getProficiencyBonus() : 0;

    return baseModifier + proficiencyBonus;
  }, [characterData, getProficiencyBonus]);

  // Экспорт персонажа
  const exportCharacter = useCallback(() => {
    if (!character) return null;
    return JSON.stringify(character, null, 2);
  }, [character]);

  // Импорт персонажа
  const importCharacter = useCallback((jsonData: string) => {
    if (!characterId) return false;
    
    try {
      const importedCharacter: Character = JSON.parse(jsonData);
      const importedCharacterData: CharacterData = migrateCharacterData(JSON.parse(importedCharacter.data));
      
      const updatedCharacter = {
        ...importedCharacter,
        data: JSON.stringify(importedCharacterData)
      };
      
      setCharacter(updatedCharacter);
      setCharacterData(importedCharacterData);
      updateCharacter(characterId, importedCharacterData);
      return true;
    } catch (error) {
      console.error('Ошибка при импорте персонажа:', error);
      return false;
    }
  }, [character, characterId, updateCharacter]);

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
    updateCoins,
    updateTextfield,
    
    // Методы работы с заклинаниями
    addSpell,
    removeSpell,
    getSpellsByLevel,
    
    // Методы работы с тегами
    addTag,
    removeTag,
    getTags,
    
    // Вспомогательные методы
    getTextContent,
    getSkillModifier,
    getSaveModifier,
    getProficiencyBonus,
    
    // Утилиты
    exportCharacter,
    importCharacter
  };
};