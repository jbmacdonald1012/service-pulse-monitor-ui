import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import StatusBadge from './StatusBadge';
import type { ServiceSummary } from '../types';

interface ServiceCardProps {
  service: ServiceSummary;
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'No checks yet';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mr: 1,
              flex: 1,
            }}
          >
            {service.serviceName}
          </Typography>
          <StatusBadge status={service.currentStatus} />
        </Box>

        {service.baseUrl && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 0.5,
            }}
          >
            {service.baseUrl}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {service.uptimePercentage.toFixed(1)}% uptime
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {service.averageResponseTimeMs !== null
            ? `${Math.round(service.averageResponseTimeMs)} ms avg`
            : 'No response data'}
        </Typography>

        <Typography variant="caption" color="text.disabled">
          Last check: {formatRelativeTime(service.lastCheckAt)}
        </Typography>
      </CardContent>
    </Card>
  );
}
