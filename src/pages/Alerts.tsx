import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import type { AlertEvent } from '../types';

interface AlertsProps {
  alertEvents: AlertEvent[];
}

export default function Alerts({ alertEvents }: AlertsProps) {
  const reversed = [...alertEvents].reverse();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Alerts
      </Typography>

      {reversed.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          No alerts received this session. Alerts will appear here in real-time
          as they are generated.
        </Typography>
      ) : (
        <List disablePadding>
          {reversed.map((alert, i) => (
            <Box key={`${alert.serviceId}-${alert.triggeredAt}-${i}`}>
              <ListItem alignItems="flex-start" disableGutters>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Chip label={alert.alertType} size="small" />
                      <Typography variant="subtitle2">
                        {alert.serviceName}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                      >
                        {alert.message}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.disabled"
                      >
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {i < reversed.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
