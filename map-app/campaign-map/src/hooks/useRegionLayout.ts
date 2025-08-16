import { useState, useEffect, useCallback } from 'react';
import { GraphNode } from '../types';
import { applyCircularRegionLayout } from '../utils/layout';

const STORAGE_KEY = 'region-layout-positions';

interface SavedPosition {
  id: string;
  x: number;
  y: number;
}

export const useRegionLayout = (nodes: GraphNode[]) => {
  const [savedPositions, setSavedPositions] = useState<SavedPosition[]>([]);
  const [isCustomLayout, setIsCustomLayout] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentPositions, setCurrentPositions] = useState<SavedPosition[]>([]);

  // Загружаем сохранённые позиции при инициализации
  useEffect(() => {
    console.log('useRegionLayout: useEffect для инициализации');
    console.log('Проверяем localStorage на наличие сохранённых позиций...');
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('Найдено в localStorage:', saved);
    
    if (saved) {
      try {
        const positions = JSON.parse(saved) as SavedPosition[];
        console.log('Позиции успешно загружены:', positions);
        setSavedPositions(positions);
        setCurrentPositions(positions);
        setIsCustomLayout(true);
        setHasUnsavedChanges(false);
        console.log('Состояние обновлено:', { 
          savedPositions: positions, 
          currentPositions: positions, 
          isCustomLayout: true, 
          hasUnsavedChanges: false 
        });
      } catch (error) {
        console.warn('Ошибка при загрузке сохранённых позиций:', error);
        setSavedPositions([]);
        setCurrentPositions([]);
        setIsCustomLayout(false);
        setHasUnsavedChanges(false);
        console.log('Состояние сброшено из-за ошибки');
      }
    } else {
      console.log('Сохранённых позиций не найдено, используем стандартную расстановку');
      console.log('Состояние по умолчанию:', { 
        savedPositions: [], 
        currentPositions: [], 
        isCustomLayout: false, 
        hasUnsavedChanges: false 
      });
    }
  }, []);

  // Применяем сохранённую расстановку или стандартную
  const getLayoutedNodes = useCallback(() => {
    console.log('getLayoutedNodes вызван:', { 
      savedPositionsLength: savedPositions.length, 
      isCustomLayout, 
      nodesLength: nodes.length 
    });
    
    if (savedPositions.length > 0 && isCustomLayout) {
      console.log('Применяем сохранённую расстановку');
      console.log('Сохранённые позиции:', savedPositions);
      // Применяем сохранённые позиции
      return nodes.map(node => {
        const savedPos = savedPositions.find(pos => pos.id === node.id);
        if (savedPos && !(node as any).parentId) {
          console.log(`Применяем позицию для узла ${node.id}:`, savedPos);
          return {
            ...node,
            position: { x: savedPos.x, y: savedPos.y }
          };
        }
        return node;
      });
    } else {
      console.log('Применяем стандартную круговую расстановку');
      // Применяем стандартную круговую расстановку
      return applyCircularRegionLayout(nodes, {
        radius: 3000,
        centerX: 1600,
        centerY: 1400,
        startAngleRad: -Math.PI / 2,
        clockwise: true,
        spacingFactor: 1.15,
      });
    }
  }, [nodes, savedPositions, isCustomLayout]);

  // Обновляем текущие позиции (вызывается при перетаскивании)
  const updateCurrentPositions = useCallback((nodes: GraphNode[]) => {
    console.log('updateCurrentPositions вызван с', nodes.length, 'узлами');
    console.log('Узлы:', nodes);
    
    const positions = nodes
      .filter(node => !(node as any).parentId) // Только регионы верхнего уровня
      .map(node => ({
        id: node.id,
        x: node.position.x,
        y: node.position.y
      }));
    
    console.log('Фильтрованные позиции регионов:', positions);
    console.log('Текущее состояние:', { isCustomLayout, savedPositionsLength: savedPositions.length });
    
    setCurrentPositions(positions);
    
    // Проверяем, есть ли изменения
    if (isCustomLayout && savedPositions.length > 0) {
      const hasChanges = positions.some(currentPos => {
        const savedPos = savedPositions.find(pos => pos.id === currentPos.id);
        return !savedPos || savedPos.x !== currentPos.x || savedPos.y !== currentPos.y;
      });
      console.log('Проверка изменений:', hasChanges);
      setHasUnsavedChanges(hasChanges);
    } else if (positions.length > 0) {
      // Если это первое изменение, считаем что есть несохранённые изменения
      console.log('Первое изменение, устанавливаем hasUnsavedChanges = true');
      setHasUnsavedChanges(true);
    }
    
    console.log('Текущие позиции обновлены:', positions);
  }, [isCustomLayout, savedPositions]);

  // Сохраняем текущие позиции узлов
  const saveCurrentPositions = useCallback((nodes: GraphNode[]) => {
    console.log('saveCurrentPositions вызван с', nodes.length, 'узлами');
    console.log('Узлы:', nodes);
    
    const positions = nodes
      .filter(node => !(node as any).parentId) // Только регионы верхнего уровня
      .map(node => ({
        id: node.id,
        x: node.position.x,
        y: node.position.y
      }));
    
    console.log('Фильтрованные позиции регионов:', positions);
    console.log('Текущее состояние:', { isCustomLayout, savedPositionsLength: savedPositions.length });
    
    setSavedPositions(positions);
    setCurrentPositions(positions);
    setIsCustomLayout(true);
    setHasUnsavedChanges(false);
    
    const jsonData = JSON.stringify(positions);
    localStorage.setItem(STORAGE_KEY, jsonData);
    
    console.log('Позиции сохранены в localStorage:', positions);
    console.log('localStorage теперь содержит:', localStorage.getItem(STORAGE_KEY));
  }, []);

  // Сбрасываем к стандартной расстановке
  const resetToDefaultLayout = useCallback(() => {
    setSavedPositions([]);
    setCurrentPositions([]);
    setIsCustomLayout(false);
    setHasUnsavedChanges(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Проверяем, есть ли сохранённая расстановка
  const hasCustomLayout = useCallback(() => {
    return savedPositions.length > 0 && isCustomLayout;
  }, [savedPositions, isCustomLayout]);

  return {
    getLayoutedNodes,
    saveCurrentPositions,
    resetToDefaultLayout,
    updateCurrentPositions,
    hasCustomLayout,
    isCustomLayout,
    hasUnsavedChanges
  };
}; 