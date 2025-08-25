import React from 'react';
import InitiativeTracker from '../components/InitiativeTracker';
import { WeatherTimeController } from '../components/WeatherTimeController';

const InitiativeTrackerPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      {/* Контроллер погоды и времени */}
      <WeatherTimeController />
      
      <InitiativeTracker />
    </div>
  );
};

export default InitiativeTrackerPage;
