import React from 'react';
import { Button, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, ThunderboltOutlined, FireOutlined, RedoOutlined } from '@ant-design/icons';
import { DEATH_SAVE_MAX, DeathSaveType } from '../types/initiative';

const { Text } = Typography;

interface DeathSaveTrackerProps {
  successes: number;
  failures: number;
  onDeathSave: (saveType: DeathSaveType) => void;
  onReset: () => void;
  isCurrentTurn: boolean;
}

const DeathSaveTracker: React.FC<DeathSaveTrackerProps> = ({
  successes,
  failures,
  onDeathSave,
  onReset,
  isCurrentTurn
}) => {
  const renderDots = (count: number, max: number, color: string) => {
    return Array.from({ length: max }).map((_, index) => (
      <div
        key={index}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: index < count ? color : '#f0f0f0',
          border: `1px solid ${color}`,
          display: 'inline-block',
          marginRight: 2
        }}
      />
    ));
  };

  return (
    <div style={{ 
      padding: '6px 8px', 
      backgroundColor: '#fff1f0', 
      borderRadius: 4, 
      border: '1px solid #ffccc7',
      width: '80px',
      fontSize: '10px'
    }}>
      {/* Счетчики */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
          <Text style={{ fontSize: 9, color: '#52c41a' }}>✓</Text>
          {renderDots(successes, DEATH_SAVE_MAX, '#52c41a')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 9, color: '#ff4d4f' }}>✗</Text>
          {renderDots(failures, DEATH_SAVE_MAX, '#ff4d4f')}
        </div>
      </div>

      {/* Кнопки действий */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Успешные броски */}
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => onDeathSave('success')}
            disabled={!isCurrentTurn}
            style={{ 
              backgroundColor: '#52c41a', 
              borderColor: '#52c41a',
              fontSize: 9,
              height: 18,
              padding: '0 4px',
              minWidth: 24
            }}
          />
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => onDeathSave('critical-success')}
            disabled={!isCurrentTurn}
            style={{ 
              backgroundColor: '#fadb14', 
              borderColor: '#fadb14',
              color: '#000',
              fontSize: 9,
              height: 18,
              padding: '0 4px',
              minWidth: 24
            }}
          />
        </div>
        
        {/* Неудачные броски */}
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => onDeathSave('failure')}
            disabled={!isCurrentTurn}
            style={{ 
              fontSize: 9,
              height: 18,
              padding: '0 4px',
              minWidth: 24
            }}
          />
          <Button
            size="small"
            icon={<FireOutlined />}
            onClick={() => onDeathSave('critical-failure')}
            disabled={!isCurrentTurn}
            style={{ 
              backgroundColor: '#722ed1', 
              borderColor: '#722ed1',
              color: '#fff',
              fontSize: 9,
              height: 18,
              padding: '0 4px',
              minWidth: 24
            }}
          />
        </div>
        
        {/* Сброс */}
        <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
          <Button
            size="small"
            type="text"
            icon={<RedoOutlined />}
            onClick={onReset}
            style={{ 
              fontSize: 9,
              height: 20,
              padding: '0 4px',
              color: '#999'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DeathSaveTracker;
