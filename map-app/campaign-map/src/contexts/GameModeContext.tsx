import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type GameMode = 'planning' | 'game';

interface GameModeContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  toggleGameMode: () => void;
  isPlanningMode: boolean;
  isGameMode: boolean;
}

const GameModeContext = createContext<GameModeContextType | null>(null);

export const useGameMode = () => {
  const context = useContext(GameModeContext);
  if (!context) {
    throw new Error('useGameMode must be used within a GameModeProvider');
  }
  return context;
};

interface GameModeProviderProps {
  children: ReactNode;
}

export const GameModeProvider: React.FC<GameModeProviderProps> = ({ children }) => {
  const [gameMode, setGameModeState] = useState<GameMode>('planning');

  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode);
    // Сохраняем режим в localStorage
    localStorage.setItem('dnd_gameMode', mode);
    console.log(`Game mode changed to: ${mode}`);
  }, []);

  const toggleGameMode = useCallback(() => {
    const newMode = gameMode === 'planning' ? 'game' : 'planning';
    setGameMode(newMode);
  }, [gameMode, setGameMode]);

  // Загружаем сохраненный режим при инициализации
  React.useEffect(() => {
    const savedMode = localStorage.getItem('dnd_gameMode') as GameMode;
    if (savedMode && (savedMode === 'planning' || savedMode === 'game')) {
      setGameModeState(savedMode);
      console.log(`Loaded saved game mode: ${savedMode}`);
    }
  }, []);

  const value: GameModeContextType = {
    gameMode,
    setGameMode,
    toggleGameMode,
    isPlanningMode: gameMode === 'planning',
    isGameMode: gameMode === 'game',
  };

  return (
    <GameModeContext.Provider value={value}>
      {children}
    </GameModeContext.Provider>
  );
};
