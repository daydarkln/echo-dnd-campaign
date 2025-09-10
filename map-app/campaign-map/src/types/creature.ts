export type CreatureSize = 'Крошечный' | 'Маленький' | 'Средний' | 'Большой' | 'Огромный' | 'Гигантский';
export type CreatureType = 'Аберрация' | 'Зверь' | 'Небожитель' | 'Конструкт' | 'Дракон' | 'Элементаль' | 'Фея' | 'Исчадие' | 'Великан' | 'Гуманоид' | 'Монстр' | 'Нежить' | 'Растение' | 'Слизь';
export type CreatureAlignment = 'Законно-добрый' | 'Нейтрально-добрый' | 'Хаотично-добрый' | 'Законно-нейтральный' | 'Нейтральный' | 'Хаотично-нейтральный' | 'Законно-злой' | 'Нейтрально-злой' | 'Хаотично-злой' | 'Без мировоззрения';
export type DamageType = 'Кислота' | 'Холод' | 'Огонь' | 'Сила' | 'Молния' | 'Некротика' | 'Яд' | 'Психика' | 'Излучение' | 'Гром' | 'Дробящий' | 'Колющий' | 'Рубящий';
export type ConditionType = 'Ослеплённый' | 'Очарованный' | 'Оглушённый' | 'Испуганный' | 'Схваченный' | 'Недееспособный' | 'Невидимый' | 'Парализованный' | 'Окаменевший' | 'Отравленный' | 'Лежащий ничком' | 'Сдержанный' | 'Оглушённый' | 'Без сознания';

export interface CreatureStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CreatureSavingThrows {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

export interface CreatureSkills {
  [skillName: string]: number;
}

export interface CreatureSpeed {
  walk?: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

export interface CreatureSenses {
  blindsight?: number;
  darkvision?: number;
  tremorsense?: number;
  truesight?: number;
  passivePerception: number;
}

export interface CreatureAction {
  name: string;
  description: string;
  type: 'action' | 'bonus_action' | 'reaction' | 'legendary_action' | 'lair_action';
  damage?: {
    dice: string;
    type: DamageType;
    bonus?: number;
  };
  attackBonus?: number;
  savingThrow?: {
    ability: keyof CreatureStats;
    dc: number;
  };
  recharge?: string; // "5-6" или "Short Rest" или "Long Rest"
  uses?: number;
}

export interface CreatureTrait {
  name: string;
  description: string;
}

export interface CreatureSpellcasting {
  level: number;
  ability: keyof CreatureStats;
  saveDc: number;
  attackBonus: number;
  spells: {
    [level: string]: {
      slots?: number;
      spells: string[];
    };
  };
}

export interface CreatureData {
  // Основная информация
  name: string;
  size: CreatureSize;
  type: CreatureType;
  subtype?: string;
  alignment: CreatureAlignment;
  
  // Боевые характеристики
  armorClass: number;
  armorType?: string;
  hitPoints: number;
  hitDice: string;
  speed: CreatureSpeed;
  
  // Характеристики
  stats: CreatureStats;
  savingThrows?: CreatureSavingThrows;
  skills?: CreatureSkills;
  
  // Сопротивления и иммунитеты
  damageVulnerabilities?: DamageType[];
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  conditionImmunities?: ConditionType[];
  
  // Чувства и языки
  senses: CreatureSenses;
  languages?: string[];
  
  // Уровень опасности
  challengeRating: string; // "1/4", "1/2", "1", "2", etc.
  proficiencyBonus: number;
  experiencePoints: number;
  
  // Способности
  traits?: CreatureTrait[];
  actions?: CreatureAction[];
  bonusActions?: CreatureAction[];
  reactions?: CreatureAction[];
  legendaryActions?: {
    perTurn: number;
    actions: CreatureAction[];
  };
  lairActions?: CreatureAction[];
  
  // Заклинания (если есть)
  spellcasting?: CreatureSpellcasting;
  
  // Дополнительная информация
  environment?: string[];
  source?: string;
  description?: string;
  lore?: string;
  
  // Метаданные
  tags?: string[];
  customData?: Record<string, any>;
}

export interface Creature {
  id: string;
  data: string; // JSON строка с CreatureData
  createdAt: string;
  updatedAt?: string;
  
  // Дополнительные поля для удобства поиска
  name?: string; // Дублируется из data для быстрого поиска
  type?: CreatureType;
  challengeRating?: string;
  tags?: string[];
}

export interface CreateCreatureInput {
  data: CreatureData;
}

export interface UpdateCreatureInput {
  data?: CreatureData;
  updatedAt?: string;
}

// Интерфейс для импорта существ
export interface CreatureImportData {
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment: string;
  
  armor_class: number | string;
  hit_points: number | string;
  hit_dice?: string;
  speed: string | CreatureSpeed;
  
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  saving_throws?: string | CreatureSavingThrows;
  skills?: string | CreatureSkills;
  
  damage_vulnerabilities?: string | DamageType[];
  damage_resistances?: string | DamageType[];
  damage_immunities?: string | DamageType[];
  condition_immunities?: string | ConditionType[];
  
  senses?: string | CreatureSenses;
  languages?: string | string[];
  
  challenge_rating: string | number;
  
  traits?: Array<{name: string; desc: string[]}>;
  actions?: Array<{name: string; desc: string[]}>;
  bonus_actions?: Array<{name: string; desc: string[]}>;
  reactions?: Array<{name: string; desc: string[]}>;
  legendary_actions?: Array<{name: string; desc: string[]}>;
  
  // Дополнительные поля для разных источников
  [key: string]: any;
}

// Утилитарные функции
export function createEmptyCreature(): Creature {
  const emptyData: CreatureData = {
    name: '',
    size: 'Средний',
    type: 'Гуманоид',
    alignment: 'Нейтральный',
    armorClass: 10,
    hitPoints: 1,
    hitDice: '1d8',
    speed: { walk: 30 },
    stats: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10
    },
    senses: {
      passivePerception: 10
    },
    challengeRating: '0',
    proficiencyBonus: 2,
    experiencePoints: 10
  };

  return {
    id: `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    data: JSON.stringify(emptyData),
    createdAt: new Date().toISOString(),
    name: '',
    type: 'Гуманоид',
    challengeRating: '0',
    tags: []
  };
}

export function parseCreatureData(creature: Creature): CreatureData {
  try {
    const parsed = JSON.parse(creature.data);
    console.log('Успешно распарсили данные существа:', parsed);
    return parsed;
  } catch (error) {
    console.error('Ошибка при парсинге данных существа:', error);
    console.error('Проблемные данные:', creature.data);
    
    // Пытаемся восстановить данные из резервных полей
    const fallbackData: CreatureData = {
      name: creature.name || 'Неизвестное существо',
      size: 'Средний' as any,
      type: creature.type as any || 'Гуманоид' as any,
      alignment: 'Нейтральный' as any,
      armorClass: 10,
      hitPoints: 1,
      hitDice: '1d8',
      speed: { walk: 30 },
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      senses: { passivePerception: 10 },
      challengeRating: creature.challengeRating || '0',
      proficiencyBonus: 2,
      experiencePoints: 10,
      tags: creature.tags || []
    };
    
    return fallbackData;
  }
}

export function getCreatureModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function calculateProficiencyBonus(challengeRating: string): number {
  const cr = parseFloat(challengeRating);
  if (cr < 1) return 2;
  if (cr <= 4) return 2;
  if (cr <= 8) return 3;
  if (cr <= 12) return 4;
  if (cr <= 16) return 5;
  if (cr <= 20) return 6;
  if (cr <= 24) return 7;
  if (cr <= 28) return 8;
  return 9;
}

export function getExperiencePoints(challengeRating: string): number {
  const crToXp: Record<string, number> = {
    '0': 10,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1100,
    '5': 1800,
    '6': 2300,
    '7': 2900,
    '8': 3900,
    '9': 5000,
    '10': 5900,
    '11': 7200,
    '12': 8400,
    '13': 10000,
    '14': 11500,
    '15': 13000,
    '16': 15000,
    '17': 18000,
    '18': 20000,
    '19': 22000,
    '20': 25000,
    '21': 33000,
    '22': 41000,
    '23': 50000,
    '24': 62000,
    '25': 75000,
    '26': 90000,
    '27': 105000,
    '28': 120000,
    '29': 135000,
    '30': 155000
  };
  
  return crToXp[challengeRating] || 10;
}
