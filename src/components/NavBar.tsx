import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';
import type { ConnectionState } from '../hooks/useSignalR';

interface NavBarProps {
  connectionState: ConnectionState;
}

const connectionColors: Record<ConnectionState, string> = {
  connected: 'success.main',
  connecting: 'warning.main',
  disconnected: 'error.main',
  error: 'error.main',
};

const connectionLabels: Record<ConnectionState, string> = {
  connected: 'Live updates active',
  connecting: 'Connecting to live updates…',
  disconnected: 'Live updates disconnected',
  error: 'Live updates unavailable',
};

export default function NavBar({ connectionState }: NavBarProps) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 3 }}>
          ServicePulse Monitor
        </Typography>

        <Button color="inherit" component={Link} to="/">
          Dashboard
        </Button>
        <Button color="inherit" component={Link} to="/alerts">
          Alerts
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={connectionLabels[connectionState]}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: connectionColors[connectionState],
              cursor: 'default',
            }}
          />
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
