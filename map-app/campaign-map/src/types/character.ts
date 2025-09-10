// Типы данных для листа персонажа D&D

export interface Stat {
  name: string;
  label: string;
  score: number;
  modifier: number;
  check?: number;
}

export interface Stats {
  str: Stat;
  dex: Stat;
  con: Stat;
  int: Stat;
  wis: Stat;
  cha: Stat;
}

export interface SavingThrow {
  name: string;
  isProf: boolean;
}

export interface SavingThrows {
  str: SavingThrow;
  dex: SavingThrow;
  con: SavingThrow;
  int: SavingThrow;
  wis: SavingThrow;
  cha: SavingThrow;
}

export interface Skill {
  baseStat: string;
  name: string;
  label: string;
  isProf?: 0 | 1 | 2; // 0 - обычный, 1 - владение, 2 - экспертиза
}

export interface Skills {
  [key: string]: Skill;
}

export interface CharacterInfo {
  name: { value: string };
  charClass: { name: string; label: string; value: string };
  level: { name: string; label: string; value: number };
  background: { name: string; label: string; value: string };
  playerName: { name: string; label: string; value: string };
  race: { name: string; label: string; value: string };
  alignment: { name: string; label: string; value: string };
  experience: { name: string; label: string; value: number };
}

export interface SubInfo {
  age: { name: string; label: string; value: string };
  height: { name: string; label: string; value: string };
  weight: { name: string; label: string; value: string };
  eyes: { name: string; label: string; value: string };
  skin: { name: string; label: string; value: string };
  hair: { name: string; label: string; value: string };
}

export interface Vitality {
  'hp-dice-current': { value: number };
  'hp-dice-multi': Record<string, any>;
  'hp-max': { value: number };
  ac: { value: number };
  speed: { value: string };
  initiative: { value: number };
}

export interface Weapon {
  id: string;
  name: { value: string };
  mod: { value: string };
  dmg: { value: string };
}

export interface SpellsInfo {
  base: { name: string; label: string; value: string; code: string };
  save: { name: string; label: string; value: string };
  mod: { name: string; label: string; value: string };
  available: { classes: string[] };
}

export interface TextContent {
  data: {
    type: string;
    content: any[];
  };
}

export interface Spell {
  id: string;
  name: string;
  url: string;
}

export interface SpellLevel {
  spells: Spell[];
}

export interface Tag {
  id: string;
  text: string;
  color: string;
}

export interface TextFields {
  background: { value: TextContent };
  personality: { value: TextContent };
  ideals: { value: TextContent };
  bonds: { value: TextContent };
  flaws: { value: TextContent };
  equipment: { value: TextContent };
  prof: { value: TextContent };
  traits: { value: TextContent };
  features: { value: TextContent };
  attacks: { value: TextContent };
}

export interface CharacterData {
  isDefault: boolean;
  jsonType: string;
  template: string;
  name: { value: string };
  info: CharacterInfo;
  subInfo: SubInfo;
  spellsInfo: SpellsInfo;
  spells: Record<string, any>;
  spellsPact: Record<string, any>;
  spellsByLevel: {
    0: SpellLevel;
    1: SpellLevel;
    2: SpellLevel;
    3: SpellLevel;
    4: SpellLevel;
    5: SpellLevel;
    6: SpellLevel;
    7: SpellLevel;
    8: SpellLevel;
    9: SpellLevel;
  };
  proficiency: number;
  stats: Stats;
  saves: SavingThrows;
  skills: Skills;
  vitality: Vitality;
  weaponsList: Weapon[];
  weapons: Record<string, any>;
  text: TextFields;
  coins: {
    cp?: { value: number };
    sp?: { value: number };
    ep?: { value: number };
    gp?: { value: number };
    pp?: { value: number };
  };
  resources: Record<string, any>;
  bonusesSkills: Record<string, any>;
  bonusesStats: Record<string, any>;
  conditions: any[];
  tags: Tag[];
  createdAt: string;
  inspiration: boolean;
  avatar?: {
    jpeg?: string;
    webp?: string;
  };
  casterClass?: { value: string };
  hasCharacterSheet?: boolean;
}

export interface Character {
  disabledBlocks: {
    'info-left': string[];
    'info-right': string[];
    'notes-left': string[];
    'notes-right': string[];
    _id: string;
  };
  spells: {
    mode: string;
    prepared: string[];
    book: string[];
  };
  data: string; // JSON строка с CharacterData
  jsonType: string;
  version: string;
}

// Вспомогательные типы для работы с модификаторами характеристик
export const ABILITY_SCORES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type AbilityScore = typeof ABILITY_SCORES[number];

// Функция для вычисления модификатора характеристики
export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// Уровни заклинаний и их названия
export const SPELL_LEVELS = [
  { level: 0, name: 'Заговоры (0 уровень)' },
  { level: 1, name: '1-й уровень' },
  { level: 2, name: '2-й уровень' },
  { level: 3, name: '3-й уровень' },
  { level: 4, name: '4-й уровень' },
  { level: 5, name: '5-й уровень' },
  { level: 6, name: '6-й уровень' },
  { level: 7, name: '7-й уровень' },
  { level: 8, name: '8-й уровень' },
  { level: 9, name: '9-й уровень' }
] as const;

// Функция для создания URL заклинания
// Палитра цветов для тегов
export const TAG_COLORS = [
  '#f50', '#2db7f5', '#87d068', '#108ee9', '#722ed1',
  '#eb2f96', '#52c41a', '#faad14', '#13c2c2', '#1890ff',
  '#fa541c', '#a0d911', '#fadb14', '#40a9ff', '#36cfc9',
  '#9254de', '#f759ab', '#73d13d', '#ffa940', '#69c0ff'
];

// Функция для получения случайного цвета
export const getRandomTagColor = (): string => {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
};

// Функция для создания нового тега
export const createTag = (text: string): Tag => {
  return {
    id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    color: getRandomTagColor()
  };
};

export const createSpellUrl = (spellName: string): string => {
  const encodedName = encodeURIComponent(spellName);
  return `https://next.dnd.su/spells/?search=${encodedName}`;
};

// Функция для создания нового заклинания
export const createSpell = (name: string): Spell => {
  return {
    id: `spell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    url: createSpellUrl(name.trim())
  };
};

// Функция для миграции старых данных персонажа
export const migrateCharacterData = (characterData: any): CharacterData => {
  // Базовый дефолтный объект
  const defaults: CharacterData = JSON.parse(createEmptyCharacter().data);

  // Безопасные хелперы
  const safe = <T,>(value: T | undefined, fallback: T): T => (value === undefined || value === null ? fallback : value);

  // Слияние по секциям, чтобы гарантировать наличие всех полей
  const merged: CharacterData = {
    ...defaults,
    ...characterData,
    name: { value: safe(characterData?.name?.value, defaults.name.value) },
    info: {
      ...defaults.info,
      ...characterData?.info,
      name: { value: safe(characterData?.info?.name?.value, defaults.info.name.value) },
      charClass: {
        name: 'charClass',
        label: 'класс и уровень',
        value: safe(characterData?.info?.charClass?.value, defaults.info.charClass.value)
      },
      level: { name: 'level', label: 'уровень', value: safe(characterData?.info?.level?.value, defaults.info.level.value) },
      background: { name: 'background', label: 'предыстория', value: safe(characterData?.info?.background?.value, defaults.info.background.value) },
      playerName: { name: 'playerName', label: 'имя игрока', value: safe(characterData?.info?.playerName?.value, defaults.info.playerName.value) },
      race: { name: 'race', label: 'раса', value: safe(characterData?.info?.race?.value, defaults.info.race.value) },
      alignment: { name: 'alignment', label: 'мировоззрение', value: safe(characterData?.info?.alignment?.value, defaults.info.alignment.value) },
      experience: { name: 'experience', label: 'опыт', value: safe(characterData?.info?.experience?.value, defaults.info.experience.value) }
    },
    subInfo: { ...defaults.subInfo, ...characterData?.subInfo },
    spellsInfo: { ...defaults.spellsInfo, ...characterData?.spellsInfo },
    spells: characterData?.spells ?? defaults.spells,
    spellsPact: characterData?.spellsPact ?? defaults.spellsPact,
    spellsByLevel: (() => {
      const src = characterData?.spellsByLevel || {};
      const out: any = {};
      for (let lvl = 0; lvl <= 9; lvl++) {
        const from = src[lvl] || {};
        out[lvl] = { spells: Array.isArray(from.spells) ? from.spells : [] };
      }
      return out as CharacterData['spellsByLevel'];
    })(),
    proficiency: safe(characterData?.proficiency, defaults.proficiency),
    stats: { ...defaults.stats, ...characterData?.stats },
    saves: { ...defaults.saves, ...characterData?.saves },
    skills: { ...defaults.skills, ...characterData?.skills },
    vitality: { ...defaults.vitality, ...characterData?.vitality },
    weaponsList: characterData?.weaponsList ?? defaults.weaponsList,
    weapons: characterData?.weapons ?? defaults.weapons,
    text: { ...defaults.text, ...characterData?.text },
    coins: { ...defaults.coins, ...characterData?.coins },
    resources: characterData?.resources ?? defaults.resources,
    bonusesSkills: characterData?.bonusesSkills ?? defaults.bonusesSkills,
    bonusesStats: characterData?.bonusesStats ?? defaults.bonusesStats,
    conditions: characterData?.conditions ?? defaults.conditions,
    tags: characterData?.tags ?? defaults.tags,
    createdAt: safe(characterData?.createdAt, defaults.createdAt),
    inspiration: safe(characterData?.inspiration, defaults.inspiration),
    avatar: characterData?.avatar ?? defaults.avatar,
    casterClass: characterData?.casterClass ?? defaults.casterClass
  };

  return merged;
};

// Функция для создания пустого персонажа
export const createEmptyCharacter = (): Character => {
  const characterData: CharacterData = {
    isDefault: true,
    jsonType: 'character',
    template: 'default',
    name: { value: 'Новый персонаж' },
    info: {
      name: { value: 'Новый персонаж' },
      charClass: { name: 'charClass', label: 'класс и уровень', value: '' },
      level: { name: 'level', label: 'уровень', value: 1 },
      background: { name: 'background', label: 'предыстория', value: '' },
      playerName: { name: 'playerName', label: 'имя игрока', value: '' },
      race: { name: 'race', label: 'раса', value: '' },
      alignment: { name: 'alignment', label: 'мировоззрение', value: '' },
      experience: { name: 'experience', label: 'опыт', value: 0 }
    },
    subInfo: {
      age: { name: 'age', label: 'возраст', value: '' },
      height: { name: 'height', label: 'рост', value: '' },
      weight: { name: 'weight', label: 'вес', value: '' },
      eyes: { name: 'eyes', label: 'глаза', value: '' },
      skin: { name: 'skin', label: 'кожа', value: '' },
      hair: { name: 'hair', label: 'волосы', value: '' }
    },
    spellsInfo: {
      base: { name: 'base', label: 'Базовая характеристика заклинаний', value: '', code: 'cha' },
      save: { name: 'save', label: 'Сложность спасброска', value: '' },
      mod: { name: 'mod', label: 'Бонус атаки заклинанием', value: '' },
      available: { classes: [] }
    },
    spells: {},
    spellsPact: {},
    spellsByLevel: {
      0: { spells: [] },
      1: { spells: [] },
      2: { spells: [] },
      3: { spells: [] },
      4: { spells: [] },
      5: { spells: [] },
      6: { spells: [] },
      7: { spells: [] },
      8: { spells: [] },
      9: { spells: [] }
    },
    proficiency: 2,
    stats: {
      str: { name: 'str', label: 'Сила', score: 10, modifier: 0 },
      dex: { name: 'dex', label: 'Ловкость', score: 10, modifier: 0 },
      con: { name: 'con', label: 'Телосложение', score: 10, modifier: 0 },
      int: { name: 'int', label: 'Интеллект', score: 10, modifier: 0 },
      wis: { name: 'wis', label: 'Мудрость', score: 10, modifier: 0 },
      cha: { name: 'cha', label: 'Харизма', score: 10, modifier: 0 }
    },
    saves: {
      str: { name: 'str', isProf: false },
      dex: { name: 'dex', isProf: false },
      con: { name: 'con', isProf: false },
      int: { name: 'int', isProf: false },
      wis: { name: 'wis', isProf: false },
      cha: { name: 'cha', isProf: false }
    },
    skills: {
      acrobatics: { baseStat: 'dex', name: 'acrobatics', label: 'Акробатика' },
      investigation: { baseStat: 'int', name: 'investigation', label: 'Анализ' },
      athletics: { baseStat: 'str', name: 'athletics', label: 'Атлетика' },
      perception: { baseStat: 'wis', name: 'perception', label: 'Восприятие' },
      survival: { baseStat: 'wis', name: 'survival', label: 'Выживание' },
      performance: { baseStat: 'cha', name: 'performance', label: 'Выступление' },
      intimidation: { baseStat: 'cha', name: 'intimidation', label: 'Запугивание' },
      history: { baseStat: 'int', name: 'history', label: 'История' },
      'sleight of hand': { baseStat: 'dex', name: 'sleight of hand', label: 'Ловкость рук' },
      arcana: { baseStat: 'int', name: 'arcana', label: 'Магия' },
      medicine: { baseStat: 'wis', name: 'medicine', label: 'Медицина' },
      deception: { baseStat: 'cha', name: 'deception', label: 'Обман' },
      nature: { baseStat: 'int', name: 'nature', label: 'Природа' },
      insight: { baseStat: 'wis', name: 'insight', label: 'Проницательность' },
      religion: { baseStat: 'int', name: 'religion', label: 'Религия' },
      stealth: { baseStat: 'dex', name: 'stealth', label: 'Скрытность' },
      persuasion: { baseStat: 'cha', name: 'persuasion', label: 'Убеждение' },
      'animal handling': { baseStat: 'wis', name: 'animal handling', label: 'Уход за животными' }
    },
    vitality: {
      'hp-dice-current': { value: 1 },
      'hp-dice-multi': {},
      'hp-max': { value: 8 },
      ac: { value: 10 },
      speed: { value: '30' },
      initiative: { value: 0 }
    },
    weaponsList: [],
    weapons: {},
    text: {
      background: { value: { data: { type: 'doc', content: [] } } },
      personality: { value: { data: { type: 'doc', content: [] } } },
      ideals: { value: { data: { type: 'doc', content: [] } } },
      bonds: { value: { data: { type: 'doc', content: [] } } },
      flaws: { value: { data: { type: 'doc', content: [] } } },
      equipment: { value: { data: { type: 'doc', content: [] } } },
      prof: { value: { data: { type: 'doc', content: [] } } },
      traits: { value: { data: { type: 'doc', content: [] } } },
      features: { value: { data: { type: 'doc', content: [] } } },
      attacks: { value: { data: { type: 'doc', content: [] } } }
    },
    coins: {
      cp: { value: 0 },
      sp: { value: 0 },
      ep: { value: 0 },
      gp: { value: 0 },
      pp: { value: 0 }
    },
    resources: {},
    bonusesSkills: {},
    bonusesStats: {},
    conditions: [],
    tags: [],
    createdAt: new Date().toISOString(),
    inspiration: false,
    hasCharacterSheet: true
  };

  return {
    disabledBlocks: {
      'info-left': [],
      'info-right': [],
      'notes-left': [],
      'notes-right': [],
      _id: `character-${Date.now()}`
    },
    spells: {
      mode: 'cards',
      prepared: [],
      book: []
    },
    data: JSON.stringify(characterData),
    jsonType: 'character',
    version: '2'
  };
};