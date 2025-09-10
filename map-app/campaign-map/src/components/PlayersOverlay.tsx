import React from 'react';
import { Card, Space, Tag, Typography, Badge, Divider } from 'antd';
import { useGroups } from '../hooks/useGroups';
import { useCharacters } from '../hooks/useCharacters';
import { useTrackers } from '../hooks/useTrackers';

const { Text } = Typography;

interface PlayersOverlayProps {
  visible: boolean;
  onClose?: () => void;
}

const PlayersOverlay: React.FC<PlayersOverlayProps> = ({ visible, onClose }) => {
  const { groups } = useGroups();
  const { getCharacterData } = useCharacters();
  const { getCharacterStages } = useTrackers();

  if (!visible) return null;

  // Получаем всех игроков из групп игроков
  const playerGroups = groups.filter(group => group.isPlayers);
  const allPlayers = playerGroups.flatMap(group => 
    group.members.map(member => ({
      ...member,
      groupColor: group.color,
      groupName: group.name
    }))
  );

  const getPassivePerception = (characterId: string): number => {
    const cd = getCharacterData(characterId);
    if (!cd) return 10;
    
    const wisMod = (cd.stats?.wis as any)?.modifier ?? 0;
    const level = Number((cd.info?.level as any)?.value ?? 1);
    const proficiency = Math.floor((level - 1) / 4) + 2;
    const percProf = (cd.skills?.perception as any)?.isProf || 0;
    const profBonus = percProf ? proficiency * (percProf === 2 ? 2 : 1) : 0;
    
    return 10 + wisMod + profBonus;
  };

  const getProficientSkills = (characterId: string): string => {
    const cd = getCharacterData(characterId);
    if (!cd) return '—';
    
    const skills = Object.values(cd.skills || {})
      .filter((skill: any) => (skill.isProf || 0) > 0)
      .map((skill: any) => skill.label)
      .join(', ');
    
    return skills || '—';
  };

  const getProficientSaves = (characterId: string): string => {
    const cd = getCharacterData(characterId);
    if (!cd) return '—';
    
    const saves = Object.entries(cd.saves || {})
      .filter(([, save]: any) => save.isProf)
      .map(([key]: any) => {
        const statKey = key as keyof typeof cd.stats;
        return cd.stats?.[statKey]?.label || String(key).toUpperCase();
      })
      .join(', ');
    
    return saves || '—';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        width: '90vw',
        maxWidth: '1200px',
        maxHeight: '80vh',
        overflow: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: 16,
      }}
      onClick={onClose}
    >
      <Card
        title={
          <Space>
            <Text strong style={{ color: '#1890ff', fontSize: 18 }}>
              📋 Информация о персонажах игроков
            </Text>
            <Tag color="blue">Удерживайте H</Tag>
          </Space>
        }
        bordered={false}
        style={{ backgroundColor: 'white', margin: 0 }}
        bodyStyle={{ padding: '16px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {allPlayers.length === 0 ? (
          <Text type="secondary">Нет персонажей игроков</Text>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
            {allPlayers.map((player) => {
              const cd = getCharacterData(player.id);
              const stages = getCharacterStages(player.id);
              const ac = cd?.vitality?.ac?.value ?? '—';
              const passivePerception = getPassivePerception(player.id);
              const skills = getProficientSkills(player.id);
              const saves = getProficientSaves(player.id);

              return (
                <Card
                  key={player.id}
                  
                  style={{
                    border: `2px solid ${player.groupColor}`,
                    borderRadius: 8
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {/* Заголовок с именем */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Badge color={player.groupColor} />
                        <Text strong style={{ fontSize: 16 }}>
                          {player.name}
                        </Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {player.groupName}
                      </Text>
                    </div>

                    {/* Основные характеристики */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                          КД: {ac}
                        </Text>
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                          ПВ: {passivePerception}
                        </Text>
                      </div>
                    </div>

                    {/* Трекеры заражения */}
                    <div>
                      <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>
                        Трекеры заражения:
                      </Text>
                      <Space size={12}>
                        <Tag color={stages.sporesStage > 2 ? 'red' : 'blue'} style={{ fontSize: 11 }}>
                          Споры: {stages.sporesStage}/4
                        </Tag>
                        <Tag color={stages.shadowStage > 2 ? 'red' : 'purple'} style={{ fontSize: 11 }}>
                          Тень: {stages.shadowStage}/4
                        </Tag>
                      </Space>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    {/* Владение навыками */}
                    <div>
                      <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>
                        Владение навыками:
                      </Text>
                      <Text style={{ fontSize: 11, lineHeight: '1.4' }}>
                        {skills}
                      </Text>
                    </div>

                    {/* Владение спасбросками */}
                    <div>
                      <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 4 }}>
                        Владение спасбросками:
                      </Text>
                      <Text style={{ fontSize: 11, lineHeight: '1.4' }}>
                        {saves}
                      </Text>
                    </div>
                  </Space>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayersOverlay;
