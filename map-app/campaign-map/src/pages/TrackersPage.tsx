import React from 'react';
import { Card, Typography, Row, Col, Button, Space, Tag, Divider } from 'antd';
import { useTrackers } from '../hooks/useTrackers';
import { useGroups } from '../hooks/useGroups';

const { Title, Text } = Typography;

const Meter: React.FC<{ label: string; value: number; description?: string | string[]; onInc: () => void; onDec: () => void; onReset?: () => void; colors?: string[] }>
  = ({ label, value, description, onInc, onDec, onReset, colors }) => {
  const max = 4;
  const palette = colors ?? ['#d9d9d9', '#95de64', '#ffd666', '#ff9c6e', '#ff7875'];
  return (
    <Card size="small" style={{ height: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text strong>{label}</Text>
        <Space>
          {Array.from({ length: max + 1 }).map((_, i) => (
            <div key={i} style={{ width: 40, height: 14, background: palette[i], opacity: i <= value ? 1 : 0.3, borderRadius: 4 }} />
          ))}
        </Space>
        <Space>
          <Button onClick={onDec} size="small">-</Button>
          <Tag color="blue">{value}</Tag>
          <Button onClick={onInc} size="small">+</Button>
          {onReset && <Button onClick={onReset} size="small" type="text">сброс</Button>}
        </Space>
        {typeof description === 'string' && description.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>{description}</Text>
        )}
        {Array.isArray(description) && description.length > 0 && (
          <div style={{ color: '#666', fontSize: 12, lineHeight: 1.5 }}>
            {description.map((line, idx) => (
              <div key={idx}>• {line}</div>
            ))}
          </div>
        )}
      </Space>
    </Card>
  );
};

const TrackersPage: React.FC = () => {
  const { state, inc, dec, reset, getCharacterStages, incCharacterStage, decCharacterStage, resetCharacterStage } = useTrackers();
  const { groups } = useGroups();

  // Кумулятивные побочки для справки (не используются напрямую, т.к. теперь персонажные)
  // Оставлено на случай будущего переназначения

  // Литературные описания для мастерских часов (по текущему этапу)
  const cityDesc = [
    '0 — Город дышит ровно: рынки гудят, стража вальяжна, слухи не задерживаются.',
    '1 — Лёгкая нервозность: двери закрывают пораньше, у колодцев шёпот короче.',
    '2 — Тревога растёт: в трактирах говорят полголоса, стража проверяет чаще и дольше.',
    '3 — Кризис на улицах: очереди, слёзы, ночами слышно колокольчики у храмов.',
    '4 — Порог сорван: бунты, факелы и поспешные сборы; караваны уходят на рассвете.',
  ][state.cityPanic];

  const ecoDesc = [
    '0 — Лес спокоен: тропы узнаваемы, зверь бережёт выводки.',
    '1 — Диссонанс: птицы меняют перелёты, цветки раскрываются не по солнцу.',
    '2 — Деградация: грибы берут верх, вода несёт горьковатый привкус.',
    '3 — Рубеж: привычные ориентиры «плывут», луга шелестят как море без ветра.',
    '4 — Коллапс: фауна прячется, корни ломают камни, рощи слышны как хор.',
  ][state.ecosystem];

  const swarmDesc = [
    '0 — Рой таится: редкие шепотки в глубине, следы не сводятся в узор.',
    '1 — Разведка: одиночные щупальца спор, карты «звенят» в одних и тех же точках.',
    '2 — Сбор сил: тропы обрастают спорыньей, охотники слышат унисонный такт.',
    '3 — Мобилизация: колонны в недрах, эхо шагов совпадает с пульсом.',
    '4 — Наступление: тьма движется массой, любой шум отзывается многоголосием.',
  ][state.swarm];
  return (
    <Card style={{ height: '100%', border: 'none' }}>
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          ⏱️ Трекеры кампании
        </Title>
        <Text type="secondary">Компактные часы/прогресс-бары для Спор, Тени и мастерских часов</Text>
      </div>

      {/* Персонажные трекеры: по всем группам/персонажам */}
      <Title level={4} style={{ marginTop: 0 }}>Игроки</Title>
      <Row gutter={[16, 16]}>
        {groups.flatMap(g => g.members.map(m => ({ groupName: g.name, id: m.id, name: m.name }))).map(({ groupName, id, name }) => {
          const cs = getCharacterStages(id);
          const sporesStages = [
            'Нет симптомов/контроль',
            'Лёгкое раздражение — -1 к Интеллекту и Исследованию; лёгкие галлюцинации',
            'Уязвимость к яду; -2 к проверкам Мудрости',
            'Периодические спасброски против контроля',
            'Полная потеря личности; контроль роя в триггерных зонах',
          ];
          const shadowStages = [
            'Фон отсутствует',
            'Шёпоты; -1 к инициативе; искушения (проверка Мудрости при «сделках»)',
            'Давление; -1 к Харизме; периодические компульсии',
            'Захват; -2 к спасброскам против контроля; краткий «аватар» при провале Интеллекта',
            'Контроль — персонаж становится агентом Тени до конца сцены',
          ];
          return (
            <Col key={id} xs={24} md={12} lg={8}>
              <Card size="small" title={<span>{name} <Text type="secondary" style={{ fontWeight: 'normal' }}>({groupName})</Text></span>}>
                <Row gutter={8}>
                  <Col span={24}>
                    <Meter
                      label="Споры"
                      value={cs.sporesStage}
                      description={sporesStages.slice(0, cs.sporesStage + 1)}
                      onInc={() => incCharacterStage(id, 'sporesStage')}
                      onDec={() => decCharacterStage(id, 'sporesStage')}
                      onReset={() => resetCharacterStage(id, 'sporesStage')}
                    />
                  </Col>
                  <Col span={24} style={{ marginTop: 8 }}>
                    <Meter
                      label="Карающая Тень"
                      value={cs.shadowStage}
                      description={shadowStages.slice(0, cs.shadowStage + 1)}
                      onInc={() => incCharacterStage(id, 'shadowStage')}
                      onDec={() => decCharacterStage(id, 'shadowStage')}
                      onReset={() => resetCharacterStage(id, 'shadowStage')}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          );
        })}

        <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>

        <Col span={24}>
          <Title level={4} style={{ margin: 0 }}>Общие трекеры</Title>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Meter label="Городская паника" value={state.cityPanic} description={cityDesc} onInc={() => inc('cityPanic')} onDec={() => dec('cityPanic')} />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Meter label="Экосистема" value={state.ecosystem} description={ecoDesc} onInc={() => inc('ecosystem')} onDec={() => dec('ecosystem')} />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Meter label="Рой" value={state.swarm} description={swarmDesc} onInc={() => inc('swarm')} onDec={() => dec('swarm')} />
        </Col>
      </Row>
    </Card>
  );
};

export default TrackersPage;

