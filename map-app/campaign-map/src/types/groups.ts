export interface Character {
  id: string;
  name: string;
  class?: string;
  level?: number;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  members: Character[];
  isPlayers: boolean; // флаг: эта группа является группой игроков
  currentLocation?: string; // ID локации где находится группа
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupsState {
  groups: Group[];
}