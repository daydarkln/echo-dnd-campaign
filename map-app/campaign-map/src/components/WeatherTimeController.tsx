import React, { useState, useEffect } from 'react';
import { Segmented } from 'antd';
import { useAudio } from '../App';
import './WeatherTimeController.css';

export const WeatherTimeController: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const {
    currentWeather,
    audioConfig,
    getCurrentLocationInfo,
    setWeather,
    isMuted
  } = useAudio();

  // Отладочная информация
  console.log('WeatherTimeController render:', {
    currentWeather,
    hasAudioConfig: !!audioConfig,
    isMuted,
    locationInfo: getCurrentLocationInfo()
  });

  const [locationInfo, setLocationInfo] = useState<{
    timeOfDayEnabled: boolean;
    weatherEnabled: boolean;
  } | null>(null);

  // Получаем информацию о текущей локации
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    if (locationInfo) {
      setLocationInfo({
        timeOfDayEnabled: locationInfo.timeOfDayEnabled,
        weatherEnabled: locationInfo.weatherEnabled
      });
    } else {
      setLocationInfo(null);
    }
  }, [getCurrentLocationInfo]);

  if (!audioConfig) {
    return null;
  }

  // Опции для погоды
  const weatherOptions = Object.entries(audioConfig.weatherEffects).map(([weather, config]) => ({
    label: (
      <div className="segmented-option">
          {weather === 'clear' && '☀️'}
          {weather === 'rain' && '🌧️'}
          {weather === 'wind' && '💨'}
          {weather === 'storm' && '⛈️'}
        </div>
    ),
    value: weather
  }));

  return (
    <div className={`control-section ${embedded ? '' : 'floating'}`} style={{zIndex: 100}}>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: isMuted ? '#ff4d4f' : '#52c41a' }}>
        {isMuted ? '🔇 Звук отключен' : '🔊 Звук включен'}
      </div>
      <Segmented
        options={weatherOptions}
        value={currentWeather}
        onChange={(value) => {
          console.log(`WeatherTimeController: Changing weather from ${currentWeather} to ${value}`);
          setWeather(value as string);
        }}
        disabled={!!(locationInfo && !locationInfo.weatherEnabled)}
        className="weather-time-segmented"
        size="small"
      />
    </div>
  );
};
