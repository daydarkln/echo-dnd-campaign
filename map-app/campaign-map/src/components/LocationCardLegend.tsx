import React, { useState } from 'react';
import { Card, Typography, Collapse, Space, Tag } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const LocationCardLegend: React.FC = () => {
  return (
    <Collapse 
      size="small" 
      ghost
      items={[
        {
          key: '1',
          label: (
            <Space>
              <InfoCircleOutlined />
              <Text strong>Легенда карточек локаций</Text>
            </Space>
          ),
          children: (
            <div style={{ padding: '8px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 8 }}>Индикаторы содержимого:</Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 16, height: 16, borderRadius: '50%', 
                      backgroundColor: 'rgba(255,77,79,0.8)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white'
                    }}>⚔</div>
                    <Text>Энкаунтеры (бои с врагами)</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 16, height: 16, borderRadius: '50%', 
                      backgroundColor: 'rgba(250,173,20,0.8)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white'
                    }}>💰</div>
                    <Text>Лут (предметы и сокровища)</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 16, height: 16, borderRadius: '50%', 
                      backgroundColor: 'rgba(24,144,255,0.8)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white'
                    }}>🔍</div>
                    <Text>Улики (информация для расследования)</Text>
                  </div>
                </Space>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 8 }}>Цвета карточек:</Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 12, backgroundColor: '#ff4d4f', borderRadius: 2 }}></div>
                    <Text>Опасные места (враги, ловушки)</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 12, backgroundColor: '#52c41a', borderRadius: 2 }}></div>
                    <Text>Безопасные места (укрытия)</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 12, backgroundColor: '#722ed1', borderRadius: 2 }}></div>
                    <Text>Магические места</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 12, backgroundColor: '#fa8c16', borderRadius: 2 }}></div>
                    <Text>Населённые места</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 12, backgroundColor: '#1890ff', borderRadius: 2 }}></div>
                    <Text>Водные объекты</Text>
                  </div>
                </Space>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 8 }}>Дополнительные индикаторы:</Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 12, height: 12, borderRadius: '50%', 
                      backgroundColor: 'rgba(255,107,107,0.8)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: 'white'
                    }}>↑</div>
                    <Text>Усилители (факторы, увеличивающие опасность)</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 12, height: 12, borderRadius: '50%', 
                      backgroundColor: 'rgba(82,196,26,0.8)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: 'white'
                    }}>↓</div>
                    <Text>Ослабители (факторы, снижающие опасность)</Text>
                  </div>
                </Space>
              </div>

              <div>
                <Title level={5} style={{ marginBottom: 8 }}>Теги локаций:</Title>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <Tag>👣 следы</Tag>
                  <Tag>🌿 скрытые тропы</Tag>
                  <Tag>🏠 укрытие</Tag>
                  <Tag>🌱 растения</Tag>
                  <Tag>🧭 ориентир</Tag>
                  <Tag>⚔️ стража</Tag>
                  <Tag>🏛️ руины</Tag>
                  <Tag>⛪ храм</Tag>
                  <Tag>💧 источник</Tag>
                  <Tag>🌉 мост</Tag>
                  <Tag>🕳️ пещера</Tag>
                  <Tag>🐸 болото</Tag>
                  <Tag>🌲 лес</Tag>
                  <Tag>⛰️ горы</Tag>
                  <Tag>🌊 река</Tag>
                  <Tag>🏘️ деревня</Tag>
                  <Tag>🗼 башня</Tag>
                  <Tag>🏕️ лагерь</Tag>
                  <Tag>🏪 рынок</Tag>
                  <Tag>🛤️ дорога</Tag>
                  <Tag>🍄 грибы</Tag>
                  <Tag>✨ магия</Tag>
                  <Tag>📜 древний</Tag>
                  <Tag>⚠️ опасность</Tag>
                  <Tag>💎 сокровища</Tag>
                  <Tag>📚 знания</Tag>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: 8, backgroundColor: '#f0f2f5', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  💡 <strong>Подсказка:</strong> Наведите курсор на карточку локации, чтобы увидеть расширенную информацию, включая все теги и дополнительные индикаторы.
                </Text>
              </div>
            </div>
          )
        }
      ]}
    />
  );
};

export default LocationCardLegend;