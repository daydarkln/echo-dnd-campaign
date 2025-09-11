import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Card,
  List,
  Typography,
  message,
  Space,
  Divider,
  Alert,
  Progress,
  Tag,
  Collapse,
  Input,
  Tabs
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { 
  CreatureImportData, 
  CreatureData, 
  parseCreatureData, 
  Creature,
  CreatureStats,
  calculateProficiencyBonus,
  getExperiencePoints
} from '../types/creature';
import { CreatureViewer } from './CreatureViewer';

const { Text, Title, Paragraph } = Typography;
const { Dragger } = Upload;
const { Panel } = Collapse;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface CreatureImporterProps {
  visible: boolean;
  onImport: (creatures: CreatureImportData[]) => Promise<void>;
  onCancel: () => void;
}

interface ImportResult {
  success: boolean;
  creature?: CreatureImportData;
  error?: string;
  warnings?: string[];
}

export const CreatureImporter: React.FC<CreatureImporterProps> = ({
  visible,
  onImport,
  onCancel
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [parsedCreatures, setParsedCreatures] = useState<CreatureImportData[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const [jsonInput, setJsonInput] = useState('');
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [previewCreature, setPreviewCreature] = useState<Creature | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Простая обработка CSV - можно расширить
        message.warning('CSV импорт пока не поддерживается. Используйте JSON файлы.');
        return false;
      } else {
        message.error('Поддерживаются только JSON файлы');
        return false;
      }

      // Определяем формат данных и парсим
      const creatures = parseImportData(data);
      setParsedCreatures(creatures);
      setStep('preview');
      
      message.success(`Загружено ${creatures.length} существ для предпросмотра`);
      return false; // Предотвращаем автоматическую загрузку
    } catch (error) {
      message.error('Ошибка при чтении файла: ' + (error as Error).message);
      return false;
    }
  };

  const handleJsonInput = () => {
    try {
      if (!jsonInput.trim()) {
        message.warning('Введите JSON данные');
        return;
      }

      const data = JSON.parse(jsonInput);
      const creatures = parseImportData(data);
      setParsedCreatures(creatures);
      setStep('preview');
      
      message.success(`Загружено ${creatures.length} существ для предпросмотра`);
    } catch (error) {
      message.error('Ошибка при парсинге JSON: ' + (error as Error).message);
    }
  };

  const parseImportData = (data: any): CreatureImportData[] => {
    // Поддержка различных форматов импорта
    
    // 1. Массив существ
    if (Array.isArray(data)) {
      return data.map(normalizeCreatureData);
    }
    
    // 2. Объект с массивом существ
    if (data.monsters || data.creatures) {
      const creatures = data.monsters || data.creatures;
      return Array.isArray(creatures) ? creatures.map(normalizeCreatureData) : [normalizeCreatureData(creatures)];
    }
    
    // 3. Одно существо
    if (data.name || data.Name) {
      return [normalizeCreatureData(data)];
    }
    
    // 4. Open5e формат
    if (data.results) {
      return data.results.map(normalizeCreatureData);
    }
    
    throw new Error('Неизвестный формат данных');
  };

  const normalizeCreatureData = (rawData: any): CreatureImportData => {
    // Нормализация различных форматов в единый
    const normalized: CreatureImportData = {
      name: rawData.name || rawData.Name || 'Безымянное существо',
      size: rawData.size || rawData.Size || 'Средний',
      type: rawData.type || rawData.Type || rawData.creature_type || 'Гуманоид',
      subtype: rawData.subtype || rawData.Subtype,
      alignment: rawData.alignment || rawData.Alignment || 'Нейтральный',
      
      armor_class: rawData.armorClass || rawData.armor_class || rawData.ac || rawData.AC || 10,
      hit_points: rawData.hitPoints || rawData.hit_points || rawData.hp || rawData.HP || 1,
      hit_dice: rawData.hitDice || rawData.hit_dice,
      speed: rawData.speed || rawData.Speed || '30 фт',
      
      strength: rawData.stats?.str || rawData.strength || rawData.str || rawData.STR || 10,
      dexterity: rawData.stats?.dex || rawData.dexterity || rawData.dex || rawData.DEX || 10,
      constitution: rawData.stats?.con || rawData.constitution || rawData.con || rawData.CON || 10,
      intelligence: rawData.stats?.int || rawData.intelligence || rawData.int || rawData.INT || 10,
      wisdom: rawData.stats?.wis || rawData.wisdom || rawData.wis || rawData.WIS || 10,
      charisma: rawData.stats?.cha || rawData.charisma || rawData.cha || rawData.CHA || 10,
      
      challenge_rating: rawData.challengeRating || rawData.challenge_rating || rawData.cr || rawData.CR || '0',
      
      // Дополнительные поля
      saving_throws: rawData.savingThrows || rawData.saving_throws || rawData.saves,
      skills: rawData.skills || rawData.Skills,
      damage_vulnerabilities: rawData.damageVulnerabilities || rawData.damage_vulnerabilities || rawData.vulnerabilities,
      damage_resistances: rawData.damageResistances || rawData.damage_resistances || rawData.resistances,
      damage_immunities: rawData.damageImmunities || rawData.damage_immunities || rawData.immunities,
      condition_immunities: rawData.conditionImmunities || rawData.condition_immunities,
      senses: rawData.senses || rawData.Senses,
      languages: rawData.languages || rawData.Languages,
      
      // Способности
      traits: rawData.special_abilities || rawData.traits,
      actions: rawData.actions || rawData.Actions,
      bonus_actions: rawData.bonusActions || rawData.bonus_actions,
      reactions: rawData.reactions || rawData.Reactions,
      legendary_actions: rawData.legendaryActions || rawData.legendary_actions,
      lair_actions: rawData.lairActions || rawData.lair_actions,
      spellcasting: rawData.spellcasting,
      
      // Дополнительные поля нового формата
      proficiency_bonus: rawData.proficiencyBonus || rawData.proficiency_bonus,
      experience_points: rawData.experiencePoints || rawData.experience_points,
      armor_type: rawData.armorType || rawData.armor_type,
      source: rawData.source,
      description: rawData.description,
      lore: rawData.lore,
      tags: rawData.tags,
      environment: rawData.environment,
      custom_data: rawData.customData || rawData.custom_data
    };

    return normalized;
  };

  const validateCreature = (creature: CreatureImportData): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    if (!creature.name || creature.name.trim() === '') {
      warnings.push('Отсутствует название');
    }
    
    if (typeof creature.armor_class !== 'number' || creature.armor_class < 1) {
      warnings.push('Некорректный класс доспеха');
    }
    
    if (typeof creature.hit_points !== 'number' || creature.hit_points < 1) {
      warnings.push('Некорректные хиты');
    }
    
    const stats = [creature.strength, creature.dexterity, creature.constitution, 
                   creature.intelligence, creature.wisdom, creature.charisma];
    if (stats.some(stat => typeof stat !== 'number' || stat < 1 || stat > 30)) {
      warnings.push('Некорректные характеристики');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  };

  const handleImportConfirm = async () => {
    setImporting(true);
    setStep('results');
    
    const results: ImportResult[] = [];
    
    for (const creature of parsedCreatures) {
      try {
        const validation = validateCreature(creature);
        
        if (validation.isValid) {
          results.push({
            success: true,
            creature,
            warnings: validation.warnings
          });
        } else {
          results.push({
            success: false,
            creature,
            error: `Ошибки валидации: ${validation.warnings.join(', ')}`
          });
        }
      } catch (error) {
        results.push({
          success: false,
          creature,
          error: (error as Error).message
        });
      }
    }
    
    setImportResults(results);
    
    // Импортируем только успешные
    const successfulCreatures = results
      .filter(result => result.success && result.creature)
      .map(result => result.creature!);
    
    if (successfulCreatures.length > 0) {
      try {
        await onImport(successfulCreatures);
      } catch (error) {
        message.error('Ошибка при импорте: ' + (error as Error).message);
      }
    }
    
    setImporting(false);
  };

  // Конвертация импортированных данных в формат CreatureData
  const convertImportDataToCreatureData = (importData: CreatureImportData): CreatureData => {
    console.log('convertImportDataToCreatureData - входные данные:', importData);
    console.log('convertImportDataToCreatureData - legendaryActions в входных данных:', importData.legendaryActions);
    
    // Проверяем, не является ли это уже готовыми данными CreatureData
    if ('armorClass' in importData && 'hitPoints' in importData && 'stats' in importData) {
      console.log('Обрабатываем как новый формат CreatureData (оригинальный JSON)');
      const data = importData as any as CreatureData;
      
      // Проверяем и приводим числовые поля к правильному типу
      const armorClass = typeof data.armorClass === 'number' ? data.armorClass : parseInt(String(data.armorClass)) || 10;
      const hitPoints = typeof data.hitPoints === 'number' ? data.hitPoints : parseInt(String(data.hitPoints)) || 1;
      const challengeRating = String(data.challengeRating || '0');
      
      // Дополняем недостающие обязательные поля если их нет
      const result: CreatureData = {
        ...data,
        armorClass,
        hitPoints,
        challengeRating,
        hitDice: data.hitDice || '1d8',
        speed: data.speed || { walk: 30 },
        stats: {
          str: Number(data.stats?.str) ?? 10,
          dex: Number(data.stats?.dex) ?? 10,
          con: Number(data.stats?.con) ?? 10,
          int: Number(data.stats?.int) ?? 10,
          wis: Number(data.stats?.wis) ?? 10,
          cha: Number(data.stats?.cha) ?? 10,
        },
        proficiencyBonus: data.proficiencyBonus || calculateProficiencyBonus(challengeRating),
        experiencePoints: data.experiencePoints || getExperiencePoints(challengeRating),
        senses: {
          ...data.senses,
          passivePerception: Number(data.senses?.passivePerception) || 10
        },
        tags: data.tags || [],
        environment: data.environment || [],
      // Обрабатываем traits и actions с правильными полями description
      traits: data.traits?.map(trait => ({
        name: trait.name,
        description: trait.description || (trait as any).desc || ''
      })) || [],
      actions: data.actions?.map(action => ({
        name: action.name,
        description: action.description || (action as any).desc || '',
        type: action.type || 'action' as const,
        attackBonus: action.attackBonus,
        damage: action.damage,
        savingThrow: action.savingThrow,
        recharge: action.recharge
      })) || [],
      // Добавляем bonusActions если есть
      bonusActions: data.bonusActions?.map(action => ({
        name: action.name,
        description: action.description || (action as any).desc || '',
        type: action.type || 'bonus_action' as const,
        attackBonus: action.attackBonus,
        damage: action.damage,
        savingThrow: action.savingThrow,
        recharge: action.recharge
      })) || [],
      // Добавляем reactions если есть
      reactions: data.reactions?.map(action => ({
        name: action.name,
        description: action.description || (action as any).desc || '',
        type: action.type || 'reaction' as const,
        attackBonus: action.attackBonus,
        damage: action.damage,
        savingThrow: action.savingThrow,
        recharge: action.recharge
      })) || [],
        // Обрабатываем legendaryActions если есть
        legendaryActions: (() => {
          console.log('Обрабатываем legendaryActions...');
          console.log('data.legendaryActions:', data.legendaryActions);
          console.log('(importData as any).legendary_actions:', (importData as any).legendary_actions);
          
          const legendarySource = data.legendaryActions || (importData as any).legendary_actions;
          console.log('legendarySource:', legendarySource);
          
          if (legendarySource) {
            const result = {
              perTurn: Number(legendarySource.perTurn) || 3,
              actions: legendarySource.actions?.map((action: any) => ({
                name: action.name,
                description: action.description || action.desc || '',
                type: action.type || 'legendary_action' as const,
                damage: action.damage,
                attackBonus: action.attackBonus,
                savingThrow: action.savingThrow
              })) || []
            };
            console.log('Результат обработки legendaryActions:', result);
            return result;
          }
          console.log('legendaryActions не найдены');
          return undefined;
        })(),
        
        // Обрабатываем lairActions если есть
        lairActions: (() => {
          console.log('Обрабатываем lairActions в новом формате...');
          const lairSource = data.lairActions || (importData as any).lair_actions;
          console.log('lairSource в новом формате:', lairSource);
          
          if (lairSource && Array.isArray(lairSource)) {
            const result = lairSource.map((action: any) => ({
              name: action.name,
              description: action.description || action.desc || '',
              type: action.type || 'lair_action' as const,
              damage: action.damage,
              attackBonus: action.attackBonus,
              savingThrow: action.savingThrow,
              recharge: action.recharge
            }));
            console.log('Результат обработки lairActions в новом формате:', result);
            return result;
          }
          console.log('lairActions не найдены в новом формате');
          return undefined;
        })(),
        
        // Обрабатываем spellcasting если есть
        spellcasting: (() => {
          console.log('Обрабатываем spellcasting в новом формате...');
          const spellcastingSource = data.spellcasting || (importData as any).spellcasting;
          console.log('spellcastingSource в новом формате:', spellcastingSource);
          
          if (spellcastingSource) {
            const result = {
              level: Number(spellcastingSource.level) || 1,
              ability: spellcastingSource.ability || 'int' as keyof CreatureStats,
              saveDc: Number(spellcastingSource.saveDc) || 10,
              attackBonus: Number(spellcastingSource.attackBonus) || 0,
              spells: spellcastingSource.spells || {}
            };
            console.log('Результат обработки spellcasting в новом формате:', result);
            return result;
          }
          console.log('spellcasting не найден в новом формате');
          return undefined;
        })(),
        
        // Добавляем дополнительные поля
        armorType: data.armorType,
        source: data.source,
        description: data.description,
        lore: data.lore,
        customData: data.customData,
        
        // Добавляем сопротивления и иммунитеты
        damageVulnerabilities: data.damageVulnerabilities,
        damageResistances: data.damageResistances,
        damageImmunities: data.damageImmunities,
        conditionImmunities: data.conditionImmunities,
        
        // Добавляем saving throws если есть
        savingThrows: data.savingThrows,
        skills: data.skills
      };
      
      console.log('convertImportDataToCreatureData - финальный результат:', result);
      console.log('convertImportDataToCreatureData - legendaryActions в результате:', result.legendaryActions);
      return result;
    }
    
    // Иначе конвертируем старый формат
    return {
      name: importData.name || 'Безымянное существо',
      size: importData.size as any || 'Средний',
      type: importData.type as any || 'Гуманоид',
      subtype: importData.subtype,
      alignment: importData.alignment as any || 'Нейтральный',
      armorClass: typeof importData.armor_class === 'number' ? importData.armor_class : 
                  (importData.armor_class ? parseInt(importData.armor_class.toString()) : 10),
      hitPoints: typeof importData.hit_points === 'number' ? importData.hit_points : 
                 (importData.hit_points ? parseInt(importData.hit_points.toString()) : 1),
      hitDice: importData.hit_dice || '1d8',
      speed: typeof importData.speed === 'object' ? importData.speed : { walk: 30 },
      stats: {
        str: importData.strength || 10,
        dex: importData.dexterity || 10,
        con: importData.constitution || 10,
        int: importData.intelligence || 10,
        wis: importData.wisdom || 10,
        cha: importData.charisma || 10
      },
      senses: {
        passivePerception: 10
      },
      challengeRating: (importData.challenge_rating || '0').toString(),
      proficiencyBonus: calculateProficiencyBonus((importData.challenge_rating || '0').toString()),
      experiencePoints: getExperiencePoints((importData.challenge_rating || '0').toString()),
      traits: importData.traits?.map(trait => ({
        name: trait.name || 'Безымянная черта',
        description: Array.isArray(trait.desc) ? trait.desc.join(' ') : 
                    (trait.desc || (trait as any).description || '')
      })),
      actions: importData.actions?.map(action => ({
        name: action.name || 'Безымянное действие',
        description: Array.isArray(action.desc) ? action.desc.join(' ') : 
                    (action.desc || (action as any).description || ''),
        type: 'action' as const
      })),
      bonusActions: importData.bonus_actions?.map(action => ({
        name: action.name || 'Безымянное бонусное действие',
        description: Array.isArray(action.desc) ? action.desc.join(' ') : 
                    (action.desc || (action as any).description || ''),
        type: 'bonus_action' as const
      })),
      reactions: importData.reactions?.map(action => ({
        name: action.name || 'Безымянная реакция',
        description: Array.isArray(action.desc) ? action.desc.join(' ') : 
                    (action.desc || (action as any).description || ''),
        type: 'reaction' as const
      })),
      // Добавляем обработку легендарных действий для старого формата
      legendaryActions: (() => {
        console.log('Обрабатываем legendaryActions в старом формате...');
        const legendarySource = (importData as any).legendary_actions || importData.legendaryActions;
        console.log('legendarySource в старом формате:', legendarySource);
        
        if (legendarySource && legendarySource.actions) {
          const result = {
            perTurn: Number(legendarySource.perTurn) || 3,
            actions: legendarySource.actions.map((action: any) => ({
              name: action.name || 'Безымянное легендарное действие',
              description: Array.isArray(action.desc) ? action.desc.join(' ') : 
                          (action.desc || action.description || ''),
              type: action.type || 'legendary_action' as const,
              damage: action.damage,
              attackBonus: action.attackBonus,
              savingThrow: action.savingThrow
            }))
          };
          console.log('Результат обработки legendaryActions в старом формате:', result);
          return result;
        }
        console.log('legendaryActions не найдены в старом формате');
        return undefined;
      })(),
      // Добавляем обработку действий логова для старого формата
      lairActions: (() => {
        console.log('Обрабатываем lairActions в старом формате...');
        const lairSource = (importData as any).lair_actions || importData.lairActions;
        console.log('lairSource в старом формате:', lairSource);
        
        if (lairSource && Array.isArray(lairSource)) {
          const result = lairSource.map((action: any) => ({
            name: action.name || 'Безымянное действие логова',
            description: Array.isArray(action.desc) ? action.desc.join(' ') : 
                        (action.desc || action.description || ''),
            type: action.type || 'lair_action' as const,
            damage: action.damage,
            attackBonus: action.attackBonus,
            savingThrow: action.savingThrow,
            recharge: action.recharge
          }));
          console.log('Результат обработки lairActions в старом формате:', result);
          return result;
        }
        console.log('lairActions не найдены в старом формате');
        return undefined;
      })(),
      // Добавляем обработку заклинательства для старого формата
      spellcasting: (() => {
        console.log('Обрабатываем spellcasting в старом формате...');
        const spellcastingSource = (importData as any).spellcasting;
        console.log('spellcastingSource в старом формате:', spellcastingSource);
        
        if (spellcastingSource) {
          const result = {
            level: Number(spellcastingSource.level) || 1,
            ability: spellcastingSource.ability || 'int' as keyof CreatureStats,
            saveDc: Number(spellcastingSource.saveDc) || 10,
            attackBonus: Number(spellcastingSource.attackBonus) || 0,
            spells: spellcastingSource.spells || {}
          };
          console.log('Результат обработки spellcasting в старом формате:', result);
          return result;
        }
        console.log('spellcasting не найден в старом формате');
        return undefined;
      })(),
      tags: (importData as any).tags || [],
      environment: (importData as any).environment || [],
      source: (importData as any).source,
      description: (importData as any).description,
      lore: (importData as any).lore,
      armorType: (importData as any).armor_type,
      customData: (importData as any).custom_data
    };
  };

  const handlePreviewCreature = (creatureData: CreatureImportData) => {
    // Конвертируем импортированные данные в полный формат CreatureData
    const convertedData = convertImportDataToCreatureData(creatureData);
    
    // Создаем mock-существо для предпросмотра
    const mockCreature: Creature = {
      id: 'preview-' + Date.now(),
      data: JSON.stringify(convertedData),
      createdAt: new Date().toISOString(),
      name: convertedData.name,
      type: convertedData.type,
      challengeRating: convertedData.challengeRating,
      tags: convertedData.tags || []
    };
    
    setPreviewCreature(mockCreature);
    setShowPreview(true);
  };

  const handleReset = () => {
    setFileList([]);
    setParsedCreatures([]);
    setImportResults([]);
    setStep('upload');
    setJsonInput('');
    setImportMethod('file');
    setPreviewCreature(null);
    setShowPreview(false);
  };

  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  const successCount = importResults.filter(r => r.success).length;
  const failCount = importResults.filter(r => !r.success).length;

  return (
    <Modal
      title="Импорт существ"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={
        step === 'upload' ? null :
        step === 'preview' ? [
          <Button key="back" onClick={() => setStep('upload')}>
            Назад
          </Button>,
          <Button key="cancel" onClick={handleCancel}>
            Отмена
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importing}
            onClick={handleImportConfirm}
            disabled={parsedCreatures.length === 0}
          >
            Импортировать ({parsedCreatures.length})
          </Button>
        ] : [
          <Button key="close" type="primary" onClick={handleCancel}>
            Закрыть
          </Button>,
          <Button key="reset" onClick={handleReset}>
            Импортировать ещё
          </Button>
        ]
      }
    >
      {step === 'upload' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Поддерживаемые форматы"
            description={
              <ul>
                <li>JSON файлы с массивом существ</li>
                <li>Open5e API формат</li>
                <li>5eTools формат</li>
                <li>Homebrew формат</li>
                <li>Прямой ввод JSON</li>
              </ul>
            }
            type="info"
            showIcon
          />
          
          <Tabs activeKey={importMethod} onChange={(key) => setImportMethod(key as 'file' | 'text')}>
            <TabPane tab="Загрузка файла" key="file">
              <Dragger
                fileList={fileList}
                beforeUpload={handleFileUpload}
                onChange={({ fileList }) => setFileList(fileList)}
                accept=".json,.csv"
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">
                  Нажмите или перетащите файл сюда
                </p>
                <p className="ant-upload-hint">
                  Поддерживаются JSON и CSV файлы
                </p>
              </Dragger>
            </TabPane>
            
            <TabPane tab="Ввод JSON" key="text">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Вставьте JSON данные существа или массива существ:</Text>
                <TextArea
                  rows={12}
                  placeholder={`Пример:
{
  "name": "Светоличинка мотылька",
  "size": "Крошечный",
  "type": "Зверь",
  "alignment": "Без мировоззрения",
  "armorClass": 11,
  "hitPoints": 3,
  "hitDice": "1d4+1",
  "speed": { "walk": 5, "climb": 5 },
  "stats": { "str": 2, "dex": 12, "con": 12, "int": 1, "wis": 8, "cha": 6 },
  "challengeRating": "0",
  "traits": [
    {
      "name": "Биолюминесценция",
      "description": "Описание способности..."
    }
  ]
}`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <Button 
                  type="primary" 
                  onClick={handleJsonInput}
                  disabled={!jsonInput.trim()}
                  icon={<FileTextOutlined />}
                >
                  Парсить JSON
                </Button>
              </Space>
            </TabPane>
          </Tabs>

          <Collapse>
            <Panel header="Пример JSON структуры" key="example">
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '12px' }}>
{`// Массив существ
[
  {
    "name": "Гоблин",
    "size": "Маленький",
    "type": "Гуманоид",
    "subtype": "гоблиноид",
    "alignment": "Нейтрально-злой",
    "armorClass": 15,
    "hitPoints": 7,
    "hitDice": "2d6",
    "speed": { "walk": 30 },
    "stats": { "str": 8, "dex": 14, "con": 10, "int": 10, "wis": 8, "cha": 8 },
    "challengeRating": "1/4",
    "traits": [
      {
        "name": "Проворство",
        "description": "Описание способности..."
      }
    ],
    "actions": [
      {
        "name": "Скимитар",
        "description": "Атака оружием...",
        "type": "action"
      }
    ]
  }
]

// Или одно существо
{
  "name": "Дракон",
  "size": "Огромный",
  // ... остальные поля
}`}
              </pre>
            </Panel>
          </Collapse>
        </Space>
      )}

      {step === 'preview' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message={`Найдено ${parsedCreatures.length} существ для импорта`}
            description="Проверьте данные перед импортом. Существа с ошибками не будут импортированы."
            type="success"
            showIcon
          />
          
          <List
            dataSource={parsedCreatures}
            renderItem={(creature, index) => {
              const validation = validateCreature(creature);
              return (
                <List.Item>
                  <Card
                    
                    style={{ width: '100%' }}
                    title={
                      <Space>
                        {validation.isValid ? 
                          <CheckCircleOutlined style={{ color: 'green' }} /> :
                          <ExclamationCircleOutlined style={{ color: 'red' }} />
                        }
                        <Text strong>{creature.name}</Text>
                        <Tag>УО {creature.challenge_rating}</Tag>
                      </Space>
                    }
                    extra={
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handlePreviewCreature(creature)}
                        size="small"
                      >
                        Предпросмотр
                      </Button>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text type="secondary">
                        {creature.size} {creature.type}, {creature.alignment}
                      </Text>
                      <Text type="secondary">
                        КД {creature.armor_class}, {creature.hit_points} ХП
                      </Text>
                      {validation.warnings.length > 0 && (
                        <Space wrap>
                          {validation.warnings.map((warning, i) => (
                            <Tag key={i} color="orange" >{warning}</Tag>
                          ))}
                        </Space>
                      )}
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
            style={{ maxHeight: '400px', overflow: 'auto' }}
          />
        </Space>
      )}

      {step === 'results' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          {importing ? (
            <Card>
              <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                <Title level={4}>Импорт существ...</Title>
                <Progress percent={100} status="active" />
              </Space>
            </Card>
          ) : (
            <>
              <Alert
                message="Импорт завершён"
                description={`Успешно: ${successCount}, Ошибки: ${failCount}`}
                type={failCount === 0 ? 'success' : 'warning'}
                showIcon
              />
              
              <List
                dataSource={importResults}
                renderItem={(result) => (
                  <List.Item>
                    <Card
                      
                      style={{ width: '100%' }}
                      title={
                        <Space>
                          {result.success ? 
                            <CheckCircleOutlined style={{ color: 'green' }} /> :
                            <ExclamationCircleOutlined style={{ color: 'red' }} />
                          }
                          <Text strong>{result.creature?.name}</Text>
                          <Tag color={result.success ? 'green' : 'red'}>
                            {result.success ? 'Успешно' : 'Ошибка'}
                          </Tag>
                        </Space>
                      }
                    >
                      {result.error && (
                        <Text type="danger">{result.error}</Text>
                      )}
                      {result.warnings && result.warnings.length > 0 && (
                        <Space wrap>
                          {result.warnings.map((warning, i) => (
                            <Tag key={i} color="orange" >{warning}</Tag>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </List.Item>
                )}
                style={{ maxHeight: '400px', overflow: 'auto' }}
              />
            </>
          )}
        </Space>
      )}
      
      {/* Модальное окно предпросмотра существа */}
      <CreatureViewer
        visible={showPreview}
        creature={previewCreature}
        onClose={() => {
          setShowPreview(false);
          setPreviewCreature(null);
        }}
      />
    </Modal>
  );
};
