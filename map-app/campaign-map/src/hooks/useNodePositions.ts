import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { GraphNode } from '../types';

const STORAGE_KEY = 'region-node-positions';

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export const useNodePositions = (nodes: GraphNode[]) => {
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());

  // Загружаем сохраненные позиции из localStorage при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const positions = JSON.parse(saved);
        const positionsMap = new Map();
        positions.forEach((pos: NodePosition) => {
          positionsMap.set(pos.id, pos);
        });
        setNodePositions(positionsMap);
      }
    } catch (error) {
      console.warn('Не удалось загрузить сохраненные позиции узлов:', error);
    }
  }, []);

  // Сохраняем позиции в localStorage
  const savePositions = useCallback((positions: Map<string, NodePosition>) => {
    try {
      const positionsArray = Array.from(positions.values());
      console.log('Saving positions to localStorage:', positionsArray);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positionsArray));
      message.success('Позиции узлов успешно сохранены!', 2);
    } catch (error) {
      console.error('Ошибка при сохранении позиций:', error);
      message.error('Не удалось сохранить позиции узлов', 2);
    }
  }, []);

  // Обновляем позицию конкретного узла
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    console.log('Updating node position:', nodeId, x, y);
    setNodePositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(nodeId, { id: nodeId, x, y });
      console.log('Updated positions map:', Array.from(newPositions.values()));
      return newPositions;
    });
  }, []);

  // Применяем сохраненные позиции к узлам
  const applySavedPositions = useCallback((nodes: GraphNode[]): GraphNode[] => {
    return nodes.map(node => {
      const savedPosition = nodePositions.get(node.id);
      if (savedPosition) {
        return {
          ...node,
          position: {
            x: savedPosition.x,
            y: savedPosition.y
          }
        };
      }
      return node;
    });
  }, [nodePositions]);

  // Сохраняем все текущие позиции
  const saveAllPositions = useCallback(() => {
    console.log('Saving all positions, current count:', nodePositions.size);
    savePositions(nodePositions);
  }, [nodePositions, savePositions]);

  return {
    nodePositions,
    updateNodePosition,
    applySavedPositions,
    saveAllPositions
  };
}; 