import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ServiceCard from '../components/ServiceCard';
import { fetchAllServicesWithHealth, fetchServiceHealth } from '../api/monitorApi';
import type { ServiceRegisteredEvent, ServiceSummary, StatusChangedEvent } from '../types';

interface DashboardProps {
  statusEvents: StatusChangedEvent[];
  registrationEvents: ServiceRegisteredEvent[];
}

interface StatCard {
  label: string;
  value: number;
  accent: string;
  bg: string;
}

export default function Dashboard({ statusEvents, registrationEvents }: DashboardProps) {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const lastProcessedRef = useRef(0);

  useEffect(() => {
    void fetchAllServicesWithHealth()
      .then((data) => setServices(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load services'),
      )
      .finally(() => setLoading(false));
  }, []);

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
            averageResponseTimeMs: ev.responseTimeMs ?? existing.averageResponseTimeMs,
          });
        }
      }
      return Array.from(map.values());
    });
  }, [statusEvents]);

  const lastRegistrationRef = useRef(0);
  useEffect(() => {
    const newEvents = registrationEvents.slice(lastRegistrationRef.current);
    if (newEvents.length === 0) return;
    lastRegistrationRef.current = registrationEvents.length;

    void Promise.allSettled(
      newEvents.map((ev) => fetchServiceHealth(ev.serviceId)),
    ).then((results) => {
      setServices((prev) => {
        const map = new Map(prev.map((s) => [s.serviceId, s]));
        newEvents.forEach((ev, i) => {
          if (map.has(ev.serviceId)) return; // already tracked
          const result = results[i];
          map.set(ev.serviceId, result.status === 'fulfilled'
            ? {
                serviceId: ev.serviceId,
                serviceName: ev.serviceName,
                baseUrl: ev.baseUrl,
                description: null,
                currentStatus: result.value.currentStatus,
                lastCheckAt: result.value.lastCheckAt,
                uptimePercentage: result.value.uptimePercentage,
                averageResponseTimeMs: result.value.averageResponseTimeMs,
              }
            : {
                serviceId: ev.serviceId,
                serviceName: ev.serviceName,
                baseUrl: ev.baseUrl,
                description: null,
                currentStatus: 'Unknown' as const,
                lastCheckAt: null,
                uptimePercentage: 0,
                averageResponseTimeMs: null,
              });
        });
        return Array.from(map.values());
      });
    });
  }, [registrationEvents]);

  const filteredServices = searchQuery.trim()
    ? services.filter((s) =>
        s.serviceName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : services;

  const healthyCount   = services.filter((s) => s.currentStatus === 'Healthy').length;
  const degradedCount  = services.filter((s) => s.currentStatus === 'Degraded').length;
  const unhealthyCount = services.filter((s) => s.currentStatus === 'Unhealthy').length;

  const stats: StatCard[] = [
    { label: 'Total',     value: services.length, accent: '#6366f1', bg: '#eef2ff' },
    { label: 'Healthy',   value: healthyCount,    accent: '#22c55e', bg: '#f0fdf4' },
    { label: 'Degraded',  value: degradedCount,   accent: '#f59e0b', bg: '#fffbeb' },
    { label: 'Unhealthy', value: unhealthyCount,  accent: '#ef4444', bg: '#fff1f2' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
          Services
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time health overview — updates automatically via live connection
        </Typography>
      </Box>

      {/* Stat summary */}
      {!loading && !error && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  bgcolor: stat.bg,
                  border: `1px solid ${stat.accent}30`,
                  borderLeft: `4px solid ${stat.accent}`,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography
                  sx={{ fontSize: '1.75rem', fontWeight: 800, color: stat.accent, lineHeight: 1 }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: stat.accent, fontWeight: 600, opacity: 0.8 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Search */}
      <TextField
        placeholder="Search services…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        sx={{
          mb: 3,
          width: 300,
          '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 6, textAlign: 'center' }}>
          {searchQuery ? 'No services match your search.' : 'No services registered yet.'}
        </Typography>
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <Grid container spacing={2}>
          {filteredServices.map((svc) => (
            <Grid key={svc.serviceId} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                onClick={() => navigate(`/services/${svc.serviceId}`)}
                sx={{ cursor: 'pointer', height: '100%' }}
              >
                <ServiceCard service={svc} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
