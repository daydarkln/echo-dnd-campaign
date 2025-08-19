// Типы для поддержки видимости полей
export type VisibilityStatus = 'visible' | 'hidden';

// Базовый тип для объектов с полями видимости
export interface VisibilityField<T> {
  value: T;
  visibility: VisibilityStatus;
}

// Утилитарный тип для добавления видимости ко всем полям кроме id
export type WithVisibility<T> = {
  id: T extends { id: infer U } ? U : never;
} & {
  [K in keyof Omit<T, 'id'>]: VisibilityField<T[K]>;
};

// Функция для проверки, является ли объект полем с видимостью
function isVisibilityField(obj: unknown): obj is VisibilityField<unknown> {
  return (
    typeof obj === 'object' && 
    obj !== null && 
    'visibility' in obj && 
    'value' in obj &&
    typeof (obj as any).visibility === 'string' &&
    ['visible', 'hidden'].includes((obj as any).visibility)
  );
}

// Тип для частичного обновления видимости
export type PartialVisibility<T> = {
  id: T extends { id: infer U } ? U : never;
} & {
  [K in keyof Omit<T, 'id'>]?: Partial<VisibilityField<T[K]>>;
};

// Функция для извлечения только видимых полей
export function getVisibleFields<T>(item: WithVisibility<T>): Partial<T> {
  const result: any = { id: item.id };
  
  for (const [key, field] of Object.entries(item)) {
    if (key !== 'id' && isVisibilityField(field)) {
      if (field.visibility === 'visible') {
        result[key] = field.value;
      }
    }
  }
  
  return result;
}

// Функция для создания объекта с видимостью из обычного объекта
export function withDefaultVisibility<T extends { id: any }>(
  item: T, 
  defaultVisibility: VisibilityStatus = 'visible'
): WithVisibility<T> {
  const result: any = { id: item.id };
  
  for (const [key, value] of Object.entries(item)) {
    if (key !== 'id') {
      result[key] = {
        value,
        visibility: defaultVisibility
      };
    }
  }
  
  return result;
}

// Функция для обновления видимости конкретного поля
export function updateFieldVisibility<T extends { id: any }>(
  item: WithVisibility<T>,
  field: keyof Omit<T, 'id'>,
  visibility: VisibilityStatus
): WithVisibility<T> {
  return {
    ...item,
    [field]: {
      ...item[field],
      visibility
    }
  };
}

// Типы для видимости отдельных элементов в полях локаций
export interface LocationFieldVisibility {
  amplifiers: { [index: number]: VisibilityStatus };
  dampeners: { [index: number]: VisibilityStatus };
  encounters: { [index: number]: VisibilityStatus };
  loot: { [index: number]: VisibilityStatus };
  clues: { [index: number]: VisibilityStatus };
}

// Типы для видимости полей путей (obstacles и requirements - массивы, notes - одиночное значение)
export interface RouteFieldVisibility {
  obstacles: { [index: number]: VisibilityStatus };
  requirements: { [index: number]: VisibilityStatus };
  notes: VisibilityStatus;
}

// Общий тип для управления видимостью полей
export interface FieldVisibilityState {
  locations: { [locationId: string]: LocationFieldVisibility };
  routes: { [routeId: string]: RouteFieldVisibility };
}

// Вспомогательные функции для создания дефолтной видимости
export const createDefaultLocationFieldVisibility = (location: any): LocationFieldVisibility => {
  const createArrayVisibility = (array: any[]) => {
    const visibility: { [index: number]: VisibilityStatus } = {};
    array.forEach((_, index) => {
      visibility[index] = 'visible';
    });
    return visibility;
  };

  return {
    amplifiers: createArrayVisibility(location.amplifiers || []),
    dampeners: createArrayVisibility(location.dampeners || []),
    encounters: createArrayVisibility(location.encounters || []),
    loot: createArrayVisibility(location.loot || []),
    clues: createArrayVisibility(location.clues || [])
  };
};

export const createDefaultRouteFieldVisibility = (route: any): RouteFieldVisibility => {
  const createArrayVisibility = (array: any[]) => {
    const visibility: { [index: number]: VisibilityStatus } = {};
    array.forEach((_, index) => {
      visibility[index] = 'visible';
    });
    return visibility;
  };

  return {
    obstacles: createArrayVisibility(route.obstacles || []),
    requirements: createArrayVisibility(route.requirements || []),
    notes: 'visible'
  };
};

// Дефолтные пустые настройки видимости (для обратной совместимости)
export const defaultLocationFieldVisibility: LocationFieldVisibility = {
  amplifiers: {},
  dampeners: {},
  encounters: {},
  loot: {},
  clues: {}
};

export const defaultRouteFieldVisibility: RouteFieldVisibility = {
  obstacles: {},
  requirements: {},
  notes: 'visible'
};

// Типы для запросов видимости полей определены в types/api.ts