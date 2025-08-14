import pointsData from '../tochki-interesa.json';

/**
 * Получает название локации по её ID
 * @param locationId - ID локации
 * @returns Название локации или ID, если не найдено
 */
export const getLocationName = (locationId: string): string => {
  for (const area of pointsData.areas) {
    const location = area.pointsOfInterest.find(poi => poi.id === locationId);
    if (location) {
      return location.name;
    }
  }
  return locationId; // Если не найдено, возвращаем ID
};

/**
 * Получает название региона по ID локации
 * @param locationId - ID локации
 * @returns Название региона или пустую строку, если не найдено
 */
export const getAreaNameByLocationId = (locationId: string): string => {
  for (const area of pointsData.areas) {
    const location = area.pointsOfInterest.find(poi => poi.id === locationId);
    if (location) {
      return area.area;
    }
  }
  return '';
};