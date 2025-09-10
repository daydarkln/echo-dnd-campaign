/**
 * Безопасная работа с localStorage
 */

/**
 * Безопасное получение массива из localStorage
 * @param key - ключ в localStorage
 * @param defaultValue - значение по умолчанию, если данных нет или они некорректны
 * @returns массив или значение по умолчанию
 */
export function getArrayFromLocalStorage<T = any>(key: string, defaultValue: T[] = []): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return defaultValue;
    }
    
    const parsed = JSON.parse(data);
    
    // Убеждаемся, что parsed - это массив
    if (!Array.isArray(parsed)) {
      console.warn(`localStorage key "${key}" содержит не массив:`, parsed);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.warn(`Ошибка при парсинге localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Безопасное получение объекта из localStorage
 * @param key - ключ в localStorage
 * @param defaultValue - значение по умолчанию, если данных нет или они некорректны
 * @returns объект или значение по умолчанию
 */
export function getObjectFromLocalStorage<T = any>(key: string, defaultValue: T = {} as T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return defaultValue;
    }
    
    const parsed = JSON.parse(data);
    
    // Убеждаемся, что parsed - это объект (но не массив)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn(`localStorage key "${key}" содержит не объект:`, parsed);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.warn(`Ошибка при парсинге localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Безопасное сохранение данных в localStorage
 * @param key - ключ в localStorage
 * @param value - значение для сохранения
 * @returns true если сохранение прошло успешно, false в противном случае
 */
export function setItemToLocalStorage(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Ошибка при сохранении в localStorage key "${key}":`, error);
    return false;
  }
}
