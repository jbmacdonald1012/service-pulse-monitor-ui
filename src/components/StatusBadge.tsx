import Chip from '@mui/material/Chip';
import type { ServiceStatus } from '../types';

interface StatusBadgeProps {
  status: ServiceStatus;
}

const colorMap: Record<
  ServiceStatus,
  'success' | 'warning' | 'error' | 'default'
> = {
  Healthy: 'success',
  Degraded: 'warning',
  Unhealthy: 'error',
  Unknown: 'default',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <Chip label={status} color={colorMap[status]} size="small" />;
}
