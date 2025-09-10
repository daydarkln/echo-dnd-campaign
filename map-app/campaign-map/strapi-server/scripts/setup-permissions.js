#!/usr/bin/env node

/**
 * Скрипт для настройки разрешений Strapi API
 * Разрешает публичный доступ к content types для миграции
 */

const fs = require('fs').promises;
const path = require('path');

const STRAPI_API_BASE = 'http://localhost:1337/api';
const ADMIN_API_BASE = 'http://localhost:1337/admin';

class StrapiPermissionSetup {
  constructor() {
    this.bearerToken = null;
  }

  /**
   * Выполняет HTTP запрос
   */
  async makeRequest(url, method = 'GET', data = null, useToken = false) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (useToken && this.bearerToken) {
      options.headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Ошибка запроса к ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Создает API токен для автоматизации
   */
  async createApiToken() {
    console.log('\n🔑 Попытка создания API токена...');
    
    try {
      // Пытаемся создать токен с полными правами
      const tokenData = {
        name: 'Migration Script Token',
        description: 'Temporary token for data migration script',
        type: 'full-access',
      };

      const result = await this.makeRequest(
        `${ADMIN_API_BASE}/api-tokens`,
        'POST',
        tokenData
      );

      if (result.data && result.data.accessKey) {
        this.bearerToken = result.data.accessKey;
        console.log('   ✅ API токен создан успешно');
        return true;
      }
    } catch (error) {
      console.log('   ⚠️  Не удалось создать API токен:', error.message);
    }

    return false;
  }

  /**
   * Настраивает публичные разрешения для роли Public
   */
  async setupPublicPermissions() {
    console.log('\n🌍 Настройка публичных разрешений...');
    
    const contentTypes = [
      'api::location.location',
      'api::world-area.world-area', 
      'api::world-path.world-path',
      'api::quest.quest'
    ];

    const permissions = [
      'find',
      'findOne', 
      'create',
      'update',
      'delete'
    ];

    try {
      // Получаем роль Public
      const rolesResponse = await this.makeRequest(
        `${ADMIN_API_BASE}/users-permissions/roles`
      );

      const publicRole = rolesResponse.roles.find(role => role.type === 'public');
      
      if (!publicRole) {
        throw new Error('Роль Public не найдена');
      }

      console.log(`   Найдена роль Public (ID: ${publicRole.id})`);

      // Настраиваем разрешения для каждого content type
      for (const contentType of contentTypes) {
        for (const permission of permissions) {
          try {
            // Устанавливаем разрешение
            const permissionData = {
              permissions: {
                [contentType]: {
                  controllers: {
                    [contentType.split('.')[2]]: {
                      [permission]: {
                        enabled: true,
                        policy: ''
                      }
                    }
                  }
                }
              }
            };

            await this.makeRequest(
              `${ADMIN_API_BASE}/users-permissions/roles/${publicRole.id}`,
              'PUT',
              permissionData
            );

            console.log(`   ✅ ${contentType}.${permission}`);
          } catch (error) {
            console.log(`   ⚠️  ${contentType}.${permission}: ${error.message}`);
          }
        }
      }

      console.log('   ✅ Публичные разрешения настроены');
      return true;

    } catch (error) {
      console.error('   ❌ Ошибка настройки разрешений:', error.message);
      return false;
    }
  }

  /**
   * Проверяет доступность API
   */
  async testApiAccess() {
    console.log('\n🧪 Тестирование доступа к API...');
    
    const testEndpoints = [
      '/world-areas',
      '/locations',
      '/world-paths', 
      '/quests'
    ];

    let successCount = 0;

    for (const endpoint of testEndpoints) {
      try {
        await this.makeRequest(`${STRAPI_API_BASE}${endpoint}`, 'GET');
        console.log(`   ✅ ${endpoint} - доступен`);
        successCount++;
      } catch (error) {
        console.log(`   ❌ ${endpoint} - недоступен: ${error.message}`);
      }
    }

    if (successCount === testEndpoints.length) {
      console.log('\n🎉 Все API endpoint доступны для миграции!');
      return true;
    } else {
      console.log(`\n⚠️  Доступно ${successCount} из ${testEndpoints.length} endpoints`);
      return false;
    }
  }

  /**
   * Выводит инструкции по ручной настройке
   */
  showManualInstructions() {
    console.log(`
🔧 Ручная настройка разрешений:

1. Откройте Strapi Admin Panel: http://localhost:1337/admin
2. Перейдите в Settings → Users & Permissions Plugin → Roles
3. Выберите роль "Public"
4. Для каждого Content Type (Location, World-area, World-path, Quest):
   - Отметьте галочки: find, findOne, create, update, delete
5. Нажмите Save

Альтернативно:
1. Создайте API Token в Settings → API Tokens
2. Скопируйте токен и обновите скрипт миграции

После настройки запустите:
node scripts/migrate-from-db-json.js --dry-run
`);
  }

  /**
   * Основная функция настройки
   */
  async setup() {
    console.log('🚀 Настройка разрешений Strapi для миграции данных');

    try {
      // Проверяем текущий доступ
      const hasAccess = await this.testApiAccess();
      
      if (hasAccess) {
        console.log('\n✅ API уже настроен! Можно запускать миграцию.');
        return;
      }

      // Пытаемся настроить автоматически
      const setupSuccess = await this.setupPublicPermissions();
      
      if (setupSuccess) {
        // Проверяем снова
        const finalTest = await this.testApiAccess();
        if (finalTest) {
          return;
        }
      }

      // Если автоматическая настройка не удалась
      console.log('\n⚠️  Автоматическая настройка не удалась');
      this.showManualInstructions();

    } catch (error) {
      console.error('\n💥 Критическая ошибка:', error.message);
      this.showManualInstructions();
    }
  }
}

// Проверяем что fetch доступен
async function ensureFetch() {
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (error) {
      console.error('❌ Необходимо установить node-fetch для Node.js < 18:');
      console.error('npm install node-fetch');
      process.exit(1);
    }
  }
}

// Главная функция
async function main() {
  await ensureFetch();
  
  const setup = new StrapiPermissionSetup();
  await setup.setup();
}

// Запускаем если вызван напрямую
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Неожиданная ошибка:', error);
    process.exit(1);
  });
}

module.exports = StrapiPermissionSetup;
