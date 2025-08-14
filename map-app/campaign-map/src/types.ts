import type { CoordinateExtent } from 'reactflow';

export interface ObstacleDescription {
  id: string;
  name: string;
  description: string;
  category: 'environmental' | 'magical' | 'social' | 'physical' | 'biological' | 'mechanical';
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  effects: string[];
  solutions: string[];
}

export interface PointOfInterest {
  id: string;
  name: string;
  tags: string[];
  amplifiers: Array<{
    effect: string;
    mechanics: string[];
  }>;
  dampeners: Array<{
    effect: string;
    mechanics: string[];
  }>;
  encounters: Array<{
    name: string;
    count: string;
    level: string;
    notes?: string;
  }>;
  loot: string[];
  clues: string[];
}

export interface Area {
  area: string;
  pointsOfInterest: PointOfInterest[];
}

export interface PointsData {
  schemaVersion: number;
  notes: string;
  areas: Area[];
}

export interface Route {
  id: string;
  from: string;
  to: string;
  pathType: string;
  description: string;
  travelTime: string;
  obstacles: string[];
  requirements: string[];
  notes: string;
}

export interface PathsData {
  schemaVersion: number;
  notes: string;
  pathTypes: Record<string, string>;
  routes: Route[];
}

export interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    area: string;
    location?: PointOfInterest;
    locationCount?: number;
    locations?: PointOfInterest[];
    color?: string;
  };
  position: { x: number; y: number };
  parentId?: string;
  extent?: 'parent' | CoordinateExtent;
  style?: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  style?: any;
  pathOptions?: any;
  className?: string;
  data: {
    route: Route;
    pathType: string;
  };
  label?: string;
  labelStyle?: any;
}