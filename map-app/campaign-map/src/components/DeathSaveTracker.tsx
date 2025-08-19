import React from 'react';
import { Button, Space, Typography, Divider, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined, ThunderboltOutlined, FireOutlined } from '@ant-design/icons';
import { DEATH_SAVE_MAX, DeathSaveType } from '../types/initiative';

const { Text } = Typography;

interface DeathSaveTrackerProps {
  successes: number;
  failures: number;
  onDeathSave: (saveType: DeathSaveType) => void;
  onReset: () => void;
  isCurrentTurn: boolean; // Новый проп для проверки, является ли это ходом текущего персонажа
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
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: index < count ? color : '#f0f0f0',
          border: `2px solid ${color}`,
          display: 'inline-block',
          marginRight: 4
        }}
      />
    ));
  };

  return (
    <div style={{ padding: 8, backgroundColor: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12, color: '#cf1322' }}>Спасброски от смерти</Text>
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 11, marginRight: 8, minWidth: 60 }}>Успехи:</Text>
          {renderDots(successes, DEATH_SAVE_MAX, '#52c41a')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, marginRight: 8, minWidth: 60 }}>Провалы:</Text>
          {renderDots(failures, DEATH_SAVE_MAX, '#ff4d4f')}
        </div>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {!isCurrentTurn && (
          <div style={{ 
            textAlign: 'center', 
            padding: 8, 
            backgroundColor: '#fff1f0', 
            borderRadius: 4, 
            marginBottom: 8,
            border: '1px solid #ffccc7'
          }}>
            <Text style={{ fontSize: 11, color: '#cf1322' }}>
              Не ваш ход! Дождитесь своей очереди.
            </Text>
          </div>
        )}
        
        <Text style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
          Обычные броски:
        </Text>
        <Row gutter={[4, 4]}>
          <Col span={12}>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => onDeathSave('success')}
              disabled={successes >= DEATH_SAVE_MAX || !isCurrentTurn}
              style={{ 
                backgroundColor: '#52c41a', 
                borderColor: '#52c41a',
                width: '100%',
                fontSize: 11,
                opacity: !isCurrentTurn ? 0.5 : 1
              }}
            >
              Успех
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => onDeathSave('failure')}
              disabled={failures >= DEATH_SAVE_MAX || !isCurrentTurn}
              style={{ 
                width: '100%', 
                fontSize: 11,
                opacity: !isCurrentTurn ? 0.5 : 1
              }}
            >
              Провал
            </Button>
          </Col>
        </Row>

        <Text style={{ fontSize: 11, textAlign: 'center', display: 'block', marginTop: 8 }}>
          Критические броски:
        </Text>
        <Row gutter={[4, 4]}>
          <Col span={12}>
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => onDeathSave('critical-success')}
              disabled={!isCurrentTurn}
              style={{ 
                backgroundColor: '#fadb14', 
                borderColor: '#fadb14',
                color: '#000',
                width: '100%',
                fontSize: 10,
                opacity: !isCurrentTurn ? 0.5 : 1
              }}
            >
              20 (встать)
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="small"
              icon={<FireOutlined />}
              onClick={() => onDeathSave('critical-failure')}
              disabled={!isCurrentTurn}
              style={{ 
                backgroundColor: '#722ed1', 
                borderColor: '#722ed1',
                color: '#fff',
                width: '100%',
                fontSize: 10,
                opacity: !isCurrentTurn ? 0.5 : 1
              }}
            >
              1 (x2 провал)
            </Button>
          </Col>
        </Row>

        <Button
          size="small"
          type="text"
          onClick={onReset}
          style={{ width: '100%', fontSize: 11, marginTop: 8 }}
        >
          Сбросить
        </Button>
      </Space>
    </div>
  );
};

export default DeathSaveTracker;
