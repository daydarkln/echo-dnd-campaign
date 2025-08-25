import React, { useState, useEffect, useMemo } from 'react';
import { Slider, Button, FloatButton, Card, Space, Typography, Divider, Badge, Modal } from 'antd';
import { AudioOutlined, SettingOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { useAudio } from '../App';

const { Text } = Typography;

interface TrackVolumeControlProps {}

interface TrackInfo {
  id: string;
  name: string;
  category: 'ambient' | 'music' | 'sfx' | 'voice';
  currentVolume: number;
  description: string;
  icon: React.ReactNode;
}

export const VolumeControlPanel: React.FC<TrackVolumeControlProps> = () => {
  const { 
    audioConfig, 
    bindings, 
    currentLocation, 
    updateCategoryVolume, 
    updateMasterVolume,
    updateTrackVolume,
    getCurrentLocationInfo
  } = useAudio();

  const [localVolumes, setLocalVolumes] = useState<Record<string, number>>({});
  const [showPanel, setShowPanel] = useState(false);

  // Получаем информацию о текущей локации
  const locationInfo = getCurrentLocationInfo?.();

  // Собираем все доступные дорожки
  const allTracks = useMemo((): TrackInfo[] => {
    const tracks: TrackInfo[] = [];
    
    if (!audioConfig || !bindings) return tracks;

    // Добавляем общую громкость
    tracks.push({
      id: 'master',
      name: 'Общая громкость',
      category: 'ambient',
      currentVolume: audioConfig.globalSettings.masterVolume,
      description: 'Общая громкость всех звуков',
      icon: <AudioOutlined style={{ color: '#1890ff' }} />
    });

    // Добавляем дорожки из текущей локации
    if (currentLocation && bindings.locations[currentLocation]) {
      const locationConfig = bindings.locations[currentLocation];
      
      // Основной ambient
      if (locationConfig.ambient?.primary) {
        tracks.push({
          id: `ambient-${locationConfig.ambient.primary}`,
          name: `Ambient: ${locationConfig.ambient.primary}`,
          category: 'ambient',
          currentVolume: locationConfig.ambient.volume || 0.6,
          description: `Основной ambient локации "${locationConfig.name}"`,
          icon: <SoundOutlined style={{ color: '#52c41a' }} />
        });
      }

      // Дополнительные ambient слои
      if (locationConfig.ambient?.layers) {
        locationConfig.ambient.layers.forEach((layerId, index) => {
          tracks.push({
            id: `ambient-layer-${layerId}`,
            name: `Ambient Layer: ${layerId}`,
            category: 'ambient',
            currentVolume: (locationConfig.ambient.volume || 0.6) * 0.7,
            description: `Дополнительный ambient слой ${index + 1}`,
            icon: <SoundOutlined style={{ color: '#13c2c2' }} />
          });
        });
      }

      // Музыкальная тема
      if (locationConfig.music?.theme) {
        tracks.push({
          id: `music-${locationConfig.music.theme}`,
          name: `Music: ${locationConfig.music.theme}`,
          category: 'music',
          currentVolume: locationConfig.music.volume || 0.4,
          description: `Музыкальная тема локации "${locationConfig.name}"`,
          icon: <PlayCircleOutlined style={{ color: '#722ed1' }} />
        });
      }
    }

    // Добавляем дорожки времени суток
    if (audioConfig.timeOfDay) {
      Object.entries(audioConfig.timeOfDay).forEach(([time, config]) => {
        tracks.push({
          id: `time-${time}`,
          name: `Time: ${time}`,
          category: 'ambient',
          currentVolume: config.volumeModifier || 1,
          description: `Эффект времени суток: ${config.description}`,
          icon: <SoundOutlined style={{ color: '#faad14' }} />
        });
      });
    }

    // Добавляем дорожки погоды
    if (audioConfig.weatherEffects) {
      Object.entries(audioConfig.weatherEffects).forEach(([weather, config]) => {
        if (config.ambientLayer) {
          tracks.push({
            id: `weather-${weather}`,
            name: `Weather: ${weather}`,
            category: 'ambient',
            currentVolume: config.volume || 0.5,
            description: `Эффект погоды: ${config.description}`,
            icon: <SoundOutlined style={{ color: '#13c2c2' }} />
          });
        }
      });
    }

    // Добавляем категории звуков
    tracks.push({
      id: 'category-music',
      name: 'Категория: Музыка',
      category: 'music',
      currentVolume: audioConfig.categoryVolumes.music,
      description: 'Общая громкость всех музыкальных треков',
      icon: <PlayCircleOutlined style={{ color: '#722ed1' }} />
    });

    tracks.push({
      id: 'category-ambient',
      name: 'Категория: Эмбиент',
      category: 'ambient',
      currentVolume: audioConfig.categoryVolumes.ambient,
      description: 'Общая громкость всех ambient звуков',
      icon: <SoundOutlined style={{ color: '#52c41a' }} />
    });

    tracks.push({
      id: 'category-sfx',
      name: 'Категория: Эффекты',
      category: 'sfx',
      currentVolume: audioConfig.categoryVolumes.sfx,
      description: 'Общая громкость всех звуковых эффектов',
      icon: <SoundOutlined style={{ color: '#fa8c16' }} />
    });

    tracks.push({
      id: 'category-voice',
      name: 'Категория: Голос',
      category: 'voice',
      currentVolume: audioConfig.categoryVolumes.voice,
      description: 'Общая громкость всех голосовых звуков',
      icon: <SoundOutlined style={{ color: '#eb2f96' }} />
    });

    return tracks;
  }, [audioConfig, bindings, currentLocation, getCurrentLocationInfo]);

  // Инициализация локальных значений
  useEffect(() => {
    const volumes: Record<string, number> = {};
    allTracks.forEach(track => {
      volumes[track.id] = track.currentVolume;
    });
    setLocalVolumes(volumes);
  }, [allTracks]);

  // Обработка изменения громкости
  const handleVolumeChange = (trackId: string, volume: number) => {
    setLocalVolumes(prev => ({ ...prev, [trackId]: volume }));
    
    if (trackId === 'master') {
      updateMasterVolume(volume);
    } else if (trackId.startsWith('category-')) {
      const category = trackId.replace('category-', '') as 'music' | 'ambient' | 'sfx' | 'voice';
      updateCategoryVolume(category, volume);
    } else {
      // Для отдельных треков используем updateTrackVolume
      updateTrackVolume(trackId, volume);
    }
  };

  // Сброс к значениям по умолчанию
  const resetToDefaults = () => {
    if (audioConfig) {
      const defaults: Record<string, number> = {};
      
      allTracks.forEach(track => {
        if (track.id === 'master') {
          defaults[track.id] = audioConfig.globalSettings.masterVolume;
        } else if (track.id.startsWith('category-')) {
          const category = track.id.replace('category-', '') as 'music' | 'ambient' | 'sfx' | 'voice';
          defaults[track.id] = audioConfig.categoryVolumes[category];
        } else {
          defaults[track.id] = track.currentVolume;
        }
      });
      
      setLocalVolumes(defaults);
      
      // Применяем изменения
      if (defaults.master !== undefined) {
        updateMasterVolume(defaults.master);
      }
      
      Object.entries(defaults).forEach(([trackId, volume]) => {
        if (trackId.startsWith('category-')) {
          const category = trackId.replace('category-', '') as 'music' | 'ambient' | 'sfx' | 'voice';
          updateCategoryVolume(category, volume);
        } else if (trackId !== 'master') {
          // Для отдельных треков используем updateTrackVolume
          updateTrackVolume(trackId, volume);
        }
      });
    }
  };

  if (!audioConfig) return null;

  const volumePanelContent = (
          <div>

      {/* Информация о текущей локации */}
      {locationInfo && (
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f6f8fa' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge color="blue" />
              <Text strong>Текущая локация: {locationInfo.name}</Text>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Тип: {locationInfo.type} • Время: {locationInfo.timeOfDayEnabled ? 'активно' : 'отключено'} • Погода: {locationInfo.weatherEnabled ? 'активна' : 'отключена'}
            </div>
          </Space>
        </Card>
      )}

      {/* Слайдеры громкости для каждой дорожки */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {allTracks.map((track) => (
          <div key={track.id} style={{ 
            padding: '12px', 
            border: '1px solid #f0f0f0', 
            borderRadius: '6px',
            backgroundColor: track.id === 'master' ? '#f6f8fa' : '#ffffff'
          }}>
            {/* Заголовок дорожки */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <Space>
                {track.icon}
                <div>
                  <Text strong style={{ fontSize: '13px' }}>{track.name}</Text>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    {track.description}
                  </div>
                </div>
              </Space>
              <Badge 
                count={track.category.toUpperCase()} 
                style={{ 
                  backgroundColor: track.id === 'master' ? '#1890ff' : '#52c41a',
                  fontSize: '10px'
                }} 
              />
            </div>

            {/* Слайдер громкости */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Slider
                min={0}
                max={1}
                step={0.001}
                value={localVolumes[track.id] || track.currentVolume}
                onChange={(value) => handleVolumeChange(track.id, value)}
                style={{ flex: 1, margin: 0 }}
              />
              <Text style={{ 
                fontSize: '12px', 
                color: '#595959',
                minWidth: '40px',
                textAlign: 'right'
              }}>
                {Math.round((localVolumes[track.id] || track.currentVolume) * 100)}%
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* Разделитель */}
      <Divider style={{ margin: '20px 0 16px 0' }} />

      {/* Кнопки управления */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Button
          size="small"
          onClick={resetToDefaults}
          type="default"
          style={{ fontSize: '12px' }}
        >
          Сброс к умолчаниям
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Всего дорожек: {allTracks.length}
          </Text>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        tooltip={{
          title: 'Управление дорожками',
          placement: 'left'
        }}
        onClick={() => setShowPanel(true)}
        style={{ right: 20, bottom: 20, zIndex: 1000 }}
      />
      
      <Modal
        title={
          <Space>
            <AudioOutlined style={{ color: '#1890ff' }} />
            <span>Управление дорожками</span>
          </Space>
        }
        open={showPanel}
        onCancel={() => setShowPanel(false)}
        footer={null}
        width={450}
        style={{ top: 20 }}
        bodyStyle={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}
      >
        {volumePanelContent}
      </Modal>
    </>
  );
};

export default VolumeControlPanel;
