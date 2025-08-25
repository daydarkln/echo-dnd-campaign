import React, { useState } from 'react';
import { Space, Button, Tooltip, Modal, Checkbox, Typography } from 'antd';
import { 
  UserOutlined, 
  SoundOutlined,
  BranchesOutlined,
  CarOutlined
} from '@ant-design/icons';
import { useAudio } from '../App';
import { RouteAudioConfig } from '../types/audio';

const { Text } = Typography;

interface RouteEffectButtonsProps {
  routeId: string;
  routeConfig: RouteAudioConfig;
  isLocationTransition?: boolean; // Флаг перехода между локациями
}

interface RouteEffectOption {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

export const RouteEffectButtons: React.FC<RouteEffectButtonsProps> = ({
  routeId,
  routeConfig,
  isLocationTransition = false
}) => {
  const { playRouteEffect, currentLocation, changeLocation } = useAudio();
  const [showEffectModal, setShowEffectModal] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [changeLocationChecked, setChangeLocationChecked] = useState(isLocationTransition);

  const getEffectOptions = (): RouteEffectOption[] => {
    const effects: RouteEffectOption[] = [];

    // Шаги для всех путей
    if (routeConfig.effects.footsteps) {
      effects.push({
        key: 'footsteps',
        title: 'Шаги',
        description: 'Шаги по пути',
        icon: <UserOutlined />,
        category: 'Общие'
      });
    }

    // Специфичные для лесной тропы
    if (routeConfig.effects.branchSnap) {
      effects.push({
        key: 'branchSnap',
        title: 'Ветка',
        description: 'Хруст ветки',
        icon: <BranchesOutlined />,
        category: 'Лесная тропа'
      });
    }

    if (routeConfig.effects.animalRustle) {
      effects.push({
        key: 'animalRustle',
        title: 'Животное',
        description: 'Шорох животного',
        icon: <SoundOutlined />,
        category: 'Лесная тропа'
      });
    }

    // Специфичные для городской улицы
    if (routeConfig.effects.carriagePass) {
      effects.push({
        key: 'carriagePass',
        title: 'Карета',
        description: 'Проезд кареты',
        icon: <CarOutlined />,
        category: 'Городская улица'
      });
    }

    return effects;
  };

  const handleEffectClick = (effectKey: string) => {
    setSelectedEffect(effectKey);
    setShowEffectModal(true);
  };

  const handlePlayEffect = () => {
    if (selectedEffect) {
      // Если это переход между локациями и выбран чекбокс смены локации, меняем локацию на начало пути
      if (isLocationTransition && changeLocationChecked && currentLocation !== routeId) {
        // Для путей можно использовать routeId как локацию или найти связанную локацию
        // Пока просто логируем
        console.log(`Would change location to route: ${routeId}`);
      }
      
      // Воспроизводим эффект
      playRouteEffect(routeId, selectedEffect);
      
      // Закрываем модалку
      setShowEffectModal(false);
      setSelectedEffect(null);
    }
  };

  const effectOptions = getEffectOptions();

  if (effectOptions.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Звуки пути:</h4>
      <Space wrap>
        {effectOptions.map((effect) => (
          <Tooltip key={effect.key} title={effect.description}>
            <Button
              icon={effect.icon}
              onClick={() => handleEffectClick(effect.key)}
              size="small"
            >
              {effect.title}
            </Button>
          </Tooltip>
        ))}
      </Space>

      {/* Модалка выбора эффекта */}
      <Modal
        title="Выбор звукового эффекта пути"
        open={showEffectModal}
        onCancel={() => {
          setShowEffectModal(false);
          setSelectedEffect(null);
        }}
        onOk={handlePlayEffect}
        okText="Воспроизвести"
        cancelText="Отмена"
        width={600}
      >
        {selectedEffect && (
          <div>
            {/* Информация о выбранном эффекте */}
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f6f8fa', borderRadius: 6 }}>
              <Space>
                {effectOptions.find(e => e.key === selectedEffect)?.icon}
                <div>
                  <Text strong>{effectOptions.find(e => e.key === selectedEffect)?.title}</Text>
                  <br />
                  <Text type="secondary">{effectOptions.find(e => e.key === selectedEffect)?.description}</Text>
                </div>
              </Space>
            </div>

            {/* Чекбокс смены локации - показываем только при переходах между локациями */}
            {isLocationTransition && (
              <div style={{ marginBottom: 16 }}>
                <Checkbox
                  checked={changeLocationChecked}
                  onChange={(e) => setChangeLocationChecked(e.target.checked)}
                >
                  <Text strong>Сменить текущую локацию</Text>
                </Checkbox>
                <div style={{ marginLeft: 24, marginTop: 4 }}>
                  <Text type="secondary">
                    {changeLocationChecked 
                      ? `Перейти на путь "${routeConfig.name}" и воспроизвести эффект`
                      : `Воспроизвести эффект без смены локации (текущая: ${currentLocation || 'не выбрана'})`
                    }
                  </Text>
                </div>
              </div>
            )}

            {/* Информация о пути */}
            <div style={{ padding: 12, backgroundColor: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
              <Text type="warning">
                <strong>Путь:</strong> {routeConfig.name}
                <br />
                <strong>Тип:</strong> {routeConfig.type}
                {routeConfig.ambient?.primary && (
                  <>
                    <br />
                    <strong>Ambient:</strong> {routeConfig.ambient.primary}
                  </>
                )}
                {isLocationTransition && (
                  <>
                    <br />
                    <strong>Статус:</strong> Переход между локациями
                  </>
                )}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
