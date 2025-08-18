# Миграция на JSON Server API с поддержкой видимости

Этот документ описывает переход от статических JSON файлов к JSON Server API с поддержкой статусов видимости для каждого поля.

## 🔄 Архитектура изменений

### Новые компоненты:

1. **Типы с видимостью** (`src/types/visibility.ts`) - базовые типы для поддержки статусов видимости
2. **API типы** (`src/types/api.ts`) - типы данных для работы с API
3. **API клиент** (`src/api/client.ts`) - клиент для взаимодействия с JSON Server
4. **Хуки данных** (`src/hooks/useApiData.ts`) - React хуки для загрузки данных из API
5. **Источник данных** (`src/hooks/useDataSource.ts`) - универсальный хук с поддержкой fallback
6. **Структура БД** (`db.json`) - данные для JSON Server
7. **Скрипт миграции** (`scripts/migrate-to-api.js`) - автоматическое преобразование данных

## 📊 Структура данных с видимостью

Каждое поле (кроме `id`) теперь имеет структуру:
```typescript
{
  value: any,          // Исходное значение
  visibility: 'visible' | 'hidden'  // Статус видимости
}
```

### Пример точки интереса с видимостью:
```json
{
  "id": "okrainy-tropa-ohotnika",
  "name": {
    "value": "Тропа охотника",
    "visibility": "visible"
  },
  "tags": {
    "value": ["следы", "скрытые тропы"],
    "visibility": "hidden"
  },
  // ... остальные поля
}
```

## 🚀 Быстрый старт

### 1. Запуск миграции данных
```bash
cd map-app/campaign-map
node scripts/migrate-to-api.js
```

### 2. Настройка JSON Server
```bash
cd server
npm install
npm start
```

Сервер запустится на `http://localhost:3001`

### 3. Настройка переменных окружения
```bash
# В корне проекта создайте .env
REACT_APP_API_URL=http://localhost:3001
```

### 4. Запуск приложения
```bash
npm start
```

## 🔧 Конфигурация

### Автоматический выбор источника данных
Приложение автоматически:
1. Проверяет доступность API
2. При недоступности API использует статические файлы
3. Позволяет переключаться между источниками в UI

### Переменные окружения
- `REACT_APP_API_URL` - URL JSON Server (по умолчанию: `http://localhost:3001`)

## 📱 Пользовательский интерфейс

### Индикатор источника данных
В верхней части приложения отображается:
- 🟢 **API Server** - подключение к API успешно
- 🔴 **API Server (недоступен)** - API недоступен, используются статические данные  
- ⚪ **Статические файлы** - использование локальных JSON файлов

### Кнопки управления
- **🔄 Обновить** - перезагрузить данные из текущего источника
- **📡 API** - переключиться на API (если доступен)
- **📄 Файлы** - переключиться на статические файлы

## 🔌 API Endpoints

### Точки интереса
- `GET /points-of-interest` - получить все точки интереса
- `GET /points-of-interest/:id` - получить точку по ID
- `POST /points-of-interest` - создать новую точку
- `PUT /points-of-interest/:id` - обновить точку
- `DELETE /points-of-interest/:id` - удалить точку

### Области
- `GET /areas` - получить все области
- `GET /areas/:id` - получить область по ID
- `POST /areas` - создать новую область
- `PUT /areas/:id` - обновить область
- `DELETE /areas/:id` - удалить область

### Маршруты
- `GET /routes` - получить все маршруты
- `GET /routes/:id` - получить маршрут по ID
- `POST /routes` - создать новый маршрут
- `PUT /routes/:id` - обновить маршрут
- `DELETE /routes/:id` - удалить маршрут

### Управление видимостью
- `PATCH /visibility/field` - обновить видимость поля
- `PATCH /visibility/bulk` - массовое обновление видимости
- `GET /visibility/stats` - статистика видимости

### Система проверки здоровья
- `GET /health` - проверка работоспособности API

## 🔄 Обратная совместимость

Приложение полностью совместимо с существующими компонентами:
- Хук `useDataSource` предоставляет данные в старом формате через `legacyData`
- При недоступности API автоматически используются статические файлы
- Все существующие компоненты работают без изменений

## 💾 Миграция существующих данных

Скрипт `migrate-to-api.js` автоматически:
1. Читает `tochki-interesa.json` и `puti-mezhdu-lokaciyami.json`
2. Преобразует в формат с поддержкой видимости
3. Создает `db.json` для JSON Server
4. Настраивает сервер с middleware

## 🔍 Фильтрация и поиск

API поддерживает фильтры:
```typescript
// Фильтр для точек интереса
{
  includeHidden?: boolean,     // Включить скрытые поля
  onlyVisible?: boolean,       // Только видимые поля
  area?: string,               // Фильтр по области
  tags?: string[],             // Фильтр по тегам
  hasEncounters?: boolean,     // Только с энкаунтерами
  hasLoot?: boolean,           // Только с лутом
  hasClues?: boolean           // Только с уликами
}
```

## 🛠 Разработка

### Добавление новых полей с видимостью
```typescript
import { withDefaultVisibility } from './types/visibility';

const newLocation = withDefaultVisibility({
  id: 'new-location',
  name: 'Новая локация',
  // ... другие поля
}, 'visible'); // дефолтная видимость
```

### Обновление видимости полей
```typescript
const { updateFieldVisibility } = useVisibility();

await updateFieldVisibility({
  id: 'location-id',
  field: 'name',
  visibility: 'hidden'
});
```

### Массовое обновление
```typescript
const { bulkUpdateVisibility } = useVisibility();

await bulkUpdateVisibility([
  { id: 'loc1', field: 'name', visibility: 'hidden' },
  { id: 'loc2', field: 'description', visibility: 'visible' }
]);
```

## 🐛 Отладка

### Проверка состояния API
```typescript
import { useApiHealth } from './hooks/useDataSource';

const { available, checking } = useApiHealth();
console.log('API доступен:', available);
```

### Логи JSON Server
```bash
cd server
npm start
# Сервер покажет все запросы в консоли
```

### Проверка данных
```bash
# Проверить структуру БД
curl http://localhost:3001/db

# Получить все точки интереса
curl http://localhost:3001/points-of-interest

# Получить статистику видимости
curl http://localhost:3001/visibility/stats
```

## 📈 Производительность

### Кэширование
- React Query можно добавить для кэширования API запросов
- Статические данные загружаются только один раз

### Оптимизация
- Ленивая загрузка больших областей
- Пагинация для большого количества точек интереса
- Фильтрация на стороне сервера

## 🔐 Безопасность

### Будущие улучшения
- Аутентификация пользователей
- Роли и разрешения для управления видимостью
- Аудит изменений видимости
- Защита от CSRF атак

## 🚧 Известные ограничения

1. JSON Server не поддерживает транзакции
2. Нет встроенной валидации схемы
3. Простая система прав доступа
4. Ограниченные возможности поиска

## 🎯 Планы развития

- [ ] Добавить React Query для кэширования
- [ ] Реализовать систему ролей
- [ ] Добавить аудит изменений
- [ ] Создать админ-панель для управления видимостью
- [ ] Добавить экспорт/импорт конфигураций видимости
- [ ] Реализовать резервное копирование данных