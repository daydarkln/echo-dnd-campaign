export interface InitiativeCharacter {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  initiative: number | null;
  status: 'active' | 'unconscious' | 'dead' | 'death-saving';
  deathSaves: {
    successes: number; // 0-3
    failures: number;  // 0-3
  };
}

export interface EncounterState {
  id: string;
  name: string;
  characters: InitiativeCharacter[];
  currentTurnIndex: number;
  round: number;
  isActive: boolean;
  selectedGroupIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiativeTrackerState {
  encounters: EncounterState[];
  currentEncounterId: string | null;
}

export type CharacterStatus = 'active' | 'unconscious' | 'dead' | 'death-saving';

// Константы для спасбросков от смерти
export const DEATH_SAVE_MAX = 3;
export const DEATH_SAVE_SUCCESS_THRESHOLD = 3;
export const DEATH_SAVE_FAILURE_THRESHOLD = 3;

// Типы спасбросков от смерти
export type DeathSaveType = 'success' | 'failure' | 'critical-success' | 'critical-failure';
