import React, { useState } from 'react';
import { Space, Button, Tooltip, Modal, Checkbox, List, Typography } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  BookOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { useAudio } from '../App';
import { LocationAudioConfig } from '../types/audio';

const { Text } = Typography;

interface LocationEffectButtonsProps {
  locationId: string;
  locationConfig: LocationAudioConfig;
  isLocationTransition?: boolean; // Флаг перехода между локациями
}

interface EffectOption {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

export const LocationEffectButtons: React.FC<LocationEffectButtonsProps> = ({
  locationId,
  locationConfig,
  isLocationTransition = false
}) => {
  const { playLocationEffect, currentLocation, changeLocation } = useAudio();
  const [showEffectModal, setShowEffectModal] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [changeLocationChecked, setChangeLocationChecked] = useState(isLocationTransition);

  // Определяем доступные эффекты на основе конфигурации
  const getEffectOptions = (): EffectOption[] => {
    const effects: EffectOption[] = [];

    // Кнопки для всех типов локаций
    if (locationConfig.effects.doorHeavy) {
      effects.push({
        key: 'doorHeavy',
        title: 'Дверь',
        description: 'Открыть/закрыть дверь',
        icon: <HomeOutlined />,
        category: 'Общие'
      });
    }

    if (locationConfig.effects.footsteps) {
      effects.push({
        key: 'footsteps',
        title: 'Шаги',
        description: 'Звук шагов по поверхности',
        icon: <UserOutlined />,
        category: 'Общие'
      });
    }

    // Специфичные для библиотеки
    if (locationConfig.effects.bookOpen) {
      effects.push({
        key: 'bookOpen',
        title: 'Книга',
        description: 'Открыть книгу',
        icon: <BookOutlined />,
        category: 'Библиотека'
      });
    }

    if (locationConfig.effects.scrollUnroll) {
      effects.push({
        key: 'scrollUnroll',
        title: 'Свиток',
        description: 'Развернуть свиток',
        icon: <FileTextOutlined />,
        category: 'Библиотека'
      });
    }

    // Специфичные для грибной колонии
    if (locationConfig.effects.sporeBurst) {
      effects.push({
        key: 'sporeBurst',
        title: 'Споры',
        description: 'Взрыв спор',
        icon: <SoundOutlined />,
        category: 'Грибная колония'
      });
    }

    if (locationConfig.effects.mindWhisper) {
      effects.push({
        key: 'mindWhisper',
        title: 'Шепот',
        description: 'Шепот разума',
        icon: <ThunderboltOutlined />,
        category: 'Грибная колония'
      });
    }

    // Специфичные для рынка
    if (locationConfig.effects.marketHaggle) {
      effects.push({
        key: 'marketHaggle',
        title: 'Торговля',
        description: 'Торговля на рынке',
        icon: <SoundOutlined />,
        category: 'Рынок'
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
      // Если это переход между локациями и выбран чекбокс смены локации, меняем локацию
      if (isLocationTransition && changeLocationChecked && currentLocation !== locationId) {
        changeLocation(locationId);
      }
      
      // Воспроизводим эффект
      playLocationEffect(locationId, selectedEffect);
      
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
      <h4>Звуковые эффекты:</h4>
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
        title="Выбор звукового эффекта"
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
                      ? `Перейти в локацию "${locationConfig.name}" и воспроизвести эффект`
                      : `Воспроизвести эффект без смены локации (текущая: ${currentLocation || 'не выбрана'})`
                    }
                  </Text>
                </div>
              </div>
            )}

            {/* Информация о локации */}
            <div style={{ padding: 12, backgroundColor: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
              <Text type="warning">
                <strong>Локация:</strong> {locationConfig.name}
                <br />
                <strong>Тип:</strong> {locationConfig.type}
                {locationConfig.ambient && (
                  <>
                    <br />
                    <strong>Ambient:</strong> {locationConfig.ambient.day}
                    {locationConfig.ambient.night && ` / ${locationConfig.ambient.night}`}
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
