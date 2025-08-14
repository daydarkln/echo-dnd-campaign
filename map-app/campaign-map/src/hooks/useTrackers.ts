import { useCallback, useEffect, useState } from 'react';

export interface CharacterStages {
  sporesStage: number; // 0-4
  shadowStage: number; // 0-4
}

export interface TrackersState {
  // Персонажные трекеры по ID персонажа
  characterStages: Record<string, CharacterStages>;
  // Глобальные мастерские часы
  cityPanic: number;   // 0-4
  ecosystem: number;   // 0-4
  swarm: number;       // 0-4
}

const STORAGE_KEY = 'campaign-map-trackers';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useTrackers = () => {
  const [state, setState] = useState<TrackersState>({
    characterStages: {},
    cityPanic: 0,
    ecosystem: 0,
    swarm: 0,
  });

  useEffect(() => {
    try {
      const str = localStorage.getItem(STORAGE_KEY);
      if (str) {
        const parsed = JSON.parse(str) as Partial<TrackersState> & { sporesStage?: number; shadowStage?: number };
        // Миграция со старого формата (глобальные spores/shadow) в characterStages не выполняется автоматически,
        // так как нет id персонажей — оставляем только глобальные часы
        setState({
          characterStages: parsed.characterStages ?? {},
          cityPanic: clamp(parsed.cityPanic ?? 0, 0, 4),
          ecosystem: clamp(parsed.ecosystem ?? 0, 0, 4),
          swarm: clamp(parsed.swarm ?? 0, 0, 4),
        });
      }
    } catch {}
  }, []);

  const save = useCallback((next: TrackersState) => {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // Глобальные часы
  const setValue = useCallback((key: 'cityPanic' | 'ecosystem' | 'swarm', value: number) => {
    save({ ...state, [key]: clamp(value, 0, 4) });
  }, [state, save]);

  const inc = useCallback((key: 'cityPanic' | 'ecosystem' | 'swarm') => setValue(key, (state[key] as number) + 1), [state, setValue]);
  const dec = useCallback((key: 'cityPanic' | 'ecosystem' | 'swarm') => setValue(key, (state[key] as number) - 1), [state, setValue]);
  const reset = useCallback((key: 'cityPanic' | 'ecosystem' | 'swarm') => setValue(key, 0), [setValue]);

  // Персонажные трекеры
  const getCharacterStages = useCallback((characterId: string): CharacterStages => {
    const cs = state.characterStages[characterId];
    return {
      sporesStage: clamp(cs?.sporesStage ?? 0, 0, 4),
      shadowStage: clamp(cs?.shadowStage ?? 0, 0, 4),
    };
  }, [state.characterStages]);

  const setCharacterStage = useCallback((characterId: string, key: keyof CharacterStages, value: number) => {
    const current = state.characterStages[characterId] ?? { sporesStage: 0, shadowStage: 0 };
    const next: TrackersState = {
      ...state,
      characterStages: {
        ...state.characterStages,
        [characterId]: { ...current, [key]: clamp(value, 0, 4) },
      },
    };
    save(next);
  }, [state, save]);

  const incCharacterStage = useCallback((characterId: string, key: keyof CharacterStages) => {
    const current = getCharacterStages(characterId);
    setCharacterStage(characterId, key, current[key] + 1);
  }, [getCharacterStages, setCharacterStage]);

  const decCharacterStage = useCallback((characterId: string, key: keyof CharacterStages) => {
    const current = getCharacterStages(characterId);
    setCharacterStage(characterId, key, current[key] - 1);
  }, [getCharacterStages, setCharacterStage]);
  
  const resetCharacterStage = useCallback((characterId: string, key: keyof CharacterStages) => {
    setCharacterStage(characterId, key, 0);
  }, [setCharacterStage]);

  return {
    state,
    setValue,
    inc,
    dec,
    reset,
    getCharacterStages,
    setCharacterStage,
    incCharacterStage,
    decCharacterStage,
    resetCharacterStage,
  };
};

