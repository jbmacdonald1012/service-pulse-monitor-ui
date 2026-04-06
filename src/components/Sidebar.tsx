import type { ReactElement } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import HubRounded from '@mui/icons-material/HubRounded';
import Badge from '@mui/material/Badge';
import WifiRounded from '@mui/icons-material/WifiRounded';
import WifiOffRounded from '@mui/icons-material/WifiOffRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import type { ConnectionState } from '../hooks/useSignalR';

interface SidebarProps {
  connectionState: ConnectionState;
  unresolvedAlertCount: number;
}

interface NavItem {
  label: string;
  to: string;
  icon: ReactElement;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <GridViewRounded fontSize="small" />, exact: true },
  { label: 'Alerts', to: '/alerts', icon: <NotificationsRounded fontSize="small" /> },
  { label: 'Dependencies', to: '/dependencies', icon: <HubRounded fontSize="small" /> },
];

const connectionMeta: Record<ConnectionState, { icon: ReactElement; color: string; label: string }> = {
  connected:    { icon: <WifiRounded sx={{ fontSize: 14 }} />,    color: '#22c55e', label: 'Live' },
  connecting:   { icon: <SyncRounded sx={{ fontSize: 14 }} />,    color: '#f59e0b', label: 'Connecting…' },
  disconnected: { icon: <WifiOffRounded sx={{ fontSize: 14 }} />, color: '#ef4444', label: 'Offline' },
  error:        { icon: <WifiOffRounded sx={{ fontSize: 14 }} />, color: '#ef4444', label: 'Error' },
};

export default function Sidebar({ connectionState, unresolvedAlertCount }: SidebarProps) {
  const location = useLocation();
  const conn = connectionMeta[connectionState];

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HubRounded sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              sx={{
                color: '#f1f5f9',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '-0.2px',
                lineHeight: 1.2,
              }}
            >
              ServicePulse
            </Typography>
            <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em' }}>
              MONITOR
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 1.5 }} />

      {/* Nav items */}
      <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.to}
                sx={{
                  borderRadius: 2,
                  py: 0.85,
                  color: isActive ? '#a5b4fc' : '#64748b',
                  bgcolor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#a5b4fc' : '#94a3b8',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                  {item.to === '/alerts' ? (
                    <Badge badgeContent={unresolvedAlertCount} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: '#6366f1',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Connection status */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 1.5 }} />
      <Box sx={{ px: 3, py: 2 }}>
        <Tooltip title="SignalR connection status" placement="right">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: conn.color }}>
            {conn.icon}
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'inherit' }}>
              {conn.label}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
