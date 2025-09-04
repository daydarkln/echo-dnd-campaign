import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const navigate = useNavigate();
  const gameMode: GameMode = location.pathname.startsWith('/game') ? 'game' : 'planning';

  const setGameMode = useCallback((mode: GameMode) => {
    if (mode === 'game') navigate('/game');
    else navigate('/');
  }, [navigate]);

  const toggleGameMode = useCallback(() => {
    if (gameMode === 'planning') navigate('/game');
    else navigate('/');
  }, [gameMode, navigate]);

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
