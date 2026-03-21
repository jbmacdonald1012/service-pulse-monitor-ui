import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import { useSignalR } from './hooks/useSignalR';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

export default function App() {
  const { statusEvents, alertEvents, connectionState } = useSignalR();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar connectionState={connectionState} />
        <Routes>
          <Route
            path="/"
            element={<Dashboard statusEvents={statusEvents} />}
          />
          <Route path="/alerts" element={<Alerts alertEvents={alertEvents} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
