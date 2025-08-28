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
    <Card  style={{ height: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text strong>{label}</Text>
        <Space>
          {Array.from({ length: max + 1 }).map((_, i) => (
            <div key={i} style={{ width: 40, height: 14, background: palette[i], opacity: i <= value ? 1 : 0.3, borderRadius: 4 }} />
          ))}
        </Space>
        <Space>
          <Button onClick={onDec} >-</Button>
          <Tag color="blue">{value}</Tag>
          <Button onClick={onInc} >+</Button>
          {onReset && <Button onClick={onReset}  type="text">сброс</Button>}
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
    '0 — Город живёт обычной жизнью: рынки переполнены торговцами, стража спокойно патрулирует улицы, слухи быстро забываются. Жители чувствуют себя в безопасности.',
    '1 — Первые признаки беспокойства: некоторые двери закрываются раньше обычного, у колодцев разговоры становятся короче и тише. В воздухе витает лёгкая напряжённость.',
    '2 — Тревога нарастает: в трактирах говорят полголоса, стража проверяет документы чаще и дольше обычного. Жители начинают запасаться припасами.',
    '3 — Кризис охватывает улицы: очереди у магазинов, слёзы отчаяния, ночами слышны колокольчики у храмов. Паника начинает выходить из-под контроля.',
    '4 — Порог сорван: бунты на площадях, факелы в руках толпы, поспешные сборы. Караваны уходят на рассвете, спасаясь от надвигающейся катастрофы.',
  ][state.cityPanic];

  const ecoDesc = [
    '0 — Природа в равновесии: лесные тропы узнаваемы и безопасны, звери спокойно выращивают потомство. Экосистема функционирует как обычно.',
    '1 — Первые диссонансы: птицы меняют привычные маршруты перелётов, цветки раскрываются не по солнечному циклу. Природа начинает вести себя странно.',
    '2 — Деградация набирает силу: грибы стремительно распространяются, вода приобретает горьковатый привкус. Привычные места становятся опасными.',
    '3 — Критический рубеж: привычные ориентиры «плывут» и меняются, луга шелестят как море без ветра. Природа больше не подчиняется обычным законам.',
    '4 — Экологический коллапс: фауна прячется в самых глубоких убежищах, корни ломают камни, рощи звучат как единый хор. Экосистема разрушена.',
  ][state.ecosystem];

  const swarmDesc = [
    '0 — Рой таится в глубине: редкие шепотки доносятся из подземелий, следы не складываются в понятный узор. Угроза пока скрыта, но уже присутствует.',
    '1 — Разведка и прощупывание: одиночные щупальца спор появляются на поверхности, карты «звенят» в одних и тех же точках. Рой изучает территорию.',
    '2 — Сбор сил и концентрация: тропы обрастают спорыньей, охотники слышат унисонный такт. Рой готовится к активным действиям.',
    '3 — Мобилизация и подготовка: колонны формируются в недрах, эхо шагов совпадает с пульсом роя. Массовое наступление неизбежно.',
    '4 — Полномасштабное наступление: тьма движется единой массой, любой шум отзывается многоголосием. Рой вышел на поверхность и захватывает мир.',
  ][state.swarm];
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ height: '100%', border: 'none' }}>
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            ⏱️ Трекеры кампании
          </Title>
          <Text type="secondary">Компактные часы/прогресс-бары для Спор, Тени и мастерских часов</Text>
        </div>

      {/* Персонажные трекеры: по всем группам/персонажам */}
      <Row gutter={[16, 16]}>
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
    </div>
  );
};

export default TrackersPage;

