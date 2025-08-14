import dagre from 'dagre';
import { GraphNode, GraphEdge } from '../types';

type Direction = 'TB' | 'BT' | 'LR' | 'RL';

export interface DagreLayoutOptions {
  direction?: Direction;
  nodeWidth?: number;
  nodeHeight?: number;
  ranksep?: number;
  nodesep?: number;
  marginx?: number;
  marginy?: number;
}

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 110;

export const applyDagreLayout = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: DagreLayoutOptions = {}
): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: options.direction ?? 'LR',
    ranksep: options.ranksep ?? 120,
    nodesep: options.nodesep ?? 80,
    marginx: options.marginx ?? 50,
    marginy: options.marginy ?? 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Учитываем размеры разных типов узлов, если заданы в стилях
  nodes.forEach((n) => {
    const width = (n as any).style?.width ?? options.nodeWidth ?? DEFAULT_NODE_WIDTH;
    const height = (n as any).style?.height ?? options.nodeHeight ?? DEFAULT_NODE_HEIGHT;
    g.setNode(n.id, { width, height });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const laidOutNodes = nodes.map((n) => {
    const nodeWithPos = g.node(n.id);
    if (!nodeWithPos) return n;

    // Если узел является дочерним (имеет parentId), позиция задаётся относительно родителя
    const isChild = (n as any).parentId;
    const baseX = isChild ? ((n as any).position?.x ?? 0) : 0;
    const baseY = isChild ? ((n as any).position?.y ?? 0) : 0;

    return {
      ...n,
      position: {
        x: nodeWithPos.x - (nodeWithPos.width / 2) + baseX,
        y: nodeWithPos.y - (nodeWithPos.height / 2) + baseY,
      },
    } as GraphNode;
  });

  return { nodes: laidOutNodes, edges };
};

// Раскладка только для верхнего уровня (группы-регионы), без перемещения детей
export const applyRegionLevelLayout = (
  nodes: GraphNode[],
  options: DagreLayoutOptions = {}
): GraphNode[] => {
  const topLevel = nodes.filter((n) => !(n as any).parentId);
  const children = nodes.filter((n) => (n as any).parentId);

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: options.direction ?? 'LR',
    ranksep: options.ranksep ?? 160,
    nodesep: options.nodesep ?? 120,
    marginx: options.marginx ?? 80,
    marginy: options.marginy ?? 80,
  });
  g.setDefaultEdgeLabel(() => ({}));

  topLevel.forEach((n) => {
    const width = (n as any).style?.width ?? 360;
    const height = (n as any).style?.height ?? 260;
    g.setNode(n.id, { width, height });
  });

  // Мягко соединяем регионы искусственными рёбрами, чтобы Dagre выстроил их сеткой слева-направо
  for (let i = 0; i < topLevel.length - 1; i++) {
    g.setEdge(topLevel[i].id, topLevel[i + 1].id);
  }

  dagre.layout(g);

  const laidOutTop = topLevel.map((n) => {
    const p = g.node(n.id);
    if (!p) return n;
    return {
      ...n,
      position: {
        x: p.x - p.width / 2,
        y: p.y - p.height / 2,
      },
    } as GraphNode;
  });

  return [...laidOutTop, ...children];
};

export interface CircularLayoutOptions {
  radius?: number;
  centerX?: number;
  centerY?: number;
  startAngleRad?: number; // в радианах
  clockwise?: boolean;
  spacingFactor?: number; // множитель дистанции между регионами (>= 0.55 по умолчанию)
}

// Круговая раскладка только для верхнего уровня (группы-регионы)
export const applyCircularRegionLayout = (
  nodes: GraphNode[],
  options: CircularLayoutOptions = {}
): GraphNode[] => {
  const topLevel = nodes.filter((n) => !(n as any).parentId);
  const children = nodes.filter((n) => (n as any).parentId);

  const n = topLevel.length || 1;
  const start = options.startAngleRad ?? -Math.PI / 2; // старт сверху
  const clockwise = options.clockwise ?? true;
  const spacingFactor = options.spacingFactor ?? 0.85;

  // Оцениваем средний размер узла, чтобы подобрать радиус
  const widths = topLevel.map((n) => ((n as any).style?.width ?? 360) as number);
  const heights = topLevel.map((n) => ((n as any).style?.height ?? 260) as number);
  const avgW = widths.reduce((a, b) => a + b, 0) / widths.length || 360;
  const avgH = heights.reduce((a, b) => a + b, 0) / heights.length || 260;

  // Базовый радиус: чем больше регионов, тем больше окружность
  const autoRadius = Math.max(800, Math.ceil(n * Math.max(avgW, avgH) * spacingFactor));
  const radius = options.radius ?? autoRadius;

  // Центр круга: достаточно большой холст; fitView сам подстроит
  const centerX = options.centerX ?? 800;
  const centerY = options.centerY ?? 700;

  const placedTop = topLevel.map((node, i) => {
    const angle = start + (2 * Math.PI * (clockwise ? i : -i)) / n;
    const w = ((node as any).style?.width ?? 360) as number;
    const h = ((node as any).style?.height ?? 260) as number;
    const x = centerX + radius * Math.cos(angle) - w / 2;
    const y = centerY + radius * Math.sin(angle) - h / 2;
    return {
      ...node,
      position: { x, y },
    } as GraphNode;
  });

  return [...placedTop, ...children];
};

// Круговая раскладка для локаций внутри региона
export const applyCircularLocationLayout = (
  locations: any[],
  options: CircularLayoutOptions = {}
): { x: number; y: number }[] => {
  const n = locations.length || 1;
  const start = options.startAngleRad ?? -Math.PI / 2; // старт сверху
  const clockwise = options.clockwise ?? true;
  const spacingFactor = options.spacingFactor ?? 1.0;

  // Оцениваем средний размер узла локации (учитываем реальные размеры)
  const avgNodeSize = 280; // увеличенный размер для лучшего разделения

  // Базовый радиус: чем больше локаций, тем больше окружность
  // Добавляем дополнительное пространство для предотвращения наложений
  const autoRadius = Math.max(400, Math.ceil(n * avgNodeSize * spacingFactor * 0.8));
  const radius = options.radius ?? autoRadius;

  // Центр круга
  const centerX = options.centerX ?? 900;
  const centerY = options.centerY ?? 700;

  return locations.map((_, i) => {
    const angle = start + (2 * Math.PI * (clockwise ? i : -i)) / n;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  });
};

