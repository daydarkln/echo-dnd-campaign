import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  List,
  Typography,
  Divider,
  Space,
  Tag,
  Popconfirm,
  Modal,
  Form,
  message,
  Tooltip,
  Checkbox,
  Spin,
  Upload,
  Tabs
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useCharacter } from '../hooks/useCharacter';
import { SPELL_LEVELS } from '../types/character';
import { SpellLevelManager } from './SpellLevelManager';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Компонент для отображения характеристик
const AbilityScore: React.FC<{
  name: string;
  label: string;
  score: number;
  modifier: number;
  onScoreChange: (value: number) => void;
}> = ({ name, label, score, modifier, onScoreChange }) => {
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <Card  style={{ textAlign: 'center', minHeight: 120 }}>
      <Text strong style={{ fontSize: 12 }}>{label}</Text>
      <br />
      <InputNumber
        value={score}
        onChange={(value) => onScoreChange(value || 10)}
        min={1}
        max={30}
        style={{ width: '60px', margin: '8px 0' }}
      />
      <br />
      <div style={{
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {modifierStr}
      </div>
    </Card>
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
    <Row align="middle" style={{ marginBottom: 4 }}>
      <Col span={2}>
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
        />
      </Col>
      <Col span={3}>
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{modifierStr}</Text>
      </Col>
      <Col span={19}>
        <Text style={{ fontSize: 12 }}>
          {skill.label}
          {profLevel === 2 && <Tag color="gold"  style={{ marginLeft: 4 }}>Эксп</Tag>}
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
    <Row align="middle" style={{ marginBottom: 4 }}>
      <Col span={3}>
        <Checkbox
          checked={save.isProf}
          onChange={(e) => onProficiencyChange(e.target.checked)}
        />
      </Col>
      <Col span={4}>
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{modifierStr}</Text>
      </Col>
      <Col span={17}>
        <Text style={{ fontSize: 12 }}>{name.toUpperCase()}</Text>
      </Col>
    </Row>
  );
};

export const CharacterSheet: React.FC = () => {
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
    getTextContent,
    getSkillModifier,
    getSaveModifier,
    resetCharacter,
    exportCharacter,
    importCharacter
  } = useCharacter();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  if (isLoading || !characterData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Загрузка персонажа...</div>
      </div>
    );
  }

  const handleExport = () => {
    const data = exportCharacter();
    if (data) {
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

  const coinTypes = [
    { key: 'pp', label: 'ПП', color: '#9c27b0' },
    { key: 'gp', label: 'ЗМ', color: '#ff9800' },
    { key: 'ep', label: 'ЭМ', color: '#607d8b' },
    { key: 'sp', label: 'СМ', color: '#9e9e9e' },
    { key: 'cp', label: 'ММ', color: '#8d6e63' }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      {/* Заголовок и действия */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>
            <UserOutlined style={{ marginRight: 8 }} />
            Лист персонажа
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Экспорт
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setShowImportModal(true)}>
              Импорт
            </Button>
            <Popconfirm
              title="Сбросить персонажа?"
              description="Это создаст нового персонажа. Текущие данные будут утеряны."
              onConfirm={resetCharacter}
              okText="Да"
              cancelText="Нет"
            >
              <Button icon={<ReloadOutlined />} danger>
                Сброс
              </Button>
            </Popconfirm>
          </Space>
        </Col>
      </Row>

      <Tabs defaultActiveKey="main" type="card">
        <TabPane tab="Основная информация" key="main">
          <Row gutter={16}>
            {/* Левая колонка */}
            <Col span={8}>
              {/* Основная информация */}
              <Card title="Основная информация" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Имя персонажа</Text>
                    <Input
                      value={characterData.name.value}
                      onChange={(e) => updateInfo('name', e.target.value)}
                      placeholder="Имя персонажа"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                  
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary">Класс</Text>
                      <Input
                        value={characterData.info.charClass.value}
                        onChange={(e) => updateInfo('charClass', e.target.value)}
                        placeholder="Класс"
                        style={{ marginTop: 4 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Уровень</Text>
                      <InputNumber
                        value={characterData.info.level.value}
                        onChange={(value) => updateInfo('level', value || 1)}
                        min={1}
                        max={20}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </Col>
                  </Row>

                  <div>
                    <Text type="secondary">Раса</Text>
                    <Input
                      value={characterData.info.race.value}
                      onChange={(e) => updateInfo('race', e.target.value)}
                      placeholder="Раса"
                      style={{ marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <Text type="secondary">Предыстория</Text>
                    <Input
                      value={characterData.info.background.value}
                      onChange={(e) => updateInfo('background', e.target.value)}
                      placeholder="Предыстория"
                      style={{ marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <Text type="secondary">Мировоззрение</Text>
                    <Input
                      value={characterData.info.alignment.value}
                      onChange={(e) => updateInfo('alignment', e.target.value)}
                      placeholder="Мировоззрение"
                      style={{ marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <Text type="secondary">Имя игрока</Text>
                    <Input
                      value={characterData.info.playerName.value}
                      onChange={(e) => updateInfo('playerName', e.target.value)}
                      placeholder="Имя игрока"
                      style={{ marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <Text type="secondary">Опыт</Text>
                    <InputNumber
                      value={characterData.info.experience.value}
                      onChange={(value) => updateInfo('experience', value || 0)}
                      min={0}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </div>
                </Space>
              </Card>

              {/* Характеристики */}
              <Card title="Характеристики" style={{ marginBottom: 16 }}>
                <Row gutter={[8, 8]}>
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
              </Card>

              {/* Жизненность */}
              <Card title="Жизненность" style={{ marginBottom: 16 }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Text type="secondary">Макс. хиты</Text>
                    <InputNumber
                      value={characterData.vitality['hp-max'].value}
                      onChange={(value) => updateVitality('hp-max', value || 0)}
                      min={1}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">КД</Text>
                    <InputNumber
                      value={characterData.vitality.ac.value}
                      onChange={(value) => updateVitality('ac', value || 10)}
                      min={1}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Скорость</Text>
                    <Input
                      value={characterData.vitality.speed.value}
                      onChange={(e) => updateVitality('speed', e.target.value)}
                      style={{ marginTop: 4 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Инициатива</Text>
                    <InputNumber
                      value={characterData.vitality.initiative.value}
                      onChange={(value) => updateVitality('initiative', value || 0)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Средняя колонка */}
            <Col span={8}>
              {/* Спасброски */}
              <Card title="Спасброски" style={{ marginBottom: 16 }}>
                {Object.entries(characterData.saves).map(([key, save]) => (
                  <SavingThrowItem
                    key={key}
                    name={key}
                    save={save}
                    modifier={getSaveModifier(key)}
                    onProficiencyChange={(isProf) => updateSave(key, isProf)}
                  />
                ))}
              </Card>

              {/* Навыки */}
              <Card title="Навыки"  style={{ marginBottom: 16 }}>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
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
              </Card>

              {/* Монеты */}
              <Card title="Монеты"  style={{ marginBottom: 16 }}>
                <Row gutter={[4, 8]}>
                  {coinTypes.map(({ key, label, color }) => (
                    <Col span={24} key={key}>
                      <Row align="middle">
                        <Col span={6}>
                          <Tag color={color} style={{ width: 30, textAlign: 'center' }}>
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
              </Card>
            </Col>

            {/* Правая колонка */}
            <Col span={8}>
              {/* Оружие */}
              <Card 
                title="Оружие и атаки" 
                 
                style={{ marginBottom: 16 }}
                extra={
                  <Button  icon={<PlusOutlined />} onClick={addWeapon}>
                    Добавить
                  </Button>
                }
              >
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
                          onChange={(e) => updateWeapon(weapon.id, { name: e.target.value })}
                          placeholder="Название оружия"
                          
                          style={{ marginBottom: 4 }}
                        />
                        <Row gutter={4}>
                          <Col span={12}>
                            <Input
                              value={weapon.mod.value}
                              onChange={(e) => updateWeapon(weapon.id, { mod: e.target.value })}
                              placeholder="Бонус"
                              
                            />
                          </Col>
                          <Col span={12}>
                            <Input
                              value={weapon.dmg.value}
                              onChange={(e) => updateWeapon(weapon.id, { dmg: e.target.value })}
                              placeholder="Урон"
                              
                            />
                          </Col>
                        </Row>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>

              {/* Дополнительная информация */}
              <Card title="Дополнительная информация" >
                <Space direction="vertical" style={{ width: '100%' }} >
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary">Возраст</Text>
                      <Input
                        value={characterData.subInfo.age.value}
                        onChange={(e) => updateSubInfo('age', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Рост</Text>
                      <Input
                        value={characterData.subInfo.height.value}
                        onChange={(e) => updateSubInfo('height', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary">Вес</Text>
                      <Input
                        value={characterData.subInfo.weight.value}
                        onChange={(e) => updateSubInfo('weight', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Глаза</Text>
                      <Input
                        value={characterData.subInfo.eyes.value}
                        onChange={(e) => updateSubInfo('eyes', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary">Кожа</Text>
                      <Input
                        value={characterData.subInfo.skin.value}
                        onChange={(e) => updateSubInfo('skin', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Волосы</Text>
                      <Input
                        value={characterData.subInfo.hair.value}
                        onChange={(e) => updateSubInfo('hair', e.target.value)}
                        
                        style={{ marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Черты и особенности" key="traits">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Черты характера" style={{ marginBottom: 16 }}>
                <TextArea
                  value={getTextContent('personality')}
                  onChange={(e) => updateTextfield('personality', e.target.value)}
                  placeholder="Опишите черты характера персонажа..."
                  rows={4}
                />
              </Card>

              <Card title="Идеалы" style={{ marginBottom: 16 }}>
                <TextArea
                  value={getTextContent('ideals')}
                  onChange={(e) => updateTextfield('ideals', e.target.value)}
                  placeholder="Опишите идеалы персонажа..."
                  rows={4}
                />
              </Card>

              <Card title="Привязанности" style={{ marginBottom: 16 }}>
                <TextArea
                  value={getTextContent('bonds')}
                  onChange={(e) => updateTextfield('bonds', e.target.value)}
                  placeholder="Опишите привязанности персонажа..."
                  rows={4}
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Недостатки" style={{ marginBottom: 16 }}>
                <TextArea
                  value={getTextContent('flaws')}
                  onChange={(e) => updateTextfield('flaws', e.target.value)}
                  placeholder="Опишите недостатки персонажа..."
                  rows={4}
                />
              </Card>

              <Card title="Особенности и умения" style={{ marginBottom: 16 }}>
                <TextArea
                  value={getTextContent('features')}
                  onChange={(e) => updateTextfield('features', e.target.value)}
                  placeholder="Опишите особенности класса, расы и другие умения..."
                  rows={8}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Снаряжение" key="equipment">
          <Row gutter={16}>
            <Col span={24}>
              <Card title="Снаряжение и вещи">
                <TextArea
                  value={getTextContent('equipment')}
                  onChange={(e) => updateTextfield('equipment', e.target.value)}
                  placeholder="Опишите снаряжение, инструменты, магические предметы и другие вещи..."
                  rows={15}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Заклинания" key="spells">
          <Row gutter={16}>
            {SPELL_LEVELS.map((spellLevel, index) => {
              const isEvenIndex = index % 2 === 0;
              const shouldStartNewRow = isEvenIndex && index > 0;
              
              return (
                <React.Fragment key={spellLevel.level}>
                  {shouldStartNewRow && <div style={{ width: '100%', marginBottom: 16 }} />}
                  <Col span={12}>
                    <SpellLevelManager
                      title={spellLevel.name}
                      spells={getSpellsByLevel(spellLevel.level)}
                      onAddSpell={(spell) => addSpell(spellLevel.level, spell)}
                      onRemoveSpell={(spellId) => removeSpell(spellLevel.level, spellId)}
                      size="default"
                      maxHeight={spellLevel.level === 0 ? 400 : 300}
                    />
                  </Col>
                </React.Fragment>
              );
            })}
          </Row>
        </TabPane>
      </Tabs>

      {/* Модалка импорта */}
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
    </div>
  );
};