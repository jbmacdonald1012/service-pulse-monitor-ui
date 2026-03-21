import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import type { AlertEvent } from '../types';

interface AlertsProps {
  alertEvents: AlertEvent[];
}

export default function Alerts({ alertEvents }: AlertsProps) {
  const reversed = [...alertEvents].reverse();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Alerts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time alerts from the current session
        </Typography>
      </Box>

      {reversed.length === 0 ? (
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: 'text.disabled',
          }}
        >
          <NotificationsNoneRounded sx={{ fontSize: 48 }} />
          <Typography variant="body2" textAlign="center">
            No alerts received this session.
            <br />
            Alerts will appear here in real-time as they are generated.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {reversed.map((alert, i) => (
            <Paper
              key={`${alert.serviceId}-${alert.triggeredAt}-${i}`}
              sx={{
                p: 2,
                borderLeft: '4px solid #ef4444',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <WarningAmberRounded sx={{ color: '#ef4444', mt: 0.25, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {alert.serviceName}
                  </Typography>
                  <Chip label={alert.alertType} size="small" color="error" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {alert.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {new Date(alert.triggeredAt).toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
