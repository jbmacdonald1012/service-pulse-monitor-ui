import { useEffect, useRef, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ServiceNode from '../components/ServiceNode';
import type { ServiceNodeData, ServiceNodeType } from '../components/ServiceNode';
import { fetchAllServicesWithHealth, fetchDependencyGraph } from '../api/monitorApi';
import type {
  ServiceSummary,
  StatusChangedEvent,
  DependencyEdge,
} from '../types';

// nodeTypes must be at module scope — defining inside the component causes
// React Flow to re-register on every render, breaking drag behavior.
const nodeTypes = { serviceNode: ServiceNode };

interface DependencyGraphProps {
  statusEvents: StatusChangedEvent[];
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

export default function DependencyGraph({ statusEvents }: DependencyGraphProps) {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [depEdges, setDepEdges] = useState<DependencyEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCycle, setHasCycle] = useState(false);
  const lastProcessedRef = useRef(0);

  useEffect(() => {
    void Promise.all([fetchAllServicesWithHealth(), fetchDependencyGraph()])
      .then(([svcs, deps]) => {
        setServices(svcs);
        setDepEdges(deps);
        setHasCycle(detectCycle(svcs, deps));
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load dependency graph',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

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

  const nodes = useMemo<Node<ServiceNodeData>[]>(
    () =>
      services.map((svc, i) => ({
        id: String(svc.serviceId),
        type: 'serviceNode' as const,
        position: { x: (i % 3) * 240, y: Math.floor(i / 3) * 160 },
        data: { label: svc.serviceName, status: svc.currentStatus },
      })),
    [services],
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      depEdges.map((dep) => ({
        id: `${dep.sourceId}-${dep.targetId}`,
        source: String(dep.sourceId),
        target: String(dep.targetId),
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

      <Box sx={{ height: 'calc(100vh - 200px)', border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <ReactFlow
          nodes={nodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>
    </Box>
  );
}
