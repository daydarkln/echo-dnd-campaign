import React, { useState } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Input,
  InputNumber,
  Button,
  List,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Checkbox,
  Spin,
  Tabs,
  message
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  DownloadOutlined,
  UploadOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  AimOutlined,
  StarOutlined,
  SafetyOutlined,
  RadiusSettingOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { useCharacterById } from '../hooks/useCharacterById';
import { SPELL_LEVELS, Tag as CharacterTag } from '../types/character';
import { useTrackers } from '../hooks/useTrackers';
import { SpellLevelManager } from './SpellLevelManager';

const { Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Функция для перевода сокращений характеристик на русский
const getStatNameInRussian = (statKey: string): string => {
  const statNames: Record<string, string> = {
    'str': 'Сила',
    'dex': 'Ловкость', 
    'con': 'Телосложение',
    'int': 'Интеллект',
    'wis': 'Мудрость',
    'cha': 'Харизма'
  };
  return statNames[statKey] || statKey.toUpperCase();
};

// Компонент для отображения характеристики
const AbilityScore: React.FC<{
  name: string;
  label: string;
  score: number;
  modifier: number;
  onScoreChange: (value: number) => void;
}> = ({ name, label, score, modifier, onScoreChange }) => (
  <div style={{ 
    textAlign: 'center', 
    padding: '12px',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    border: '1px solid #f0f0f0'
  }}>
          <Text style={{ fontSize: '11px', color: '#8c8c8c', display: 'block', marginBottom: 4 }}>
        {getStatNameInRussian(name)}
      </Text>
    <InputNumber
      value={score}
      onChange={(value) => onScoreChange(value || 10)}
      min={1}
      max={30}
      style={{ 
        width: '100%', 
        marginBottom: 8,
        textAlign: 'center'
      }}
    />
    <div style={{ 
      backgroundColor: '#ffffff',
      borderRadius: 6,
      padding: '4px 8px',
      border: '1px solid #d9d9d9',
      fontWeight: 600,
      color: modifier >= 0 ? '#52c41a' : '#ff4d4f'
    }}>
      {modifier >= 0 ? '+' : ''}{modifier}
    </div>
  </div>
);

interface CharacterSheetModalProps {
  visible: boolean;
  onClose: () => void;
  characterId: string | null;
  characterName?: string;
}



// Компонент для отображения трекеров персонажа
const CharacterTrackers: React.FC<{
  characterId: string;
}> = ({ characterId }) => {
  const { getCharacterStages, incCharacterStage, decCharacterStage, resetCharacterStage } = useTrackers();
  const stages = getCharacterStages(characterId);
  
  const sporesStages = [
    'Нет симптомов/контроль',
    'Лёгкое раздражение — -1 к Интеллекту и Исследованию; лёгкие галлюцинации',
    'Уязвимость к яду; -2 к проверкам Мудрости',
    'Периодические спасброски против контроля',
    'Полная потеря личности; контроль роя в триггерных зонах'
  ];
  
  const shadowStages = [
    'Фон отсутствует',
    'Шёпоты; -1 к инициативе; искушения (проверка Мудрости при «сделках»)',
    'Давление; -1 к Харизме; периодические компульсии',
    'Захват; -2 к спасброскам против контроля; краткий «аватар» при провале Интеллекта',
    'Контроль — персонаж становится агентом Тени до конца сцены'
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 16,
      marginBottom: 16
    }}>
      {/* Трекер спор */}
      <div>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 500, 
          color: '#262626',
          marginBottom: 8
        }}>
          Споры ({stages.sporesStage}/4)
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 4, 
          marginBottom: 8
        }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              style={{ 
                width: 20, 
                height: 8, 
                background: i <= stages.sporesStage ? '#ff7875' : '#f0f0f0',
                borderRadius: 4,
                transition: 'all 0.2s'
              }} 
            />
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 4, 
          alignItems: 'center'
        }}>
          <Button 
            size="small" 
            onClick={() => decCharacterStage(characterId, 'sporesStage')}
            disabled={stages.sporesStage === 0}
            style={{ width: 24, height: 24, padding: 0, minWidth: 24 }}
          >
            -
          </Button>
          <span style={{ fontSize: '12px', color: '#8c8c8c', minWidth: 20, textAlign: 'center' }}>
            {stages.sporesStage}
          </span>
          <Button 
            size="small" 
            onClick={() => incCharacterStage(characterId, 'sporesStage')}
            disabled={stages.sporesStage === 4}
            style={{ width: 24, height: 24, padding: 0, minWidth: 24 }}
          >
            +
          </Button>
          <Button 
            size="small" 
            type="text" 
            onClick={() => resetCharacterStage(characterId, 'sporesStage')}
            style={{ fontSize: '11px', padding: '0 4px', height: 24 }}
          >
            сброс
          </Button>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#8c8c8c', 
          marginTop: 4,
          lineHeight: '1.3'
        }}>
          {sporesStages.slice(0, stages.sporesStage + 1).map((stage, idx) => (
            <div key={idx} style={{ marginBottom: idx < stages.sporesStage ? 2 : 0 }}>
              • {stage}
            </div>
          ))}
        </div>
      </div>

      {/* Трекер тени */}
      <div>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 500, 
          color: '#262626',
          marginBottom: 8
        }}>
          Тень ({stages.shadowStage}/4)
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 4, 
          marginBottom: 8
        }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              style={{ 
                width: 20, 
                height: 8, 
                background: i <= stages.shadowStage ? '#722ed1' : '#f0f0f0',
                borderRadius: 4,
                transition: 'all 0.2s'
              }} 
            />
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 4, 
          alignItems: 'center'
        }}>
          <Button 
            size="small" 
            onClick={() => decCharacterStage(characterId, 'shadowStage')}
            disabled={stages.shadowStage === 0}
            style={{ width: 24, height: 24, padding: 0, minWidth: 24 }}
          >
            -
          </Button>
          <span style={{ fontSize: '12px', color: '#8c8c8c', minWidth: 20, textAlign: 'center' }}>
            {stages.shadowStage}
          </span>
          <Button 
            size="small" 
            onClick={() => incCharacterStage(characterId, 'shadowStage')}
            disabled={stages.shadowStage === 4}
            style={{ width: 24, height: 24, padding: 0, minWidth: 24 }}
          >
            +
          </Button>
          <Button 
            size="small" 
            type="text" 
            onClick={() => resetCharacterStage(characterId, 'shadowStage')}
            style={{ fontSize: '11px', padding: '0 4px', height: 24 }}
          >
            сброс
          </Button>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#8c8c8c', 
          marginTop: 4,
          lineHeight: '1.3'
        }}>
          {shadowStages.slice(0, stages.shadowStage + 1).map((stage, idx) => (
            <div key={idx} style={{ marginBottom: idx < stages.shadowStage ? 2 : 0 }}>
              • {stage}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Компонент для отображения навыка
const SkillItem: React.FC<{
  name: string;
  skill: any;
  modifier: number;
  onProficiencyChange: (level: 0 | 1 | 2) => void;
}> = ({ name, skill, modifier, onProficiencyChange }) => {
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const profLevel = skill.isProf || 0;

  return (
    <Row align="middle" style={{ marginBottom: 2 }}>
      <Col span={3}>
        <Checkbox
          checked={profLevel >= 1}
          indeterminate={profLevel === 2}
          onChange={(e) => {
            if (profLevel === 0) {
              onProficiencyChange(1);
            } else if (profLevel === 1) {
              onProficiencyChange(2);
            } else {
              onProficiencyChange(0);
            }
          }}
          style={{ fontSize: 10 }}
        />
      </Col>
      <Col span={4}>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>{modifierStr}</Text>
      </Col>
      <Col span={17}>
        <Text style={{ fontSize: 11 }}>
          {skill.label}
          {profLevel === 2 && <Tag color="gold"  style={{ marginLeft: 4, fontSize: 10 }}>Эксп</Tag>}
        </Text>
      </Col>
    </Row>
  );
};

// Компонент для отображения спасброска
const SavingThrowItem: React.FC<{
  name: string;
  save: any;
  modifier: number;
  onProficiencyChange: (isProf: boolean) => void;
}> = ({ name, save, modifier, onProficiencyChange }) => {
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <Row align="middle" style={{ marginBottom: 2 }}>
      <Col span={4}>
        <Checkbox
          checked={save.isProf}
          onChange={(e) => onProficiencyChange(e.target.checked)}
          style={{ fontSize: 10 }}
        />
      </Col>
      <Col span={6}>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>{modifierStr}</Text>
      </Col>
      <Col span={14}>
        <Text style={{ fontSize: 11 }}>{getStatNameInRussian(name)}</Text>
      </Col>
    </Row>
  );
};

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ 
  visible, 
  onClose, 
  characterId,
  characterName 
}) => {
  const {
    characterData,
    isLoading,
    updateInfo,
    updateSubInfo,
    updateStat,
    updateSave,
    updateSkill,
    updateVitality,
    updateWeapon,
    addWeapon,
    removeWeapon,
    updateCoins,
    updateTextfield,
    addSpell,
    removeSpell,
    getSpellsByLevel,
    addTag,
    removeTag,
    getTags,
    getTextContent,
    getSkillModifier,
    getSaveModifier,
    getProficiencyBonus,
    exportCharacter,
    importCharacter
  } = useCharacterById(characterId || undefined);

  const [activeTab, setActiveTab] = useState('summary');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [newTagText, setNewTagText] = useState('');

  const handleExport = () => {
    const data = exportCharacter();
    if (data && characterData) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${characterData.name.value || 'character'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Персонаж экспортирован');
    }
  };

  const handleImport = () => {
    if (importCharacter(importData)) {
      message.success('Персонаж импортирован');
      setShowImportModal(false);
      setImportData('');
    } else {
      message.error('Ошибка при импорте персонажа');
    }
  };

  const handleAddTag = () => {
    if (newTagText.trim()) {
      addTag(newTagText.trim());
      setNewTagText('');
      message.success('Тег добавлен');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag(tagId);
    message.success('Тег удален');
  };

  if (!visible) return null;

  if (isLoading || !characterData) {
    return (
      <Modal
        title={`Лист персонажа${characterName ? `: ${characterName}` : ''}`}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={'100%'}
        style={{ top: 20 }}
      >
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Загрузка персонажа...</div>
        </div>
      </Modal>
    );
  }

  const coinTypes = [
    { key: 'pp', label: 'П', color: '#9c27b0' },
    { key: 'gp', label: 'З', color: '#ff9800' },
    { key: 'ep', label: 'Э', color: '#607d8b' },
    { key: 'sp', label: 'С', color: '#9e9e9e' },
    { key: 'cp', label: 'М', color: '#8d6e63' }
  ];

  return (
    <Modal
      title={
        <div style={{ paddingRight: 40 }}>
          <Row justify="space-between" align="middle">
            <Col flex="auto">
              <Space>
                <UserOutlined />
                <span>Лист персонажа: {characterData.name.value}</span>
              </Space>
            </Col>
            <Col flex="none">
              <Space size="small">
                <Button 
                  size="small" 
                  icon={<DownloadOutlined />} 
                  onClick={handleExport}
                  title="Экспорт персонажа"
                >
                  Экспорт
                </Button>
                <Button 
                  size="small" 
                  icon={<UploadOutlined />} 
                  onClick={() => setShowImportModal(true)}
                  title="Импорт персонажа"
                >
                  Импорт
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="100vw"
      style={{ top: 0, margin: 0, padding: 0, maxWidth: '100vw' }}
      bodyStyle={{ height: '100vh', overflow: 'auto' }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} >
        <TabPane tab={<span><StarOutlined /> Краткая сводка</span>} key="summary">
          <div style={{ padding: '12px 20px' }}>
            {/* Блок тегов и трекеров в одном ряду */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <div style={{ 
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                  height: '100%'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 16,
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#262626'
                  }}>
                    <TagsOutlined style={{ color: '#8c8c8c' }} />
                    Зацепки и особенности
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder="Добавить зацепку или особенность..."
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onPressEnter={handleAddTag}
                        style={{ 
                          borderRadius: '8px 0 0 8px',
                          height: 36,
                          fontSize: '13px'
                        }}
                      />
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={handleAddTag}
                        disabled={!newTagText.trim()}
                        style={{ 
                          borderRadius: '0 8px 8px 0',
                          height: 36,
                          paddingLeft: 14,
                          paddingRight: 14
                        }}
                      >
                        Добавить
                      </Button>
                    </Space.Compact>
                  </div>
                  
                  <div style={{ minHeight: 50 }}>
                    {getTags().length > 0 ? (
                      <Space size={[8, 8]} wrap>
                        {getTags().map((tag: CharacterTag) => (
                          <Tag
                            key={tag.id}
                            color={tag.color}
                            closable
                            onClose={() => handleRemoveTag(tag.id)}
                            style={{ 
                              margin: 0,
                              fontSize: '12px',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              border: 'none',
                              fontWeight: 500
                            }}
                          >
                            {tag.text}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '16px',
                        color: '#8c8c8c',
                        fontSize: '13px'
                      }}>
                        <TagsOutlined style={{ fontSize: '20px', marginBottom: '6px', display: 'block' }} />
                        Добавьте зацепки для быстрого ориентирования
                      </div>
                    )}
                  </div>
                </div>
              </Col>

              {/* Трекеры персонажа */}
              {characterId && (
                <Col span={12}>
                  <div style={{ 
                    padding: '20px',
                    backgroundColor: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                    height: '100%'
                  }}>
                    <div style={{ 
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#262626',
                      marginBottom: 16
                    }}>
                      Трекеры состояния
                    </div>
                    <CharacterTrackers characterId={characterId} />
                  </div>
                </Col>
              )}
            </Row>

            {/* Краткая информация о персонаже */}
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ 
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 16,
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#262626'
                  }}>
                    <AimOutlined style={{ color: '#8c8c8c' }} />
                    Навыки
                  </div>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {Object.entries(characterData.skills)
                      .filter(([key, skill]) => skill.isProf && skill.isProf > 0)
                      .map(([key, skill]) => {
                        const profLevel = skill.isProf || 0;
                        const modifier = getSkillModifier(key);
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ 
                              color: profLevel === 2 ? '#fa8c16' : profLevel > 0 ? '#52c41a' : '#8c8c8c', 
                              fontSize: '13px',
                              fontWeight: profLevel > 0 ? 600 : 400
                            }}>
                              {skill.label}
                              {profLevel === 2 && <span style={{ marginLeft: 4, fontSize: '10px', color: '#fa8c16' }}>Эксп</span>}
                              {profLevel === 1 && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                            </Text>
                            <Text style={{ fontSize: '14px' }}>
                              {modifier >= 0 ? '+' : ''}{modifier}
                            </Text>
                          </div>
                        );
                      })}
                  </Space>
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ 
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 16,
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#262626'
                  }}>
                    <ThunderboltOutlined style={{ color: '#8c8c8c' }} />
                    Характеристики
                  </div>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: characterData.saves.str.isProf ? '#1890ff' : '#8c8c8c', 
                        fontSize: '13px',
                        fontWeight: characterData.saves.str.isProf ? 600 : 400
                      }}>
                        Сила
                        {characterData.saves.str.isProf && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {characterData.stats.str.score} 
                          <span style={{ 
                            color: characterData.saves.str.isProf ? '#1890ff' : '#8c8c8c',
                            fontWeight: characterData.saves.str.isProf ? 600 : 400
                          }}>
                            ({characterData.stats.str.modifier >= 0 ? '+' : ''}{characterData.stats.str.modifier + (characterData.saves.str.isProf ? getProficiencyBonus() : 0)})
                          </span>
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: characterData.saves.dex.isProf ? '#1890ff' : '#8c8c8c', 
                        fontSize: '13px',
                        fontWeight: characterData.saves.dex.isProf ? 600 : 400
                      }}>
                        Ловкость
                        {characterData.saves.dex.isProf && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {characterData.stats.dex.score} 
                          <span style={{ 
                            color: characterData.saves.dex.isProf ? '#1890ff' : '#8c8c8c',
                            fontWeight: characterData.saves.dex.isProf ? 600 : 400
                          }}>
                            ({characterData.stats.dex.modifier >= 0 ? '+' : ''}{characterData.stats.dex.modifier + (characterData.saves.dex.isProf ? getProficiencyBonus() : 0)})
                          </span>
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: characterData.saves.con.isProf ? '#1890ff' : '#8c8c8c', 
                        fontSize: '13px',
                        fontWeight: characterData.saves.con.isProf ? 600 : 400
                      }}>
                        Телосложение
                        {characterData.saves.con.isProf && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {characterData.stats.con.score} 
                          <span style={{ 
                            color: characterData.saves.con.isProf ? '#1890ff' : '#8c8c8c',
                            fontWeight: characterData.saves.con.isProf ? 600 : 400
                          }}>
                            ({characterData.stats.con.modifier >= 0 ? '+' : ''}{characterData.stats.con.modifier + (characterData.saves.con.isProf ? getProficiencyBonus() : 0)})
                          </span>
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: characterData.saves.int.isProf ? '#1890ff' : '#8c8c8c', 
                        fontSize: '13px',
                        fontWeight: characterData.saves.int.isProf ? 600 : 400
                      }}>
                        Интеллект
                        {characterData.saves.int.isProf && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {characterData.stats.int.score} 
                          <span style={{ 
                            color: characterData.saves.int.isProf ? '#1890ff' : '#8c8c8c',
                            fontWeight: characterData.saves.int.isProf ? 600 : 400
                          }}>
                            ({characterData.stats.int.modifier >= 0 ? '+' : ''}{characterData.stats.int.modifier + (characterData.saves.int.isProf ? getProficiencyBonus() : 0)})
                          </span>
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: characterData.saves.wis.isProf ? '#1890ff' : '#8c8c8c', 
                        fontSize: '13px',
                        fontWeight: characterData.saves.wis.isProf ? 600 : 400
                      }}>
                        Мудрость
                        {characterData.saves.wis.isProf && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {characterData.stats.wis.score} 
                          <span style={{ 
                            color: characterData.saves.wis.isProf ? '#1890ff' : '#8c8c8c',
                            fontWeight: characterData.saves.wis.isProf ? 600 : 400
                          }}>
                            ({characterData.stats.wis.modifier >= 0 ? '+' : ''}{characterData.stats.wis.modifier + (characterData.saves.wis.isProf ? getProficiencyBonus() : 0)})
                          </span>
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: characterData.saves.cha.isProf ? '#1890ff' : '#8c8c8c', 
                        fontSize: '13px',
                        fontWeight: characterData.saves.cha.isProf ? 600 : 400
                      }}>
                        Харизма
                        {characterData.saves.cha.isProf && <span style={{ marginLeft: 4, fontSize: '10px' }}>●</span>}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: '14px' }}>
                          {characterData.stats.cha.score} 
                          <span style={{ 
                            color: characterData.saves.cha.isProf ? '#1890ff' : '#8c8c8c',
                            fontWeight: characterData.saves.cha.isProf ? 600 : 400
                          }}>
                            ({characterData.stats.cha.modifier >= 0 ? '+' : ''}{characterData.stats.cha.modifier + (characterData.saves.cha.isProf ? getProficiencyBonus() : 0)})
                          </span>
                        </Text>
                      </div>
                    </div>
                  </Space>
                </div>
              </Col>

              <Col span={8}>
                <div style={{ 
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 16,
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#262626'
                  }}>
                    <SafetyOutlined style={{ color: '#8c8c8c' }} />
                    Жизнеспособность
                  </div>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>Хиты</Text>
                      <Text style={{ fontSize: '14px', color: '#fa541c' }}>{characterData.vitality['hp-max'].value}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>КД</Text>
                      <Text style={{ fontSize: '14px', color: '#1890ff', fontWeight: 600 }}>{characterData.vitality.ac.value}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>Скорость</Text>
                      <Text style={{ fontSize: '14px' }}>{characterData.vitality.speed.value} фт.</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>Инициатива</Text>
                      <Text style={{ fontSize: '14px' }}>
                        {characterData.vitality.initiative.value >= 0 ? '+' : ''}{characterData.vitality.initiative.value}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8c8c8c', fontSize: '13px' }}>Пассивная внимательность</Text>
                      <Text style={{ fontSize: '14px', color: '#52c41a', fontWeight: 600 }}>
                        {10 + characterData.stats.wis.modifier + (characterData.skills.perception?.isProf ? getProficiencyBonus() : 0)}
                      </Text>
                    </div>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>
        </TabPane>
        
        <TabPane tab={<span><UserOutlined /> Основная информация</span>} key="main">
          <div style={{ padding: '16px 24px' }}>
            <Row gutter={24}>
              {/* Левая колонка */}
              <Col span={8}>
                              {/* Основная информация */}
              <div style={{ 
                marginBottom: 24,
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 16,
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626'
                }}>
                  <UserOutlined style={{ color: '#8c8c8c' }} />
                  Основная информация
                </div>
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Имя персонажа</Text>
                      <Input
                        value={characterData.name.value}
                        onChange={(e) => updateInfo('name', e.target.value)}
                        placeholder="Имя персонажа"
                        style={{ 
                          borderRadius: 8,
                          height: 40,
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <Row gutter={12}>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Класс</Text>
                        <Input
                          value={characterData.info.charClass.value}
                          onChange={(e) => updateInfo('charClass', e.target.value)}
                          placeholder="Класс"
                          style={{ 
                            borderRadius: 8,
                            height: 40,
                            fontSize: '14px'
                          }}
                        />
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Уровень</Text>
                        <InputNumber
                          value={characterData.info.level.value}
                          onChange={(value) => updateInfo('level', value || 1)}
                          min={1}
                          max={20}
                          style={{ 
                            width: '100%',
                            borderRadius: 8,
                            height: 40
                          }}
                        />
                      </Col>
                    </Row>

                    <div>
                      <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Раса</Text>
                      <Input
                        value={characterData.info.race.value}
                        onChange={(e) => updateInfo('race', e.target.value)}
                        placeholder="Раса"
                        style={{ 
                          borderRadius: 8,
                          height: 40,
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Предыстория</Text>
                      <Input
                        value={characterData.info.background.value}
                        onChange={(e) => updateInfo('background', e.target.value)}
                        placeholder="Предыстория"
                        style={{ 
                          borderRadius: 8,
                          height: 40,
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Опыт</Text>
                      <InputNumber
                        value={characterData.info.experience.value}
                        onChange={(value) => updateInfo('experience', value || 0)}
                        min={0}
                        style={{ 
                          width: '100%',
                          borderRadius: 8,
                          height: 40
                        }}
                      />
                    </div>
                  </Space>
                </div>

              {/* Характеристики */}
              <div style={{ 
                marginBottom: 24,
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 16,
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626'
                }}>
                  <ThunderboltOutlined style={{ color: '#8c8c8c' }} />
                  Характеристики
                </div>
                <Row gutter={[12, 12]}>
                  {Object.entries(characterData.stats).map(([key, stat]) => (
                    <Col span={8} key={key}>
                      <AbilityScore
                        name={key}
                        label={stat.label}
                        score={stat.score}
                        modifier={stat.modifier}
                        onScoreChange={(value) => updateStat(key, value)}
                      />
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Жизненность */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 16,
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626'
                }}>
                  <HeartOutlined style={{ color: '#8c8c8c' }} />
                  Жизненность
                </div>
                <Row gutter={[12, 16]}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Макс. хиты</Text>
                    <InputNumber
                      value={characterData.vitality['hp-max'].value}
                      onChange={(value) => updateVitality('hp-max', value || 0)}
                      min={1}
                      style={{ 
                        width: '100%',
                        borderRadius: 8,
                        height: 40
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>КД</Text>
                    <InputNumber
                      value={characterData.vitality.ac.value}
                      onChange={(value) => updateVitality('ac', value || 10)}
                      min={1}
                      style={{ 
                        width: '100%',
                        borderRadius: 8,
                        height: 40
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Скорость</Text>
                    <Input
                      value={characterData.vitality.speed.value}
                      onChange={(e) => updateVitality('speed', e.target.value)}
                      style={{ 
                        borderRadius: 8,
                        height: 40,
                        fontSize: '14px'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: '13px', marginBottom: 6, display: 'block' }}>Инициатива</Text>
                    <InputNumber
                      value={characterData.vitality.initiative.value}
                      onChange={(value) => updateVitality('initiative', value || 0)}
                      style={{ 
                        width: '100%',
                        borderRadius: 8,
                        height: 40
                      }}
                    />
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Средняя колонка */}
            <Col span={8}>
              {/* Спасброски */}
              <div style={{ 
                marginBottom: 12,
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626',
                  marginBottom: 16
                }}>
                  Спасброски
                </div>
                {Object.entries(characterData.saves).map(([key, save]) => (
                  <SavingThrowItem
                    key={key}
                    name={key}
                    save={save}
                    modifier={getSaveModifier(key)}
                    onProficiencyChange={(isProf) => updateSave(key, isProf)}
                  />
                ))}
              </div>

              {/* Навыки */}
              <div style={{ 
                marginBottom: 12,
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626',
                  marginBottom: 16
                }}>
                  Навыки
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {Object.entries(characterData.skills).map(([key, skill]) => (
                    <SkillItem
                      key={key}
                      name={key}
                      skill={skill}
                      modifier={getSkillModifier(key)}
                      onProficiencyChange={(level) => updateSkill(key, level)}
                    />
                  ))}
                </div>
              </div>

              {/* Монеты */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626',
                  marginBottom: 16
                }}>
                  Монеты
                </div>
                <Row gutter={[4, 4]}>
                  {coinTypes.map(({ key, label, color }) => (
                    <Col span={24} key={key}>
                      <Row align="middle">
                        <Col span={6}>
                          <Tag color={color} style={{ width: 28, textAlign: 'center', fontSize: 10, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                            {label}
                          </Tag>
                        </Col>
                        <Col span={18}>
                          <InputNumber
                            value={characterData.coins[key as keyof typeof characterData.coins]?.value || 0}
                            onChange={(value) => updateCoins(key, value || 0)}
                            min={0}
                            style={{ width: '100%' }}
                          />
                        </Col>
                      </Row>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>

            {/* Правая колонка */}
            <Col span={8}>
              {/* Оружие */}
              <div style={{ 
                marginBottom: 12,
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <div style={{ 
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#262626'
                  }}>
                    Оружие и атаки
                  </div>
                  <Button icon={<PlusOutlined />} onClick={addWeapon}>
                    Добавить
                  </Button>
                </div>
                <List
                  
                  dataSource={characterData.weaponsList}
                  locale={{ emptyText: 'Нет оружия' }}
                  renderItem={(weapon) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="Удалить оружие?"
                          onConfirm={() => removeWeapon(weapon.id)}
                          okText="Да"
                          cancelText="Нет"
                        >
                          <Button type="link" danger  icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ]}
                    >
                      <div style={{ width: '100%' }}>
                        <Input
                          value={weapon.name.value}
                          onChange={(e) => updateWeapon(weapon.id, 'name', e.target.value)}
                          placeholder="Название оружия"
                          
                          style={{ marginBottom: 4 }}
                        />
                        <Row gutter={4}>
                          <Col span={12}>
                            <Input
                              value={weapon.mod.value}
                              onChange={(e) => updateWeapon(weapon.id, 'mod', e.target.value)}
                              placeholder="Бонус"
                              
                            />
                          </Col>
                          <Col span={12}>
                            <Input
                              value={weapon.dmg.value}
                              onChange={(e) => updateWeapon(weapon.id, 'dmg', e.target.value)}
                              placeholder="Урон"
                              
                            />
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
              </div>

              {/* Дополнительная информация */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#262626',
                  marginBottom: 16
                }}>
                  Дополнительная информация
                </div>
                <Space direction="vertical" style={{ width: '100%' }} >
                  <Row gutter={4}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Возраст</Text>
                      <Input
                        value={characterData.subInfo.age.value}
                        onChange={(e) => updateSubInfo('age', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: '11' }}>Рост</Text>
                      <Input
                        value={characterData.subInfo.height.value}
                        onChange={(e) => updateSubInfo('height', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={4}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Вес</Text>
                      <Input
                        value={characterData.subInfo.weight.value}
                        onChange={(e) => updateSubInfo('weight', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Глаза</Text>
                      <Input
                        value={characterData.subInfo.eyes.value}
                        onChange={(e) => updateSubInfo('eyes', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                </Space>
              </div>
            </Col>
          </Row>
          </div>
        </TabPane>

        <TabPane tab={<span><HeartOutlined /> Черты и особенности</span>} key="traits">
          <div style={{ padding: '16px 24px' }}>
            <Row gutter={12}>
            <Col span={12}>
              <Card title="Черты характера"  style={{ marginBottom: 12 }}>
                <TextArea
                  value={getTextContent('personality')}
                  onChange={(e) => updateTextfield('personality', e.target.value)}
                  placeholder="Опишите черты характера персонажа..."
                  rows={6}
                  
                />
              </Card>

              <Card title="Идеалы"  style={{ marginBottom: 12 }}>
                <TextArea
                  value={getTextContent('ideals')}
                  onChange={(e) => updateTextfield('ideals', e.target.value)}
                  placeholder="Опишите идеалы персонажа..."
                  rows={6}
                  
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Привязанности"  style={{ marginBottom: 12 }}>
                <TextArea
                  value={getTextContent('bonds')}
                  onChange={(e) => updateTextfield('bonds', e.target.value)}
                  placeholder="Опишите привязанности персонажа..."
                  rows={6}
                  
                />
              </Card>

              <Card title="Недостатки"  style={{ marginBottom: 12 }}>
                <TextArea
                  value={getTextContent('flaws')}
                  onChange={(e) => updateTextfield('flaws', e.target.value)}
                  placeholder="Опишите недостатки персонажа..."
                  rows={6}
                  
                />
              </Card>
            </Col>
          </Row>

          <Card title="Особенности и умения" >
            <TextArea
              value={getTextContent('features')}
              onChange={(e) => updateTextfield('features', e.target.value)}
              placeholder="Опишите особенности класса, расы и другие умения..."
              rows={8}
              
            />
          </Card>
          </div>
        </TabPane>

        <TabPane tab={<span><SafetyOutlined /> Снаряжение</span>} key="equipment">
          <div style={{ padding: '16px 24px' }}>
            <Card title="Снаряжение и вещи" >
            <TextArea
              value={getTextContent('equipment')}
              onChange={(e) => updateTextfield('equipment', e.target.value)}
              placeholder="Опишите снаряжение, инструменты, магические предметы и другие вещи..."
              rows={12}
              
            />
          </Card>
          </div>
        </TabPane>

        <TabPane tab={<span><RadiusSettingOutlined /> Заклинания</span>} key="spells">
          <div style={{ padding: '16px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
            <Row gutter={12}>
              {SPELL_LEVELS.map((spellLevel, index) => {
                const isEvenIndex = index % 2 === 0;
                const shouldStartNewRow = isEvenIndex && index > 0;
                
                return (
                  <React.Fragment key={spellLevel.level}>
                    {shouldStartNewRow && <div style={{ width: '100%', marginBottom: 12 }} />}
                    <Col span={12}>
                      <SpellLevelManager
                        title={spellLevel.name}
                        spells={getSpellsByLevel(spellLevel.level)}
                        onAddSpell={(spell) => addSpell(spellLevel.level, spell)}
                        onRemoveSpell={(spellId) => removeSpell(spellLevel.level, spellId)}
                        
                        maxHeight={spellLevel.level === 0 ? 250 : 200}
                      />
                    </Col>
                  </React.Fragment>
                );
              })}
            </Row>
          </div>
        </TabPane>
      </Tabs>
      
      {/* Модальное окно импорта */}
      <Modal
        title="Импорт персонажа"
        open={showImportModal}
        onCancel={() => {
          setShowImportModal(false);
          setImportData('');
        }}
        onOk={handleImport}
        okText="Импортировать"
        cancelText="Отмена"
        width={600}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Вставьте JSON данные персонажа в поле ниже:
          </Text>
        </div>
        <TextArea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder="Вставьте JSON данные персонажа..."
          rows={10}
        />
      </Modal>
    </Modal>
  );
};