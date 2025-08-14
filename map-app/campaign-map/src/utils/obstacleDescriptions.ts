import { ObstacleDescription } from '../types';

export const obstacleDescriptions: ObstacleDescription[] = [
  // Окружающая среда
  {
    id: "thick-vegetation",
    name: "заросли",
    description: "Густые заросли кустарника и высокой травы, затрудняющие передвижение",
    category: "environmental",
    difficulty: "easy",
    effects: ["замедление движения", "сложность навигации"],
    solutions: ["использование мачете", "проверка Выживания"]
  },
  {
    id: "wet-ground",
    name: "влажная земля",
    description: "Размокшая после дождя почва, склонная к размыванию",
    category: "environmental",
    difficulty: "easy",
    effects: ["замедление", "риск застревания"],
    solutions: ["осторожное передвижение", "использование палок"]
  },
  {
    id: "fog",
    name: "туман",
    description: "Густой туман, ограничивающий видимость",
    category: "environmental",
    difficulty: "medium",
    effects: ["снижение видимости", "дезориентация"],
    solutions: ["проверка Восприятия", "использование верёвки для связи"]
  },
  {
    id: "steep-ascent",
    name: "крутой подъём",
    description: "Крутой склон, требующий физических усилий для преодоления",
    category: "environmental",
    difficulty: "medium",
    effects: ["усталость", "риск падения"],
    solutions: ["проверка Атлетики", "использование альпинистского снаряжения"]
  },
  {
    id: "loose-stones",
    name: "осыпающиеся камни",
    description: "Неустойчивые камни, которые могут обрушиться при неосторожном движении",
    category: "environmental",
    difficulty: "medium",
    effects: ["риск обвала", "травмы"],
    solutions: ["проверка Ловкости", "осторожное передвижение"]
  },
  {
    id: "mud-after-rain",
    name: "грязь после дождя",
    description: "Разжиженная грязь на дорогах после сильного дождя",
    category: "environmental",
    difficulty: "easy",
    effects: ["замедление", "загрязнение"],
    solutions: ["ожидание высыхания", "использование высоких сапог"]
  },
  {
    id: "streams",
    name: "перешагивание ручейков",
    description: "Небольшие ручейки, пересекающие тропу",
    category: "environmental",
    difficulty: "easy",
    effects: ["незначительное замедление"],
    solutions: ["перешагивание", "использование брёвен"]
  },
  {
    id: "fords",
    name: "броды",
    description: "Места пересечения водных преград вброд",
    category: "environmental",
    difficulty: "medium",
    effects: ["мокрые ноги", "риск поскользнуться"],
    solutions: ["проверка Выживания", "использование палок"]
  },
  {
    id: "shaded-roots",
    name: "затенённые корни",
    description: "Корни деревьев в тени, создающие препятствия на тропе",
    category: "environmental",
    difficulty: "easy",
    effects: ["риск споткнуться"],
    solutions: ["внимательность", "источник света"]
  },
  {
    id: "slippery-stones",
    name: "скользкие камни",
    description: "Камни, покрытые мхом или влагой, скользкие для передвижения",
    category: "environmental",
    difficulty: "medium",
    effects: ["риск падения", "замедление"],
    solutions: ["проверка Ловкости", "осторожное передвижение"]
  },
  {
    id: "narrow-sections",
    name: "узкие участки",
    description: "Тесные проходы, требующие особой осторожности",
    category: "environmental",
    difficulty: "medium",
    effects: ["замедление", "риск застревания"],
    solutions: ["проверка Акробатики", "снятие снаряжения"]
  },
  {
    id: "dampness",
    name: "сырость",
    description: "Высокая влажность, создающая дискомфорт и риск заболеваний",
    category: "environmental",
    difficulty: "easy",
    effects: ["дискомфорт", "риск простуды"],
    solutions: ["защитная одежда", "проверка Телосложения"]
  },
  {
    id: "brick-collapse",
    name: "обвалы кирпича",
    description: "Обрушившиеся кирпичные стены или перекрытия",
    category: "environmental",
    difficulty: "medium",
    effects: ["блокировка пути", "риск травм"],
    solutions: ["расчистка завала", "поиск обходного пути"]
  },
  {
    id: "overgrown-bushes",
    name: "заросшие кусты",
    description: "Кусты, разросшиеся на тропе",
    category: "environmental",
    difficulty: "easy",
    effects: ["замедление", "царапины"],
    solutions: ["раздвигание веток", "обход"]
  },
  {
    id: "narrow-streets",
    name: "узкие улочки",
    description: "Тесные городские переулки",
    category: "environmental",
    difficulty: "easy",
    effects: ["замедление движения"],
    solutions: ["однофайловое движение", "терпение"]
  },
  {
    id: "mountain-trails",
    name: "горные тропы",
    description: "Извилистые тропы в горах с переменной сложностью",
    category: "environmental",
    difficulty: "medium",
    effects: ["усталость", "риск сбиться с пути"],
    solutions: ["проверка Выживания", "карта местности"]
  },
  {
    id: "mountain-climb",
    name: "подъём в гору",
    description: "Подъём по горной дороге к высоким районам города",
    category: "environmental",
    difficulty: "medium",
    effects: ["усталость", "замедление"],
    solutions: ["отдых", "постепенное движение"]
  },
  
    // Магические препятствия
  {
    id: "magical-traps",
    name: "магические ловушки",
    description: "Ловушки, активируемые магической энергией",
    category: "magical",
    difficulty: "hard",
    effects: ["магические повреждения", "эффекты заклинаний"],
    solutions: ["проверка Расследования", "проверка Магии", "разрушение ловушки"]
  },
  {
    id: "illusions",
    name: "иллюзии",
    description: "Магические иллюзии, искажающие реальность",
    category: "magical",
    difficulty: "medium",
    effects: ["дезориентация", "ложные пути"],
    solutions: ["проверка Мудрости", "проверка Расследования"]
  },
  {
    id: "magical-anomalies",
    name: "магические аномалии",
    description: "Нестабильные магические явления в воздухе",
    category: "magical",
    difficulty: "medium",
    effects: ["случайные магические эффекты", "дезориентация"],
    solutions: ["проверка Магии", "осторожное передвижение"]
  },
  {
    id: "magical-surges",
    name: "магические всплески",
    description: "Внезапные выбросы магической энергии",
    category: "magical",
    difficulty: "hard",
    effects: ["магические повреждения", "случайные эффекты"],
    solutions: ["проверка Магии", "защитные заклинания"]
  },
  {
    id: "magical-currents",
    name: "магические течения",
    description: "Потоки магической энергии в воде",
    category: "magical",
    difficulty: "hard",
    effects: ["дезориентация", "потеря контроля"],
    solutions: ["проверка Навигации", "магическая защита"]
  },
  {
    id: "magical-pressure",
    name: "магическое давление",
    description: "Давящая магическая сила в подводных глубинах",
    category: "magical",
    difficulty: "deadly",
    effects: ["магическое подавление", "потеря способностей"],
    solutions: ["антимагическая защита", "быстрое прохождение"]
  },
  {
    id: "magical-barriers",
    name: "магические барьеры",
    description: "Невидимые магические препятствия",
    category: "magical",
    difficulty: "hard",
    effects: ["блокировка пути", "отражение атак"],
    solutions: ["проверка Магии", "разрушение барьера"]
  },
  {
    id: "magical-experiments",
    name: "магические эксперименты",
    description: "Нестабильные магические опыты в академии",
    category: "magical",
    difficulty: "medium",
    effects: ["случайные эффекты", "помехи заклинаниям"],
    solutions: ["проверка Магии", "избегание зон экспериментов"]
  },
  {
    id: "sound-resonances",
    name: "звуковые резонансы",
    description: "Резонирующие звуковые волны от маятников",
    category: "magical",
    difficulty: "medium",
    effects: ["дезориентация", "головокружение"],
    solutions: ["проверка Восприятия", "защита ушей"]
  },
  {
    id: "energy-discharges",
    name: "энергетические разряды",
    description: "Всплески энергии от грибных артефактов",
    category: "magical",
    difficulty: "hard",
    effects: ["электрические повреждения", "шок"],
    solutions: ["проверка Магии", "изоляция"]
  },
  {
    id: "antimagic-fields",
    name: "антимагические поля",
    description: "Зоны, подавляющие магические способности",
    category: "magical",
    difficulty: "hard",
    effects: ["потеря магических способностей", "неэффективность заклинаний"],
    solutions: ["физические методы", "быстрое прохождение"]
  },
  {
    id: "reality-distortions",
    name: "искажения реальности",
    description: "Искажения пространства и времени вблизи Тени",
    category: "magical",
    difficulty: "deadly",
    effects: ["дезориентация", "потеря связи с реальностью"],
    solutions: ["проверка Мудрости", "сильная воля"]
  },
  {
    id: "dark-reflections",
    name: "тёмные отражения",
    description: "Отражения, показывающие искажённую реальность",
    category: "magical",
    difficulty: "hard",
    effects: ["обман чувств", "ложные образы"],
    solutions: ["проверка Мудрости", "игнорирование отражений"]
  },
  {
    id: "shadow-whispers",
    name: "шёпот Тени",
    description: "Голоса Тени, влияющие на разум",
    category: "magical",
    difficulty: "deadly",
    effects: ["влияние на разум", "потеря контроля"],
    solutions: ["проверка Мудрости", "сильная воля группы"]
  },

  // Социальные препятствия
  {
    id: "document-check",
    name: "проверка документов",
    description: "Проверка документов у городских ворот",
    category: "social",
    difficulty: "easy",
    effects: ["задержка", "отказ в проходе"],
    solutions: ["наличие пропуска", "проверка Убеждения DC 12"]
  },
  {
    id: "baggage-inspection",
    name: "проверка багажа",
    description: "Досмотр багажа у лесных ворот",
    category: "social",
    difficulty: "easy",
    effects: ["задержка", "конфискация запрещённых предметов"],
    solutions: ["сотрудничество", "отсутствие запрещённых предметов"]
  },
  {
    id: "customs-inspection",
    name: "таможенный осмотр",
    description: "Таможенная проверка у портовых ворот",
    category: "social",
    difficulty: "medium",
    effects: ["задержка", "штрафы", "конфискация"],
    solutions: ["честное декларирование", "отсутствие контрабанды"]
  },
  {
    id: "guard-patrols",
    name: "патрули стражи",
    description: "Патрули городской стражи на контрабандных тропах",
    category: "social",
    difficulty: "medium",
    effects: ["арест", "штрафы", "конфискация"],
    solutions: ["проверка Скрытности DC 12", "избегание патрулей"]
  },
  {
    id: "illegal-trade",
    name: "нелегальная торговля",
    description: "Торговля запрещёнными товарами",
    category: "social",
    difficulty: "hard",
    effects: ["арест", "судебное преследование"],
    solutions: ["законная торговля", "избегание нелегальных сделок"]
  },
  {
    id: "status-checks",
    name: "проверки статуса",
    description: "Проверки социального статуса для доступа к элитным районам",
    category: "social",
    difficulty: "medium",
    effects: ["отказ в доступе", "унижение"],
    solutions: ["высокий статус", "проверка Убеждения DC 13"]
  },
  {
    id: "crypt-guards",
    name: "охрана склепов",
    description: "Охрана горных склепов для элитных захоронений",
    category: "social",
    difficulty: "hard",
    effects: ["отказ в доступе", "арест"],
    solutions: ["высокий статус", "проверка Убеждения DC 14"]
  },
  {
    id: "control-posts",
    name: "контрольные посты",
    description: "Посты контроля между санитарными службами",
    category: "social",
    difficulty: "medium",
    effects: ["задержка", "отказ в проходе"],
    solutions: ["служебные документы", "проверка Убеждения DC 13"]
  },
  {
    id: "cargo-inspection",
    name: "проверка грузов",
    description: "Проверка перевозимых грузов",
    category: "social",
    difficulty: "medium",
    effects: ["задержка", "конфискация"],
    solutions: ["правильное оформление", "отсутствие запрещённых товаров"]
  },
  {
    id: "contrabandists",
    name: "контрабандисты",
    description: "Незаконные торговцы на тайных тропах",
    category: "social",
    difficulty: "hard",
    effects: ["опасность", "вовлечение в преступную деятельность"],
    solutions: ["избегание", "сообщение властям"]
  },
  {
    id: "hidden-doors",
    name: "скрытые дверцы",
    description: "Тайные проходы для контрабанды",
    category: "social",
    difficulty: "medium",
    effects: ["сложность обнаружения"],
    solutions: ["проверка Расследования DC 14", "знание паролей"]
  },
  {
    id: "crowds",
    name: "толпы горожан",
    description: "Большие скопления людей на главных дорогах",
    category: "social",
    difficulty: "easy",
    effects: ["замедление", "толкотня"],
    solutions: ["терпение", "выбор менее людных маршрутов"]
  },
  {
    id: "buyer-crowds",
    name: "толпа покупателей",
    description: "Толпы покупателей на рынке",
    category: "social",
    difficulty: "easy",
    effects: ["замедление", "толкотня"],
    solutions: ["ожидание", "выбор менее загруженного времени"]
  },
  {
    id: "inspection-checks",
    name: "инспекционные проверки",
    description: "Регулярные проверки санитарной службы",
    category: "social",
    difficulty: "easy",
    effects: ["задержка", "документация"],
    solutions: ["наличие документов", "сотрудничество"]
  },
  {
    id: "peaceful-mycilians",
    name: "мирные мицелиане (могут не пустить)",
    description: "Мирные жители-мицелиане, охраняющие свои земли",
    category: "social",
    difficulty: "medium",
    effects: ["отказ в проходе", "конфликт"],
    solutions: ["разрешение старейшин", "проверка Убеждения DC 14"]
  },
  {
    id: "social-barriers",
    name: "социальные барьеры",
    description: "Барьеры, связанные с социальным статусом",
    category: "social",
    difficulty: "medium",
    effects: ["отказ в доступе", "дискриминация"],
    solutions: ["повышение статуса", "проверка Убеждения"]
  },
  {
    id: "discontented-citizens",
    name: "недовольные горожане",
    description: "Горожане, недовольные сложившейся ситуацией",
    category: "social",
    difficulty: "medium",
    effects: ["враждебность", "отказ в помощи"],
    solutions: ["дипломатия", "оказание помощи"]
  },
  {
    id: "unquiet-spirits",
    name: "неспокойные духи",
    description: "Духи, беспокоящиеся из-за нарушений покоя",
    category: "social",
    difficulty: "hard",
    effects: ["духовные наказания", "проклятия"],
    solutions: ["уважение к мертвым", "ритуалы успокоения"]
  },

  // Физические препятствия
  {
    id: "animal-traps",
    name: "звериные ловушки",
    description: "Ловушки, установленные охотниками для поимки зверей",
    category: "physical",
    difficulty: "medium",
    effects: ["травмы", "задержка"],
    solutions: ["проверка Выживания", "осторожность"]
  },
  {
    id: "slippery-roots",
    name: "скользкие корни",
    description: "Корни деревьев, покрытые влагой и мхом",
    category: "physical",
    difficulty: "medium",
    effects: ["риск падения", "травмы"],
    solutions: ["проверка Ловкости DC 12", "осторожное передвижение"]
  },
  {
    id: "strangler-vines",
    name: "лозы-удушители",
    description: "Агрессивные лозы, пытающиеся захватить путников",
    category: "physical",
    difficulty: "hard",
    effects: ["удушение", "ограничение движения"],
    solutions: ["проверка Ловкости DC 13", "использование оружия"]
  },
  {
    id: "cave-ins",
    name: "обвалы",
    description: "Обрушившиеся потолки и стены в подземельях",
    category: "physical",
    difficulty: "hard",
    effects: ["блокировка пути", "травмы", "смерть"],
    solutions: ["расчистка завала", "поиск обходного пути"]
  },
  {
    id: "battle-traces",
    name: "следы битвы",
    description: "Остатки недавнего сражения на тропе",
    category: "physical",
    difficulty: "easy",
    effects: ["замедление", "эмоциональное воздействие"],
    solutions: ["проверка Расследования DC 10", "осторожное прохождение"]
  },
  {
    id: "ancient-defenses",
    name: "древние защиты",
    description: "Древние защитные механизмы, блокирующие проход",
    category: "physical",
    difficulty: "hard",
    effects: ["блокировка пути", "активация ловушек"],
    solutions: ["проверка Магии DC 13", "проверка Расследования DC 14"]
  },
  {
    id: "ancient-guardians",
    name: "древние стражи",
    description: "Древние механические или магические стражи",
    category: "physical",
    difficulty: "hard",
    effects: ["атаки", "блокировка пути"],
    solutions: ["разрушение", "обход", "деактивация"]
  },
  {
    id: "spiritual-trials",
    name: "духовные испытания",
    description: "Испытания, устраиваемые духами для проверки достойности",
    category: "physical",
    difficulty: "hard",
    effects: ["духовные наказания", "отказ в проходе"],
    solutions: ["разрешение духов", "проверка Религии DC 15"]
  },
  {
    id: "unstable-bridge",
    name: "неустойчивый мост",
    description: "Мост через кислотную реку, готовый обрушиться",
    category: "physical",
    difficulty: "medium",
    effects: ["риск падения", "травмы"],
    solutions: ["проверка Ловкости DC 12", "осторожное передвижение"]
  },
  {
    id: "broken-machinery",
    name: "сломанная техника",
    description: "Неисправные механизмы в шахте",
    category: "physical",
    difficulty: "medium",
    effects: ["блокировка пути", "опасность"],
    solutions: ["проверка механики DC 14", "ремонт"]
  },
  {
    id: "ancient-traps",
    name: "остатки древних ловушек",
    description: "Частично разрушенные древние ловушки",
    category: "physical",
    difficulty: "medium",
    effects: ["случайные срабатывания", "травмы"],
    solutions: ["проверка Истории DC 13", "осторожность"]
  },
  {
    id: "ancient-mechanisms",
    name: "древние механизмы",
    description: "Древние механические устройства для открытия дверей",
    category: "physical",
    difficulty: "hard",
    effects: ["блокировка доступа", "активация ловушек"],
    solutions: ["ключи крепости", "проверка Воровства DC 16"]
  },
  {
    id: "hidden-doors",
    name: "скрытые двери",
    description: "Тайные двери, скрытые в стенах",
    category: "physical",
    difficulty: "medium",
    effects: ["сложность обнаружения"],
    solutions: ["проверка Расследования", "знание расположения"]
  },
  {
    id: "thieves-traps",
    name: "ловушки воров",
    description: "Ловушки, установленные ворами для защиты своих троп",
    category: "physical",
    difficulty: "hard",
    effects: ["травмы", "смерть", "сигнализация"],
    solutions: ["проверка Воровства DC 15", "знание паролей"]
  },
  {
    id: "secret-doors",
    name: "тайные двери",
    description: "Скрытые проходы, известные только посвящённым",
    category: "physical",
    difficulty: "medium",
    effects: ["сложность обнаружения"],
    solutions: ["знание паролей", "проверка Расследования"]
  },
  {
    id: "pendulums",
    name: "маятники",
    description: "Качающиеся маятники для калибровки резонанса",
    category: "physical",
    difficulty: "medium",
    effects: ["травмы", "дезориентация"],
    solutions: ["синхронизация движения", "осторожность"]
  },

  // Биологические препятствия
  {
    id: "spore-clouds",
    name: "споровые облака",
    description: "Облака спор от заражённых грибов",
    category: "biological",
    difficulty: "medium",
    effects: ["заражение", "отравление", "заболевания"],
    solutions: ["проверка Телосложения DC 13", "защитные маски"]
  },
  {
    id: "infected-beasts",
    name: "заражённые звери",
    description: "Дикие звери, заражённые грибковой инфекцией",
    category: "biological",
    difficulty: "hard",
    effects: ["агрессия", "заражение", "смерть"],
    solutions: ["уничтожение", "избегание", "лечение"]
  },
  {
    id: "infected-rats",
    name: "заражённые крысы",
    description: "Крысы, переносящие грибковую инфекцию",
    category: "biological",
    difficulty: "medium",
    effects: ["заражение", "агрессия", "распространение спор"],
    solutions: ["уничтожение", "защита", "избегание"]
  },
  {
    id: "infected-miners",
    name: "заражённые горняки",
    description: "Бывшие горняки, превращённые в зомби-носителей спор",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "заражение", "смерть"],
    solutions: ["уничтожение", "избегание", "лечение"]
  },
  {
    id: "fungal-guards",
    name: "грибные стражи",
    description: "Стражники, созданные из грибов и спор",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "заражение", "блокировка пути"],
    solutions: ["уничтожение", "обход", "деактивация"]
  },
  {
    id: "artifact-guards",
    name: "стражи артефактов",
    description: "Защитники сокровищницы, созданные из грибов",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "защита артефактов"],
    solutions: ["уничтожение", "обход", "деактивация"]
  },
  {
    id: "mutated-frogs",
    name: "мутировавшие жабы",
    description: "Жабы, мутировавшие под влиянием грибковой инфекции",
    category: "biological",
    difficulty: "medium",
    effects: ["атаки", "отравление", "заражение"],
    solutions: ["уничтожение", "избегание", "защита"]
  },
  {
    id: "water-elementals",
    name: "водные элементали",
    description: "Элементали, созданные из заражённой воды",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "заражение", "блокировка пути"],
    solutions: ["уничтожение", "обход", "магическая защита"]
  },
  {
    id: "spore-elementals",
    name: "споровые элементали",
    description: "Элементали, состоящие из спор и грибковой материи",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "заражение", "распространение спор"],
    solutions: ["уничтожение", "защита", "избегание"]
  },
  {
    id: "underwater-creatures",
    name: "подводные существа",
    description: "Существа, обитающие в глубинах вод",
    category: "biological",
    difficulty: "medium",
    effects: ["атаки", "угроза", "блокировка пути"],
    solutions: ["уничтожение", "избегание", "защита"]
  },
  {
    id: "wild-beasts",
    name: "дикие звери",
    description: "Обычные дикие животные в горах",
    category: "biological",
    difficulty: "easy",
    effects: ["угроза", "атаки"],
    solutions: ["проверка Выживания DC 11", "избегание"]
  },
  {
    id: "corrupted-priests",
    name: "оскверённые жрецы",
    description: "Жрецы, осквернённые влиянием Тени",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "проклятия", "блокировка пути"],
    solutions: ["уничтожение", "изгнание", "обход"]
  },
  {
    id: "dark-spirits",
    name: "тёмные духи",
    description: "Духи, подчинённые Тени",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "проклятия", "влияние на разум"],
    solutions: ["изгнание", "защитные заклинания", "обход"]
  },
  {
    id: "antimagic-constructs",
    name: "антимагические конструкты",
    description: "Механические существа, подавляющие магию",
    category: "biological",
    difficulty: "hard",
    effects: ["атаки", "подавление магии", "блокировка пути"],
    solutions: ["физические атаки", "разрушение", "обход"]
  },
  {
    id: "spore-carrier-rats",
    name: "крысы-носители спор",
    description: "Крысы, переносящие споры грибов",
    category: "biological",
    difficulty: "easy",
    effects: ["заражение", "распространение спор"],
    solutions: ["уничтожение", "защита", "избегание"]
  },

  // Механические препятствия
  {
    id: "confusing-passages",
    name: "запутанные ходы",
    description: "Сложная система катакомбных ходов",
    category: "mechanical",
    difficulty: "medium",
    effects: ["потеря ориентации", "заблуждение"],
    solutions: ["источник света", "проверка Выживания DC 14"]
  },
  {
    id: "complete-darkness",
    name: "полная темнота",
    description: "Отсутствие света в подземных ходах",
    category: "mechanical",
    difficulty: "medium",
    effects: ["потеря ориентации", "заблуждение", "страх"],
    solutions: ["источник света", "проверка Выживания DC 14"]
  },
  {
    id: "getting-lost",
    name: "заблудиться",
    description: "Потеря ориентации в сложных подземных ходах",
    category: "mechanical",
    difficulty: "medium",
    effects: ["потеря времени", "опасность", "стресс"],
    solutions: ["карта", "проверка Выживания", "ориентиры"]
  },
  {
    id: "acid-splashes",
    name: "кислотные брызги",
    description: "Брызги кислоты от токсичных рек",
    category: "mechanical",
    difficulty: "medium",
    effects: ["кислотные ожоги", "повреждение снаряжения"],
    solutions: ["проверка Ловкости DC 13", "защита от кислоты"]
  },
  {
    id: "poisonous-fumes",
    name: "ядовитые пары",
    description: "Токсичные испарения от кислотных рек",
    category: "mechanical",
    difficulty: "medium",
    effects: ["отравление", "удушье", "потеря сознания"],
    solutions: ["защита органов дыхания", "быстрое прохождение"]
  },
  {
    id: "water-pressure",
    name: "давление воды",
    description: "Высокое давление на больших глубинах",
    category: "mechanical",
    difficulty: "hard",
    effects: ["повреждение организма", "смерть"],
    solutions: ["защита от давления", "магическая защита"]
  },
  {
    id: "underwater-labyrinths",
    name: "подводные лабиринты",
    description: "Сложные подводные ходы и туннели",
    category: "mechanical",
    difficulty: "hard",
    effects: ["потеря ориентации", "опасность утопления"],
    solutions: ["способность дышать под водой", "проверка Выносливости DC 16"]
  },
  {
    id: "strong-current",
    name: "сильное течение",
    description: "Мощные подводные течения",
    category: "mechanical",
    difficulty: "hard",
    effects: ["потеря контроля", "опасность утопления"],
    solutions: ["проверка Атлетики", "использование верёвок"]
  },
  {
    id: "underwater-swimming",
    name: "подводное плавание",
    description: "Необходимость плавать под водой",
    category: "mechanical",
    difficulty: "medium",
    effects: ["усталость", "ограниченное время"],
    solutions: ["способность дышать под водой", "магическая помощь"]
  }
];

export const getObstacleById = (id: string): ObstacleDescription | undefined => {
  return obstacleDescriptions.find(obstacle => obstacle.id === id);
};

export const getObstaclesByCategory = (category: string): ObstacleDescription[] => {
  return obstacleDescriptions.filter(obstacle => obstacle.category === category);
};

export const getObstaclesByDifficulty = (difficulty: string): ObstacleDescription[] => {
  return obstacleDescriptions.filter(obstacle => obstacle.difficulty === difficulty);
};