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
  console.log(`🚀 JSON Server запущен на порту ${PORT}`);
});