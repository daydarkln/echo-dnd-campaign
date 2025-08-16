import { PointsData, PathsData, GraphNode, GraphEdge, PointOfInterest, Area } from '../types';

// Функция для создания позиций в группированной структуре
const generateGroupedPosition = (
  regionIndex: number, 
  locationIndex: number, 
  locationsInRegion: number
): { x: number; y: number } => {
  // Размещаем регионы в сетке 2x2
  const regionCols = 2;
  const regionRow = Math.floor(regionIndex / regionCols);
  const regionCol = regionIndex % regionCols;
  
  // Базовая позиция региона
  const regionBaseX = regionCol * 800 + 100;
  const regionBaseY = regionRow * 600 + 100;
  
  // Размещаем локации внутри региона в кольце или сетке
  const locationsPerRow = Math.min(4, Math.ceil(Math.sqrt(locationsInRegion)));
  const locationRow = Math.floor(locationIndex / locationsPerRow);
  const locationCol = locationIndex % locationsPerRow;
  
  return {
    x: regionBaseX + locationCol * 180 + 50,
    y: regionBaseY + locationRow * 150 + 80,
  };
};

// Функция для создания простой сетки координат
const generateGridPosition = (index: number, itemsPerRow: number = 4): { x: number; y: number } => {
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;
  return {
    x: col * 300 + 100,
    y: row * 200 + 100,
  };
};

// Новая функция для создания узлов регионов в mind map стиле
export const parseAreasToRegionNodes = (pointsData: PointsData): GraphNode[] => {
  return pointsData.areas.map((area, index) => {
    const position = generateGridPosition(index, 3); // 3 региона в ряду
    
    return {
      id: `region-${index}`,
      type: 'regionNode',
      data: {
        label: area.area,
        area: area.area,
        locationCount: area.pointsOfInterest.length,
        locations: area.pointsOfInterest,
      },
      position: {
        x: position.x,
        y: position.y,
      },
    };
  });
};

// Функция для создания узлов локаций в регионе
export const parseLocationsInArea = (area: Area): GraphNode[] => {
  return area.pointsOfInterest.map((poi, index) => {
    const position = generateGridPosition(index, 4); // 4 локации в ряду
    
    return {
      id: poi.id,
      type: 'locationNode',
      data: {
        label: poi.name,
        location: poi,
        area: area.area,
      },
      position,
    };
  });
};

// Функция для создания subflows структуры с parent-child отношениями
export const parseToSubflows = (pointsData: PointsData, pathsData: PathsData): { nodes: GraphNode[], edges: GraphEdge[] } => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Определяем цветовую палитру для регионов
  const regionColors = [
    'rgba(255, 105, 135, 1)', // Розовый
    'rgba(50, 205, 50, 1)',   // Зелёный
    'rgba(30, 144, 255, 1)',  // Синий
    'rgba(255, 140, 0, 1)',   // Оранжевый
    'rgba(186, 85, 211, 1)',  // Фиолетовый
    'rgba(255, 215, 0, 1)',   // Жёлтый
    'rgba(135, 206, 235, 1)', // Небесно-голубой (для Мертвых хребтов)
    'rgba(255, 165, 0, 1)',   // Тёплый оранжевый (для Южных равнин)
  ];

  // Создаём родительские узлы-регионы
  pointsData.areas.forEach((area, regionIndex) => {
    const color = regionColors[regionIndex % regionColors.length];

    // Раскладка детей внутри региона (свободнее)
    const total = area.pointsOfInterest.length;
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(total))));
    const rows = Math.max(1, Math.ceil(total / cols));

    // Геометрия узлов и отступов (под размеры LocationNode ~200px шириной)
    const paddingX = 32;
    const paddingY = 48; // дополнительное место под шапку
    const stepX = 260;   // расстояние между карточками по X
    const stepY = 170;   // расстояние между карточками по Y
    const nodeWidth = 220;  // ориентировочная ширина карточки LocationNode
    const nodeHeight = 110; // ориентировочная высота карточки

    const regionWidth = paddingX * 2 + nodeWidth + (cols - 1) * stepX;
    const regionHeight = paddingY * 2 + nodeHeight + (rows - 1) * stepY;

    // Раскладываем регионы с увеличенными интервалами
    const regionsPerRow = 2;
    const regionRow = Math.floor(regionIndex / regionsPerRow);
    const regionCol = regionIndex % regionsPerRow;
    const regionGapX = 120;
    const regionGapY = 120;
    const baseX = 100 + regionCol * (regionWidth + regionGapX);
    const baseY = 100 + regionRow * (regionHeight + regionGapY);

    // Родительский узел-регион с динамическими размерами
    nodes.push({
      id: `region-${regionIndex}`,
      type: 'group',
      data: {
        label: area.area,
        area: area.area,
        locationCount: total,
        color: color,
      },
      position: {
        x: baseX,
        y: baseY,
      },
      style: {
        width: regionWidth,
        height: regionHeight,
      },
    } as GraphNode);

    // Дочерние узлы-локации
    area.pointsOfInterest.forEach((poi, locationIndex) => {
      const c = locationIndex % cols;
      const r = Math.floor(locationIndex / cols);

      nodes.push({
        id: poi.id,
        type: 'locationNode',
        data: {
          label: poi.name,
          location: poi,
          area: area.area,
        },
        position: {
          x: paddingX + c * stepX,
          y: paddingY + r * stepY,
        },
        parentId: `region-${regionIndex}`,
        extent: 'parent',
      } as GraphNode);
    });
  });

  // Создаём рёбра между локациями с улучшенной логикой
  const connectionMap = new Map<string, number>();
  const edgeOffsets = new Map<string, number>();
  
  pathsData.routes.forEach((route) => {
    const connectionKey = `${route.from}-${route.to}`;
    const reverseKey = `${route.to}-${route.from}`;
    
    const currentCount = (connectionMap.get(connectionKey) || 0) + (connectionMap.get(reverseKey) || 0);
    connectionMap.set(connectionKey, currentCount + 1);
    edgeOffsets.set(connectionKey, currentCount);
  });

  pathsData.routes.forEach((route, index) => {
    const connectionKey = `${route.from}-${route.to}`;
    const offset = edgeOffsets.get(connectionKey) || 0;
    const totalConnections = connectionMap.get(connectionKey) || 1;
    
    let edgeType = 'bezier';
    let style: any = {};
    let pathOptions: any = {};
    
    const curvature = 0.15 + (offset * 0.25);
    pathOptions = {
      curvature: offset % 2 === 0 ? curvature : -curvature,
    };

    const edge: GraphEdge = {
      id: `edge-${index}`,
      source: route.from,
      target: route.to,
      type: edgeType,
      data: {
        route,
        pathType: route.pathType,
      },
      label: route.travelTime,
      className: `edge-${route.pathType}`,
    };
    
    if (Object.keys(style).length > 0) edge.style = style;
    if (Object.keys(pathOptions).length > 0) edge.pathOptions = pathOptions;
    
    edge.labelStyle = {
      fontSize: '11px',
      fontWeight: 500,
      fill: route.pathType === 'main_road' ? '#1890ff' : 
            route.pathType === 'hidden_path' ? '#fa8c16' : 
            route.pathType === 'obstructed_road' ? '#f5222d' : '#666',
    };
    
    edges.push(edge);
  });

  return { nodes, edges };
};

// Новая функция для создания группированной mind map
export const parseToGroupedMindMap = (pointsData: PointsData, pathsData: PathsData): { nodes: GraphNode[], edges: GraphEdge[] } => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Создаём узлы локаций, группированные по регионам
  pointsData.areas.forEach((area, regionIndex) => {
    area.pointsOfInterest.forEach((poi, locationIndex) => {
      const position = generateGroupedPosition(regionIndex, locationIndex, area.pointsOfInterest.length);
      
      nodes.push({
        id: poi.id,
        type: 'locationNode',
        data: {
          label: poi.name,
          location: poi,
          area: area.area,
        },
        position,
      });
    });
  });

  // Создаём карту связей для определения множественных соединений
  const connectionMap = new Map<string, number>();
  const edgeOffsets = new Map<string, number>();
  
  pathsData.routes.forEach((route) => {
    const connectionKey = `${route.from}-${route.to}`;
    const reverseKey = `${route.to}-${route.from}`;
    
    // Считаем количество связей между одними и теми же узлами
    const currentCount = (connectionMap.get(connectionKey) || 0) + (connectionMap.get(reverseKey) || 0);
    connectionMap.set(connectionKey, currentCount + 1);
    edgeOffsets.set(connectionKey, currentCount);
  });

  // Создаём рёбра между локациями с улучшенной логикой
  pathsData.routes.forEach((route, index) => {
    const connectionKey = `${route.from}-${route.to}`;
    const offset = edgeOffsets.get(connectionKey) || 0;
    const totalConnections = connectionMap.get(connectionKey) || 1;
    
    // Определяем тип рёбра и стиль в зависимости от количества соединений
    let edgeType = 'smoothstep';
    let style: any = {};
    let pathOptions: any = {};
    
    if (totalConnections > 1) {
      // Для множественных соединений используем разные кривизны
      const curvature = 0.2 + (offset * 0.3);
      edgeType = 'bezier';
      pathOptions = {
        curvature: offset % 2 === 0 ? curvature : -curvature,
      };
      
      // Разные стили для разных типов путей
      style = {
        strokeDasharray: route.pathType === 'hidden_path' ? '5,5' : 
                        route.pathType === 'obstructed_road' ? '10,5' : 'none',
        strokeWidth: route.pathType === 'main_road' ? 3 : 2,
      };
    } else {
      // Для одиночных соединений используем стандартную логику
      style = {
        strokeDasharray: route.pathType === 'hidden_path' ? '5,5' : 
                        route.pathType === 'obstructed_road' ? '10,5' : 'none',
        strokeWidth: route.pathType === 'main_road' ? 3 : 2,
      };
    }

    const edge: GraphEdge = {
      id: `edge-${index}`,
      source: route.from,
      target: route.to,
      type: edgeType,
      data: {
        route,
        pathType: route.pathType,
      },
      label: route.travelTime,
      className: `edge-${route.pathType}`,
    };
    
    // Добавляем дополнительные свойства
    if (Object.keys(style).length > 0) edge.style = style;
    if (Object.keys(pathOptions).length > 0) edge.pathOptions = pathOptions;
    
    edge.labelStyle = {
      fontSize: '11px',
      fontWeight: 500,
      fill: route.pathType === 'main_road' ? '#1890ff' : 
            route.pathType === 'hidden_path' ? '#fa8c16' : 
            route.pathType === 'obstructed_road' ? '#f5222d' : '#666',
    };
    
    edges.push(edge);
  });

  return { nodes, edges };
};

export const parsePointsToNodes = (pointsData: PointsData): GraphNode[] => {
  const nodes: GraphNode[] = [];
  let nodeIndex = 0;

  pointsData.areas.forEach((area) => {
    area.pointsOfInterest.forEach((poi) => {
      const position = generateGridPosition(nodeIndex);
      
      nodes.push({
        id: poi.id,
        type: 'locationNode',
        data: {
          label: poi.name,
          location: poi,
          area: area.area,
        },
        position,
      });
      
      nodeIndex++;
    });
  });

  return nodes;
};

export const parseRoutesToEdges = (pathsData: PathsData): GraphEdge[] => {
  return pathsData.routes.map((route, index) => ({
    id: `edge-${index}`,
    source: route.from,
    target: route.to,
    type: 'smoothstep',
    data: {
      route,
      pathType: route.pathType,
    },
    label: route.travelTime,
  }));
};

export const getAllLocations = (pointsData: PointsData): Record<string, PointOfInterest> => {
  const locations: Record<string, PointOfInterest> = {};
  
  pointsData.areas.forEach((area) => {
    area.pointsOfInterest.forEach((poi) => {
      locations[poi.id] = poi;
    });
  });

  return locations;
};

export const getLocationById = (pointsData: PointsData, id: string): PointOfInterest | undefined => {
  for (const area of pointsData.areas) {
    const poi = area.pointsOfInterest.find(p => p.id === id);
    if (poi) return poi;
  }
  return undefined;
};

export const getAreaByLocationId = (pointsData: PointsData, locationId: string): string | undefined => {
  for (const area of pointsData.areas) {
    if (area.pointsOfInterest.some(p => p.id === locationId)) {
      return area.area;
    }
  }
  return undefined;
};