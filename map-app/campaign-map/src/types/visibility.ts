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

// Типы для видимости полей локаций
export interface LocationFieldVisibility {
  amplifiers: VisibilityStatus;
  dampeners: VisibilityStatus;
  encounters: VisibilityStatus;
  loot: VisibilityStatus;
  clues: VisibilityStatus;
}

// Типы для видимости полей путей
export interface RouteFieldVisibility {
  obstacles: VisibilityStatus;
  requirements: VisibilityStatus;
  notes: VisibilityStatus;
}

// Общий тип для управления видимостью полей
export interface FieldVisibilityState {
  locations: { [locationId: string]: LocationFieldVisibility };
  routes: { [routeId: string]: RouteFieldVisibility };
}

// Дефолтные настройки видимости
export const defaultLocationFieldVisibility: LocationFieldVisibility = {
  amplifiers: 'visible',
  dampeners: 'visible', 
  encounters: 'visible',
  loot: 'visible',
  clues: 'visible'
};

export const defaultRouteFieldVisibility: RouteFieldVisibility = {
  obstacles: 'visible',
  requirements: 'visible',
  notes: 'visible'
};

// Типы для запросов видимости полей определены в types/api.ts