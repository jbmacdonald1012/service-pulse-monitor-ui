import { useEffect, useRef, useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import ServiceCard from '../components/ServiceCard';
import { fetchAllServicesWithHealth } from '../api/monitorApi';
import type { ServiceSummary, StatusChangedEvent } from '../types';

interface DashboardProps {
  statusEvents: StatusChangedEvent[];
}

export default function Dashboard({ statusEvents }: DashboardProps) {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const lastProcessedRef = useRef(0);

  // Initial load
  useEffect(() => {
    void fetchAllServicesWithHealth()
      .then((data) => setServices(data))
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load services',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  // Merge SignalR status updates — only processes new events via index ref
  useEffect(() => {
    const newEvents = statusEvents.slice(lastProcessedRef.current);
    if (newEvents.length === 0) return;

    lastProcessedRef.current = statusEvents.length;

    setServices((prev) => {
      const map = new Map(prev.map((s) => [s.serviceId, s]));
      for (const ev of newEvents) {
        const existing = map.get(ev.serviceId);
        if (existing) {
          map.set(ev.serviceId, {
            ...existing,
            currentStatus: ev.status,
            lastCheckAt: ev.timestamp,
            averageResponseTimeMs:
              ev.responseTimeMs ?? existing.averageResponseTimeMs,
          });
        }
      }
      return Array.from(map.values());
    });
  }, [statusEvents]);

  const filteredServices = searchQuery.trim()
    ? services.filter((s) =>
        s.serviceName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : services;

  return (
    <Box sx={{ p: 3 }}>
      <TextField
        placeholder="Search services…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        sx={{ mb: 3, width: 300 }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          {searchQuery ? 'No services match your search.' : 'No services registered.'}
        </Typography>
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <Grid container spacing={2}>
          {filteredServices.map((svc) => (
            <Grid key={svc.serviceId} size={{ xs: 12, sm: 6, md: 4 }}>
              <ServiceCard service={svc} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
