import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Select,
  Input,
  InputNumber,
  Badge,
  Dropdown,
  MenuProps,
  Tag,
  Alert,
  Modal,
  message,
  Divider,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  UserOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  HeartOutlined,
  StopOutlined,
  ClockCircleOutlined,
  FundOutlined,
  BarsOutlined,
  DashboardOutlined,
  SafetyOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useInitiativeTracker } from '../hooks/useInitiativeTracker';
import { useGroups } from '../hooks/useGroups';
import { useCharacters } from '../hooks/useCharacters';
import { useTrackers } from '../hooks/useTrackers';
import { CharacterStatus, InitiativeCharacter, DeathSaveType, DEATH_SAVE_MAX } from '../types/initiative';
import DeathSaveTracker from './DeathSaveTracker';

const { Title, Text } = Typography;
const { Option } = Select;

const statusConfig = {
  active: { label: 'Активен', color: 'green', icon: '💚' },
  unconscious: { label: 'Без сознания', color: 'orange', icon: '😵' },
  dead: { label: 'Мертв', color: 'red', icon: '💀' },
  'death-saving': { label: 'Спасброски от смерти', color: 'volcano', icon: '⚡' }
};

const InitiativeTracker: React.FC = () => {
  const {
    encounters,
    currentEncounter,
    createEncounter,
    deleteEncounter,
    setCharacterInitiative,
    startCombat,
    nextTurn,
    setCharacterStatus,
    addDeathSave,
    resetDeathSaves,
    endCombat,
    setCurrentEncounter,
    isNextTurnBlocked
  } = useInitiativeTracker();



  const { groups } = useGroups();
  const { hasCharacter, getCharacterData } = useCharacters();
  const { getCharacterStages } = useTrackers();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [encounterName, setEncounterName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [editingInitiatives, setEditingInitiatives] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Группы для выбора
  const availableGroups = useMemo(() => {
    return groups.filter(group => group.members.length > 0);
  }, [groups]);

  // Создание нового энкаунтера
  const handleCreateEncounter = useCallback(() => {
    if (!encounterName.trim()) {
      message.error('Введите название энкаунтера');
      return;
    }

    if (selectedGroupIds.length < 2) {
      message.error('Выберите минимум 2 группы');
      return;
    }

    const selectedGroups = groups.filter(g => selectedGroupIds.includes(g.id));
    
          try {
        const newEncounter = createEncounter(encounterName.trim(), selectedGroups);
        setCurrentEncounter(newEncounter.id);
        
        setShowCreateForm(false);
        setEncounterName('');
        setSelectedGroupIds([]);
        setRefreshKey(prev => prev + 1);
        message.success('Энкаунтер создан!');
      } catch (error) {
        message.error((error as Error).message);
      }
  }, [encounterName, selectedGroupIds, groups, createEncounter, setCurrentEncounter]);

  // Обновление инициативы персонажа
  const handleInitiativeChange = useCallback((characterId: string, value: number | null) => {
    if (!currentEncounter || value === null) return;
    
    setCharacterInitiative(currentEncounter.id, characterId, value);
  }, [currentEncounter, setCharacterInitiative]);

  // Обработка спасброска от смерти
  const handleDeathSave = useCallback((characterId: string, saveType: DeathSaveType) => {
    if (!currentEncounter) return;
    
    // Проверяем, что сейчас ход этого персонажа
    const currentCharacterInTurn = currentEncounter.characters[currentEncounter.currentTurnIndex];
    if (!currentCharacterInTurn || currentCharacterInTurn.id !== characterId) {
      const character = currentEncounter.characters.find(c => c.id === characterId);
      message.warning(`Сейчас не ход персонажа ${character?.name}! Дождитесь своей очереди.`);
      return;
    }
    
    addDeathSave(currentEncounter.id, characterId, saveType);
    
    // Показываем уведомление о результате спасброка
    const character = currentEncounter.characters.find(c => c.id === characterId);
    if (character) {
      const saveTypeLabels = {
        'success': 'успех',
        'failure': 'провал', 
        'critical-success': 'критический успех',
        'critical-failure': 'критический провал'
      };
      
      message.success(`${character.name}: ${saveTypeLabels[saveType]}! Кнопка "Следующий хода" разблокирована.`);
    }
  }, [currentEncounter, addDeathSave]);

  // Начало боя
  const handleStartCombat = useCallback(() => {
    if (!currentEncounter) return;

    try {
      startCombat(currentEncounter.id);
      message.success('Бой начался!');
    } catch (error) {
      message.error((error as Error).message);
    }
  }, [currentEncounter, startCombat]);

  // Следующий ход
  const handleNextTurn = useCallback(() => {
    if (!currentEncounter) return;
    nextTurn(currentEncounter.id);
  }, [currentEncounter, nextTurn]);

  // Завершение боя
  const handleEndCombat = useCallback(() => {
    if (!currentEncounter) return;
    endCombat(currentEncounter.id);
    message.success('Бой завершен!');
  }, [currentEncounter, endCombat]);

  // Действия персонажа
  const getCharacterActions = useCallback((character: InitiativeCharacter): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'active',
        label: (
          <Space>
            <span style={{ color: statusConfig.active.color }}>💚</span>
            Активен
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'active')
      },
      {
        key: 'unconscious',
        label: (
          <Space>
            <span style={{ color: statusConfig.unconscious.color }}>😵</span>
            Без сознания
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'unconscious')
      },
      {
        key: 'death-saving',
        label: (
          <Space>
            <span style={{ color: statusConfig['death-saving'].color }}>⚡</span>
            Спасброски от смерти
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'death-saving')
      },
      {
        key: 'dead',
        label: (
          <Space>
            <span style={{ color: statusConfig.dead.color }}>💀</span>
            Мертв
          </Space>
        ),
        onClick: () => setCharacterStatus(currentEncounter!.id, character.id, 'dead')
      }
    ];

    return items;
  }, [currentEncounter, setCharacterStatus]);

  // Функции для создания элементов дропдаунов метрик
  const getTrackerItems = useCallback((character: InitiativeCharacter) => {
    const st = getCharacterStages(character.id);
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Трекеры заражения</div>, type: 'group' as const },
      {
        key: character.id,
        label: (
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{character.name.split(' ')[0]}</div>
            <Space size={16}>
              <span style={{ fontWeight: 'bold', color: st.sporesStage > 2 ? '#ff4d4f' : '#1890ff' }}>
                Споры: {st.sporesStage}/4
              </span>
              <span style={{ fontWeight: 'bold', color: st.shadowStage > 2 ? '#ff4d4f' : '#722ed1' }}>
                Тень: {st.shadowStage}/4
              </span>
            </Space>
          </div>
        )
      }
    ];
  }, [getCharacterStages]);

  const getSkillsItems = useCallback((character: InitiativeCharacter) => {
    const cd = getCharacterData(character.id);
    const prof = cd ? Object.values(cd.skills || {}).filter((s: any) => (s.isProf || 0) > 0).map((s: any) => s.label).join(', ') : '—';
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Владение навыками</div>, type: 'group' as const },
      {
        key: character.id,
        label: (
          <div style={{ minWidth: '250px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{character.name.split(' ')[0]}</div>
            <div style={{ fontWeight: 'bold', textAlign: 'left', maxWidth: '200px' }}>
              {prof || '—'}
            </div>
          </div>
        )
      }
    ];
  }, [getCharacterData]);

  const getSavesItems = useCallback((character: InitiativeCharacter) => {
    const cd = getCharacterData(character.id);
    const list = cd ? Object.entries(cd.saves || {})
      .filter(([, s]: any) => s.isProf)
      .map(([k]: any) => {
        const statKey = k as keyof typeof cd.stats;
        return cd.stats?.[statKey]?.label || String(k).toUpperCase();
      })
      .join(', ') : '—';
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Владение спасбросками</div>, type: 'group' as const },
      {
        key: character.id,
        label: (
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{character.name.split(' ')[0]}</div>
            <div style={{ fontWeight: 'bold', textAlign: 'left' }}>
              {list || '—'}
            </div>
          </div>
        )
      }
    ];
  }, [getCharacterData]);

  const getAcItems = useCallback((character: InitiativeCharacter) => {
    const cd = getCharacterData(character.id);
    const ac = cd?.vitality?.ac?.value ?? '—';
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Класс Доспеха (КД)</div>, type: 'group' as const },
      {
        key: character.id,
        label: (
          <div style={{ minWidth: '120px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{character.name.split(' ')[0]}</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
              {ac}
            </div>
          </div>
        )
      }
    ];
  }, [getCharacterData]);

  const getPpItems = useCallback((character: InitiativeCharacter) => {
    const cd = getCharacterData(character.id);
    if (!cd) return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Пассивная Внимательность</div>, type: 'group' as const },
      {
        key: character.id,
        label: (
          <div style={{ minWidth: '120px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{character.name.split(' ')[0]}</div>
            <div style={{ fontWeight: 'bold' }}>—</div>
          </div>
        )
      }
    ];
    
    const wisMod = (cd.stats?.wis as any)?.modifier ?? 0;
    const level = Number((cd.info?.level as any)?.value ?? 1);
    const proficiency = Math.floor((level - 1) / 4) + 2;
    const percProf = (cd.skills?.perception as any)?.isProf || 0;
    const profBonus = percProf ? proficiency * (percProf === 2 ? 2 : 1) : 0;
    const pp = 10 + wisMod + profBonus;
    
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Пассивная Внимательность</div>, type: 'group' as const },
      {
        key: character.id,
        label: (
          <div style={{ minWidth: '120px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{character.name.split(' ')[0]}</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#52c41a' }}>
              {pp}
            </div>
          </div>
        )
      }
    ];
  }, [getCharacterData]);

  // Функции для создания элементов дропдаунов метрик энкаунтера
  const getEncounterTrackerItems = useCallback(() => {
    const charactersWithSheets = currentEncounter?.characters.filter(c => hasCharacter(c.id)) || [];
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Трекеры заражения</div>, type: 'group' as const },
      ...charactersWithSheets.map(c => {
        const st = getCharacterStages(c.id);
        return {
          key: c.id,
          label: (
            <div style={{ minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{c.name.split(' ')[0]}</div>
              <Space size={16}>
                <span style={{ fontWeight: 'bold', color: st.sporesStage > 2 ? '#ff4d4f' : '#1890ff' }}>
                  Споры: {st.sporesStage}/4
                </span>
                <span style={{ fontWeight: 'bold', color: st.shadowStage > 2 ? '#ff4d4f' : '#722ed1' }}>
                  Тень: {st.shadowStage}/4
                </span>
              </Space>
            </div>
          )
        };
      })
    ];
  }, [currentEncounter, hasCharacter, getCharacterStages]);

  const getEncounterSkillsItems = useCallback(() => {
    const charactersWithSheets = currentEncounter?.characters.filter(c => hasCharacter(c.id)) || [];
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Владение навыками</div>, type: 'group' as const },
      ...charactersWithSheets.map(c => {
        const cd = getCharacterData(c.id);
        const prof = cd ? Object.values(cd.skills || {}).filter((s: any) => (s.isProf || 0) > 0).map((s: any) => s.label).join(', ') : '—';
        return {
          key: c.id,
          label: (
            <div style={{ minWidth: '250px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{c.name.split(' ')[0]}</div>
              <div style={{ fontWeight: 'bold', textAlign: 'left', maxWidth: '200px' }}>
                {prof || '—'}
              </div>
            </div>
          )
        };
      })
    ];
  }, [currentEncounter, hasCharacter, getCharacterData]);

  const getEncounterSavesItems = useCallback(() => {
    const charactersWithSheets = currentEncounter?.characters.filter(c => hasCharacter(c.id)) || [];
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Владение спасбросками</div>, type: 'group' as const },
      ...charactersWithSheets.map(c => {
        const cd = getCharacterData(c.id);
        const list = cd ? Object.entries(cd.saves || {})
          .filter(([, s]: any) => s.isProf)
          .map(([k]: any) => {
            const statKey = k as keyof typeof cd.stats;
            return cd.stats?.[statKey]?.label || String(k).toUpperCase();
          })
          .join(', ') : '—';
        return {
          key: c.id,
          label: (
            <div style={{ minWidth: '200px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{c.name.split(' ')[0]}</div>
              <div style={{ fontWeight: 'bold', textAlign: 'left' }}>
                {list || '—'}
              </div>
            </div>
          )
        };
      })
    ];
  }, [currentEncounter, hasCharacter, getCharacterData]);

  const getEncounterAcItems = useCallback(() => {
    const charactersWithSheets = currentEncounter?.characters.filter(c => hasCharacter(c.id)) || [];
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Класс Доспеха (КД)</div>, type: 'group' as const },
      ...charactersWithSheets.map(c => {
        const cd = getCharacterData(c.id);
        const ac = cd?.vitality?.ac?.value ?? '—';
        return {
          key: c.id,
          label: (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{c.name.split(' ')[0]}</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                {ac}
              </div>
            </div>
          )
        };
      })
    ];
  }, [currentEncounter, hasCharacter, getCharacterData]);

  const getEncounterPpItems = useCallback(() => {
    const charactersWithSheets = currentEncounter?.characters.filter(c => hasCharacter(c.id)) || [];
    return [
      { key: 'header', label: <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #d9d9d9', padding: '4px 0', marginBottom: '4px' }}>Пассивная Внимательность</div>, type: 'group' as const },
      ...charactersWithSheets.map(c => {
        const cd = getCharacterData(c.id);
        if (!cd) return {
          key: c.id,
          label: (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{c.name.split(' ')[0]}</div>
              <div style={{ fontWeight: 'bold' }}>—</div>
            </div>
          )
        };
        
        const wisMod = (cd.stats?.wis as any)?.modifier ?? 0;
        const level = Number((cd.info?.level as any)?.value ?? 1);
        const proficiency = Math.floor((level - 1) / 4) + 2;
        const percProf = (cd.skills?.perception as any)?.isProf || 0;
        const profBonus = percProf ? proficiency * (percProf === 2 ? 2 : 1) : 0;
        const pp = 10 + wisMod + profBonus;
        
        return {
          key: c.id,
          label: (
            <div style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{c.name.split(' ')[0]}</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#52c41a' }}>
                {pp}
              </div>
            </div>
          )
        };
      })
    ];
  }, [currentEncounter, hasCharacter, getCharacterData]);

  // Рендер карточки персонажа
  const renderCharacterCard = useCallback((character: InitiativeCharacter, index: number) => {
    const isCurrentTurn = Boolean(currentEncounter?.isActive && currentEncounter.currentTurnIndex === index);
    const statusInfo = statusConfig[character.status];
    


    return (
      <Card
        key={character.id}
        
        style={{
          width: '100%',
          border: isCurrentTurn ? '2px solid #1890ff' : '1px solid #d9d9d9',
          backgroundColor: isCurrentTurn ? '#f0f8ff' : 'white',
          boxShadow: isCurrentTurn ? '0 4px 8px rgba(24, 144, 255, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          width: '100%',
          flexWrap: 'wrap'
        }}>
          {/* Основная информация о персонаже */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            minWidth: '300px',
            flexWrap: 'wrap'
          }}>
            {/* Имя и группа */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <Badge color={character.groupColor} />
                <Text strong style={{ fontSize: 14 }}>
                  {character.name}
                </Text>
                {isCurrentTurn && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>ХОД</Tag>}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {character.groupName}
              </Text>
            </div>

            {/* Статус */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag color={statusInfo.color} style={{ margin: 0, fontSize: 11 }}>
                {statusInfo.icon} {statusInfo.label}
              </Tag>
              {/* Компонент спасбросков от смерти встроен рядом со статусом */}
              {character.status === 'death-saving' && (
                <DeathSaveTracker
                  successes={character.deathSaves.successes}
                  failures={character.deathSaves.failures}
                  onDeathSave={(saveType: DeathSaveType) => handleDeathSave(character.id, saveType)}
                  onReset={() => resetDeathSaves(currentEncounter!.id, character.id)}
                  isCurrentTurn={isCurrentTurn || false}
                />
              )}
            </div>

            {/* Инициатива */}
            <div style={{ minWidth: '80px', textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>Инициатива</Text>
              {!currentEncounter?.isActive ? (
                <InputNumber
                  
                  placeholder="Инц."
                  value={character.initiative}
                  onChange={(value) => handleInitiativeChange(character.id, value)}
                  style={{ width: 70 }}
                  min={1}
                  max={30}
                />
              ) : (
                <Tag color="geekblue" style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>
                  {character.initiative}
                </Tag>
              )}
            </div>

            {/* Действия */}
            <div>
              <Dropdown
                menu={{ items: getCharacterActions(character) }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button  icon={<MoreOutlined />} />
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Информация о персонаже (если есть лист) */}
        {hasCharacter(character.id) && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
              КД: {getCharacterData(character.id)?.vitality?.ac?.value || '—'} | 
              ХП: {(getCharacterData(character.id)?.vitality as any)?.['hp-current']?.value || '—'}/{(getCharacterData(character.id)?.vitality as any)?.['hp-max']?.value || '—'}
            </Text>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
              {[
                { key: 'str', label: 'СИЛ' },
                { key: 'dex', label: 'ЛОВ' },
                { key: 'con', label: 'ТЕЛ' },
                { key: 'int', label: 'ИНТ' },
                { key: 'wis', label: 'МДР' },
                { key: 'cha', label: 'ХАР' }
              ].map(({ key, label }) => {
                const cd = getCharacterData(character.id);
                if (!cd?.stats) return null;
                
                // Безопасный доступ к характеристикам
                const statData = (cd.stats as any)[key];
                if (!statData) return null;
                
                const modifier = statData.modifier || 0;
                const hasSave = (cd.saves as any)?.[key]?.isProf;
                
                return (
                  <span key={key} style={{ marginRight: 12 }}>
                    {label}: {modifier >= 0 ? '+' : ''}{modifier}{hasSave ? '*' : ''}
                  </span>
                );
              }).filter(Boolean)}
            </Text>
          </div>
        )}
        
        {/* Показываем прогресс спасбросков для персонажей в статусе "без сознания" */}
        {(character.deathSaves.successes > 0 || character.deathSaves.failures > 0) && 
         character.status === 'unconscious' && (
          <div style={{ 
            marginTop: 6, 
            padding: '4px 8px', 
            backgroundColor: '#f6ffed', 
            borderRadius: 4, 
            border: '1px solid #b7eb8f',
            display: 'inline-block'
          }}>
            <Text style={{ fontSize: 10, color: '#52c41a', marginRight: 8 }}>
              📊 Спасброски:
            </Text>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 9, color: '#52c41a' }}>✓</Text>
              {Array.from({ length: DEATH_SAVE_MAX }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: index < character.deathSaves.successes ? '#52c41a' : '#f0f0f0',
                    border: `1px solid #52c41a`
                  }}
                />
              ))}
              <Text style={{ fontSize: 9, color: '#ff4d4f', marginLeft: 8 }}>✗</Text>
              {Array.from({ length: DEATH_SAVE_MAX }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: index < character.deathSaves.failures ? '#ff4d4f' : '#f0f0f0',
                    border: `1px solid #ff4d4f`
                  }}
                />
              ))}
            </span>
          </div>
        )}
      </Card>
    );
  }, [currentEncounter]);

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, textAlign: 'center' }}>
            ⚔️ Трекер инициативы
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            Управление боевыми энкаунтерами
          </Text>
        </div>

        {/* Управление энкаунтерами */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col flex="auto">

            <Select
              key={`encounters-${encounters.length}-${refreshKey}`}
              placeholder="Выберите энкаунтер"
              value={currentEncounter?.id}
              onChange={setCurrentEncounter}
              style={{ width: '100%' }}
              allowClear
            >
              {encounters.map(encounter => (
                <Option key={encounter.id} value={encounter.id}>
                  <Space>
                    <Text>{encounter.name}</Text>
                    {encounter.isActive && <Tag color="green">АКТИВЕН</Tag>}
                    <Text type="secondary">
                      ({encounter.characters.length} персонажей)
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateForm(true)}
            >
              Создать энкаунтер
            </Button>
          </Col>
          {currentEncounter && (
            <Col>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Удалить
              </Button>
            </Col>
          )}
        </Row>

        {/* Контролы боя */}
        {currentEncounter ? (
          <Card  style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Text strong>{currentEncounter.name}</Text>
                  {currentEncounter.isActive && (
                    <Tag color="green">
                      Раунд {currentEncounter.round}
                    </Tag>
                  )}
                  {/* Иконки метрик для персонажей с листами */}
                  {currentEncounter.characters.some(c => hasCharacter(c.id)) && (
                    <Space size={4}>
                      <Dropdown trigger={["hover"]} menu={{ items: getEncounterTrackerItems() }} placement="bottomRight">
                        <Button  type="text" icon={<FundOutlined />} />
                      </Dropdown>
                      <Dropdown trigger={["hover"]} menu={{ items: getEncounterSkillsItems() }} placement="bottomRight">
                        <Button  type="text" icon={<BarsOutlined />} />
                      </Dropdown>
                      <Dropdown trigger={["hover"]} menu={{ items: getEncounterSavesItems() }} placement="bottomRight">
                        <Button  type="text" icon={<DashboardOutlined />} />
                      </Dropdown>
                      <Dropdown trigger={["hover"]} menu={{ items: getEncounterAcItems() }} placement="bottomRight">
                        <Button  type="text" icon={<SafetyOutlined />} />
                      </Dropdown>
                      <Dropdown trigger={["hover"]} menu={{ items: getEncounterPpItems() }} placement="bottomRight">
                        <Button  type="text" icon={<EyeOutlined />} />
                      </Dropdown>
                    </Space>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  {!currentEncounter.isActive ? (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={handleStartCombat}
                      disabled={currentEncounter.characters.some(c => c.initiative === null)}
                    >
                      Начать бой
                    </Button>
                  ) : (
                    <>
                      <Button
                        icon={<StepForwardOutlined />}
                        onClick={handleNextTurn}
                        disabled={isNextTurnBlocked(currentEncounter.id)}
                      >
                        Следующий ход
                      </Button>
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        {isNextTurnBlocked(currentEncounter.id) ? 
                          '(заблокировано - сделайте спасброк)' : 
                          '(нажмите для следующего хода)'
                        }
                      </Text>
                      <Button
                        icon={<StopOutlined />}
                        onClick={handleEndCombat}
                      >
                        Завершить бой
                      </Button>
                    </>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        ) : null}

        {/* Список персонажей */}
        {currentEncounter ? (
          <div>
            {currentEncounter.characters.length === 0 ? (
              <Empty description="Нет персонажей в энкаунтере" />
            ) : (
              <div>
                {!currentEncounter.isActive && (
                  <Alert
                    message="Установите инициативу всем персонажам перед началом боя"
                    type="info"
                    style={{ marginBottom: 16 }}
                    showIcon
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentEncounter.characters.map((character, index) => 
                    renderCharacterCard(character, index)
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Empty description="Выберите или создайте энкаунтер" />
        )}
      </Card>

      {/* Модальное окно создания энкаунтера */}
      <Modal
        title="Создать новый энкаунтер"
        open={showCreateForm}
        onOk={handleCreateEncounter}
        onCancel={() => {
          setShowCreateForm(false);
          setEncounterName('');
          setSelectedGroupIds([]);
        }}
        okText="Создать"
        cancelText="Отмена"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Название энкаунтера:</Text>
            <Input
              placeholder="Введите название"
              value={encounterName}
              onChange={(e) => setEncounterName(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          
          <div>
            <Text>Выберите группы (минимум 2):</Text>
            <Select
              mode="multiple"
              placeholder="Выберите группы"
              value={selectedGroupIds}
              onChange={setSelectedGroupIds}
              style={{ width: '100%', marginTop: 4 }}
            >
              {availableGroups.map(group => (
                <Option key={group.id} value={group.id}>
                  <Space>
                    <Badge color={group.color} />
                    <Text>{group.name}</Text>
                    <Text type="secondary">({group.members.length} персонажей)</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </div>

          {selectedGroupIds.length > 0 && (
            <div>
              <Text type="secondary">Персонажи в энкаунтере:</Text>
              <div style={{ marginTop: 8 }}>
                {selectedGroupIds.map(groupId => {
                  const group = groups.find(g => g.id === groupId);
                  if (!group) return null;
                  
                  return (
                    <div key={groupId} style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: group.color }}>
                        {group.name}:
                      </Text>{' '}
                      {group.members.map(member => member.name).join(', ')}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Space>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        title="Удалить энкаунтер?"
        open={showDeleteConfirm}
        onOk={() => {
          if (currentEncounter) {
            const deletedId = currentEncounter.id;
            deleteEncounter(deletedId);
            // Если удаляем текущий, сбросим выбор локально
            if (currentEncounter?.id === deletedId) {
              setCurrentEncounter(null);
            }
            setRefreshKey(prev => prev + 1);
            message.success('Энкаунтер успешно удален');
          }
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p>Вы уверены, что хотите удалить энкаунтер "{currentEncounter?.name}"?</p>
        <p>Это действие нельзя отменить.</p>
      </Modal>
    </div>
  );
};

export default InitiativeTracker;
