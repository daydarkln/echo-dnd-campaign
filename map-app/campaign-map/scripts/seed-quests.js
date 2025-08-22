#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function readDb(dbPath) {
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

function writeDb(dbPath, data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

function createSeedQuest() {
  const now = new Date().toISOString();
  return {
    id: 'quest-lunnye-niti-pamyati',
    title: 'Лунные нити памяти',
    summary: 'Мистический квест о светящихся телах на кладбище и голосе мицелия.',
    status: 'planned',
    content: `
## Побочный квест: «Лунные нити памяти»

**Завязка:** По ночам на городском кладбище видны бледно‑бирюзовые огни; шепчутся, будто «трупы светятся», а мицелий плетёт замысел.

### Ключевые NPC
- **Дария Корос**, смотрительница кладбища; скрывает, что слышит «тихий звон» из‑под склепов.
- **Брат Фалько**, жрец. _Твист:_ уже мёртв; голос поддержан грибницей как эхо.
- **Лисандр Мори**, фактор гильдии; подсыпает фосфорные соли, чтобы раздуть панику.
- **«Светошёпот»**, разум мицелия; ткет световой барьер из памяти умерших.

### Неожиданный твист
**Фалько уже мёртв**, его голос — световая память мицелия; после закрытия течи он просит отпустить его или стать стражем печати.
    `,
    tags: ['мистика', 'кладбище', 'мицелий'],
    relatedLocations: [],
    createdAt: now,
    updatedAt: now
  };
}

function main() {
  const dbPath = path.join(__dirname, '../db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('db.json не найден:', dbPath);
    process.exit(1);
  }
  const db = readDb(dbPath);
  if (!db.quests) {
    db.quests = [];
  }
  const idx = db.quests.findIndex(q => q.id === 'quest-lunnye-niti-pamyati');
  const seed = createSeedQuest();
  if (idx === -1) {
    db.quests.push(seed);
    writeDb(dbPath, db);
    console.log('✅ Посеян квест «Лунные нити памяти».');
  } else {
    db.quests[idx] = { ...db.quests[idx], ...seed, updatedAt: new Date().toISOString() };
    writeDb(dbPath, db);
    console.log('🔄 Обновлён квест «Лунные нити памяти» в формате Markdown.');
  }
}

if (require.main === module) {
  main();
}


