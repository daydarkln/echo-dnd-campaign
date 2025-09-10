import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Typography, Empty, Modal } from 'antd';
import { PointsData, PathsData, GraphNode, GraphEdge, PointOfInterest } from '../types';
import LocationNode from './LocationNode';
import LocationDetail from './LocationDetail';

const { Text } = Typography;

interface CurrentLocationGraphProps {
  pointsData: PointsData;
  pathsData: PathsData;
  currentLocationId: string | null | undefined;
}

const nodeTypes = {
  locationNode: LocationNode,
};

function findPoiById(pointsData: PointsData, id: string): { poi: PointOfInterest; area: string } | null {
  for (const area of pointsData.areas) {
    const poi = area.pointsOfInterest.find((p) => p.id === id);
    if (poi) return { poi, area: area.area };
  }
  return null;
}

export const CurrentLocationGraph: React.FC<CurrentLocationGraphProps> = ({ pointsData, pathsData, currentLocationId }) => {
  const [selected, setSelected] = useState<{ poi: PointOfInterest; area: string } | null>(null);
  const { nodes, edges } = useMemo(() => {
    if (!currentLocationId) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };

    const centerInfo = findPoiById(pointsData, currentLocationId);
    if (!centerInfo) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };

    const centerX = 400;
    const centerY = 170;

    const resultNodes: GraphNode[] = [
      {
        id: centerInfo.poi.id,
        type: 'locationNode',
        data: { label: centerInfo.poi.name, location: centerInfo.poi, area: centerInfo.area },
        position: { x: centerX, y: centerY },
        style: { zIndex: 2 },
      } as GraphNode,
    ];

    const neighborIds = new Set<string>();
    pathsData.routes.forEach((r) => {
      if (r.from === centerInfo.poi.id) neighborIds.add(r.to);
      if (r.to === centerInfo.poi.id) neighborIds.add(r.from);
    });

    const neighbors = Array.from(neighborIds)
      .map((id) => findPoiById(pointsData, id))
      .filter((x): x is { poi: PointOfInterest; area: string } => !!x);

    const radius = 230;
    const angleStep = (2 * Math.PI) / Math.max(1, neighbors.length);

    const resultEdges: GraphEdge[] = [];

    neighbors.forEach((n, idx) => {
      const angle = -Math.PI / 2 + idx * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      resultNodes.push({
        id: n.poi.id,
        type: 'locationNode',
        data: { label: n.poi.name, location: n.poi, area: n.area },
        position: { x, y },
        style: { zIndex: 1 },
      } as GraphNode);

      // Находим маршрут между центром и соседней локацией, чтобы применить стиль как на мировой карте
      const route = pathsData.routes.find(r =>
        (r.from === centerInfo.poi.id && r.to === n.poi.id) ||
        (r.to === centerInfo.poi.id && r.from === n.poi.id)
      );

      resultEdges.push({
        id: `${centerInfo.poi.id}-${n.poi.id}`,
        source: centerInfo.poi.id,
        target: n.poi.id,
        type: 'smoothstep',
        className: route ? `edge-${route.pathType}` : undefined,
        label: route?.travelTime,
        data: route ? { route } : {},
      } as GraphEdge);
    });

    return { nodes: resultNodes, edges: resultEdges };
  }, [pointsData, pathsData, currentLocationId]);

  const [graphNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [graphEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const data: any = node.data;
    if (data?.location && data?.area) {
      // Убираем автоматический переход на локацию - переход должен происходить только при перемещении группы
      // try { window.dispatchEvent(new CustomEvent('gm:locationSelected', { detail: { id: data.location.id, name: data.location.name, area: data.area } })); } catch {}
      setSelected({ poi: data.location as PointOfInterest, area: data.area as string });
    }
  }, []);

  if (!currentLocationId || graphNodes.length === 0) {
    return (
      <Card  style={{ marginBottom: 12 }}>
        <Empty description="Текущая локация не выбрана" />
      </Card>
    );
  }

  return (
    <Card  style={{ marginBottom: 12 }}>
      <div style={{ height: '100vh' }}>
        <ReactFlow
          nodes={graphNodes}
          edges={graphEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.4}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls position="bottom-right" />
        </ReactFlow>
      </div>
      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={960}
        title={selected?.poi.name}
      >
        {selected && (
          <LocationDetail
            location={selected.poi}
            area={selected.area}
            onBack={() => setSelected(null)}
            isModal={true}
          />
        )}
      </Modal>
    </Card>
  );
};

export default CurrentLocationGraph;


