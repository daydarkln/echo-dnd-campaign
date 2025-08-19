import React from 'react';
import { CharacterSheet } from '../components/CharacterSheet';

export const CharacterPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '16px 0'
    }}>
      <CharacterSheet />
    </div>
  );
};