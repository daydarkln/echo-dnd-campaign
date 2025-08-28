import React from 'react';
import InitiativeTracker from '../components/InitiativeTracker';


const InitiativeTrackerPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      {/* Контроллер погоды и времени */}
      <InitiativeTracker />
    </div>
  );
};

export default InitiativeTrackerPage;
