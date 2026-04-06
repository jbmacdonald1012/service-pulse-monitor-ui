import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import type { AlertDto } from '../types';

interface AlertsProps {
  alerts: AlertDto[];
  onAcknowledge: (alertId: number) => Promise<void>;
}

export default function Alerts({ alerts, onAcknowledge }: AlertsProps) {
  const [acknowledging, setAcknowledging] = useState<Set<number>>(new Set());

  const handleAcknowledge = async (alertId: number) => {
    setAcknowledging((prev) => new Set(prev).add(alertId));
    try {
      await onAcknowledge(alertId);
    } finally {
      setAcknowledging((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Alerts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Active unresolved alerts — updated in real-time
        </Typography>
      </Box>

      {alerts.length === 0 ? (
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
            No active alerts.
            <br />
            Alerts will appear here in real-time as they are generated.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {alerts.map((alert) => {
            const isTemp = alert.alertId < 0;
            const isBusy = acknowledging.has(alert.alertId);
            return (
              <Paper
                key={alert.alertId}
                sx={{
                  p: 2,
                  borderLeft: `4px solid ${alert.isAcknowledged ? '#94a3b8' : '#ef4444'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  opacity: alert.isAcknowledged ? 0.7 : 1,
                }}
              >
                <WarningAmberRounded
                  sx={{ color: alert.isAcknowledged ? '#94a3b8' : '#ef4444', mt: 0.25, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {alert.serviceName}
                    </Typography>
                    <Chip label={alert.alertType} size="small" color="error" variant="outlined" />
                    {alert.isAcknowledged && (
                      <Chip
                        icon={<CheckCircleOutlineRounded />}
                        label="Acknowledged"
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </Typography>
                </Box>
                {!alert.isAcknowledged && !isTemp && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    disabled={isBusy}
                    onClick={() => void handleAcknowledge(alert.alertId)}
                    sx={{ flexShrink: 0, alignSelf: 'center', whiteSpace: 'nowrap' }}
                  >
                    {isBusy ? <CircularProgress size={14} /> : 'Acknowledge'}
                  </Button>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
