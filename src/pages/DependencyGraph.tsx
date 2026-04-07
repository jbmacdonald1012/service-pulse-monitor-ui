import { useEffect, useRef, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, MarkerType } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ServiceNode from '../components/ServiceNode';
import type { ServiceNodeData } from '../components/ServiceNode';
import { NODE_WIDTH, NODE_HEIGHT } from '../components/ServiceNode';
import { fetchAllServicesWithHealth, fetchDependencyGraph } from '../api/monitorApi';
import type {
  DependencyDiscoveredEvent,
  ServiceSummary,
  StatusChangedEvent,
  DependencyEdge,
} from '../types';

// nodeTypes must be at module scope — defining inside the component causes
// React Flow to re-register on every render, breaking drag behavior.
const nodeTypes = { serviceNode: ServiceNode };

// Re-exported from ServiceNode so dagre and the rendered node use the same dimensions

interface DependencyGraphProps {
  statusEvents: StatusChangedEvent[];
  dependencyEvents: DependencyDiscoveredEvent[];
}

function detectCycle(services: ServiceSummary[], deps: DependencyEdge[]): boolean {
  const adj = new Map<number, number[]>();
  for (const svc of services) adj.set(svc.serviceId, []);
  for (const dep of deps) adj.get(dep.sourceId)?.push(dep.targetId);

  const visited = new Set<number>();
  const inStack = new Set<number>();

  function dfs(nodeId: number): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const n of adj.get(nodeId) ?? []) {
      if (!visited.has(n) && dfs(n)) return true;
      if (inStack.has(n)) return true;
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const svc of services) {
    if (!visited.has(svc.serviceId) && dfs(svc.serviceId)) return true;
  }
  return false;
}

/**
 * Computes node positions using dagre's hierarchical layout algorithm.
 * Callers are placed above their dependencies (top-to-bottom rank direction).
 */
function computeLayout(
  services: ServiceSummary[],
  deps: DependencyEdge[],
): Map<number, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const svc of services) {
    g.setNode(String(svc.serviceId), { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const dep of deps) {
    g.setEdge(String(dep.sourceId), String(dep.targetId));
  }

  dagre.layout(g);

  const positions = new Map<number, { x: number; y: number }>();
  for (const svc of services) {
    const node = g.node(String(svc.serviceId));
    // dagre gives center coordinates; React Flow needs top-left corner
    positions.set(svc.serviceId, {
      x: node.x - NODE_WIDTH / 2,
      y: node.y - NODE_HEIGHT / 2,
    });
  }
  return positions;
}

export default function DependencyGraph({ statusEvents, dependencyEvents }: DependencyGraphProps) {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [depEdges, setDepEdges] = useState<DependencyEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCycle, setHasCycle] = useState(false);
  const lastProcessedRef = useRef(0);

  const syncGraph = () =>
    Promise.all([fetchAllServicesWithHealth(), fetchDependencyGraph()])
      .then(([svcs, deps]) => {
        setServices(svcs);
        // Merge fetched edges with any edges SignalR discovered before the
        // fetch completed. Using a functional update avoids stale closure issues.
        setDepEdges((prev) => {
          const fetchedKeys = new Set(deps.map((d) => `${d.sourceId}-${d.targetId}`));
          const signalrOnly = prev.filter((e) => !fetchedKeys.has(`${e.sourceId}-${e.targetId}`));
          return [...deps, ...signalrOnly];
        });
        setHasCycle(detectCycle(svcs, deps));
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load dependency graph',
        ),
      );

  useEffect(() => {
    void syncGraph().finally(() => setLoading(false));

    // Re-sync every 30 s as a backstop in case a SignalR event is missed.
    const id = setInterval(() => void syncGraph(), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge newly discovered dependency edges without a full re-fetch
  const lastDepRef = useRef(0);
  useEffect(() => {
    const newEvents = dependencyEvents.slice(lastDepRef.current);
    if (newEvents.length === 0) return;
    lastDepRef.current = dependencyEvents.length;

    const existing = new Set(depEdges.map((e) => `${e.sourceId}-${e.targetId}`));
    const toAdd = newEvents
      .filter((ev) => !existing.has(`${ev.sourceId}-${ev.targetId}`))
      .map((ev) => ({
        sourceId: ev.sourceId,
        sourceName: ev.sourceName,
        targetId: ev.targetId,
        targetName: ev.targetName,
        discoveredAt: ev.discoveredAt,
      }));

    if (toAdd.length === 0) return;

    const nextEdges = [...depEdges, ...toAdd];
    setDepEdges(nextEdges);
    setHasCycle((prev) => prev || detectCycle(services, nextEdges));
  }, [dependencyEvents, depEdges, services]);

  // Merge SignalR status updates — same processed-index ref pattern as Dashboard
  useEffect(() => {
    const newEvents = statusEvents.slice(lastProcessedRef.current);
    if (newEvents.length === 0) return;
    lastProcessedRef.current = statusEvents.length;

    setServices((prev) => {
      const map = new Map(prev.map((s) => [s.serviceId, s]));
      for (const ev of newEvents) {
        const existing = map.get(ev.serviceId);
        if (existing) {
          map.set(ev.serviceId, {
            ...existing,
            currentStatus: ev.status,
            lastCheckAt: ev.timestamp,
            averageResponseTimeMs:
              ev.responseTimeMs ?? existing.averageResponseTimeMs,
          });
        }
      }
      return Array.from(map.values());
    });
  }, [statusEvents]);

  const nodes = useMemo<Node<ServiceNodeData>[]>(() => {
    const positions = computeLayout(services, depEdges);
    return services.map((svc) => {
      const pos = positions.get(svc.serviceId) ?? { x: 0, y: 0 };
      return {
        id: String(svc.serviceId),
        type: 'serviceNode' as const,
        position: pos,
        data: { label: svc.serviceName, status: svc.currentStatus },
      };
    });
  }, [services, depEdges]);

  const flowEdges = useMemo<Edge[]>(
    () =>
      depEdges.map((dep) => ({
        id: `${dep.sourceId}-${dep.targetId}`,
        source: String(dep.sourceId),
        target: String(dep.targetId),
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
      })),
    [depEdges],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Dependency Graph
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {hasCycle && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Circular dependency detected in the service graph.
        </Alert>
      )}

      <Box
        sx={{
          height: 'calc(100vh - 200px)',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>
    </Box>
  );
}
