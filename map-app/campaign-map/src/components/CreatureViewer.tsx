import React from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Divider,
  Tag,
  Typography,
  Space,
  List,
  Descriptions,
  Statistic
} from 'antd';
import {
  Creature,
  parseCreatureData,
  getCreatureModifier,
  formatModifier
} from '../types/creature';

const { Title, Text, Paragraph } = Typography;

interface CreatureViewerProps {
  visible: boolean;
  creature: Creature | null;
  onClose: () => void;
}

export const CreatureViewer: React.FC<CreatureViewerProps> = ({
  visible,
  creature,
  onClose
}) => {
  if (!creature) return null;
  console.log('CreatureViewer - исходное существо:', creature);

  const data = parseCreatureData(creature);

  console.log('CreatureViewer - распарсенные данные:', data);
  console.log('CreatureViewer - легендарные действия:', data.legendaryActions);

  const formatSpeed = () => {
    const speeds = [];
    if (data.speed.walk) speeds.push(`${data.speed.walk} фт`);
    if (data.speed.fly) speeds.push(`полёт ${data.speed.fly} фт${data.speed.hover ? ' (парение)' : ''}`);
    if (data.speed.swim) speeds.push(`плавание ${data.speed.swim} фт`);
    if (data.speed.climb) speeds.push(`лазание ${data.speed.climb} фт`);
    if (data.speed.burrow) speeds.push(`зарывание ${data.speed.burrow} фт`);
    return speeds.join(', ') || '0 фт';
  };

  const formatSenses = () => {
    const senses = [];
    if (data.senses.blindsight) senses.push(`слепое зрение ${data.senses.blindsight} фт`);
    if (data.senses.darkvision) senses.push(`тёмное зрение ${data.senses.darkvision} фт`);
    if (data.senses.tremorsense) senses.push(`чувство вибрации ${data.senses.tremorsense} фт`);
    if (data.senses.truesight) senses.push(`истинное зрение ${data.senses.truesight} фт`);
    senses.push(`пассивное восприятие ${data.senses.passivePerception}`);
    return senses.join(', ');
  };

  return (
    <Modal
      title={data.name}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
        {/* Основная информация */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card >
            <Text type="secondary" italic>
              {data.size} {data.type.toLowerCase()}{data.subtype ? ` (${data.subtype})` : ''}, {data.alignment.toLowerCase()}
            </Text>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Класс доспеха" value={data.armorClass} />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Хиты" 
                  value={data.hitPoints}
                  suffix={<Text type="secondary">({data.hitDice})</Text>}
                />
              </Col>
              <Col span={8}>
                <Statistic title="Скорость" value={formatSpeed()} />
              </Col>
            </Row>
          </Card>

          {/* Характеристики */}
          <Card  title="Характеристики">
            <Row gutter={16} style={{ textAlign: 'center' }}>
              <Col span={4}>
                <Title level={5} style={{ margin: 0 }}>СИЛ</Title>
                <Text strong>{data.stats.str}</Text>
                <br />
                <Text type="secondary">({formatModifier(getCreatureModifier(data.stats.str))})</Text>
              </Col>
              <Col span={4}>
                <Title level={5} style={{ margin: 0 }}>ЛОВ</Title>
                <Text strong>{data.stats.dex}</Text>
                <br />
                <Text type="secondary">({formatModifier(getCreatureModifier(data.stats.dex))})</Text>
              </Col>
              <Col span={4}>
                <Title level={5} style={{ margin: 0 }}>ТЕЛ</Title>
                <Text strong>{data.stats.con}</Text>
                <br />
                <Text type="secondary">({formatModifier(getCreatureModifier(data.stats.con))})</Text>
              </Col>
              <Col span={4}>
                <Title level={5} style={{ margin: 0 }}>ИНТ</Title>
                <Text strong>{data.stats.int}</Text>
                <br />
                <Text type="secondary">({formatModifier(getCreatureModifier(data.stats.int))})</Text>
              </Col>
              <Col span={4}>
                <Title level={5} style={{ margin: 0 }}>МДР</Title>
                <Text strong>{data.stats.wis}</Text>
                <br />
                <Text type="secondary">({formatModifier(getCreatureModifier(data.stats.wis))})</Text>
              </Col>
              <Col span={4}>
                <Title level={5} style={{ margin: 0 }}>ХАР</Title>
                <Text strong>{data.stats.cha}</Text>
                <br />
                <Text type="secondary">({formatModifier(getCreatureModifier(data.stats.cha))})</Text>
              </Col>
            </Row>
          </Card>

          <Card >
            <Descriptions column={1} >
              {data.savingThrows && Object.keys(data.savingThrows).length > 0 && (
                <Descriptions.Item label="Спасброски">
                  {Object.entries(data.savingThrows).map(([stat, bonus]) => 
                    `${stat.toUpperCase()} ${formatModifier(bonus!)}`
                  ).join(', ')}
                </Descriptions.Item>
              )}
              
              {data.skills && Object.keys(data.skills).length > 0 && (
                <Descriptions.Item label="Навыки">
                  {Object.entries(data.skills).map(([skill, bonus]) => 
                    `${skill} ${formatModifier(bonus)}`
                  ).join(', ')}
                </Descriptions.Item>
              )}

              {data.damageVulnerabilities && data.damageVulnerabilities.length > 0 && (
                <Descriptions.Item label="Уязвимости к урону">
                  {data.damageVulnerabilities.join(', ')}
                </Descriptions.Item>
              )}

              {data.damageResistances && data.damageResistances.length > 0 && (
                <Descriptions.Item label="Сопротивления к урону">
                  {data.damageResistances.join(', ')}
                </Descriptions.Item>
              )}

              {data.damageImmunities && data.damageImmunities.length > 0 && (
                <Descriptions.Item label="Иммунитеты к урону">
                  {data.damageImmunities.join(', ')}
                </Descriptions.Item>
              )}

              {data.conditionImmunities && data.conditionImmunities.length > 0 && (
                <Descriptions.Item label="Иммунитеты к состояниям">
                  {data.conditionImmunities.join(', ')}
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Чувства">
                {formatSenses()}
              </Descriptions.Item>

              {data.languages && data.languages.length > 0 && (
                <Descriptions.Item label="Языки">
                  {data.languages.join(', ')}
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Уровень опасности">
                <Space>
                  <Tag color="red">УО {data.challengeRating}</Tag>
                  <Text type="secondary">({data.experiencePoints} опыта)</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {data.traits && data.traits.length > 0 ? (
            <Card  title="Черты">
              <List
                dataSource={data.traits}
                renderItem={(trait) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{trait.name}</Text>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {trait.description}
                      </Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            <Card title="Черты">
              <Text type="secondary">Черты не найдены или не загружены</Text>
            </Card>
          )}

          {data.actions && data.actions.length > 0 ? (
            <Card  title="Действия">
              <List
                dataSource={data.actions}
                renderItem={(action) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{action.name}</Text>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {action.description}
                      </Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            <Card title="Действия">
              <Text type="secondary">Действия не найдены или не загружены</Text>
            </Card>
          )}

          {/* Бонусные действия */}
          {data.bonusActions && data.bonusActions.length > 0 && (
            <Card  title="Бонусные действия">
              <List
                dataSource={data.bonusActions}
                renderItem={(action) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{action.name}</Text>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {action.description}
                      </Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Реакции */}
          {data.reactions && data.reactions.length > 0 && (
            <Card  title="Реакции">
              <List
                dataSource={data.reactions}
                renderItem={(action) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{action.name}</Text>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {action.description}
                      </Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Легендарные действия */}
          {data.legendaryActions && data.legendaryActions.actions && data.legendaryActions.actions.length > 0 ? (
            <Card  title={`Легендарные действия (${data.legendaryActions.perTurn} за ход)`}>
              <List
                dataSource={data.legendaryActions.actions}
                renderItem={(action) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{action.name}</Text>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {action.description}
                      </Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ) : data.legendaryActions ? (
            <Card title="Легендарные действия">
              <Text type="secondary">Легендарные действия загружены, но не найдены или имеют неправильный формат</Text>
              <br />
              <Text type="secondary">Debug: {JSON.stringify(data.legendaryActions)}</Text>
            </Card>
          ) : null}

          {/* Действия логова */}
          {data.lairActions && data.lairActions.length > 0 && (
            <Card  title="Действия логова">
              <List
                dataSource={data.lairActions}
                renderItem={(action) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{action.name}</Text>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {action.description}
                      </Paragraph>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Заклинательство */}
          {data.spellcasting && (
            <Card title={`Заклинательство (${data.spellcasting.level} уровень)`}>
              <Descriptions column={1} style={{ marginBottom: '16px' }}>
                <Descriptions.Item label="Базовая характеристика">
                  {data.spellcasting.ability.toUpperCase()}
                </Descriptions.Item>
                <Descriptions.Item label="Сл спасброска">
                  {data.spellcasting.saveDc}
                </Descriptions.Item>
                <Descriptions.Item label="Бонус атаки заклинанием">
                  {formatModifier(data.spellcasting.attackBonus)}
                </Descriptions.Item>
              </Descriptions>
              
              {data.spellcasting.spells && Object.keys(data.spellcasting.spells).length > 0 && (
                <div>
                  <Title level={5}>Заклинания:</Title>
                  {Object.entries(data.spellcasting.spells).map(([level, spellData]) => (
                    <div key={level} style={{ marginBottom: '8px' }}>
                      <Text strong>
                        {level === 'cantrips' ? 'Заговоры' : `${level} уровень`}
                        {spellData.slots ? ` (${spellData.slots} ячеек)` : ''}:
                      </Text>
                      <br />
                      <Text>{spellData.spells.join(', ')}</Text>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Дополнительная информация */}
          {(data.description || data.lore || (data.tags && data.tags.length > 0)) && (
            <Card  title="Дополнительная информация">
              {data.description && (
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {data.description}
                </Paragraph>
              )}
              
              {data.lore && (
                <>
                  <Title level={5}>Предыстория</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {data.lore}
                  </Paragraph>
                </>
              )}

              {data.tags && data.tags.length > 0 && (
                <>
                  <Title level={5}>Теги</Title>
                  <Space wrap>
                    {data.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </>
              )}

              {data.environment && data.environment.length > 0 && (
                <>
                  <Title level={5}>Окружение</Title>
                  <Space wrap>
                    {data.environment.map(env => (
                      <Tag key={env} color="green">{env}</Tag>
                    ))}
                  </Space>
                </>
              )}

              {data.source && (
                <>
                  <Title level={5}>Источник</Title>
                  <Text type="secondary">{data.source}</Text>
                </>
              )}
            </Card>
          )}
        </Space>
      </div>
    </Modal>
  );
};
