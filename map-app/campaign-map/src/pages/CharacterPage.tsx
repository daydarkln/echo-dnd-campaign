import React from 'react';
import { CharacterSheet } from '../components/CharacterSheet';
import { WeatherTimeController } from '../components/WeatherTimeController';

export const CharacterPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '16px 0'
    }}>
      {/* Контроллер погоды и времени */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <WeatherTimeController />
      </div>
      
      <CharacterSheet />
    </div>
  );
};