import { useCallback, useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import DependencyGraph from './pages/DependencyGraph';
import ServiceDetail from './pages/ServiceDetail';
import { useSignalR } from './hooks/useSignalR';
import { acknowledgeAlert, fetchActiveAlerts } from './api/monitorApi';
import type { AlertDto } from './types';

const theme = createTheme({
  palette: {
    primary:    { main: '#6366f1' },
    success:    { main: '#22c55e' },
    warning:    { main: '#f59e0b' },
    error:      { main: '#ef4444' },
    background: { default: '#f1f5f9', paper: '#ffffff' },
    text:       { primary: '#0f172a', secondary: '#64748b' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #e2e8f0' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #e2e8f0' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default function App() {
  const { statusEvents, alertEvents, alertsResolvedEvents, alertAcknowledgedEvents, registrationEvents, dependencyEvents, connectionState } = useSignalR();

  // Single source of truth for unresolved alerts — badge and Alerts page both read from here.
  const [alerts, setAlerts] = useState<AlertDto[]>([]);

  // Seed on mount and re-sync every 30 s as a backstop.
  useEffect(() => {
    const sync = () => fetchActiveAlerts().then(setAlerts);
    sync();
    const id = setInterval(sync, 30_000);
    return () => clearInterval(id);
  }, []);

  // New alert via SignalR — add to list (deduplicated by serviceId + triggeredAt).
  useEffect(() => {
    if (alertEvents.length === 0) return;
    const latest = alertEvents[alertEvents.length - 1];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts((prev) => {
      const exists = prev.some(
        (a) => a.serviceId === latest.serviceId && a.triggeredAt === latest.triggeredAt,
      );
      if (exists) return prev;
      const newAlert: AlertDto = {
        alertId: -Date.now(),
        serviceId: latest.serviceId,
        serviceName: latest.serviceName,
        alertType: latest.alertType,
        triggeredAt: latest.triggeredAt,
        isAcknowledged: false,
        isResolved: false,
        resolvedAt: null,
        message: latest.message,
      };
      return [newAlert, ...prev];
    });
  }, [alertEvents]);

  // Service recovered — remove its alerts immediately (no async re-fetch needed).
  useEffect(() => {
    if (alertsResolvedEvents.length === 0) return;
    const latest = alertsResolvedEvents[alertsResolvedEvents.length - 1];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts((prev) => prev.filter((a) => a.serviceId !== latest.serviceId));
  }, [alertsResolvedEvents]);

  // Alert acknowledged elsewhere — mark in place.
  useEffect(() => {
    if (alertAcknowledgedEvents.length === 0) return;
    const latest = alertAcknowledgedEvents[alertAcknowledgedEvents.length - 1];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts((prev) =>
      prev.map((a) => (a.alertId === latest.alertId ? { ...a, isAcknowledged: true } : a)),
    );
  }, [alertAcknowledgedEvents]);

  const handleAcknowledge = useCallback(async (alertId: number) => {
    await acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.alertId === alertId ? { ...a, isAcknowledged: true } : a)),
    );
  }, []);

  // fetchActiveAlerts only returns isResolved=false, so length === unresolved count.
  const unresolvedCount = alerts.length;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar connectionState={connectionState} unresolvedAlertCount={unresolvedCount} />
          <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard statusEvents={statusEvents} registrationEvents={registrationEvents} />} />
              <Route
                path="/alerts"
                element={<Alerts alerts={alerts} onAcknowledge={handleAcknowledge} />}
              />
              <Route
                path="/dependencies"
                element={<DependencyGraph statusEvents={statusEvents} dependencyEvents={dependencyEvents} />}
              />
              <Route path="/services/:id" element={<ServiceDetail />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}
