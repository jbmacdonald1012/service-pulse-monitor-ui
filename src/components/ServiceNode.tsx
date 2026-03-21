import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ServiceStatus } from '../types';

export interface ServiceNodeData extends Record<string, unknown> {
  label: string;
  status: ServiceStatus;
}

export type ServiceNodeType = Node<ServiceNodeData, 'serviceNode'>;

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
      <Handle type="target" position={Position.Top} />
      <Box
        sx={{
          px: 2,
          py: 1,
          border: `2px solid ${borderColor}`,
          borderRadius: 2,
          background: '#fff',
          minWidth: 140,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: statusTextColor[data.status] }}
        >
          {data.status}
        </Typography>
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(ServiceNode);
