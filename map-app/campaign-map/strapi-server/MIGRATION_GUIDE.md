# 🚀 Руководство по миграции данных из db.json в Strapi

## Быстрый старт

### 1. Настройка разрешений в Strapi Admin Panel

**ОБЯЗАТЕЛЬНЫЙ ШАГ!** Без этого миграция завершится ошибками 403 Forbidden.

1. Откройте Strapi Admin Panel: http://localhost:1337/admin
2. Войдите в систему (создайте аккаунт если нужно)
3. Перейдите в **Settings** → **Users & Permissions Plugin** → **Roles**
4. Выберите роль **"Public"**
5. Для каждого Content Type отметьте следующие разрешения:

#### ✅ Location
- [x] find
- [x] findOne  
- [x] create
- [x] update
- [x] delete

#### ✅ Quest
- [x] find
- [x] findOne
- [x] create 
- [x] update
- [x] delete

#### ✅ World-area
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete

#### ✅ World-path
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete

6. Нажмите **Save**

### 2. Запуск миграции

```bash
# Тестовый запуск (рекомендуется)
node scripts/migrate-from-db-json.js --dry-run

# Полная миграция с очисткой существующих данных
node scripts/migrate-from-db-json.js --clean

# Миграция без очистки (добавление к существующим данным)
node scripts/migrate-from-db-json.js
```

## Альтернативный способ: API токен

Если не хотите открывать публичный доступ, можете использовать API токен:

### 1. Создание API токена

1. В Strapi Admin Panel перейдите в **Settings** → **API Tokens**
2. Нажмите **Create new API Token**
3. Заполните форму:
   - **Name**: Migration Script Token
   - **Description**: Временный токен для миграции данных
   - **Token duration**: Custom (установите нужный срок)
   - **Token type**: Full access
4. Нажмите **Save**
5. **СКОПИРУЙТЕ ТОКЕН** - он больше не будет показан!

### 2. Использование токена

```bash
# Вариант 1: Через переменную окружения
export STRAPI_API_TOKEN="your_token_here"
node scripts/migrate-from-db-json.js --dry-run

# Вариант 2: Через параметр командной строки
node scripts/migrate-from-db-json.js --token=your_token_here --dry-run
```

## Что будет мигрировано

| Тип данных | Количество | Источник в db.json |
|------------|------------|-------------------|
| World Areas | 11 | `areas` |
| Locations | 68 | `points-of-interest` |
| World Paths | 84 | `routes` |
| Quests | 7 | в конце файла |
| **ВСЕГО** | **170** | |

## Устранение проблем

### ❌ Ошибка 403 Forbidden
```
❌ Доступ запрещен к http://localhost:1337/api/...
```
**Решение**: Настройте разрешения в Strapi Admin Panel (см. раздел 1)

### ❌ Ошибка подключения
```
❌ Ошибка запроса к http://localhost:1337/api/...
```
**Решение**: Убедитесь что Strapi сервер запущен:
```bash
npm run develop
```

### ❌ Ошибка "fetch is not defined"
**Решение**: Используйте Node.js 18+ или установите node-fetch:
```bash
npm install node-fetch
```

### ❌ Ошибка чтения db.json
**Решение**: Убедитесь что файл `db.json` находится в корне проекта

## Проверка результатов

После успешной миграции проверьте данные в Strapi Admin Panel:

1. **World Areas**: http://localhost:1337/admin/content-manager/collectionType/api::world-area.world-area
2. **Locations**: http://localhost:1337/admin/content-manager/collectionType/api::location.location  
3. **World Paths**: http://localhost:1337/admin/content-manager/collectionType/api::world-path.world-path
4. **Quests**: http://localhost:1337/admin/content-manager/collectionType/api::quest.quest

## Безопасность

⚠️ **После миграции рекомендуется:**

1. **Отключить публичный доступ** к API если использовали первый способ
2. **Удалить API токен** если использовали второй способ
3. Настроить нужные разрешения для продакшена

## Контакты

Если возникли проблемы, проверьте:
- Strapi сервер запущен и доступен
- Разрешения настроены правильно
- Файл db.json существует и читается
- Версия Node.js поддерживает fetch (18+)
