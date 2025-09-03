import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Slider, Button, FloatButton, Card, Space, Typography, Divider, Badge, Modal, Tabs, Select, Tooltip, Row, Col } from 'antd';
import { AudioOutlined, SettingOutlined, PlayCircleOutlined, SoundOutlined, CloudOutlined, ClockCircleOutlined, MutedOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAudio } from '../App';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface TrackVolumeControlProps {}

interface TrackInfo {
  id: string;
  name: string;
  category: 'ambient' | 'music' | 'sfx' | 'voice';
  currentVolume: number;
  description: string;
  icon: string;
}

export const VolumeControlPanel: React.FC<TrackVolumeControlProps & { asWidget?: boolean }> = ({ asWidget }) => {
  const { 
    audioConfig, 
    bindings, 
    currentLocation, 
    updateCategoryVolume, 
    updateMasterVolume,
    updateTrackVolume,
    getCurrentLocationInfo,
    getActiveTracks,
    currentTimeOfDay,
    currentWeather,
    isMuted,
    setTimeOfDay,
    setWeather,
    setIsMuted
  } = useAudio();

  const [localVolumes, setLocalVolumes] = useState<Record<string, number>>({});
  const [showPanel, setShowPanel] = useState(false);

  // Получаем информацию о текущей локации
  const locationInfo = getCurrentLocationInfo?.();

  // Стабилизируем ключевые значения для предотвращения бесконечных циклов
  const timeOfDayEnabled = locationInfo?.timeOfDayEnabled ?? false;
  const weatherEnabled = locationInfo?.weatherEnabled ?? false;
  const locationName = locationInfo?.name ?? '';
  const locationType = locationInfo?.type ?? '';

  // Получаем только активные дорожки
  const activeTracks = useMemo((): TrackInfo[] => {
    return getActiveTracks?.() || [];
  }, [getActiveTracks]);

  // Инициализация локальных значений
  useEffect(() => {
    const volumes: Record<string, number> = {};
    activeTracks.forEach(track => {
      volumes[track.id] = track.currentVolume;
    });
    setLocalVolumes(volumes);
  }, [activeTracks]);

  // Обработка изменения громкости
  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    setLocalVolumes(prev => ({ ...prev, [trackId]: volume }));
    
    if (trackId === 'master') {
      updateMasterVolume(volume);
    } else {
      // Для отдельных треков используем updateTrackVolume
      updateTrackVolume(trackId, volume);
    }
  }, [updateMasterVolume, updateTrackVolume]);

  // Сброс к значениям по умолчанию
  const resetToDefaults = useCallback(() => {
    if (audioConfig) {
      const defaults: Record<string, number> = {};
      
      activeTracks.forEach(track => {
        if (track.id === 'master') {
          defaults[track.id] = audioConfig.globalSettings.masterVolume;
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
        if (trackId !== 'master') {
          updateTrackVolume(trackId, volume);
        }
      });
    }
  }, [audioConfig, activeTracks, updateMasterVolume, updateTrackVolume]);

  if (!audioConfig) return null;

  // Контент для таба "Каналы"
  const channelsTabContent = (
    <div>
      {/* Информация о текущей локации */}
      {locationInfo && (
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f6f8fa' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge color="blue" />
              <Text strong>Текущая локация: {locationName}</Text>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Тип: {locationType} • Время: {timeOfDayEnabled ? 'активно' : 'отключено'} • Погода: {weatherEnabled ? 'активна' : 'отключена'}
            </div>
          </Space>
        </Card>
      )}

      {/* Слайдеры громкости для каждой дорожки */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeTracks.map((track) => (
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
                <span style={{ fontSize: '16px' }}>{track.icon}</span>
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
            Активных каналов: {activeTracks.length}
          </Text>
        </div>
      </div>
    </div>
  );

  // Контент для таба "Атмосфера"
  const atmosphereTabContent = (
    <div>
      {/* Информация о текущей локации */}
      {locationInfo && (
        <div style={{ 
          padding: 12, 
          backgroundColor: '#f6f8fa', 
          borderRadius: 6, 
          border: '1px solid #e1e4e8',
          marginBottom: 16
        }}>
          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            📍 {locationName}
          </div>
          <Row gutter={8}>
            <Col span={12}>
              <Space>
                <ClockCircleOutlined style={{ color: timeOfDayEnabled ? '#52c41a' : '#d9d9d9' }} />
                <span style={{ fontSize: '11px', color: timeOfDayEnabled ? '#52c41a' : '#999' }}>
                  {timeOfDayEnabled ? 'Время суток активно' : 'Время суток отключено'}
                </span>
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <CloudOutlined style={{ color: weatherEnabled ? '#52c41a' : '#d9d9d9' }} />
                <span style={{ fontSize: '11px', color: weatherEnabled ? '#52c41a' : '#999' }}>
                  {weatherEnabled ? 'Погода активна' : 'Погода отключена'}
                </span>
              </Space>
            </Col>
          </Row>
        </div>
      )}

      {/* Время дня */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <ClockCircleOutlined />
          <span>Время дня:</span>
          {!timeOfDayEnabled && (
            <Tooltip title="Эффекты времени суток отключены для текущей локации">
              <InfoCircleOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
        <Select
          value={currentTimeOfDay}
          onChange={setTimeOfDay}
          style={{ width: '100%', marginTop: 8 }}
          size="small"
          disabled={!timeOfDayEnabled}
        >
          {Object.entries(audioConfig.timeOfDay).map(([time, config]) => (
            <Option key={time} value={time}>
              {time === 'morning' && '🌅'}
              {time === 'day' && '☀️'}
              {time === 'evening' && '🌆'}
              {time === 'night' && '🌙'}
              {' '}{time.charAt(0).toUpperCase() + time.slice(1)}
            </Option>
          ))}
        </Select>
        {audioConfig.timeOfDay[currentTimeOfDay] && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {audioConfig.timeOfDay[currentTimeOfDay].description}
            {!timeOfDayEnabled && (
              <span style={{ color: '#faad14', marginLeft: 8 }}>
                (не применяется в {locationName})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Погода */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <CloudOutlined />
          <span>Погода:</span>
          {!weatherEnabled && (
            <Tooltip title="Эффекты погоды отключены для текущей локации">
              <InfoCircleOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
        <Select
          value={currentWeather}
          onChange={setWeather}
          style={{ width: '100%', marginTop: 8 }}
          size="small"
          disabled={!weatherEnabled}
        >
          {Object.entries(audioConfig.weatherEffects).map(([weather, config]) => (
            <Option key={weather} value={weather}>
              {weather === 'clear' && '☀️'}
              {weather === 'rain' && '🌧️'}
              {weather === 'wind' && '💨'}
              {weather === 'storm' && '⛈️'}
              {' '}{weather.charAt(0).toUpperCase() + weather.slice(1)}
            </Option>
          ))}
        </Select>
        {audioConfig.weatherEffects[currentWeather] && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {audioConfig.weatherEffects[currentWeather].description}
            {!weatherEnabled && (
              <span style={{ color: '#faad14', marginLeft: 8 }}>
                (не применяется в {locationName})
              </span>
            )}
          </div>
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Кнопка отключения звука */}
      <Button
        type={isMuted ? 'primary' : 'default'}
        icon={isMuted ? <MutedOutlined /> : <SoundOutlined />}
        onClick={() => setIsMuted(!isMuted)}
        size="small"
        style={{ width: '100%' }}
      >
        {isMuted ? 'Включить звук' : 'Отключить звук'}
      </Button>

      {/* Информация о текущих настройках */}
      <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: 12 }}>
        Громкость: {Math.round(audioConfig.globalSettings.masterVolume * 100)}%
        {locationName && (
          <span style={{ marginLeft: 8 }}>
            • {locationName}
          </span>
        )}
      </div>
    </div>
  );

  if (asWidget) {
    return (
      <div>
        {channelsTabContent}
      </div>
    );
  }

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        tooltip={{
          title: 'Настройки звука и атмосферы',
          placement: 'left'
        }}
        onClick={() => setShowPanel(true)}
        style={{ right: 20, bottom: 20, zIndex: 1000 }}
      />
      
      <Modal
        title={
          <Space>
            <AudioOutlined style={{ color: '#1890ff' }} />
            <span>Настройки звука и атмосферы</span>
          </Space>
        }
        open={showPanel}
        onCancel={() => setShowPanel(false)}
        footer={null}
        width={500}
        style={{ top: 20 }}
        bodyStyle={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}
      >
        <Tabs defaultActiveKey="channels" size="small">
          <TabPane 
            tab={
              <span>
                <AudioOutlined />
                Каналы
              </span>
            } 
            key="channels"
          >
            {channelsTabContent}
          </TabPane>
        </Tabs>
      </Modal>
    </>
  );
};

export default VolumeControlPanel;
