import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { ServiceStatus, ServiceSummary } from '../types';

interface ServiceCardProps {
  service: ServiceSummary;
}

const statusAccent: Record<ServiceStatus, string> = {
  Healthy:   '#22c55e',
  Degraded:  '#f59e0b',
  Unhealthy: '#ef4444',
  Unknown:   '#94a3b8',
};

const statusPillBg: Record<ServiceStatus, string> = {
  Healthy:   '#f0fdf4',
  Degraded:  '#fffbeb',
  Unhealthy: '#fff1f2',
  Unknown:   '#f8fafc',
};

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
  const accent = statusAccent[service.currentStatus];

  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 2,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px rgba(15,23,42,0.10)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Name + status pill */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: accent,
              flexShrink: 0,
              mt: 0.7,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              fontSize: '0.88rem',
              lineHeight: 1.4,
            }}
          >
            {service.serviceName}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: 10,
              bgcolor: statusPillBg[service.currentStatus],
              border: `1px solid ${accent}40`,
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: accent, fontWeight: 700, fontSize: '0.68rem' }}>
              {service.currentStatus}
            </Typography>
          </Box>
        </Box>

        {/* URL */}
        {service.baseUrl && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 2,
              pl: 2.25,
            }}
          >
            {service.baseUrl}
          </Typography>
        )}

        {/* Metrics */}
        <Box
          sx={{
            display: 'flex',
            gap: 0,
            bgcolor: '#f8fafc',
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ flex: 1, p: 1.2, borderRight: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Uptime
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
              {service.uptimePercentage.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.2, borderRight: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Avg
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
              {service.averageResponseTimeMs !== null
                ? `${Math.round(service.averageResponseTimeMs)}ms`
                : '—'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Checked
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
              {formatRelativeTime(service.lastCheckAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
