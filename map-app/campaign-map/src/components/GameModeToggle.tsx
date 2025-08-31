import React from 'react';
import { Switch, Space, Typography, Badge, Tooltip } from 'antd';
import { 
  EditOutlined, 
  PlayCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useGameMode } from '../contexts/GameModeContext';

const { Text } = Typography;

export const GameModeToggle: React.FC = () => {
  const { gameMode, toggleGameMode, isPlanningMode, isGameMode } = useGameMode();

  const getModeDescription = () => {
    if (isPlanningMode) {
      return {
        title: 'Режим планирования',
        description: 'Полный доступ ко всем инструментам мастера',
        icon: <EditOutlined style={{ color: '#1890ff' }} />,
        badge: { text: 'ПЛАНИРОВАНИЕ', color: 'blue' }
      };
    } else {
      return {
        title: 'Режим игры',
        description: 'Упрощенный интерфейс для игрового процесса',
        icon: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
        badge: { text: 'ИГРА', color: 'green' }
      };
    }
  };

  const modeInfo = getModeDescription();

  return (
    <div style={{ 
      padding: '12px 16px', 
      backgroundColor: '#fafafa', 
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Space>
        {modeInfo.icon}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ fontSize: '14px' }}>
              {modeInfo.title}
            </Text>
            <Badge 
              count={modeInfo.badge.text} 
              style={{ 
                backgroundColor: modeInfo.badge.color,
                fontSize: '10px',
                fontWeight: 'bold'
              }} 
            />
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {modeInfo.description}
          </Text>
        </div>
      </Space>

      <Space>
        <Tooltip 
          title={
            <div>
              <div><strong>Режим планирования:</strong></div>
              <div>• Полный доступ ко всем картам</div>
              <div>• Редактирование локаций и квестов</div>
              <div>• Настройки видимости</div>
              <div>• Инструменты мастера</div>
              <br />
              <div><strong>Режим игры:</strong></div>
              <div>• Упрощенный интерфейс</div>
              <div>• Фокус на игровом процессе</div>
              <div>• Быстрый доступ к важной информации</div>
            </div>
          }
          placement="left"
        >
          <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
        </Tooltip>
        
        <Switch
          checked={isGameMode}
          onChange={toggleGameMode}
          checkedChildren="ИГРА"
          unCheckedChildren="ПЛАН"
          style={{ 
            minWidth: '80px',
            backgroundColor: isGameMode ? '#52c41a' : '#1890ff'
          }}
        />
      </Space>
    </div>
  );
};

export default GameModeToggle;
