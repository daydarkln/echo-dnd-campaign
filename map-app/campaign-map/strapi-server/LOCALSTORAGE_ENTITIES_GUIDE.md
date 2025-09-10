# 📦 Инструкция по созданию сущностей Strapi для данных localStorage

Данный гайд описывает, какие сущности нужно создать в Strapi для замены данных, хранящихся в localStorage приложения D&D Campaign Map.

## 🗂️ Обзор данных в localStorage

Приложение хранит следующие типы данных в localStorage:

| Ключ | Описание | Компонент/Хук |
|------|----------|---------------|
| `dnd-character` | Данные персонажа игрока | `useCharacter` |
| `campaign-map-initiative-tracker` | Трекер инициативы | `useInitiativeTracker` |
| `campaign-map-characters` | Коллекция персонажей | `useCharacters` |
| `campaign-map-groups` | Группы персонажей | `useGroups` |
| `campaign-map-trackers` | Глобальные трекеры | `useTrackers` |
| `location-visibility` | Видимость локаций | `useLocationVisibility` |
| `region-visibility` | Видимость регионов | `useRegionVisibility` |
| `path-visibility` | Видимость путей | `usePathVisibility` |
| `field-visibility` | Видимость полей | `useFieldVisibility` |
| `campaign-map-game-notes` | Заметки ведущего | `GameModeView` |
| `campaign-map-game-history` | История событий | `GameModeView` |
| `campaign-map-generated-npcs` | Сгенерированные NPC | `GameModeView` |
| `dnd_audioSettings` | Настройки аудио | `useAudioManager` |
| `dnd_currentLocation` | Текущая локация для аудио | `useAudioManager` |

---

## 🏗️ Схемы сущностей для Strapi

### 1. **Player Character** - Основной персонаж игрока

```json
{
  "kind": "collectionType",
  "collectionName": "player_characters",
  "info": {
    "singularName": "player-character",
    "pluralName": "player-characters",
    "displayName": "Player Character"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "playerId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "characterData": {
      "type": "json",
      "required": true
    },
    "lastSync": {
      "type": "datetime",
      "default": "now"
    }
  }
}
```

**Поля:**
- `playerId` (String, обязательное, уникальное) - Идентификатор игрока
- `characterData` (JSON, обязательное) - Полные данные персонажа
- `lastSync` (DateTime) - Время последней синхронизации

---

### 2. **Campaign Session** - Игровая сессия

```json
{
  "kind": "collectionType",
  "collectionName": "campaign_sessions",
  "info": {
    "singularName": "campaign-session",
    "pluralName": "campaign-sessions",
    "displayName": "Campaign Session"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "sessionId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "name": {
      "type": "string",
      "required": true
    },
    "gameState": {
      "type": "json"
    },
    "isActive": {
      "type": "boolean",
      "default": false
    },
    "createdAt": {
      "type": "datetime"
    },
    "updatedAt": {
      "type": "datetime"
    }
  }
}
```

**Поля:**
- `sessionId` (String, обязательное, уникальное) - ID сессии
- `name` (String, обязательное) - Название сессии
- `gameState` (JSON) - Состояние игры
- `isActive` (Boolean) - Активная ли сессия

---

### 3. **Game Group** - Группы персонажей

```json
{
  "kind": "collectionType",
  "collectionName": "game_groups",
  "info": {
    "singularName": "game-group",
    "pluralName": "game-groups",
    "displayName": "Game Group"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "groupId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "name": {
      "type": "string",
      "required": true
    },
    "color": {
      "type": "string",
      "default": "#1890ff"
    },
    "members": {
      "type": "json",
      "default": []
    },
    "isPlayers": {
      "type": "boolean",
      "default": false
    },
    "currentLocation": {
      "type": "string"
    },
    "session": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::campaign-session.campaign-session"
    }
  }
}
```

**Поля:**
- `groupId` (String, обязательное, уникальное) - ID группы
- `name` (String, обязательное) - Название группы
- `color` (String) - Цвет группы в интерфейсе
- `members` (JSON) - Массив участников группы
- `isPlayers` (Boolean) - Группа игроков или NPC
- `currentLocation` (String) - Текущая локация группы
- `session` (Relation) - Связь с игровой сессией

---

### 4. **Initiative Encounter** - Энкаунтер для инициативы

```json
{
  "kind": "collectionType",
  "collectionName": "initiative_encounters",
  "info": {
    "singularName": "initiative-encounter",
    "pluralName": "initiative-encounters",
    "displayName": "Initiative Encounter"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "encounterId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "name": {
      "type": "string",
      "required": true
    },
    "characters": {
      "type": "json",
      "default": []
    },
    "currentTurnIndex": {
      "type": "integer",
      "default": 0
    },
    "round": {
      "type": "integer",
      "default": 1
    },
    "isActive": {
      "type": "boolean",
      "default": false
    },
    "selectedGroupIds": {
      "type": "json",
      "default": []
    },
    "session": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::campaign-session.campaign-session"
    }
  }
}
```

**Поля:**
- `encounterId` (String, обязательное, уникальное) - ID энкаунтера
- `name` (String, обязательное) - Название энкаунтера
- `characters` (JSON) - Массив персонажей в инициативе
- `currentTurnIndex` (Integer) - Индекс текущего хода
- `round` (Integer) - Номер раунда
- `isActive` (Boolean) - Активен ли энкаунтер
- `selectedGroupIds` (JSON) - ID выбранных групп
- `session` (Relation) - Связь с игровой сессией

---

### 5. **Campaign Trackers** - Глобальные трекеры кампании

```json
{
  "kind": "collectionType",
  "collectionName": "campaign_trackers",
  "info": {
    "singularName": "campaign-tracker",
    "pluralName": "campaign-trackers",
    "displayName": "Campaign Tracker"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "sessionId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "characterStages": {
      "type": "json",
      "default": {}
    },
    "cityPanic": {
      "type": "integer",
      "default": 0,
      "min": 0,
      "max": 4
    },
    "ecosystem": {
      "type": "integer",
      "default": 0,
      "min": 0,
      "max": 4
    },
    "swarm": {
      "type": "integer",
      "default": 0,
      "min": 0,
      "max": 4
    },
    "recognizability": {
      "type": "integer",
      "default": 2,
      "min": 0,
      "max": 4
    },
    "session": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::campaign-session.campaign-session"
    }
  }
}
```

**Поля:**
- `sessionId` (String, обязательное, уникальное) - ID сессии
- `characterStages` (JSON) - Стадии персонажей (споры/тень)
- `cityPanic` (Integer, 0-4) - Уровень паники в городе
- `ecosystem` (Integer, 0-4) - Состояние экосистемы
- `swarm` (Integer, 0-4) - Активность роя
- `recognizability` (Integer, 0-4) - Узнаваемость партии
- `session` (Relation) - Связь с игровой сессией

---

### 6. **UI Visibility Settings** - Настройки видимости интерфейса

```json
{
  "kind": "collectionType",
  "collectionName": "ui_visibility_settings",
  "info": {
    "singularName": "ui-visibility-setting",
    "pluralName": "ui-visibility-settings",
    "displayName": "UI Visibility Setting"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "userId": {
      "type": "string",
      "required": true
    },
    "settingType": {
      "type": "enumeration",
      "enum": ["location", "region", "path", "field", "parameter"],
      "required": true
    },
    "visibilityData": {
      "type": "json",
      "required": true
    },
    "session": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::campaign-session.campaign-session"
    }
  }
}
```

**Поля:**
- `userId` (String, обязательное) - ID пользователя
- `settingType` (Enum, обязательное) - Тип настройки видимости
- `visibilityData` (JSON, обязательное) - Данные о видимости
- `session` (Relation) - Связь с игровой сессией

---

### 7. **Game Notes** - Заметки и история ведущего

```json
{
  "kind": "collectionType",
  "collectionName": "game_notes",
  "info": {
    "singularName": "game-note",
    "pluralName": "game-notes",
    "displayName": "Game Note"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "sessionId": {
      "type": "string",
      "required": true
    },
    "noteType": {
      "type": "enumeration",
      "enum": ["notes", "history", "npc"],
      "required": true
    },
    "content": {
      "type": "json",
      "required": true
    },
    "session": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::campaign-session.campaign-session"
    }
  }
}
```

**Поля:**
- `sessionId` (String, обязательное) - ID сессии
- `noteType` (Enum, обязательное) - Тип заметки (notes/history/npc)
- `content` (JSON, обязательное) - Содержимое заметки
- `session` (Relation) - Связь с игровой сессией

---

### 8. **Audio Settings** - Настройки аудио

```json
{
  "kind": "collectionType",
  "collectionName": "audio_settings",
  "info": {
    "singularName": "audio-setting",
    "pluralName": "audio-settings",
    "displayName": "Audio Setting"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "userId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "settings": {
      "type": "json",
      "required": true
    },
    "currentLocation": {
      "type": "string"
    }
  }
}
```

**Поля:**
- `userId` (String, обязательное, уникальное) - ID пользователя
- `settings` (JSON, обязательное) - Настройки аудио
- `currentLocation` (String) - Текущая локация для аудио

---

## 🔄 Миграция данных

### Примерная структура данных в localStorage:

#### Character Data (dnd-character):
```json
{
  "id": "char_123",
  "name": "Aragorn",
  "data": "{\"info\": {...}, \"stats\": {...}, \"vitality\": {...}}"
}
```

#### Initiative Tracker:
```json
{
  "encounters": [
    {
      "id": "enc_1",
      "name": "Гоблины в лесу",
      "characters": [...],
      "currentTurnIndex": 0,
      "round": 1,
      "isActive": true
    }
  ],
  "currentEncounterId": "enc_1"
}
```

#### Trackers:
```json
{
  "characterStages": {
    "char_123": {"spores": 1, "shadow": 0}
  },
  "cityPanic": 2,
  "ecosystem": 1,
  "swarm": 3,
  "recognizability": 2
}
```

### Скрипт миграции

Для создания скрипта миграции localStorage → Strapi:

1. **Создайте API endpoints** для всех сущностей
2. **Настройте разрешения** для создания/чтения данных
3. **Создайте миграционный скрипт** аналогично `migrate-from-db-json.js`

---

## 🚀 План внедрения

### Этап 1: Создание сущностей
1. Создать все сущности в Strapi Admin Panel
2. Настроить поля согласно схемам
3. Настроить связи между сущностями

### Этап 2: API интеграция
1. Обновить хуки для работы с Strapi API
2. Добавить синхронизацию localStorage ↔ Strapi
3. Реализовать offline/online режимы

### Этап 3: Миграция данных
1. Создать скрипт миграции существующих данных
2. Протестировать на dev окружении
3. Выполнить миграцию production данных

### Этап 4: Очистка
1. Удалить использование localStorage
2. Обновить документацию
3. Добавить monitoring и backup

---

## 📋 Чек-лист создания

- [ ] **Player Character** - Основные данные персонажей
- [ ] **Campaign Session** - Игровые сессии  
- [ ] **Game Group** - Группы персонажей
- [ ] **Initiative Encounter** - Энкаунтеры инициативы
- [ ] **Campaign Trackers** - Глобальные трекеры
- [ ] **UI Visibility Settings** - Настройки видимости
- [ ] **Game Notes** - Заметки ведущего
- [ ] **Audio Settings** - Настройки аудио
- [ ] Настроить связи между сущностями
- [ ] Настроить разрешения API
- [ ] Создать миграционный скрипт
- [ ] Протестировать миграцию

---

## 🔧 Дополнительные настройки

### Индексы базы данных
Рекомендуется создать индексы для:
- `playerId` в Player Character
- `sessionId` в Campaign Session
- `userId` в UI Visibility Settings
- `groupId` в Game Group

### Валидация данных
- Ограничения на значения трекеров (0-4)
- Проверка JSON схем для сложных полей
- Валидация обязательных полей

### Backup и восстановление
- Автоматическое резервное копирование
- Экспорт/импорт данных кампании
- Версионирование изменений

Это руководство поможет полностью перенести все данные из localStorage в структурированную базу данных Strapi.
