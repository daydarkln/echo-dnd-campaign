#!/usr/bin/env node

/**
 * Скрипт для миграции данных из db.json в Strapi
 * 
 * Использование:
 * node scripts/migrate-from-db-json.js [--dry-run] [--clean]
 * 
 * Опции:
 * --dry-run  - Показать что будет мигрировано без выполнения
 * --clean    - Очистить существующие данные перед миграцией
 */

const fs = require('fs').promises;
const path = require('path');

// Конфигурация
const DB_JSON_PATH = path.join(__dirname, '../../db.json');
const STRAPI_API_BASE = 'http://localhost:1337/api';

class StrapiMigrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.clean = options.clean || false;
    this.token = options.token || process.env.STRAPI_API_TOKEN || null;
    this.data = null;
    this.stats = {
      worldAreas: { created: 0, errors: 0 },
      locations: { created: 0, errors: 0 },
      worldPaths: { created: 0, errors: 0 },
      quests: { created: 0, errors: 0 }
    };
  }

  /**
   * Загружает данные из db.json
   */
  async loadData() {
    try {
      const rawData = await fs.readFile(DB_JSON_PATH, 'utf8');
      this.data = JSON.parse(rawData);
      console.log('✅ Данные из db.json загружены успешно');
    } catch (error) {
      throw new Error(`Ошибка загрузки db.json: ${error.message}`);
    }
  }

  /**
   * Выполняет HTTP запрос к Strapi API
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    if (this.dryRun) {
      console.log(`[DRY RUN] ${method} ${endpoint}`, data ? 'with data' : '');
      return { data: { id: Math.random() } };
    }

    const url = `${STRAPI_API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Добавляем авторизацию если есть токен
    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify({ data });
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        // Если 403, предлагаем решение
        if (response.status === 403) {
          console.error(`❌ Доступ запрещен к ${url}`);
          console.error('   💡 Запустите: node scripts/setup-permissions.js');
          console.error('   💡 Или добавьте API токен: STRAPI_API_TOKEN=your_token');
        }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Ошибка запроса к ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Очищает существующие данные
   */
  async cleanExistingData() {
    if (!this.clean) return;

    console.log('\n🧹 Очистка существующих данных...');

    const entities = ['locations', 'world-areas', 'world-paths', 'quests'];
    
    for (const entity of entities) {
      try {
        // Получаем все записи
        const response = await this.makeRequest(`/${entity}?pagination[limit]=1000`);
        const items = response.data || [];

        // Удаляем каждую запись
        for (const item of items) {
          await this.makeRequest(`/${entity}/${item.id}`, 'DELETE');
        }

        console.log(`   ✅ Удалено ${items.length} записей из ${entity}`);
      } catch (error) {
        console.error(`   ❌ Ошибка очистки ${entity}:`, error.message);
      }
    }
  }

  /**
   * Преобразует данные из формата db.json в формат Strapi
   */
  transformVisibilityData(item) {
    const transformed = {};
    
    // Извлекаем все поля с visibility структурой
    Object.keys(item).forEach(key => {
      if (key === 'id') {
        // ID остается как есть для связывания
        return;
      }
      
      if (item[key] && typeof item[key] === 'object' && 'value' in item[key]) {
        transformed[key] = item[key];
      }
    });

    return transformed;
  }

  /**
   * Добавляет недостающие поля в схемы Strapi
   */
  async ensureSchemaFields() {
    console.log('\n🔧 Проверка и обновление схем...');
    
    // Проверяем наличие поля name в Location
    // В db.json у каждой точки интереса есть поле name
    const locationSchemaPath = path.join(__dirname, '../src/api/location/content-types/location/schema.json');
    
    try {
      const schemaContent = await fs.readFile(locationSchemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Добавляем недостающие поля если их нет
      if (!schema.attributes.name) {
        schema.attributes.name = { "type": "json" };
        
        await fs.writeFile(locationSchemaPath, JSON.stringify(schema, null, 2));
        console.log('   ✅ Добавлено поле name в схему Location');
      }
    } catch (error) {
      console.log('   ⚠️  Не удалось обновить схему Location:', error.message);
    }
  }

  /**
   * Мигрирует области мира (world-areas)
   */
  async migrateWorldAreas() {
    console.log('\n🌍 Миграция областей мира...');

    const areas = this.data.areas || [];
    const createdAreas = new Map(); // Для хранения соответствия id -> strapi id

    for (const area of areas) {
      try {
        const transformedData = this.transformVisibilityData(area);
        
        const strapiData = {
          area: transformedData.area,
          // Locations будут добавлены позже через связи
        };

        const response = await this.makeRequest('/world-areas', 'POST', strapiData);
        createdAreas.set(area.id, response.data.id);
        
        this.stats.worldAreas.created++;
        console.log(`   ✅ Создана область: ${area.id}`);
      } catch (error) {
        this.stats.worldAreas.errors++;
        console.error(`   ❌ Ошибка создания области ${area.id}:`, error.message);
      }
    }

    return createdAreas;
  }

  /**
   * Мигрирует точки интереса (locations)
   */
  async migrateLocations(worldAreaMap) {
    console.log('\n📍 Миграция точек интереса...');

    const pointsOfInterest = this.data['points-of-interest'] || [];
    const createdLocations = new Map();

    for (const poi of pointsOfInterest) {
      try {
        const transformedData = this.transformVisibilityData(poi);
        
        // Находим область для этой локации
        let worldAreaId = null;
        const areas = this.data.areas || [];
        
        for (const area of areas) {
          if (area.pointsOfInterest?.value?.includes(poi.id)) {
            worldAreaId = worldAreaMap.get(area.id);
            break;
          }
        }

        const strapiData = {
          name: transformedData.name,
          tags: transformedData.tags,
          amplifiers: transformedData.amplifiers,
          dampeners: transformedData.dampeners, 
          encounters: transformedData.encounters,
          loot: transformedData.loot,
          clues: transformedData.clues,
          world_area: worldAreaId, // Связь с областью
        };

        const response = await this.makeRequest('/locations', 'POST', strapiData);
        createdLocations.set(poi.id, response.data.id);
        
        this.stats.locations.created++;
        console.log(`   ✅ Создана локация: ${poi.id}`);
      } catch (error) {
        this.stats.locations.errors++;
        console.error(`   ❌ Ошибка создания локации ${poi.id}:`, error.message);
      }
    }

    return createdLocations;
  }

  /**
   * Мигрирует пути (world-paths)
   */
  async migrateWorldPaths() {
    console.log('\n🛤️  Миграция путей...');

    // Пути хранятся в секции "routes"
    const paths = this.data.routes || [];

    console.log(`   Найдено ${paths.length} путей для миграции`);

    for (const pathItem of paths) {
      try {
        const transformedData = this.transformVisibilityData(pathItem);
        
        const strapiData = {
          from: transformedData.from,
          to: transformedData.to,
          pathType: transformedData.pathType,
          description: transformedData.description,
          travelTime: transformedData.travelTime,
          obstacles: transformedData.obstacles,
          requirements: transformedData.requirements,
          notes: transformedData.notes,
        };

        await this.makeRequest('/world-paths', 'POST', strapiData);
        
        this.stats.worldPaths.created++;
        console.log(`   ✅ Создан путь: ${pathItem.id}`);
      } catch (error) {
        this.stats.worldPaths.errors++;
        console.error(`   ❌ Ошибка создания пути ${pathItem.id}:`, error.message);
      }
    }
  }

  /**
   * Мигрирует квесты (если есть в данных)
   */
  async migrateQuests() {
    console.log('\n🎯 Миграция квестов...');

    // Проверяем разные возможные местоположения квестов
    let quests = this.data.quests || [];
    if (this.data['quests-data']) {
      quests = this.data['quests-data'];
    }
    
    if (quests.length === 0) {
      console.log('   ℹ️  Квесты не найдены в db.json');
      return;
    }

    for (const quest of quests) {
      try {
        const strapiData = {
          title: quest.title || quest.id,
          summary: quest.summary || '',
          questStatus: quest.status || 'available',
          content: quest.content || '',
          tags: quest.tags || {},
        };

        await this.makeRequest('/quests', 'POST', strapiData);
        
        this.stats.quests.created++;
        console.log(`   ✅ Создан квест: ${quest.id || quest.title}`);
      } catch (error) {
        this.stats.quests.errors++;
        console.error(`   ❌ Ошибка создания квеста ${quest.id}:`, error.message);
      }
    }
  }

  /**
   * Выводит статистику миграции
   */
  printStats() {
    console.log('\n📊 Статистика миграции:');
    console.log('========================');
    
    Object.entries(this.stats).forEach(([entity, stats]) => {
      const total = stats.created + stats.errors;
      const successRate = total > 0 ? Math.round((stats.created / total) * 100) : 0;
      
      console.log(`${entity}:`);
      console.log(`  ✅ Создано: ${stats.created}`);
      console.log(`  ❌ Ошибок: ${stats.errors}`);
      console.log(`  📈 Успешность: ${successRate}%`);
      console.log('');
    });
  }

  /**
   * Выполняет полную миграцию
   */
  async migrate() {
    console.log('🚀 Начало миграции данных из db.json в Strapi');
    console.log(`Режим: ${this.dryRun ? 'ТЕСТОВЫЙ (dry-run)' : 'РЕАЛЬНАЯ МИГРАЦИЯ'}`);
    console.log(`Очистка: ${this.clean ? 'ДА' : 'НЕТ'}`);

    try {
      // Загружаем данные
      await this.loadData();

      // Обновляем схемы если нужно
      await this.ensureSchemaFields();

      // Очищаем существующие данные если нужно
      await this.cleanExistingData();

      // Мигрируем в правильном порядке (учитывая зависимости)
      const worldAreaMap = await this.migrateWorldAreas();
      const locationMap = await this.migrateLocations(worldAreaMap);
      await this.migrateWorldPaths();
      await this.migrateQuests();

      // Выводим статистику
      this.printStats();

      console.log('\n🎉 Миграция завершена!');

      if (this.dryRun) {
        console.log('\n⚠️  Это был тестовый запуск. Для реальной миграции запустите без --dry-run');
      }

    } catch (error) {
      console.error('\n💥 Критическая ошибка миграции:', error.message);
      process.exit(1);
    }
  }
}

// Обработка аргументов командной строки
function parseArgs() {
  const args = process.argv.slice(2);
  
  // Извлекаем токен из аргументов
  let token = null;
  const tokenArgIndex = args.findIndex(arg => arg.startsWith('--token='));
  if (tokenArgIndex !== -1) {
    token = args[tokenArgIndex].split('=')[1];
    args.splice(tokenArgIndex, 1); // Удаляем из массива для безопасности
  }
  
  return {
    dryRun: args.includes('--dry-run'),
    clean: args.includes('--clean'),
    help: args.includes('--help') || args.includes('-h'),
    token
  };
}

// Показать справку
function showHelp() {
  console.log(`
Скрипт миграции данных из db.json в Strapi

Использование:
  node scripts/migrate-from-db-json.js [опции]

Опции:
  --dry-run           Тестовый запуск (показать что будет сделано без выполнения)
  --clean             Очистить существующие данные перед миграцией
  --token=<TOKEN>     API токен для авторизации
  --help, -h          Показать эту справку

Переменные окружения:
  STRAPI_API_TOKEN    API токен для авторизации

Примеры:
  node scripts/migrate-from-db-json.js --dry-run
  node scripts/migrate-from-db-json.js --clean
  node scripts/migrate-from-db-json.js --token=your_api_token_here
  STRAPI_API_TOKEN=your_token node scripts/migrate-from-db-json.js

Настройка доступа:
  1. Запустите: node scripts/setup-permissions.js
  2. Или создайте API токен в Strapi Admin Panel

Убедитесь что Strapi сервер запущен на http://localhost:1337
`);
}

// Главная функция
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Проверяем что fetch доступен (для Node.js < 18)
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (error) {
      console.error('❌ Необходимо установить node-fetch для Node.js < 18:');
      console.error('npm install node-fetch');
      process.exit(1);
    }
  }

  const migrator = new StrapiMigrator(options);
  await migrator.migrate();
}

// Запускаем скрипт если он вызван напрямую
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Неожиданная ошибка:', error);
    process.exit(1);
  });
}

module.exports = StrapiMigrator;
