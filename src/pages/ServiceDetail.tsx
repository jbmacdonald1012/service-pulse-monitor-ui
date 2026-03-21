import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import StatusBadge from '../components/StatusBadge';
import { fetchServiceHealth, fetchHealthChecks } from '../api/monitorApi';
import type { ServiceHealthSummaryDto, HealthCheckDto } from '../types';

const statusToValue: Record<string, number> = {
  Healthy: 1,
  Degraded: 0.5,
  Unhealthy: 0,
};

const valueToStatus: Record<number, string> = {
  1: 'Healthy',
  0.5: 'Degraded',
  0: 'Unhealthy',
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceId = Number(id);

  const [summary, setSummary] = useState<ServiceHealthSummaryDto | null>(null);
  const [checks, setChecks] = useState<HealthCheckDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(serviceId)) return;

    void Promise.all([fetchServiceHealth(serviceId), fetchHealthChecks(serviceId, 50)])
      .then(([health, history]) => {
        setSummary(health);
        setChecks(history);
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load service detail',
        ),
      )
      .finally(() => setLoading(false));
  }, [serviceId, id]);

  if (!id || isNaN(serviceId)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Invalid service ID.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          ← Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Service not found.</Typography>
      </Box>
    );
  }

  const chartData = checks.map((chk) => ({
    time: new Date(chk.checkedAt).toLocaleTimeString(),
    responseMs: chk.responseTimeMs ?? 0,
    statusValue: statusToValue[chk.status] ?? 0,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        ← Back
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5">{summary.serviceName}</Typography>
        <StatusBadge status={summary.currentStatus} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Base URL
            </Typography>
            <Typography variant="body2">{summary.baseUrl ?? '—'}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Uptime
            </Typography>
            <Typography variant="body2">
              {summary.uptimePercentage.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Avg Response
            </Typography>
            <Typography variant="body2">
              {summary.averageResponseTimeMs !== null
                ? `${Math.round(summary.averageResponseTimeMs)} ms`
                : '—'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" gutterBottom>
        Response Time — Last 50 Checks (ms)
      </Typography>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis unit="ms" />
            <Tooltip
              formatter={(value: number) => [`${value} ms`, 'Response Time']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="responseMs"
              name="Response Time"
              stroke="#1976d2"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No health checks recorded yet.
        </Typography>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Health Status — Last 50 Checks
      </Typography>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.5, 1]}
              tickFormatter={(v: number) => valueToStatus[v] ?? ''}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [
                valueToStatus[value] ?? String(value),
                'Status',
              ]}
            />
            <Legend />
            <Line
              type="stepAfter"
              dataKey="statusValue"
              name="Status"
              stroke="#2e7d32"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </Box>
  );
}
