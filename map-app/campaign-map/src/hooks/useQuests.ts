import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { CreateQuestInput, Quest, UpdateQuestInput } from '../types/quests';

interface LoadingState {
  loading: boolean;
  error: string | null;
}

export function useQuests() {
  const [data, setData] = useState<Quest[]>([]);
  const [state, setState] = useState<LoadingState>({ loading: true, error: null });

  const fetchData = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const quests = await apiClient.quests.getQuests();
      setData(quests);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : 'Ошибка загрузки квестов' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createQuest = useCallback(async (input: CreateQuestInput) => {
    const now = new Date().toISOString();
    const newQuest = await apiClient.quests.createQuest({
      title: input.title,
      summary: input.summary || '',
      status: input.status || 'planned',
      content: input.content,
      tags: input.tags || [],
      relatedLocations: input.relatedLocations || [],
      createdAt: now,
      updatedAt: now
    } as Quest);
    setData(prev => [...prev, newQuest]);
    return newQuest;
  }, []);

  const updateQuest = useCallback(async (id: string, input: UpdateQuestInput) => {
    const updated = await apiClient.quests.updateQuest(id, { ...input, updatedAt: new Date().toISOString() });
    setData(prev => prev.map(q => (q.id === id ? updated : q)));
    return updated;
  }, []);

  const deleteQuest = useCallback(async (id: string) => {
    await apiClient.quests.deleteQuest(id);
    setData(prev => prev.filter(q => q.id !== id));
  }, []);

  return {
    data,
    ...state,
    refetch: fetchData,
    createQuest,
    updateQuest,
    deleteQuest
  };
}


