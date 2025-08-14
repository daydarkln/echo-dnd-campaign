import React from 'react';
import { Tag, Tooltip, Space, Typography, Divider } from 'antd';
import { ObstacleDescription } from '../types';
import { getObstacleById, obstacleDescriptions } from '../utils/obstacleDescriptions';

const { Text } = Typography;

interface ObstacleTagProps {
  obstacleName: string;
  showTooltip?: boolean;
}

const ObstacleTag: React.FC<ObstacleTagProps> = ({ obstacleName, showTooltip = true }) => {
  const obstacle = getObstacleById(obstacleName) || getObstacleByName(obstacleName);
  
  if (!obstacle) {
    return <Tag color="orange">{obstacleName}</Tag>;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      case 'deadly': return 'purple';
      default: return 'orange';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'blue';
      case 'magical': return 'purple';
      case 'social': return 'cyan';
      case 'physical': return 'orange';
      case 'biological': return 'red';
      case 'mechanical': return 'geekblue';
      default: return 'default';
    }
  };

  const tooltipContent = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ color: 'white' }}>{obstacle.name}</Text>
      </div>
      <Divider style={{ margin: '4px 0', backgroundColor: 'rgba(255,255,255,0.3)' }} />
      <div style={{ marginBottom: 8 }}>
        <Text style={{ color: 'white', fontSize: '12px' }}>{obstacle.description}</Text>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>Категория: </Text>
            <Tag color={getCategoryColor(obstacle.category)} style={{ margin: 0 }}>
              {getCategoryName(obstacle.category)}
            </Tag>
          </div>
          <div>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>Сложность: </Text>
            <Tag color={getDifficultyColor(obstacle.difficulty)} style={{ margin: 0 }}>
              {getDifficultyName(obstacle.difficulty)}
            </Tag>
          </div>
        </Space>
      </div>
      {obstacle.effects.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>Эффекты:</Text>
          <div style={{ marginTop: 4 }}>
            {obstacle.effects.map((effect, index) => (
              <Tag key={index} color="red" style={{ margin: '2px', fontSize: '10px' }}>
                {effect}
              </Tag>
            ))}
          </div>
        </div>
      )}
      {obstacle.solutions.length > 0 && (
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>Решения:</Text>
          <div style={{ marginTop: 4 }}>
            {obstacle.solutions.map((solution, index) => (
              <Tag key={index} color="green" style={{ margin: '2px', fontSize: '10px' }}>
                {solution}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title={tooltipContent} 
        placement="top"
        overlayStyle={{ maxWidth: 350 }}
        color="rgba(0,0,0,0.9)"
      >
        <Tag color={getDifficultyColor(obstacle.difficulty)} style={{ cursor: 'help' }}>
          {obstacle.name}
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tag color={getDifficultyColor(obstacle.difficulty)}>
      {obstacle.name}
    </Tag>
  );
};

// Вспомогательные функции
const getObstacleByName = (name: string): ObstacleDescription | undefined => {
  return obstacleDescriptions.find(obstacle => 
    obstacle.name.toLowerCase() === name.toLowerCase()
  );
};

const getCategoryName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    'environmental': 'Окружение',
    'magical': 'Магия',
    'social': 'Социальное',
    'physical': 'Физическое',
    'biological': 'Биологическое',
    'mechanical': 'Механическое'
  };
  return categoryNames[category] || category;
};

const getDifficultyName = (difficulty: string): string => {
  const difficultyNames: Record<string, string> = {
    'easy': 'Легко',
    'medium': 'Средне',
    'hard': 'Сложно',
    'deadly': 'Смертельно'
  };
  return difficultyNames[difficulty] || difficulty;
};

export default ObstacleTag; 