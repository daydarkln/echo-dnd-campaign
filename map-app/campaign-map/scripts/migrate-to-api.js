#!/usr/bin/env node

/**
 * Скрипт для миграции данных из статических JSON файлов 
 * в формат JSON server с поддержкой видимости полей
 */

const fs = require('fs');
const path = require('path');

// Функция для создания поля с видимостью
function createVisibilityField(value, visibility = 'visible') {
  return {
    value,
    visibility
  };
}

// Функция для преобразования объекта в формат с видимостью
function withVisibility(obj, excludeFields = ['id']) {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (excludeFields.includes(key)) {
      result[key] = value;
    } else {
      result[key] = createVisibilityField(value);
    }
  }
  
  return result;
}

// Функция для генерации уникального ID
function generateId(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function migrateData() {
  try {
    console.log('🚀 Начинаем миграцию данных...');

    // Читаем исходные файлы
    const pointsPath = path.join(__dirname, '../src/tochki-interesa.json');
    const pathsPath = path.join(__dirname, '../src/puti-mezhdu-lokaciyami.json');
    
    if (!fs.existsSync(pointsPath) || !fs.existsSync(pathsPath)) {
      throw new Error('Исходные файлы не найдены');
    }

    const pointsData = JSON.parse(fs.readFileSync(pointsPath, 'utf8'));
    const pathsData = JSON.parse(fs.readFileSync(pathsPath, 'utf8'));

    console.log('📖 Исходные файлы загружены');

    // Создаем структуру для JSON server
    const dbStructure = {
      'points-data': [],
      'areas': [],
      'points-of-interest': [],
      'paths-data': [],
      'path-types': [],
      'routes': [],
      'visibility-stats': []
    };

    // Преобразуем точки интереса
    console.log('🔄 Преобразуем точки интереса...');
    
    const areaIds = [];
    pointsData.areas.forEach((area, index) => {
      const areaId = `area-${index + 1}`;
      areaIds.push(areaId);

      // Создаем записи для точек интереса
      const poiIds = [];
      area.pointsOfInterest.forEach(poi => {
        poiIds.push(poi.id);
        dbStructure['points-of-interest'].push(withVisibility(poi));
      });

      // Создаем запись области
      dbStructure.areas.push({
        id: areaId,
        area: createVisibilityField(area.area),
        pointsOfInterest: createVisibilityField(poiIds)
      });
    });

    // Создаем основную запись точек данных
    dbStructure['points-data'].push({
      id: 'main',
      schemaVersion: createVisibilityField(pointsData.schemaVersion),
      notes: createVisibilityField(pointsData.notes),
      areas: createVisibilityField(areaIds)
    });

    // Преобразуем пути
    console.log('🔄 Преобразуем пути...');

    // Создаем типы путей
    dbStructure['path-types'].push({
      id: 'main-path-types',
      pathTypes: createVisibilityField(pathsData.pathTypes)
    });

    // Преобразуем маршруты
    const routeIds = [];
    pathsData.routes.forEach(route => {
      routeIds.push(route.id);
      dbStructure.routes.push(withVisibility(route));
    });

    // Создаем основную запись путей данных
    dbStructure['paths-data'].push({
      id: 'main',
      schemaVersion: createVisibilityField(pathsData.schemaVersion),
      notes: createVisibilityField(pathsData.notes),
      pathTypes: createVisibilityField('main-path-types'),
      routes: createVisibilityField(routeIds)
    });

    // Создаем статистику видимости
    const totalFields = 
      dbStructure['points-of-interest'].reduce((sum, poi) => 
        sum + Object.keys(poi).length - 1, 0) + // -1 для исключения id
      dbStructure.routes.reduce((sum, route) => 
        sum + Object.keys(route).length - 1, 0);

    dbStructure['visibility-stats'].push({
      id: 'main',
      totalFields,
      visibleFields: totalFields,
      hiddenFields: 0,
      byEntity: {
        'points-of-interest': { visible: dbStructure['points-of-interest'].length, hidden: 0 },
        'routes': { visible: dbStructure.routes.length, hidden: 0 },
        'areas': { visible: dbStructure.areas.length, hidden: 0 }
      }
    });

    // Записываем результат
    const outputPath = path.join(__dirname, '../db.json');
    fs.writeFileSync(outputPath, JSON.stringify(dbStructure, null, 2), 'utf8');

    console.log('✅ Миграция завершена успешно!');
    console.log(`📄 Создан файл: ${outputPath}`);
    console.log(`📊 Статистика:`);
    console.log(`   - Областей: ${dbStructure.areas.length}`);
    console.log(`   - Точек интереса: ${dbStructure['points-of-interest'].length}`);
    console.log(`   - Маршрутов: ${dbStructure.routes.length}`);
    console.log(`   - Всего полей: ${totalFields}`);

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error.message);
    process.exit(1);
  }
}

// Функция для создания файла package.json для JSON server
function createServerPackage() {
  const serverPath = path.join(__dirname, '../server');
  
  if (!fs.existsSync(serverPath)) {
    fs.mkdirSync(serverPath, { recursive: true });
  }

  const packageJson = {
    name: "campaign-map-server",
    version: "1.0.0",
    description: "JSON Server для данных карты кампании",
    main: "server.js",
    scripts: {
      start: "json-server --watch ../db.json --port 3001 --host 0.0.0.0",
      dev: "json-server --watch ../db.json --port 3001 --host 0.0.0.0"
    },
    dependencies: {
      "json-server": "^0.17.4"
    }
  };

  fs.writeFileSync(
    path.join(serverPath, 'package.json'), 
    JSON.stringify(packageJson, null, 2), 
    'utf8'
  );

  console.log('📦 Создан package.json для сервера');
}

// Функция для создания конфигурации JSON server
function createServerConfig() {
  const serverPath = path.join(__dirname, '../server');
  
  const routes = {
    "/api/*": "/$1",
    "/health": "/visibility-stats/main"
  };

  fs.writeFileSync(
    path.join(serverPath, 'routes.json'), 
    JSON.stringify(routes, null, 2), 
    'utf8'
  );

  const middleware = `
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('../db.json');
const middlewares = jsonServer.defaults({
  cors: true,
  logger: true
});

// Мидлвара для CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Мидлвара для обработки запросов видимости
server.use('/visibility', (req, res, next) => {
  if (req.method === 'PATCH' && req.path === '/field') {
    // Обновление видимости поля
    const { id, field, visibility } = req.body;
    // Здесь можно добавить логику обновления
    res.json({ success: true, message: 'Видимость обновлена' });
  } else if (req.method === 'PATCH' && req.path === '/bulk') {
    // Массовое обновление видимости
    const { updates } = req.body;
    // Здесь можно добавить логику массового обновления
    res.json({ success: true, message: 'Видимость обновлена массово' });
  } else if (req.method === 'GET' && req.path === '/stats') {
    // Получение статистики видимости
    const db = router.db;
    const stats = db.get('visibility-stats').find({ id: 'main' }).value();
    res.json(stats);
  } else {
    next();
  }
});

// Health check
server.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

server.use(middlewares);
server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(\`🚀 JSON Server запущен на порту \${PORT}\`);
});
`;

  fs.writeFileSync(
    path.join(serverPath, 'server.js'), 
    middleware.trim(), 
    'utf8'
  );

  console.log('⚙️ Создана конфигурация сервера');
}

// Запуск миграции
if (require.main === module) {
  migrateData()
    .then(() => {
      createServerPackage();
      createServerConfig();
      console.log('\n🎉 Все готово! Для запуска сервера выполните:');
      console.log('cd server && npm install && npm start');
    })
    .catch(console.error);
}

module.exports = {
  migrateData,
  createVisibilityField,
  withVisibility
};