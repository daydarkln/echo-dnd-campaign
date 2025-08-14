#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Читаем файлы данных
const pointsData = JSON.parse(fs.readFileSync('./src/tochki-interesa.json', 'utf8'));
const pathsData = JSON.parse(fs.readFileSync('./src/puti-mezhdu-lokaciyami.json', 'utf8'));

// Собираем все локации из всех регионов
const allLocations = [];
pointsData.areas.forEach(area => {
  area.pointsOfInterest.forEach(poi => {
    allLocations.push({
      id: poi.id,
      name: poi.name,
      area: area.area
    });
  });
});

console.log(`📊 Всего локаций: ${allLocations.length}`);
console.log(`🛣️ Всего путей: ${pathsData.routes.length}`);

// Создаем граф связей
const connections = new Map();
allLocations.forEach(loc => {
  connections.set(loc.id, new Set());
});

// Заполняем граф на основе путей
pathsData.routes.forEach(route => {
  if (connections.has(route.from) && connections.has(route.to)) {
    connections.get(route.from).add(route.to);
    connections.get(route.to).add(route.from);
  }
});

// Анализируем связность
console.log('\n🔍 АНАЛИЗ СВЯЗНОСТИ:\n');

const isolatedLocations = [];
const connectedLocations = [];

allLocations.forEach(location => {
  const connectionCount = connections.get(location.id).size;
  if (connectionCount === 0) {
    isolatedLocations.push(location);
  } else {
    connectedLocations.push({
      ...location,
      connections: connectionCount
    });
  }
});

// Выводим результаты
if (isolatedLocations.length > 0) {
  console.log('❌ ИЗОЛИРОВАННЫЕ ЛОКАЦИИ (без связей):');
  isolatedLocations.forEach(loc => {
    console.log(`   • ${loc.name} (${loc.id}) - ${loc.area}`);
  });
} else {
  console.log('✅ Все локации имеют связи!');
}

console.log('\n📊 СТАТИСТИКА ПО РЕГИОНАМ:');
const regionStats = new Map();

allLocations.forEach(location => {
  if (!regionStats.has(location.area)) {
    regionStats.set(location.area, {
      total: 0,
      connected: 0,
      isolated: 0
    });
  }
  
  const stats = regionStats.get(location.area);
  stats.total++;
  
  const connectionCount = connections.get(location.id).size;
  if (connectionCount === 0) {
    stats.isolated++;
  } else {
    stats.connected++;
  }
});

regionStats.forEach((stats, area) => {
  console.log(`\n🏛️ ${area}:`);
  console.log(`   Всего: ${stats.total}`);
  console.log(`   Связанных: ${stats.connected}`);
  if (stats.isolated > 0) {
    console.log(`   ❌ Изолированных: ${stats.isolated}`);
  } else {
    console.log(`   ✅ Все связаны`);
  }
});

console.log('\n📈 ЛОКАЦИИ С НАИМЕНЬШИМИ СВЯЗЯМИ:');
const sortedByConnections = connectedLocations.sort((a, b) => a.connections - b.connections);
const leastConnected = sortedByConnections.slice(0, 10);

leastConnected.forEach(loc => {
  console.log(`   • ${loc.name} - ${loc.connections} связи (${loc.area})`);
});