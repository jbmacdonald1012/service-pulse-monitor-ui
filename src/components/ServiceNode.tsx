import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import type { ServiceStatus } from '../types';

export interface ServiceNodeData extends Record<string, unknown> {
  label: string;
  status: ServiceStatus;
}

export type ServiceNodeType = Node<ServiceNodeData, 'serviceNode'>;

// Must match NODE_WIDTH in DependencyGraph.tsx so dagre allocates the right space
export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 64;

const statusBorderColor: Record<ServiceStatus, string> = {
  Healthy: '#4caf50',
  Degraded: '#ff9800',
  Unhealthy: '#f44336',
  Unknown: '#9e9e9e',
};

const statusTextColor: Record<ServiceStatus, string> = {
  Healthy: '#4caf50',
  Degraded: '#ff9800',
  Unhealthy: '#f44336',
  Unknown: '#9e9e9e',
};

function ServiceNode({ data }: NodeProps<ServiceNodeType>) {
  const borderColor = statusBorderColor[data.status];

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Tooltip title={data.label} placement="top">
        <Box
          sx={{
            px: 1.5,
            py: 1,
            border: `2px solid ${borderColor}`,
            borderRadius: 2,
            background: '#fff',
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {data.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: statusTextColor[data.status] }}
          >
            {data.status}
          </Typography>
        </Box>
      </Tooltip>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export default memo(ServiceNode);
