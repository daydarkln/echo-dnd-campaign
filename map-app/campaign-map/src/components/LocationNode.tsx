import React, { useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, Tag, Button, Modal, Select, message } from 'antd';
import { EnvironmentOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import { useGroups } from '../hooks/useGroups';
import { getLocationName } from '../utils/locationUtils';

interface LocationNodeData {
  label: string;
  location: any;
  area: string;
  color?: string;
  onNodeClick?: (nodeId: string) => void;
}

const LocationNode: React.FC<NodeProps<LocationNodeData>> = ({ id, data, selected }) => {
  const rf = useReactFlow();
  const { groups, moveGroupToLocation } = useGroups();
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Найти группы, которые находятся в этой локации
  const groupsAtLocation = groups.filter(group => group.currentLocation === id);
  
  // Найти группы, которые НЕ находятся в этой локации (можно добавить несколько групп в одну локацию)
  const availableGroups = groups.filter(group => group.currentLocation !== id);

  const handleMouseEnter = () => {
    // Кладём id наведённого узла в глобальный стор через rf.setNodes? Нет прямого API,
    // используем кастомное событие на документе
    const ev = new CustomEvent('location-node-hover', { detail: { id } });
    window.dispatchEvent(ev);
  };

  const handleMouseLeave = () => {
    const ev = new CustomEvent('location-node-hover', { detail: { id: null } });
    window.dispatchEvent(ev);
  };

  const handleAddGroup = (groupId: string) => {
    moveGroupToLocation(groupId, id);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      message.success(`Группа "${group.name}" перемещена в "${data.label}"`);
    }
    setShowGroupModal(false);
    
    // Отправляем событие для блокировки кликов по узлу
    const preventClickEvent = new CustomEvent('prevent-node-click', { 
      detail: { nodeId: id, duration: 200 } 
    });
    window.dispatchEvent(preventClickEvent);
  };
  const handleNodeClick = (e: React.MouseEvent) => {
    // Проверяем, был ли клик по кнопке добавления или её иконке
    const target = e.target as HTMLElement;
    const isAddButton = target.closest('.add-group-button') || 
                       target.classList.contains('anticon-plus') ||
                       target.closest('.anticon-plus');
    
    // Если модальное окно открыто или клик по кнопке добавления
    if (isAddButton || showGroupModal) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
  };

  return (
    <div 
      className="location-node" 
      style={{ minWidth: 220 }}
      onClick={handleNodeClick}
    >
      <Handle type="target" position={Position.Top} />
      
      <Card
        className="location-card"
        size="small"
        hoverable
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: 8,
          backgroundColor: '#fff',
          boxShadow: selected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        bodyStyle={{ padding: '8px 12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EnvironmentOutlined style={{ color: data.color || '#1890ff', marginRight: 4 }} />
            <strong style={{ fontSize: 14, color: '#262626' }}>{data.label}</strong>
          </div>
          {availableGroups.length > 0 && (
            <Button
              type="link"
              size="small"
              className="add-group-button"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowGroupModal(true);
              }}
              style={{ padding: 0, height: 'auto', minWidth: 'auto' }}
              title="Добавить группу"
            />
          )}
        </div>
        
        <div style={{ marginBottom: 4 }}>
          <Tag color={data.color || 'blue'} style={{ fontSize: 11 }}>
            {data.area}
          </Tag>
        </div>
        
        {data.location.tags && data.location.tags.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            {data.location.tags.slice(0, 2).map((tag: string, index: number) => (
              <Tag key={index} color="green" style={{ fontSize: 10, margin: '2px 2px 2px 0' }}>
                {tag}
              </Tag>
            ))}
            {data.location.tags.length > 2 && (
              <Tag style={{ fontSize: 10 }}>+{data.location.tags.length - 2}</Tag>
            )}
          </div>
        )}
        
        {/* Отображение групп в локации */}
        {groupsAtLocation.length > 0 && (
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <TeamOutlined style={{ fontSize: 12, color: '#666', marginRight: 4 }} />
              <span style={{ fontSize: 11, color: '#666' }}>Группы:</span>
            </div>
            {groupsAtLocation.map((group) => (
              <div
                key={group.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '2px 0',
                  padding: '2px 4px',
                  backgroundColor: group.color + '20',
                  borderRadius: 4,
                  border: `1px solid ${group.color}40`
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: group.color,
                    marginRight: 4
                  }}
                />
                <span style={{ fontSize: 10, color: '#333' }}>
                  {group.name} ({group.members.length})
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      <Handle type="source" position={Position.Bottom} />
      
      {/* Модальное окно для добавления группы */}
      <Modal
        title={`Добавить группу в "${data.label}"`}
        open={showGroupModal}
        onCancel={() => setShowGroupModal(false)}
        footer={null}
      >
        {availableGroups.length === 0 ? (
          <p>Все группы уже находятся в этой локации или других локациях.</p>
        ) : (
          <div>
            <p>Выберите группу для перемещения в эту локацию:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableGroups.map((group) => (
                <Button
                  key={group.id}
                  type="default"
                  className="group-selection-button"
                  onClick={() => handleAddGroup(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '8px 12px',
                    height: 'auto'
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: group.color,
                      marginRight: 8
                    }}
                  />
                  <span>{group.name} ({group.members.length} участников)</span>
                  {group.currentLocation && (
                    <span style={{ marginLeft: 'auto', color: '#999', fontSize: 12 }}>
                      Сейчас: {getLocationName(group.currentLocation)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LocationNode;