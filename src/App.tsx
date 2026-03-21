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
  const { statusEvents, alertEvents, connectionState } = useSignalR();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar connectionState={connectionState} />
          <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard statusEvents={statusEvents} />} />
              <Route path="/alerts" element={<Alerts alertEvents={alertEvents} />} />
              <Route
                path="/dependencies"
                element={<DependencyGraph statusEvents={statusEvents} />}
              />
              <Route path="/services/:id" element={<ServiceDetail />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}
