export type QuestStatus = 'idea' | 'planned' | 'active' | 'completed' | 'archived';

export interface Quest {
  id: string;
  title: string;
  summary?: string;
  status: QuestStatus;
  content: string; // HTML из WYSIWYG
  tags?: string[];
  relatedLocations?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateQuestInput {
  title: string;
  summary?: string;
  status?: QuestStatus;
  content: string;
  tags?: string[];
  relatedLocations?: string[];
}

export interface UpdateQuestInput {
  title?: string;
  summary?: string;
  status?: QuestStatus;
  content?: string;
  tags?: string[];
  relatedLocations?: string[];
  updatedAt?: string;
}


