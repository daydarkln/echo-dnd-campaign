import { GraphNode } from '../types';

export interface SavedLayout {
  version: string;
  timestamp: number;
  positions: Array<{
    id: string;
    x: number;
    y: number;
  }>;
  metadata?: {
    description?: string;
    author?: string;
    campaign?: string;
  };
}

const CURRENT_VERSION = '1.0.0';

export const exportLayout = (nodes: GraphNode[], metadata?: SavedLayout['metadata']): string => {
  const positions = nodes
    .filter(node => !(node as any).parentId) // Только регионы верхнего уровня
    .map(node => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y
    }));

  const layout: SavedLayout = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    positions,
    metadata: metadata || {}
  };

  return JSON.stringify(layout, null, 2);
};

export const importLayout = (jsonString: string): SavedLayout | null => {
  try {
    const layout = JSON.parse(jsonString) as SavedLayout;
    
    // Проверяем версию
    if (layout.version !== CURRENT_VERSION) {
      console.warn(`Версия файла (${layout.version}) отличается от текущей (${CURRENT_VERSION})`);
    }
    
    // Проверяем структуру
    if (!layout.positions || !Array.isArray(layout.positions)) {
      throw new Error('Неверная структура файла: отсутствуют позиции');
    }
    
    // Проверяем каждую позицию
    for (const pos of layout.positions) {
      if (!pos.id || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        throw new Error('Неверная структура позиции в файле');
      }
    }
    
    return layout;
  } catch (error) {
    console.error('Ошибка при импорте расстановки:', error);
    return null;
  }
};

export const applyImportedLayout = (nodes: GraphNode[], layout: SavedLayout): GraphNode[] => {
  return nodes.map(node => {
    if ((node as any).parentId) {
      return node; // Пропускаем дочерние узлы
    }
    
    const importedPos = layout.positions.find(pos => pos.id === node.id);
    if (importedPos) {
      return {
        ...node,
        position: { x: importedPos.x, y: importedPos.y }
      };
    }
    
    return node;
  });
};

export const downloadLayoutFile = (layout: SavedLayout, filename?: string): void => {
  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `region-layout-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 