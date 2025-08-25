import React, { useState, useEffect } from 'react';
import { Card, Space, Select, Button, Tooltip, Badge, Divider, Row, Col } from 'antd';
import { 
  CloudOutlined, 
  ClockCircleOutlined, 
  SoundOutlined,
  MutedOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAudio } from '../App';

const { Option } = Select;

export const WeatherTimeController: React.FC = () => {
  const {
    currentTimeOfDay,
    currentWeather,
    isMuted,
    audioConfig,
    getCurrentLocationInfo,
    getSavedSettingsInfo,
    setTimeOfDay,
    setWeather,
    setIsMuted
  } = useAudio();

  const [locationInfo, setLocationInfo] = useState<{
    name: string;
    timeOfDayEnabled: boolean;
    weatherEnabled: boolean;
  } | null>(null);

  // Получаем информацию о текущей локации
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    if (locationInfo) {
      setLocationInfo({
        name: locationInfo.name,
        timeOfDayEnabled: locationInfo.timeOfDayEnabled,
        weatherEnabled: locationInfo.weatherEnabled
      });
    } else {
      setLocationInfo(null);
    }
  }, [getCurrentLocationInfo]);

  if (!audioConfig) {
    return (
      <Card
        title="Атмосфера мира"
        size="small"
        style={{ marginBottom: 16 }}
        loading
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>Атмосфера мира</span>
          {locationInfo && (
            <Badge 
              count={[locationInfo.timeOfDayEnabled, locationInfo.weatherEnabled].filter(Boolean).length}
              style={{ backgroundColor: '#52c41a' }}
              title={`Активных эффектов: ${[locationInfo.timeOfDayEnabled, locationInfo.weatherEnabled].filter(Boolean).length}`}
            />
          )}
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Информация о текущей локации */}
        {locationInfo && (
          <div style={{ 
            padding: 8, 
            backgroundColor: '#f6f8fa', 
            borderRadius: 6, 
            border: '1px solid #e1e4e8' 
          }}>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
              📍 {locationInfo.name}
            </div>
            <Row gutter={8}>
              <Col span={12}>
                <Space>
                  <ClockCircleOutlined style={{ color: locationInfo.timeOfDayEnabled ? '#52c41a' : '#d9d9d9' }} />
                  <span style={{ fontSize: '11px', color: locationInfo.timeOfDayEnabled ? '#52c41a' : '#999' }}>
                    {locationInfo.timeOfDayEnabled ? 'Время суток активно' : 'Время суток отключено'}
                  </span>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <CloudOutlined style={{ color: locationInfo.weatherEnabled ? '#52c41a' : '#d9d9d9' }} />
                  <span style={{ fontSize: '11px', color: locationInfo.weatherEnabled ? '#52c41a' : '#999' }}>
                    {locationInfo.weatherEnabled ? 'Погода активна' : 'Погода отключена'}
                  </span>
                </Space>
              </Col>
            </Row>
          </div>
        )}

        {/* Время дня */}
        <div>
          <Space>
            <ClockCircleOutlined />
            <span>Время дня:</span>
            {locationInfo && !locationInfo.timeOfDayEnabled && (
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
            disabled={!!(locationInfo && !locationInfo.timeOfDayEnabled)}
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
              {locationInfo && !locationInfo.timeOfDayEnabled && (
                <span style={{ color: '#faad14', marginLeft: 8 }}>
                  (не применяется в {locationInfo.name})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Погода */}
        <div>
          <Space>
            <CloudOutlined />
            <span>Погода:</span>
            {locationInfo && !locationInfo.weatherEnabled && (
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
            disabled={!!(locationInfo && !locationInfo.weatherEnabled)}
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
              {locationInfo && !locationInfo.weatherEnabled && (
                <span style={{ color: '#faad14', marginLeft: 8 }}>
                  (не применяется в {locationInfo.name})
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
        <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
          Громкость: {Math.round(audioConfig.globalSettings.masterVolume * 100)}%
          {locationInfo && (
            <span style={{ marginLeft: 8 }}>
              • {locationInfo.name}
            </span>
          )}
          {getSavedSettingsInfo().hasLocation && (
            <span style={{ marginLeft: 8, color: '#52c41a' }}>
              💾 Настройки сохранены
            </span>
          )}
        </div>
      </Space>
    </Card>
  );
};
