import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, Tag, Button, Modal, Select, message, Tooltip, Space, notification } from 'antd';
import { EnvironmentOutlined, TeamOutlined, PlusOutlined, EyeOutlined, EyeInvisibleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useGroups } from '../hooks/useGroups';
import { getLocationName } from '../utils/locationUtils';
import { useLocationVisibility } from '../hooks/useLocationVisibility';
import { useRegionVisibility } from '../hooks/useRegionVisibility';
import { useAudio } from '../App';

interface LocationNodeData {
  label: string;
  location: any;
  area: string;
  color?: string;
  onNodeClick?: (nodeId: string) => void;
  enableLocationVisibility?: boolean;
  isPlayerMap?: boolean;
}

// Типы эффектов перехода
type TransitionEffect = 
  | 'none'
  | 'door'
  | 'carriage'
  | 'horses'
  | 'magic'
  | 'flight';

// Типы дверей
type DoorType = 'heavy' | 'wooden' | 'secret';

const LocationNode: React.FC<NodeProps<LocationNodeData>> = ({ id, data, selected }) => {
  const rf = useReactFlow();
  const { groups, moveGroupToLocation } = useGroups();
  const [localGroups, setLocalGroups] = useState(groups);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<TransitionEffect>('none');
  const [showDoorTypeModal, setShowDoorTypeModal] = useState(false);
  const { isLocationVisible, toggleLocationVisibility, setLocationVisibilityWithRegionUpdate } = useLocationVisibility();
  const { autoOpenRegionIfNeeded } = useRegionVisibility();
  const { playLocationSpotlight, bindings, playSound } = useAudio();
  
  // Синхронизируем локальное состояние с глобальным
  useEffect(() => {
    setLocalGroups(groups);
  }, [groups, id]);
  
  // Найти группы, которые находятся в этой локации
  const groupsAtLocation = localGroups.filter(group => group.currentLocation === id);
  
  // Найти группы, которые НЕ находятся в этой локации (можно добавить несколько групп в одну локацию)
  const availableGroups = localGroups.filter(group => group.currentLocation !== id);
  
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

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedEffect('none');
  };

  const handleEffectSelect = (effect: TransitionEffect) => {
    if (effect === 'door') {
      setSelectedEffect(effect);
      setShowDoorTypeModal(true);
    } else {
      // Для всех остальных эффектов сразу воспроизводим и перемещаем
      setSelectedEffect(effect);
      playEffectAndMove(effect);
    }
  };

  const handleDoorTypeSelect = (doorType: DoorType) => {
    setShowDoorTypeModal(false);
    // Воспроизводим звук двери и перемещаем группу
    const doorSoundMap = {
      heavy: 'door_ancient_heavy',
      wooden: 'door_wooden',
      secret: 'door_ancient_heavy' // используем тот же звук для потайной двери
    };
    
    playSound(doorSoundMap[doorType], 'sfx', {
      volume: 0.8,
      onEnd: () => {
        // После воспроизведения звука двери перемещаем группу
        moveGroupWithEffect('door', doorType);
      }
    });
  };

  const playEffectAndMove = (effect: TransitionEffect) => {
    if (effect === 'none') {
      // Если эффект не выбран, сразу перемещаем
      moveGroupWithEffect('none');
      return;
    }

    // Воспроизводим выбранный эффект
    const effectSoundMap = {
      door: 'door_wooden', // будет заменен на конкретный тип двери
      carriage: 'door_wooden', // временно используем звук двери
      horses: 'door_wooden', // временно используем звук двери
      magic: 'door_wooden', // временно используем звук двери
      flight: 'door_wooden' // временно используем звук двери
    };
    
    playSound(effectSoundMap[effect], 'sfx', {
      volume: 0.8,
      onEnd: () => {
        // После воспроизведения эффекта перемещаем группу
        moveGroupWithEffect(effect);
      }
    });
  };

  const moveGroupWithEffect = (effect: TransitionEffect, doorType?: DoorType) => {
    if (!selectedGroupId) return;
    
    // Перемещаем группу
    moveGroupToLocation(selectedGroupId, id);
    
    // Принудительно обновляем локальное состояние для корректного отображения
    const updatedGroups = localGroups.map(group => 
      group.id === selectedGroupId 
        ? { ...group, currentLocation: id }
        : group
    );
    
    // Обновляем локальное состояние немедленно
    setLocalGroups(updatedGroups);
    
    const group = updatedGroups.find(g => g.id === selectedGroupId);
    if (group) {
      let effectText = '';
      if (effect === 'door' && doorType) {
        const doorTypeNames = {
          heavy: 'тяжелой двери',
          wooden: 'деревянной двери',
          secret: 'потайной двери'
        };
        effectText = `с эффектом ${doorTypeNames[doorType]}`;
      } else if (effect !== 'none') {
        effectText = `с эффектом "${getEffectDisplayName(effect)}"`;
      } else {
        effectText = 'без эффекта';
      }
      
      message.success(`Группа "${group.name}" перемещена в "${data.label}" ${effectText}`);
      
      // Если это группа игроков, отправляем событие о смене локации
      if (group.isPlayers) {
        try { 
          window.dispatchEvent(new CustomEvent('gm:locationSelected', { 
            detail: { 
              id: id, 
              name: data.label, 
              area: data.area 
            } 
          })); 
        } catch {}
      }
      
      // Автоматически запускаем атмосферу локации после перемещения
      // Используем небольшую задержку, чтобы эффект перехода успел завершиться
      setTimeout(() => {
        if (bindings?.locations[id]) {
          playLocationSpotlight(id);
        }
      }, 500);
    }
    
    // Сброс состояния и закрытие модалки
    setSelectedGroupId(null);
    setSelectedEffect('none');
    setShowGroupModal(false);
    
    // Отправляем событие для блокировки кликов по узлу
    const preventClickEvent = new CustomEvent('prevent-node-click', { 
      detail: { nodeId: id, duration: 200 } 
    });
    window.dispatchEvent(preventClickEvent);
  };

  const getEffectDisplayName = (effect: TransitionEffect): string => {
    switch (effect) {
      case 'none': return 'Без эффекта';
      case 'door': return 'Дверь';
      case 'carriage': return 'Повозка';
      case 'horses': return 'Лошади';
      case 'magic': return 'Магический эффект';
      case 'flight': return 'Пролет';
      default: return 'Неизвестно';
    }
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
            {data.enableLocationVisibility && (
              <Button
                type="text"
                
                icon={isLocationVisible(id) ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocationVisible(id)) {
                    // Если локация скрывается, просто переключаем
                    toggleLocationVisibility(id);
                  } else {
                    // Если локация открывается, автоматически открываем регион
                    setLocationVisibilityWithRegionUpdate(id, true, data.area, autoOpenRegionIfNeeded);
                  }
                }}
                style={{ marginLeft: 8, color: isLocationVisible(id) ? '#52c41a' : '#d9d9d9' }}
                title={isLocationVisible(id) ? 'Скрыть локацию' : 'Показать локацию'}
              />
            )}
            {/* Кнопка спотлайта - только для мастера */}
            {!data.isPlayerMap && bindings?.locations[id] && (
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  playLocationSpotlight(id);
                }}
                style={{ marginLeft: 4, color: '#1890ff' }}
                title="Воспроизвести атмосферу локации"
              />
            )}
          </div>
          {availableGroups.length > 0 && (
            <Button
              type="link"
              
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
        onCancel={() => {
          setShowGroupModal(false);
          setSelectedGroupId(null);
          setSelectedEffect('none');
        }}
        footer={null}
        width={600}
      >
        {availableGroups.length === 0 ? (
          <p>Все группы уже находятся в этой локации или других локациях.</p>
        ) : (
          <div>
            {/* Шаг 1: Выбор группы */}
            <div style={{ marginBottom: 24 }}>
              <h4>1. Выберите группу для перемещения:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableGroups.map((group) => (
                  <Button
                    key={group.id}
                    type={selectedGroupId === group.id ? 'primary' : 'default'}
                    className="group-selection-button"
                    onClick={() => handleGroupSelect(group.id)}
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

            {/* Шаг 2: Выбор эффекта перехода (только для групп игроков) */}
            {selectedGroupId && availableGroups.find(g => g.id === selectedGroupId)?.isPlayers && (
              <div style={{ marginBottom: 24 }}>
                <h4>2. Выберите эффект перехода:</h4>
                <Space wrap>
                  <Button
                    type={selectedEffect === 'none' ? 'primary' : 'default'}
                    onClick={() => handleEffectSelect('none')}
                  >
                    Без эффекта
                  </Button>
                  
                  <Tooltip title="Нажмите для выбора типа двери">
                    <Button
                      type={selectedEffect === 'door' ? 'primary' : 'default'}
                      onClick={() => handleEffectSelect('door')}
                    >
                      🚪 Дверь
                    </Button>
                  </Tooltip>
                  
                  <Button
                    type={selectedEffect === 'carriage' ? 'primary' : 'default'}
                    onClick={() => handleEffectSelect('carriage')}
                  >
                    🚛 Повозка
                  </Button>
                  
                  <Button
                    type={selectedEffect === 'horses' ? 'primary' : 'default'}
                    onClick={() => handleEffectSelect('horses')}
                  >
                    🐎 Лошади
                  </Button>
                  
                  <Button
                    type={selectedEffect === 'magic' ? 'primary' : 'default'}
                    onClick={() => handleEffectSelect('magic')}
                  >
                    ✨ Магический эффект
                  </Button>
                  
                  <Button
                    type={selectedEffect === 'flight' ? 'primary' : 'default'}
                    onClick={() => handleEffectSelect('flight')}
                  >
                    🦅 Пролет
                  </Button>
                </Space>
              </div>
            )}

            {/* Для NPC групп - простая кнопка перемещения */}
            {selectedGroupId && !availableGroups.find(g => g.id === selectedGroupId)?.isPlayers && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => moveGroupWithEffect('none')}
                  disabled={!selectedGroupId}
                >
                  Переместить группу
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно выбора типа двери */}
      <Modal
        title="Выберите тип двери"
        open={showDoorTypeModal}
        onCancel={() => setShowDoorTypeModal(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 20 }}>Какой тип двери будет использоваться для перехода?</p>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="default"
              size="large"
              block
              onClick={() => handleDoorTypeSelect('heavy')}
            >
              🚪 Тяжелая дверь
            </Button>
            <Button
              type="default"
              size="large"
              block
              onClick={() => handleDoorTypeSelect('wooden')}
            >
              🪵 Обычная деревянная
            </Button>
            <Button
              type="default"
              size="large"
              block
              onClick={() => handleDoorTypeSelect('secret')}
            >
              🔐 Потайная дверь
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default LocationNode;