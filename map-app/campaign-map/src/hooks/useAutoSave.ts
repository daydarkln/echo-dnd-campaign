import { useCallback, useRef } from 'react';
import { GraphNode } from '../types';

export const useAutoSave = (saveFunction: (nodes: GraphNode[]) => void, delay: number = 1000) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((nodes: GraphNode[]) => {
    console.log('Запуск автоматического сохранения через', delay, 'мс');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log('Предыдущий таймер отменён');
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Выполняем автоматическое сохранение');
      saveFunction(nodes);
      timeoutRef.current = null;
    }, delay);
  }, [saveFunction, delay]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      console.log('Автоматическое сохранение отменено');
    }
  }, []);

  return { debouncedSave, cancelAutoSave };
}; 