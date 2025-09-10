import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Card, Typography, Space, Row, Col, Button, Divider, Tag, Tooltip, Badge, Input, List, Empty, Slider } from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined,
  SoundOutlined,
  PauseCircleOutlined,
  CustomerServiceOutlined,
  ThunderboltOutlined,
  BookOutlined,
  GlobalOutlined,
  TeamOutlined,
  ReadOutlined,
  FileTextOutlined,
  HistoryOutlined,
  AimOutlined,
  UserOutlined
} from '@ant-design/icons';
import { SaveOutlined } from '@ant-design/icons';
import { useAudio } from '../App';
import { useQuests } from '../hooks/useQuests';
import InitiativeTracker from './InitiativeTracker';
import GroupedMindMap from './GroupedMindMap';
import RegionFocusedMap from './RegionFocusedMap';
import { PointsData, PathsData } from '../types';
import pointsData from '../tochki-interesa.json';
import pathsData from '../puti-mezhdu-lokaciyami.json';
import { parseToSubflows } from '../utils/dataParser';
import { useInitiativeTracker } from '../hooks/useInitiativeTracker';
import { useCharacters } from '../hooks/useCharacters';
import { useGroups } from '../hooks/useGroups';
import { useTrackers } from '../hooks/useTrackers';
import { useNavigate } from 'react-router-dom';
import VolumeControlPanel from './VolumeControlPanel';
import { WeatherTimeController } from './WeatherTimeController';
import CurrentLocationGraph from './CurrentLocationGraph';
import PlayersOverlay from './PlayersOverlay';

const { Title, Text } = Typography;

type Mode = 'exploration' | 'combat';
type MusicMode = 'exploration' | 'battle' | 'ambient';

const zoneStyle: React.CSSProperties = { transition: 'opacity 0.25s ease, transform 0.25s ease' };
const STORAGE_NOTES_KEY = 'gm-notes';
const STORAGE_HISTORY_KEY = 'gm-history';
const STORAGE_NPCS_KEY = 'gm-generated-npcs';

const NotesPanel: React.FC<{ value: string; onChange: (v: string) => void }>
  = ({ value, onChange }) => {
  return (
    <Card  title={<Space><FileTextOutlined /> <span>Заметки мастера</span></Space>}>
      <Input.TextArea id="gm-notes-input" rows={6} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Быстрые заметки... (Z — добавить)" />
    </Card>
  );
};

export const GameModeView: React.FC = () => {
  const audio = useAudio();
  const { data: quests } = useQuests();
  const { currentEncounter, startCombat, endCombat } = useInitiativeTracker();
  const { characters } = useCharacters();
  const { groups } = useGroups();
  const { state: trackers, setValue: setTrackerValue, inc: incTracker, dec: decTracker, incCharacterStage, decCharacterStage, getCharacterStages } = useTrackers();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('exploration');
  const [musicMode, setMusicMode] = useState<MusicMode>('exploration');
  const [showInitiative, setShowInitiative] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showQuests, setShowQuests] = useState(true);
  const [showWorldTrackers, setShowWorldTrackers] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [notes, setNotes] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_NOTES_KEY) ?? ''; } catch { return ''; }
  });
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (!saved) return [];
      const arr = JSON.parse(saved);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showPlayers, setShowPlayers] = useState<boolean>(true);
  const [showNpcWidget, setShowNpcWidget] = useState<boolean>(true);
  const [showMapFullscreen, setShowMapFullscreen] = useState<boolean>(false);
  const [showPlayersOverlay, setShowPlayersOverlay] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'mindmap' | 'region'>('mindmap');
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  
  // Состояния сворачивания виджетов
  const [isWorldTrackersCollapsed, setIsWorldTrackersCollapsed] = useState<boolean>(false);
  const [isMapCollapsed, setIsMapCollapsed] = useState<boolean>(false);
  const [isQuestsCollapsed, setIsQuestsCollapsed] = useState<boolean>(false);

  const pushHistory = useCallback((record: string) => {
    setHistory((prev) => {
      const next = [new Date().toLocaleTimeString('ru-RU') + ' — ' + record, ...prev].slice(0, 50);
      try { localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // NPC генерация
  type GeneratedNpc = { name: string; race: string; age: string; attitudeIndex: number; attitudeLabel: string };
  const [generatedNpcs, setGeneratedNpcs] = useState<GeneratedNpc[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NPCS_KEY);
      const arr = saved ? JSON.parse(saved) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  const [npcLoading, setNpcLoading] = useState(false);
  const [npcError, setNpcError] = useState<string | null>(null);

  const attitudeLabels = ['Враждебный', 'Недружелюбный', 'Нейтральный', 'Доброжелательный', 'Дружелюбный'];
  const attitudeColors = ['red', 'volcano', 'default', 'green', 'blue'];

  const sampleAttitude = useCallback((bias: number) => {
    const mu = Math.max(0, Math.min(4, bias));
    const sigma = 0.9;
    const weights = Array.from({ length: 5 }).map((_, i) => {
      const z = (i - mu) / sigma;
      return Math.exp(-0.5 * z * z);
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    const probs = weights.map((w) => w / sum);
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (r <= acc) return i;
    }
    return 2;
  }, []);

  const parseNpcFromResponse = (raw: any): { name?: string; race?: string; age?: string } => {
    const tryObj = (o: any) => {
      if (!o || typeof o !== 'object') return {} as any;
      return {
        name: o.name || o.Name || o.fullName || o.character || o.title,
        race: o.race || o.Race || o.species,
        age: (o.age ?? o.Age ?? o?.details?.age)?.toString(),
      } as any;
    };
    // Новый формат 7tools: refPackage.References["0"].ReferenceIds[raw.npc]
    try {
      const npcId = raw?.npc;
      const refs = raw?.refPackage?.References;
      const ref0 = refs?.["0"] ?? refs?.[0];
      const ids = ref0?.ReferenceIds;
      const entry = npcId && ids ? ids[npcId] : undefined;
      if (entry && typeof entry === 'object') {
        const vp = entry.VisualAppearance || {};
        return {
          name: entry.Name || entry.name,
          race: entry.RaceName || entry.race || raw?.race,
          age: (vp.age || vp.Age || entry.age || '').toString() || undefined,
        };
      }
    } catch {}
    if (Array.isArray(raw)) return tryObj(raw[0]);
    if (raw?.data) {
      if (Array.isArray(raw.data)) return tryObj(raw.data[0]);
      return tryObj(raw.data);
    }
    if (raw?.result && typeof raw.result === 'string') {
      const text = raw.result as string;
      const name = (text.match(/(?:Name|Имя)[:\-]?\s*([^,\n]+)/i)?.[1] || '').trim();
      const race = (text.match(/(?:Race|Раса)[:\-]?\s*([^,\n]+)/i)?.[1] || '').trim();
      const age = (text.match(/(?:Age|Возраст)[:\-]?\s*([^,\n]+)/i)?.[1] || '').trim();
      return { name, race, age };
    }
    return tryObj(raw);
  };

  const generateNpc = useCallback(async () => {
    setNpcLoading(true);
    setNpcError(null);
    try {
      const url = 'https://7tools.dev/api/GetNPC?adjective=true&generationCount=1&race=Random&gender=Any';
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const text = await res.text();
      let name = 'Незнакомец';
      let race = '—';
      let age = '—';
      try {
        const json = JSON.parse(text);
        const parsed = parseNpcFromResponse(json);
        if (parsed.name) name = parsed.name;
        if (parsed.race) race = parsed.race;
        if (parsed.age) age = parsed.age;
      } catch {
        const nameM = text.match(/(?:Name|Имя)[:\-]?\s*([^,\n]+)/i);
        const raceM = text.match(/(?:Race|Раса)[:\-]?\s*([^,\n]+)/i);
        const ageM = text.match(/(?:Age|Возраст)[:\-]?\s*([^,\n]+)/i);
        if (nameM) name = nameM[1].trim();
        if (raceM) race = raceM[1].trim();
        if (ageM) age = ageM[1].trim();
      }
      const idx = sampleAttitude(trackers.recognizability ?? 2);
      const label = attitudeLabels[idx];
      setGeneratedNpcs((prev) => [{ name, race, age, attitudeIndex: idx, attitudeLabel: label }, ...prev].slice(0, 10));
      pushHistory(`NPC: ${name} (${race}, ${age}) — ${label.toLowerCase()}`);
    } catch (e: any) {
      setNpcError('Не удалось сгенерировать NPC. Проверьте соединение.');
    } finally {
      setNpcLoading(false);
    }
  }, [sampleAttitude, trackers.recognizability, attitudeLabels, pushHistory]);

  // Подготовка данных карты
  const { nodes, edges } = useMemo(() => parseToSubflows(pointsData as PointsData, pathsData as PathsData), []);

  // Начальная загрузка из localStorage выполнена в инициализации useState

  // Сохранение состояния в localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_NOTES_KEY, notes); } catch {}
  }, [notes]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history)); } catch {}
  }, [history]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_NPCS_KEY, JSON.stringify(generatedNpcs)); } catch {}
  }, [generatedNpcs]);

  const playMusicTransition = useCallback(async (target: MusicMode) => {
    if (!audio?.audioConfig) return;
    
    const cfg = audio.audioConfig.encounterSettings;
    
    if (target === 'ambient') {
      // Плавно затухаем музыку, оставляем только ambient
      const activeSounds = audio.getActiveTracks();
      const musicSounds = activeSounds.filter(track => track.category === 'music');
      
      for (const musicSound of musicSounds) {
        audio.stopSound(musicSound.id, true); // С fade-out
      }
      
      setMusicMode('ambient');
      return;
    }
    
    // Для battle/exploration - плавный переход
    const pick = target === 'battle' ? cfg.battle : cfg.exploration;
    
    if (target === 'exploration') {
      // При возврате к исследованию - восстанавливаем музыку текущей локации
      const locationInfo = audio.getCurrentLocationInfo();
      if (locationInfo) {
        // Плавно затухаем боевую музыку
        const activeSounds = audio.getActiveTracks();
        const musicSounds = activeSounds.filter(track => track.category === 'music');
        
        // Запускаем fade-out для текущей музыки
        const fadePromises = musicSounds.map(musicSound => 
          new Promise<void>(resolve => {
            audio.stopSound(musicSound.id, true);
            setTimeout(resolve, audio.audioConfig?.globalSettings.fadeOutDuration || 1500);
          })
        );
        
        // Ждём завершения fade-out, затем запускаем музыку локации
        await Promise.all(fadePromises);
        
        // Восстанавливаем музыку локации через playLocationSpotlight
        setTimeout(() => {
          audio.playLocationSpotlight(locationInfo.id);
          setMusicMode(target);
        }, 200);
        
        return;
      }
    }
    
    // Стандартный переход для battle или fallback для exploration
    if (pick?.musicTransition) {
      // Плавно затухаем текущую музыку
      const activeSounds = audio.getActiveTracks();
      const musicSounds = activeSounds.filter(track => track.category === 'music');
      
      const fadePromises = musicSounds.map(musicSound => 
        new Promise<void>(resolve => {
          audio.stopSound(musicSound.id, true);
          setTimeout(resolve, audio.audioConfig?.globalSettings.fadeOutDuration || 1500);
        })
      );
      
      // Ждём завершения fade-out, затем запускаем новую музыку
      await Promise.all(fadePromises);
      
      setTimeout(() => {
        audio.playSound(pick.musicTransition!, 'music', { 
          volume: pick.volume || 0.6, 
          loop: true, 
          fadeIn: true 
        });
        setMusicMode(target);
      }, 200);
    }
  }, [audio, pushHistory]);

  const handleStartEncounter = useCallback(() => {
    setMode('combat');
    setShowInitiative(true);
    setShowMap(false);
    setShowQuests(false);
    setShowWorldTrackers(false);
    setShowNotes(false);
    playMusicTransition('battle');
    if (currentEncounter && !currentEncounter.isActive) {
      try { startCombat(currentEncounter.id); } catch {}
    }
    pushHistory('Бой начат');
  }, [currentEncounter, startCombat, playMusicTransition, pushHistory]);

  const handleEndEncounter = useCallback(() => {
    setMode('exploration');
    setShowInitiative(false);
    setShowMap(true);
    setShowQuests(true);
    setShowWorldTrackers(true);
    setShowNotes(true);
    playMusicTransition('exploration');
    if (currentEncounter?.isActive) {
      try { endCombat(currentEncounter.id); } catch {}
    }
    pushHistory('Бой завершён');
  }, [currentEncounter, endCombat, playMusicTransition, pushHistory]);

  const toggleEncounter = useCallback(() => {
    if (mode === 'exploration') handleStartEncounter(); else handleEndEncounter();
  }, [mode, handleStartEncounter, handleEndEncounter]);

  const cycleMusic = useCallback(() => {
    const order: MusicMode[] = ['exploration', 'battle', 'ambient'];
    const next = order[(order.indexOf(musicMode) + 1) % order.length];
    playMusicTransition(next);
  }, [musicMode, playMusicTransition]);

  // Горячие клавиши
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Игнорировать, если зажаты модификаторы Cmd/Ctrl
      if (e.metaKey || e.ctrlKey) return;
      // Игнорировать, если фокус в поле ввода/редактировании
      const ae = (document.activeElement as HTMLElement | null);
      if (ae) {
        const tag = ae.tagName?.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea';
        const isEditable = (ae as any).isContentEditable === true || !!ae.closest?.('[contenteditable="true"], .ant-input, .ant-mentions, .ant-select-open, .ant-picker-focused');
        if (isInput || isEditable) return;
      }
      const code = e.code; // физическая клавиша по раскладке
      if (code === 'KeyQ') { e.preventDefault(); toggleEncounter(); }
      if (code === 'KeyW') { e.preventDefault(); cycleMusic(); }
      if (code === 'KeyX') { e.preventDefault(); audio.setIsMuted(!audio.isMuted); pushHistory(audio.isMuted ? 'Звук: включен' : 'Звук: выключен'); }
      if (code === 'KeyA') { e.preventDefault(); setShowInitiative((v) => !v); }
      if (code === 'KeyE') { e.preventDefault(); setIsMapCollapsed((v) => !v); }
      if (code === 'KeyR') { e.preventDefault(); setIsQuestsCollapsed((v) => !v); }
      if (code === 'KeyT') { e.preventDefault(); setIsWorldTrackersCollapsed((v) => !v); }
      if (code === 'KeyY') { e.preventDefault(); setShowNotes((v) => !v); }
      if (code === 'KeyZ') { e.preventDefault(); setShowNotes(true); setTimeout(() => document.getElementById('gm-notes-input')?.focus(), 0); }
      if (code === 'KeyS') { e.preventDefault(); generateNpc(); }
      if (code === 'KeyO') { e.preventDefault(); setShowQuests((v) => !v); }
      if (code === 'KeyC') { e.preventDefault(); setShowPlayers((v) => !v); }
      if (code === 'KeyG') { e.preventDefault(); setShowNpcWidget((v) => !v); }
      if (code === 'KeyM') { e.preventDefault(); setShowMapFullscreen((v) => !v); }
      if (code === 'KeyH') { 
        e.preventDefault(); 
        if (!showPlayersOverlay) {
          setShowPlayersOverlay(true); 
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      const code = e.code;
      if (code === 'KeyH') setShowPlayersOverlay(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // Событие выбора локации из карт
    const onLocationSelected = (e: any) => {
      try {
        const d = e.detail;
        if (d && d.name) pushHistory(`Локация: ${d.name}`);
      } catch {}
    };
    window.addEventListener('gm:locationSelected', onLocationSelected as any);
    // Событие обновления квеста (summary/status)
    const onQuestUpdated = (e: any) => {
      try {
        const d = e.detail as { id: string; input: any };
        if (!d) return;
        const parts: string[] = [];
        if (typeof d.input?.status === 'string') parts.push(`статус → ${d.input.status}`);
        if (typeof d.input?.summary === 'string') parts.push('обновлён краткий обзор');
        if (parts.length > 0) pushHistory(`Квест #${d.id}: ${parts.join(', ')}`);
      } catch {}
    };
    window.addEventListener('gm:questUpdated', onQuestUpdated as any);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [audio, toggleEncounter, cycleMusic, pushHistory, generateNpc, showPlayersOverlay]);

  // Универсальная функция для создания сворачиваемых карточек
  const renderCollapsibleCard = useCallback((
    title: React.ReactNode,
    content: React.ReactNode,
    isCollapsed: boolean,
    hotkey?: string
  ) => {
    return (
      <Card  title={title} bodyStyle={isCollapsed ? { display: 'none' } : { padding: 8 }}>
        {!isCollapsed && content}
      </Card>
    );
  }, []);

  // Правый столбец: карточки игроков
  const renderPlayerCards = () => {
    if (mode === 'combat' && currentEncounter) {
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          {currentEncounter.characters.map((c) => {
            const cd = (Object.entries(characters).find(([id]) => id.endsWith(c.id))?.[1] ?? null);
            const parsed = cd ? JSON.parse(cd.data) : null;
            const hpCur = parsed?.vitality?.['hp-current']?.value ?? '—';
            const hpMax = parsed?.vitality?.['hp-max']?.value ?? '—';
            const ac = parsed?.vitality?.ac?.value ?? '—';
            const stages = getCharacterStages(c.id);
            const isPlayerCharacter = groups.some(g => g.isPlayers && g.members.some(m => m.id === c.id));
            
            return (
              <Card key={c.id}  bodyStyle={{ padding: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Badge color={c.groupColor} />
                      <Text strong>{c.name}</Text>
                    </Space>
                    <Space>
                      <Tag color="blue">КД {ac}</Tag>
                      <Tag color="red">ХП {hpCur}/{hpMax}</Tag>
                    </Space>
                  </Space>
                  
                  {/* Трекеры заражения только для игроков в бою */}
                  {isPlayerCharacter && (
                    <Space direction="vertical" style={{ width: '100%' }} size={2}>
                      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Споры:</Text>
                        <Space size={4}>
                          <Button 
                             
                            type="text" 
                            style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                            onClick={() => {
                              const prev = stages.sporesStage;
                              decCharacterStage(c.id, 'sporesStage');
                              const newVal = Math.max(0, prev - 1);
                              if (newVal !== prev) {
                                pushHistory(`${c.name}: Споры ${prev} → ${newVal}`);
                              }
                            }}
                          >-</Button>
                          <Tag 
                            color={stages.sporesStage > 2 ? 'red' : 'blue'} 
                            style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                          >
                            {stages.sporesStage}
                          </Tag>
                          <Button 
                             
                            type="text" 
                            style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                            onClick={() => {
                              const prev = stages.sporesStage;
                              incCharacterStage(c.id, 'sporesStage');
                              const newVal = Math.min(4, prev + 1);
                              if (newVal !== prev) {
                                pushHistory(`${c.name}: Споры ${prev} → ${newVal}`);
                              }
                            }}
                          >+</Button>
                        </Space>
                      </Space>
                      
                      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Тень:</Text>
                        <Space size={4}>
                          <Button 
                             
                            type="text" 
                            style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                            onClick={() => {
                              const prev = stages.shadowStage;
                              decCharacterStage(c.id, 'shadowStage');
                              const newVal = Math.max(0, prev - 1);
                              if (newVal !== prev) {
                                pushHistory(`${c.name}: Тень ${prev} → ${newVal}`);
                              }
                            }}
                          >-</Button>
                          <Tag 
                            color={stages.shadowStage > 2 ? 'red' : 'purple'} 
                            style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                          >
                            {stages.shadowStage}
                          </Tag>
                          <Button 
                             
                            type="text" 
                            style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                            onClick={() => {
                              const prev = stages.shadowStage;
                              incCharacterStage(c.id, 'shadowStage');
                              const newVal = Math.min(4, prev + 1);
                              if (newVal !== prev) {
                                pushHistory(`${c.name}: Тень ${prev} → ${newVal}`);
                              }
                            }}
                          >+</Button>
                        </Space>
                      </Space>
                    </Space>
                  )}
                </Space>
              </Card>
            );
          })}
        </Space>
      );
    }
    // Exploration: упрощённые карточки из групп
    const members = groups.flatMap((g) => g.members.map((m) => ({ ...m, groupColor: g.color, isPlayerGroup: g.isPlayers, groupId: g.id })));
  return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {members.map((m) => {
          const characterId = `${m.groupId}-${m.id}`;
          const stages = getCharacterStages(characterId);
          return (
            <Card key={m.id}  bodyStyle={{ padding: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Badge color={m.groupColor} />
                    <Text strong>{m.name}</Text>
                  </Space>
                  <Text type="secondary">{m.class || '—'}</Text>
                </Space>
                
                {/* Трекеры заражения только для игроков */}
                {m.isPlayerGroup && (
                  <Space direction="vertical" style={{ width: '100%' }} size={2}>
                    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Споры:</Text>
                      <Space size={4}>
                        <Button 
                           
                          type="text" 
                          style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                          onClick={() => {
                            const prev = stages.sporesStage;
                            decCharacterStage(characterId, 'sporesStage');
                            const newVal = Math.max(0, prev - 1);
                            if (newVal !== prev) {
                              pushHistory(`${m.name}: Споры ${prev} → ${newVal}`);
                            }
                          }}
                        >-</Button>
                        <Tag 
                          color={stages.sporesStage > 2 ? 'red' : 'blue'} 
                          style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                        >
                          {stages.sporesStage}
                        </Tag>
                        <Button 
                           
                          type="text" 
                          style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                          onClick={() => {
                            const prev = stages.sporesStage;
                            incCharacterStage(characterId, 'sporesStage');
                            const newVal = Math.min(4, prev + 1);
                            if (newVal !== prev) {
                              pushHistory(`${m.name}: Споры ${prev} → ${newVal}`);
                            }
                          }}
                        >+</Button>
                      </Space>
                    </Space>
                    
                    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Тень:</Text>
                      <Space size={4}>
                        <Button 
                           
                          type="text" 
                          style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                          onClick={() => {
                            const prev = stages.shadowStage;
                            decCharacterStage(characterId, 'shadowStage');
                            const newVal = Math.max(0, prev - 1);
                            if (newVal !== prev) {
                              pushHistory(`${m.name}: Тень ${prev} → ${newVal}`);
                            }
                          }}
                        >-</Button>
                        <Tag 
                          color={stages.shadowStage > 2 ? 'red' : 'purple'} 
                          style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                        >
                          {stages.shadowStage}
                        </Tag>
                        <Button 
                           
                          type="text" 
                          style={{ minWidth: 20, height: 20, padding: 0, fontSize: 10 }}
                          onClick={() => {
                            const prev = stages.shadowStage;
                            incCharacterStage(characterId, 'shadowStage');
                            const newVal = Math.min(4, prev + 1);
                            if (newVal !== prev) {
                              pushHistory(`${m.name}: Тень ${prev} → ${newVal}`);
                            }
                          }}
                        >+</Button>
                      </Space>
                    </Space>
                  </Space>
                )}
              </Space>
            </Card>
          );
        })}
        {members.length === 0 && <Empty description="Нет игроков" />}
      </Space>
    );
  };

  // Список активных квестов (компактно)
  const questList = useMemo(() => quests.filter((q) => q.status === 'active').slice(0, 10), [quests]);

  // Верхняя панель
  const TopBar = (
    <Card bodyStyle={{ padding: 8 }} style={{ marginBottom: 12 }}>
      <Space wrap>
        <Tooltip title="Start/End Encounter (Q)">
          {mode === 'exploration' ? (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartEncounter}>Start Encounter</Button>
          ) : (
            <Button danger icon={<StopOutlined />} onClick={handleEndEncounter}>End Encounter</Button>
          )}
        </Tooltip>
        <Tooltip title="Музыка: Исследование ↔ Бой ↔ Атмосфера (W)">
          <Button icon={<SoundOutlined />} onClick={cycleMusic}>Музыка</Button>
        </Tooltip>
        <Tooltip title="Пауза/Play (X)">
          <Button icon={audio.isMuted ? <CustomerServiceOutlined /> : <PauseCircleOutlined />} onClick={() => audio.setIsMuted(!audio.isMuted)}>
            {audio.isMuted ? 'Включить звук' : 'Выключить звук'}
          </Button>
        </Tooltip>
        <Tooltip title="Генератор NPC (S)"><Button icon={<TeamOutlined />} loading={npcLoading} onClick={generateNpc}>NPC</Button></Tooltip>
        <Tooltip title="Генератор лута (D)"><Button icon={<ThunderboltOutlined />} onClick={() => pushHistory('Генерация лута (заглушка)')}>Лут</Button></Tooltip>
      </Space>
    </Card>
  );

  // Собираем все виджеты и распределяем по сторонам
  const allWidgets = useMemo(() => {
    const widgets: Array<{ id: string; order: number; side: 'left' | 'center' | 'right'; className: string; content: React.ReactNode }> = [];

    // Карточки игроков (всегда видимы)
    widgets.push({
      id: 'players',
      order: 3,
      side: 'right',
      className: 'gm-widget-compact',
      content: (
        <Card  title={<Space><UserOutlined /> Карточки игроков (F)</Space>}>
          {renderPlayerCards()}
        </Card>
      )
    });

    if (mode === 'exploration') {
      // Состояние мира
      if (showWorldTrackers) {
        const worldTrackersContent = (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Узнаваемость</Text>
            <Slider
              min={0}
              max={4}
              step={1}
              value={trackers.recognizability}
              onChange={(v) => {
                const oldVal = trackers.recognizability;
                const newVal = Number(v);
                if (newVal !== oldVal) {
                  setTrackerValue('recognizability', newVal);
                  const labels = ['Враждебно','Недружелюбно','Нейтрально','Доброжелательно','Дружелюбно'];
                  pushHistory(`Узнаваемость: ${labels[oldVal]} → ${labels[newVal]}`);
                }
              }}
            />
            <div style={{ fontWeight: 500 }}>{['Враждебно','Недружелюбно','Нейтрально','Доброжелательно','Дружелюбно'][trackers.recognizability]}</div>
            <Divider style={{ margin: '8px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>Городская паника</Text>
                <Space>
                  <Button  onClick={() => {
                    const prev = trackers.cityPanic;
                    const next = Math.max(0, Math.min(4, prev - 1));
                    if (next !== prev) {
                      setTrackerValue('cityPanic', next);
                      pushHistory(`Городская паника: ${prev} → ${next}`);
                    }
                  }}>-</Button>
                  <Tag color="blue">{trackers.cityPanic}</Tag>
                  <Button  onClick={() => {
                    const prev = trackers.cityPanic;
                    const next = Math.max(0, Math.min(4, prev + 1));
                    if (next !== prev) {
                      setTrackerValue('cityPanic', next);
                      pushHistory(`Городская паника: ${prev} → ${next}`);
                    }
                  }}>+</Button>
                </Space>
              </Space>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>Экосистема</Text>
                <Space>
                  <Button  onClick={() => {
                    const prev = trackers.ecosystem;
                    const next = Math.max(0, Math.min(4, prev - 1));
                    if (next !== prev) {
                      setTrackerValue('ecosystem', next);
                      pushHistory(`Экосистема: ${prev} → ${next}`);
                    }
                  }}>-</Button>
                  <Tag color="green">{trackers.ecosystem}</Tag>
                  <Button  onClick={() => {
                    const prev = trackers.ecosystem;
                    const next = Math.max(0, Math.min(4, prev + 1));
                    if (next !== prev) {
                      setTrackerValue('ecosystem', next);
                      pushHistory(`Экосистема: ${prev} → ${next}`);
                    }
                  }}>+</Button>
                </Space>
              </Space>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>Рой</Text>
                <Space>
                  <Button  onClick={() => {
                    const prev = trackers.swarm;
                    const next = Math.max(0, Math.min(4, prev - 1));
                    if (next !== prev) {
                      setTrackerValue('swarm', next);
                      pushHistory(`Рой: ${prev} → ${next}`);
                    }
                  }}>-</Button>
                  <Tag color="magenta">{trackers.swarm}</Tag>
                  <Button  onClick={() => {
                    const prev = trackers.swarm;
                    const next = Math.max(0, Math.min(4, prev + 1));
                    if (next !== prev) {
                      setTrackerValue('swarm', next);
                      pushHistory(`Рой: ${prev} → ${next}`);
                    }
                  }}>+</Button>
                </Space>
              </Space>
            </Space>
          </Space>
        );

        widgets.push({
          id: 'world-trackers',
          order: 4,
          side: 'left',
          className: 'gm-widget-compact',
          content: renderCollapsibleCard(
            <Space><GlobalOutlined /> Состояние мира (T)</Space>,
            worldTrackersContent,
            isWorldTrackersCollapsed
          )
        });
      }

      // Карта — центральная колонка. Для columns layout она будет тяготеть к центру при большем размере.
      if (showMap) {
        const mapContent = (
          <CurrentLocationGraph
            pointsData={pointsData as PointsData}
            pathsData={pathsData as PathsData}
            currentLocationId={audio.getCurrentLocationInfo?.()?.id}
          />
        );

        widgets.push({
          id: 'map',
          order: 5,
          side: 'center',
          className: 'gm-widget-tall',
          content: renderCollapsibleCard(
            <Space><AimOutlined /> Текущая локация и соседние (E/M)</Space>,
            mapContent,
            isMapCollapsed
          )
        });
      }

      // Квесты
      if (showQuests) {
        const questsContent = questList.length === 0 ? (
          <Empty description="Нет активных квестов" />
        ) : (
          <List
            
            dataSource={questList}
            renderItem={(q) => (
              <List.Item onClick={() => navigate(`/quests/${q.id}`)} style={{ cursor: 'pointer' }}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
    <Space>
                    <Text strong>{q.title}</Text>
                    <Tag>{q.status}</Tag>
                  </Space>
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                    {q.summary}
                  </Typography.Paragraph>
    </Space>
              </List.Item>
            )}
          />
        );

        widgets.push({
          id: 'quests',
          order: 1,
          side: 'right',
          className: 'gm-widget-compact',
          content: renderCollapsibleCard(
            <Space><ReadOutlined /> Активные задания (R)</Space>,
            questsContent,
            isQuestsCollapsed
          )
        });
      }

      // Заметки и история в exploration
      if (showNotes) {
        widgets.push({
          id: 'notes',
          order: 2,
          side: 'left',
          className: 'gm-widget-compact',
          content: <NotesPanel value={notes} onChange={setNotes} />
        });
      }

      // Правая колонка: инструменты мастера (аккордеоны)
      widgets.push({
        id: 'history',
        order: 6,
        side: 'left',
        className: 'gm-widget-compact',
        content: (
          <Card  title={
            <Space>
              <HistoryOutlined /> История действий
              <Tag color="geekblue">{history.length}</Tag>
              {isHistoryOpen && history.length > 0 && (
                <Button  type="primary" icon={<SaveOutlined />} onClick={() => {
                  try {
                    const payload = {
                      generatedAt: new Date().toISOString(),
                      actions: history.slice().reverse(),
                      notes
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `campaign-history-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setHistory([]);
                    try { localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify([])); } catch {}
                    setNotes('');
                    try { localStorage.setItem(STORAGE_NOTES_KEY, ''); } catch {}
                  } catch {}
                }}>Сохранить</Button>
              )}
            </Space>
          }>
            <details open={isHistoryOpen} onToggle={(e) => setIsHistoryOpen((e.target as HTMLDetailsElement).open)}>
              <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Показать / скрыть</summary>
              <div style={{ marginTop: 8 }}>
                {history.length === 0 ? (
                  <Empty description="Пока пусто" />
                ) : (
                  <List  dataSource={history} renderItem={(i) => <List.Item>{i}</List.Item>} />
                )}
              </div>
            </details>
          </Card>
        )
      });
      widgets.push({
        id: 'npc',
        order: 7,
        side: 'right',
        className: 'gm-widget-compact',
        content: (
          <Card  title={<Space><TeamOutlined /> Генератор NPC (S)</Space>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Button type="primary" onClick={generateNpc} loading={npcLoading}>Сгенерировать</Button>
                <Tag>{attitudeLabels[trackers.recognizability]} (сдвиг)</Tag>
              </Space>
              {npcError && <Text type="danger">{npcError}</Text>}
              <List
                
                locale={{ emptyText: 'Пока нет NPC' }}
                dataSource={generatedNpcs}
                renderItem={(n) => (
                  <List.Item>
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text strong>{n.name}</Text>
                        <Tag color={attitudeColors[n.attitudeIndex]}>{n.attitudeLabel}</Tag>
                      </Space>
                      <Space>
                        <Tag color="geekblue">{n.race || '—'}</Tag>
                        <Tag color="purple">{n.age || '—'}</Tag>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </Space>
          </Card>
        )
      });
      widgets.push({
        id: 'loot',
        order: 8,
        side: 'right',
        className: 'gm-widget-compact',
        content: (
          <Card  title={<Space><ThunderboltOutlined /> Генератор лута (D)</Space>}>
            <Text type="secondary">Пока заглушка. Нажмите D для быстрого доступа.</Text>
          </Card>
        )
      });
      widgets.push({
        id: 'music-controls',
        order: 9,
        side: 'left',
        className: 'gm-widget-compact',
        content: (
          <Card  title={<Space><SoundOutlined /> Управление музыкой</Space>}>
            <div>
              <details>
                <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Громкость и каналы</summary>
                <div style={{ marginTop: 8 }}>
                  <VolumeControlPanel asWidget />
                </div>
              </details>
              <div style={{ marginTop: 12 }}>
                <details>
                  <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Погода</summary>
                  <div style={{ marginTop: 8 }}>
                    <WeatherTimeController embedded />
                  </div>
                </details>
              </div>
            </div>
          </Card>
        )
      });
    }

    if (mode === 'combat') {
      // Трекер инициативы в центре
      if (showInitiative) {
        widgets.push({
          id: 'initiative',
          order: 2,
          side: 'center',
          className: 'gm-widget-full',
          content: (
            <div style={{ animation: 'fadein 0.25s' }}>
              <InitiativeTracker />
            </div>
          )
        });
      }
    }

    // Сортируем по порядку
    return widgets.sort((a, b) => a.order - b.order);
  }, [mode, showWorldTrackers, showMap, showQuests, showNotes, questList, notes, history, showInitiative, currentView, focusedRegion, nodes, edges, renderPlayerCards, trackers.recognizability, setTrackerValue, npcLoading, npcError, generatedNpcs, isWorldTrackersCollapsed, isMapCollapsed, isQuestsCollapsed, renderCollapsibleCard, getCharacterStages, incCharacterStage, decCharacterStage, pushHistory]);

    return (
    <div style={{ padding: 12 }}>
      {TopBar}
      
      {/* Трёхколоночный лэйаут: 25% / 50% / 25% */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: '25%' }}>
          {allWidgets.filter(w => w.side === 'left').map((widget) => (
            <div key={widget.id} className={`gm-masonry-item ${widget.className}`} style={zoneStyle}>
              {widget.content}
            </div>
          ))}
        </div>
        <div style={{ width: '50%' }}>
          {allWidgets.filter(w => w.side === 'center').map((widget) => (
            <div key={widget.id} className={`gm-masonry-item ${widget.className}`} style={zoneStyle}>
              {widget.content}
            </div>
          ))}
        </div>
        <div style={{ width: '25%' }}>
          {allWidgets.filter(w => w.side === 'right').map((widget) => (
            <div key={widget.id} className={`gm-masonry-item ${widget.className}`} style={zoneStyle}>
              {widget.content}
            </div>
          ))}
        </div>
      </div>
      
      {/* Оверлей с информацией о персонажах игроков */}
      <PlayersOverlay
        visible={showPlayersOverlay}
        onClose={() => setShowPlayersOverlay(false)}
      />
      
      {/* Полноэкранный режим карты */}
      {showMapFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9998,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => setShowMapFullscreen(false)}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            flexShrink: 0
          }}>
            <Space>
              <Text strong style={{ fontSize: 18 }}>
                🗺️ Полноэкранный режим карты
              </Text>
              <Tag color="blue">Нажмите M или кликните для выхода</Tag>
            </Space>
            <Button 
              type="primary" 
              danger 
              onClick={() => setShowMapFullscreen(false)}
            >
              ✕ Закрыть
            </Button>
          </div>
          
          <div 
            style={{ 
              flex: 1, 
              backgroundColor: 'white',
              overflow: 'hidden',
              height: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CurrentLocationGraph
              pointsData={pointsData as PointsData}
              pathsData={pathsData as PathsData}
              currentLocationId={audio.getCurrentLocationInfo?.()?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameModeView;
